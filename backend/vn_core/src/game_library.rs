use crate::downloads::DownloadManager;
use crate::util::{runtime_error, value_to_py, extract_value, extract_serde};
use crate::json_result;
use anyhow::{anyhow, Context, Result};
use chrono::{Local, TimeZone};
use flate2::write::GzEncoder;
use flate2::Compression;
use pyo3::prelude::*;
use pyo3::types::{PyAny, PyDict, PyList, PySet};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};
use std::fs::{self, File};
use std::io::{BufReader, BufWriter, Read, Write};
use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock};
use tar::Builder;
use tokio::task;
use walkdir::WalkDir;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum SortKey {
    Name,
    Size,
    InstallDate,
    LastPlayed,
    Rating,
    Developer,
}

impl SortKey {
    fn from_str(value: &str) -> Option<Self> {
        match value {
            "name" => Some(SortKey::Name),
            "size" => Some(SortKey::Size),
            "install_date" => Some(SortKey::InstallDate),
            "last_played" => Some(SortKey::LastPlayed),
            "rating" => Some(SortKey::Rating),
            "developer" => Some(SortKey::Developer),
            _ => None,
        }
    }

    fn as_str(&self) -> &'static str {
        match self {
            SortKey::Name => "name",
            SortKey::Size => "size",
            SortKey::InstallDate => "install_date",
            SortKey::LastPlayed => "last_played",
            SortKey::Rating => "rating",
            SortKey::Developer => "developer",
        }
    }
}

#[pyclass(module = "vn_core")]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SortBy {
    key: SortKey,
}

#[pymethods]
impl SortBy {
    #[new]
    pub fn new(value: &str) -> PyResult<Self> {
        let key = SortKey::from_str(&value.to_lowercase())
            .ok_or_else(|| runtime_error(format!("Invalid sort key: {}", value)))?;
        Ok(Self { key })
    }

    #[classattr]
    fn name() -> Self {
        Self { key: SortKey::Name }
    }

    #[classattr]
    fn size() -> Self {
        Self { key: SortKey::Size }
    }

    #[classattr]
    fn install_date() -> Self {
        Self {
            key: SortKey::InstallDate,
        }
    }

    #[classattr]
    fn last_played() -> Self {
        Self {
            key: SortKey::LastPlayed,
        }
    }

    #[classattr]
    fn rating() -> Self {
        Self {
            key: SortKey::Rating,
        }
    }

    #[classattr]
    fn developer() -> Self {
        Self {
            key: SortKey::Developer,
        }
    }

    pub fn value(&self) -> &'static str {
        self.key.as_str()
    }
}

#[pyclass(module = "vn_core")]
pub struct GameLibrary {
    games_dir: PathBuf,
    library_cache: Arc<RwLock<HashMap<String, Value>>>,
}

impl GameLibrary {
    fn metadata_path_for(base: &Path, game_id: &str) -> PathBuf {
        base.join(format!("game_{}", game_id)).join("metadata.json")
    }

    fn read_metadata_from(base: &Path, game_id: &str) -> Result<Option<Value>> {
        let path = GameLibrary::metadata_path_for(base, game_id);
        if !path.exists() {
            return Ok(None);
        }
        let file = File::open(&path)
            .with_context(|| format!("Failed to open metadata {}", path.display()))?;
        let reader = BufReader::new(file);
        let data = serde_json::from_reader(reader)
            .with_context(|| format!("Failed to parse metadata {}", path.display()))?;
        Ok(Some(data))
    }

    fn write_metadata_to(base: &Path, game_id: &str, metadata: &Value) -> Result<()> {
        let path = GameLibrary::metadata_path_for(base, game_id);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .with_context(|| format!("Failed to create directory {}", parent.display()))?;
        }
        let file = File::create(&path)
            .with_context(|| format!("Failed to create metadata {}", path.display()))?;
        let mut writer = BufWriter::new(file);
        serde_json::to_writer_pretty(&mut writer, metadata)
            .with_context(|| format!("Failed to write metadata {}", path.display()))?;
        writer.flush().ok();
        Ok(())
    }

    fn game_dir(&self, game_id: &str) -> PathBuf {
        self.games_dir.join(format!("game_{}", game_id))
    }

    fn read_metadata(&self, game_id: &str) -> Result<Option<Value>> {
        GameLibrary::read_metadata_from(&self.games_dir, game_id)
    }

    fn write_metadata(&self, game_id: &str, metadata: &Value) -> Result<()> {
        GameLibrary::write_metadata_to(&self.games_dir, game_id, metadata)
    }

    fn current_time_secs() -> f64 {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs_f64())
            .unwrap_or(0.0)
    }

    fn select_main_game_file(game_dir: &Path) -> Result<PathBuf> {
        let mut candidates: Vec<PathBuf> = WalkDir::new(game_dir)
            .into_iter()
            .filter_map(|entry| entry.ok())
            .filter(|entry| entry.path().is_file())
            .map(|entry| entry.into_path())
            .filter(|path| {
                if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                    matches!(ext.to_lowercase().as_str(), "zip" | "exe")
                } else {
                    false
                }
            })
            .collect();

        if candidates.is_empty() {
            return Err(anyhow!("No game files found"));
        }

        candidates.sort_by(|a, b| {
            let a_size = a.metadata().map(|m| m.len()).unwrap_or(0);
            let b_size = b.metadata().map(|m| m.len()).unwrap_or(0);
            b_size.cmp(&a_size)
        });

        Ok(candidates[0].clone())
    }

    fn calculate_sha256(path: &Path) -> Result<String> {
        let file =
            File::open(path).with_context(|| format!("Failed to open {}", path.display()))?;
        let mut reader = BufReader::new(file);
        let mut hasher = Sha256::new();
        let mut buffer = [0u8; 64 * 1024];
        loop {
            let read = reader
                .read(&mut buffer)
                .with_context(|| format!("Failed to read {}", path.display()))?;
            if read == 0 {
                break;
            }
            hasher.update(&buffer[..read]);
        }
        Ok(format!("{:x}", hasher.finalize()))
    }

    fn ensure_directory(path: &Path) -> Result<()> {
        fs::create_dir_all(path)
            .with_context(|| format!("Failed to create directory {}", path.display()))
    }

    fn metadata_as_object(metadata: &mut Value) -> &mut serde_json::Map<String, Value> {
        if !metadata.is_object() {
            *metadata = json!({});
        }
        metadata.as_object_mut().unwrap()
    }

    fn read_directory_games(&self) -> Vec<String> {
        let mut games = Vec::new();
        if let Ok(entries) = fs::read_dir(&self.games_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
                        if let Some(id) = name.strip_prefix("game_") {
                            games.push(id.to_string());
                        }
                    }
                }
            }
        }
        games
    }

    fn gather_tags_from_metadata(metadata: &Value) -> HashSet<String> {
        metadata
            .get("user_tags")
            .and_then(|value| value.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|item| item.as_str().map(|s| s.to_string()))
                    .collect::<HashSet<_>>()
            })
            .unwrap_or_default()
    }

    pub fn format_size(bytes: u64) -> String {
        if bytes == 0 {
            return "0B".to_string();
        }
        let units = ["B", "KB", "MB", "GB", "TB"];
        let mut size = bytes as f64;
        let mut index = 0usize;
        while size >= 1024.0 && index < units.len() - 1 {
            size /= 1024.0;
            index += 1;
        }
        format!("{:.1}{}", size, units[index])
    }
}

#[pymethods]
impl GameLibrary {
    #[new]
    pub fn new(games_dir: String) -> PyResult<Self> {
        let path = PathBuf::from(games_dir);
        fs::create_dir_all(&path)
            .map_err(|err| runtime_error(format!("Failed to create games directory: {}", err)))?;
        Ok(Self {
            games_dir: path,
            library_cache: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    pub fn is_game_installed(&self, game_id: String) -> PyResult<bool> {
        let dir = self.game_dir(&game_id);
        Ok(dir.is_dir() && dir.join(".download_complete").exists())
    }

    pub fn is_game_downloading(&self, game_id: String, download_manager: &PyAny) -> PyResult<bool> {
        let result = download_manager
            .call_method1("is_downloading", (game_id.clone(),))?
            .extract::<bool>()?;
        Ok(result)
    }

    pub fn get_game_progress(
        &self,
        _py: Python<'_>,
        game_id: String,
        download_manager: &PyAny,
    ) -> PyResult<f64> {
        if self.is_game_installed(game_id.clone())? {
            return Ok(100.0);
        }

        if let Ok(status) = download_manager.call_method1("get_download_status", (game_id.clone(),))
        {
            if !status.is_none() {
                if let Ok(dict) = status.downcast::<PyDict>() {
                    if let Ok(Some(value)) = dict.get_item("progress") {
                        if let Ok(progress) = value.extract::<f64>() {
                            return Ok(progress);
                        }
                    }
                }
            }
        }

        let progress_file = self.game_dir(&game_id).join(".download_progress");
        if let Ok(contents) = fs::read_to_string(progress_file) {
            if let Ok(value) = contents.trim().parse::<f64>() {
                return Ok(value);
            }
        }

        Ok(0.0)
    }

    pub fn get_installed_games(&self) -> PyResult<Vec<String>> {
        let mut installed = Vec::new();
        for game_id in self.read_directory_games() {
            if self.is_game_installed(game_id.clone())? {
                installed.push(game_id);
            }
        }
        Ok(installed)
    }

    pub fn get_game_executable(&self, game_id: String) -> PyResult<Option<String>> {
        let dir = self.game_dir(&game_id);
        if !dir.is_dir() {
            return Ok(None);
        }

        let mut candidates: Vec<PathBuf> = WalkDir::new(&dir)
            .into_iter()
            .filter_map(|entry| entry.ok())
            .map(|entry| entry.into_path())
            .filter(|path| {
                path.is_file()
                    && path
                        .extension()
                        .and_then(|s| s.to_str())
                        .map(|ext| ext.eq_ignore_ascii_case("exe"))
                        .unwrap_or(false)
            })
            .collect();

        if candidates.is_empty() {
            return Ok(None);
        }

        let keywords = ["game", "main", "start", "launcher"];
        candidates.sort_by(|a, b| {
            let name_a = a
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("")
                .to_lowercase();
            let name_b = b
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("")
                .to_lowercase();
            let score_a = keywords.iter().any(|k| name_a.contains(k));
            let score_b = keywords.iter().any(|k| name_b.contains(k));
            match score_b.cmp(&score_a) {
                Ordering::Equal => name_a.cmp(&name_b),
                other => other,
            }
        });

        Ok(candidates
            .into_iter()
            .next()
            .map(|path| path.to_string_lossy().to_string()))
    }

    pub fn delete_game(&self, game_id: String) -> PyResult<bool> {
        let dir = self.game_dir(&game_id);
        if dir.exists() {
            fs::remove_dir_all(&dir).map_err(|err| {
                runtime_error(format!("Failed to delete game {}: {}", game_id, err))
            })?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    pub fn get_game_metadata(&self, py: Python<'_>, game_id: String) -> PyResult<Option<PyObject>> {
        match self.read_metadata(&game_id) {
            Ok(Some(value)) => Ok(Some(value_to_py(py, &value)?)),
            Ok(None) => Ok(None),
            Err(err) => Err(runtime_error(err.to_string())),
        }
    }

    pub fn save_game_metadata(&self, game_id: String, metadata: &PyAny) -> PyResult<bool> {
        let value: Value = extract_value(metadata)?;
        self.write_metadata(&game_id, &value)
            .map_err(|err| runtime_error(err.to_string()))?;
        Ok(true)
    }

    pub fn get_game_size(&self, game_id: String) -> PyResult<u64> {
        let dir = self.game_dir(&game_id);
        if !dir.exists() {
            return Ok(0);
        }

        let mut total = 0u64;
        for entry in WalkDir::new(&dir).into_iter().flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Ok(metadata) = path.metadata() {
                    total += metadata.len();
                }
            }
        }
        Ok(total)
    }

    pub fn get_game_install_date(&self, game_id: String) -> PyResult<Option<String>> {
        let marker = self.game_dir(&game_id).join(".download_complete");
        if !marker.exists() {
            return Ok(None);
        }

        let metadata = marker
            .metadata()
            .map_err(|err| runtime_error(format!("Failed to read metadata: {}", err)))?;
        let modified = metadata
            .modified()
            .map_err(|err| runtime_error(format!("Failed to read modification time: {}", err)))?;
        let ts = modified
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|err| runtime_error(format!("Invalid timestamp: {}", err)))?;
        let datetime = Local
            .timestamp_opt(ts.as_secs() as i64, 0)
            .single()
            .map(|dt| {
                // Match Python's datetime.fromtimestamp().isoformat() behaviour
                dt.format("%Y-%m-%dT%H:%M:%S").to_string()
            });
        Ok(datetime)
    }

    pub fn scan_for_orphaned_games(&self) -> PyResult<Vec<String>> {
        let mut orphaned = Vec::new();
        for game_id in self.read_directory_games() {
            if !self.is_game_installed(game_id.clone())? {
                orphaned.push(game_id);
            }
        }
        Ok(orphaned)
    }

    pub fn cleanup_orphaned_games(&self) -> PyResult<usize> {
        let orphaned = self.scan_for_orphaned_games()?;
        let mut cleaned = 0usize;
        for game_id in orphaned {
            if self.delete_game(game_id.clone())? {
                cleaned += 1;
            }
        }
        Ok(cleaned)
    }

    pub fn update_library_cache(&self, games_data: &PyAny) -> PyResult<()> {
        let entries: Vec<Value> = extract_serde(games_data)?;
        let mut map = HashMap::new();
        for entry in entries {
            if let Some(id) = entry.get("id").and_then(|v| v.as_str()) {
                map.insert(id.to_string(), entry.clone());
            }
        }
        let mut guard = self
            .library_cache
            .write()
            .map_err(|_| runtime_error("Failed to lock library cache"))?;
        *guard = map;
        Ok(())
    }

    pub fn get_cached_game_info(
        &self,
        py: Python<'_>,
        game_id: String,
    ) -> PyResult<Option<PyObject>> {
        let guard = self
            .library_cache
            .read()
            .map_err(|_| runtime_error("Failed to lock library cache"))?;
        if let Some(value) = guard.get(&game_id) {
            Ok(Some(value_to_py(py, value)?))
        } else {
            Ok(None)
        }
    }

    pub fn update_last_played(&self, game_id: String) -> PyResult<()> {
        let mut metadata = self
            .read_metadata(&game_id)
            .map_err(|err| runtime_error(err.to_string()))?
            .unwrap_or_else(|| json!({}));
        let object = metadata.as_object_mut().unwrap();
        object.insert(
            "last_played".to_string(),
            json!(GameLibrary::current_time_secs()),
        );
        self.write_metadata(&game_id, &metadata)
            .map_err(|err| runtime_error(err.to_string()))
    }

    pub fn get_game_tags(&self, py: Python<'_>, game_id: String) -> PyResult<PyObject> {
        let metadata = self
            .read_metadata(&game_id)
            .map_err(|err| runtime_error(err.to_string()))?
            .unwrap_or_else(|| json!({}));
        let tags = GameLibrary::gather_tags_from_metadata(&metadata);
        let tag_list: Vec<String> = tags.into_iter().collect();
        let pyset = PySet::new(py, &tag_list)?;
        Ok(pyset.into())
    }

    /// Enrich a list of games with installation and download status information.
    pub fn enrich_games(
        &self,
        py: Python<'_>,
        games: &PyAny,
        download_manager: &DownloadManager,
    ) -> PyResult<PyObject> {
        let entries: Vec<Value> = extract_serde(games)?;
        let downloads = download_manager.snapshot_all();
        let mut out = Vec::with_capacity(entries.len());

        for mut entry in entries {
            let gid_opt = entry
                .get("id")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            let Some(gid) = gid_opt else {
                out.push(entry);
                continue;
            };

            let installed = self.is_game_installed(gid.clone())?;
            let snapshot = downloads.get(&gid);

            let mut downloading = false;
            let mut progress = if installed { 100.0 } else { 0.0 };
            let mut status = if installed { "installed" } else { "idle" };
            let mut downloaded_size = 0u64;
            let mut total_size = 0u64;
            let mut message: Option<String> = None;

            if let Some(snap) = snapshot {
                downloading = snap.status.is_active();
                progress = snap.progress;
                status = snap.status.as_str();
                downloaded_size = snap.downloaded_size;
                total_size = snap.total_size;
                message = snap.message.clone();
            }

            if let Some(obj) = entry.as_object_mut() {
                obj.insert("installed".into(), json!(installed));
                obj.insert("downloading".into(), json!(downloading));
                obj.insert("progress".into(), json!(progress));
                obj.insert("downloadStatus".into(), json!(status));
                obj.insert("downloadedSize".into(), json!(downloaded_size));
                obj.insert("totalSize".into(), json!(total_size));
                match message {
                    Some(msg) => {
                        obj.insert("downloadMessage".into(), json!(msg));
                    }
                    None => {
                        obj.remove("downloadMessage");
                    }
                }
            }

            out.push(entry);
        }

        let py_list = PyList::empty(py);
        for value in out {
            py_list.append(value_to_py(py, &value)?)?;
        }
        Ok(py_list.into())
    }

    pub fn add_game_tag(&self, game_id: String, tag: String) -> PyResult<bool> {
        let mut metadata = self
            .read_metadata(&game_id)
            .map_err(|err| runtime_error(err.to_string()))?
            .unwrap_or_else(|| json!({}));
        let mut tags = GameLibrary::gather_tags_from_metadata(&metadata);
        tags.insert(tag.trim().to_lowercase());
        let object = GameLibrary::metadata_as_object(&mut metadata);
        object.insert(
            "user_tags".to_string(),
            json!(tags.into_iter().collect::<Vec<_>>()),
        );
        self.write_metadata(&game_id, &metadata)
            .map_err(|err| runtime_error(err.to_string()))?;
        Ok(true)
    }

    pub fn remove_game_tag(&self, game_id: String, tag: String) -> PyResult<bool> {
        let mut metadata = self
            .read_metadata(&game_id)
            .map_err(|err| runtime_error(err.to_string()))?
            .unwrap_or_else(|| json!({}));
        let mut tags = GameLibrary::gather_tags_from_metadata(&metadata);
        tags.remove(&tag.trim().to_lowercase());
        let object = GameLibrary::metadata_as_object(&mut metadata);
        object.insert(
            "user_tags".to_string(),
            json!(tags.into_iter().collect::<Vec<_>>()),
        );
        self.write_metadata(&game_id, &metadata)
            .map_err(|err| runtime_error(err.to_string()))?;
        Ok(true)
    }

    pub fn get_all_tags(&self) -> PyResult<Vec<String>> {
        let mut all_tags = HashSet::new();
        for game_id in self.read_directory_games() {
            if let Ok(Some(metadata)) = self.read_metadata(&game_id) {
                all_tags.extend(GameLibrary::gather_tags_from_metadata(&metadata));
            }
        }
        let mut list: Vec<String> = all_tags.into_iter().collect();
        list.sort();
        Ok(list)
    }

    pub fn verify_game_integrity<'py>(
        &'py self,
        py: Python<'py>,
        game_id: String,
        expected_hash: Option<String>,
    ) -> PyResult<&'py PyAny> {
        let games_dir = self.games_dir.clone();

        pyo3_asyncio::tokio::future_into_py(py, async move {
            let game_id_for_path = game_id.clone();
            let game_dir = games_dir.join(format!("game_{}", game_id_for_path));
            if !game_dir.exists() {
                return json_result!({
                    "valid": false,
                    "error": "Game not found"
                });
            }

            let integrity = task::spawn_blocking(move || -> Result<_> {
                let main_file = GameLibrary::select_main_game_file(&game_dir)?;
                let file_hash = GameLibrary::calculate_sha256(&main_file)?;
                Ok((main_file, file_hash))
            })
            .await
            .map_err(|err| runtime_error(format!("Hash task failed: {}", err)))?
            .map_err(|err| runtime_error(err.to_string()))?;

            let (main_file, file_hash) = integrity;

            if let Some(expected) = expected_hash {
                let valid = file_hash.eq_ignore_ascii_case(&expected);
                return json_result!({
                    "valid": valid,
                    "calculated_hash": file_hash,
                    "expected_hash": expected,
                    "file_path": main_file.to_string_lossy(),
                });
            }

            let games_dir_clone = games_dir.clone();
            let game_id_clone = game_id.clone();
            let hash_clone = file_hash.clone();

            task::spawn_blocking(move || -> Result<()> {
                let mut metadata =
                    GameLibrary::read_metadata_from(&games_dir_clone, &game_id_clone)?
                        .unwrap_or_else(|| json!({}));
                let object = GameLibrary::metadata_as_object(&mut metadata);
                object.insert("calculated_hash".to_string(), json!(hash_clone));
                GameLibrary::write_metadata_to(&games_dir_clone, &game_id_clone, &metadata)?;
                Ok(())
            })
            .await
            .map_err(|err| runtime_error(format!("Metadata update failed: {}", err)))?
            .map_err(|err| runtime_error(err.to_string()))?;

            json_result!({
                "valid": true,
                "calculated_hash": file_hash,
                "file_path": main_file.to_string_lossy(),
            })
        })
    }

    pub fn filter_games(
        &self,
        py: Python<'_>,
        games: &PyAny,
        filters: &PyAny,
    ) -> PyResult<PyObject> {
        let games_list: Vec<Value> = extract_serde(games)?;
        let filters_value: Value = extract_value(filters)?;

        let filtered = games_list
            .into_iter()
            .filter(|game| GameLibrary::passes_filters(game, &filters_value, &self.games_dir))
            .collect::<Vec<_>>();

        let py_list = PyList::empty(py);
        for game in filtered {
            py_list.append(value_to_py(py, &game)?)?;
        }
        Ok(py_list.into())
    }

    pub fn sort_games(
        &self,
        py: Python<'_>,
        games: &PyAny,
        sort_by: &SortBy,
        reverse: Option<bool>,
    ) -> PyResult<PyObject> {
        let mut games_list: Vec<Value> = extract_serde(games)?;
        let reverse = reverse.unwrap_or(false);
        let key = sort_by.key;

        games_list.sort_by(|a, b| GameLibrary::compare_games(a, b, key, reverse, &self.games_dir));

        let py_list = PyList::empty(py);
        for game in games_list {
            py_list.append(value_to_py(py, &game)?)?;
        }
        Ok(py_list.into())
    }

    pub fn backup_game<'py>(
        &'py self,
        py: Python<'py>,
        game_id: String,
        backup_path: &PyAny,
    ) -> PyResult<&'py PyAny> {
        let games_dir = self.games_dir.clone();
        let backup_dir: PathBuf = extract_serde(backup_path)?;

        pyo3_asyncio::tokio::future_into_py(py, async move {
            let game_id_for_path = game_id.clone();
            let game_dir = games_dir.join(format!("game_{}", game_id_for_path));
            if !game_dir.exists() {
                return json_result!({"success": false, "error": "Game not found"});
            }

            let backup_game_id = game_id.clone();
            let games_dir_for_metadata = games_dir.clone();
            let backup = task::spawn_blocking(move || -> Result<_> {
                GameLibrary::ensure_directory(&backup_dir)?;
                let timestamp = GameLibrary::current_time_secs() as u64;
                let backup_file =
                    backup_dir.join(format!("{}_backup_{}.tar.gz", backup_game_id, timestamp));

                let tar_gz = File::create(&backup_file).with_context(|| {
                    format!("Failed to create backup {}", backup_file.display())
                })?;
                let enc = GzEncoder::new(tar_gz, Compression::default());
                let mut builder = Builder::new(enc);
                builder
                    .append_dir_all(game_dir.file_name().unwrap(), &game_dir)
                    .with_context(|| "Failed to write backup archive")?;
                builder.into_inner()?.finish()?;

                let size = backup_file.metadata()?.len();
                Ok((backup_file, size, games_dir_for_metadata, backup_game_id))
            })
            .await
            .map_err(|err| runtime_error(format!("Backup task failed: {}", err)))?
            .map_err(|err| runtime_error(err.to_string()))?;

            let (backup_file, size, games_dir_for_metadata, game_id_for_metadata) = backup;
            let backup_path_str = backup_file.to_string_lossy().to_string();
            let backup_path_for_metadata = backup_path_str.clone();

            task::spawn_blocking(move || -> Result<()> {
                let mut metadata = GameLibrary::read_metadata_from(
                    &games_dir_for_metadata,
                    &game_id_for_metadata,
                )?
                .unwrap_or_else(|| json!({}));
                let object = GameLibrary::metadata_as_object(&mut metadata);
                let mut backups = object
                    .get("backups")
                    .and_then(|v| v.as_array())
                    .cloned()
                    .unwrap_or_else(Vec::new);
                backups.push(json!({
                    "path": backup_path_for_metadata,
                    "created_at": GameLibrary::current_time_secs(),
                    "size": size
                }));
                object.insert("backups".to_string(), Value::Array(backups));
                GameLibrary::write_metadata_to(
                    &games_dir_for_metadata,
                    &game_id_for_metadata,
                    &metadata,
                )?;
                Ok(())
            })
            .await
            .map_err(|err| runtime_error(format!("Failed to record backup: {}", err)))?
            .map_err(|err| runtime_error(err.to_string()))?;

            json_result!({
                "success": true,
                "backup_path": backup_path_str,
                "size": size
            })
        })
    }

    pub fn restore_game<'py>(
        &'py self,
        py: Python<'py>,
        game_id: String,
        backup_path: &PyAny,
    ) -> PyResult<&'py PyAny> {
        let games_dir = self.games_dir.clone();
        let backup_file: PathBuf = extract_serde(backup_path)?;

        pyo3_asyncio::tokio::future_into_py(py, async move {
            if !backup_file.exists() {
                return json_result!({"success": false, "error": "Backup file not found"});
            }

            let game_dir = games_dir.join(format!("game_{}", game_id));

            let _restore = task::spawn_blocking(move || -> Result<_> {
                if game_dir.exists() {
                    fs::remove_dir_all(&game_dir)
                        .with_context(|| format!("Failed to remove {}", game_dir.display()))?;
                }

                let file = File::open(&backup_file)
                    .with_context(|| format!("Failed to open backup {}", backup_file.display()))?;
                let decoder = flate2::read::GzDecoder::new(file);
                let mut archive = tar::Archive::new(decoder);
                archive.unpack(game_dir.parent().unwrap())?;

                fs::File::create(game_dir.join(".download_complete"))?;
                Ok(())
            })
            .await
            .map_err(|err| runtime_error(format!("Restore task failed: {}", err)))?
            .map_err(|err| runtime_error(err.to_string()))?;

            json_result!({"success": true, "message": "Game restored successfully"})
        })
    }

    pub fn get_library_statistics(&self) -> PyResult<PyObject> {
        let mut total_size = 0u64;
        let mut games_by_status: HashMap<String, usize> = HashMap::new();
        let mut developers = HashSet::new();
        let mut languages = HashSet::new();
        let mut tags = HashSet::new();

        for game_id in self.read_directory_games() {
            if self.is_game_installed(game_id.clone())? {
                total_size += self.get_game_size(game_id.clone())?;
                let status = self.get_game_status(&game_id)?;
                *games_by_status.entry(status).or_default() += 1;

                if let Some(cached) = self
                    .library_cache
                    .read()
                    .ok()
                    .and_then(|guard| guard.get(&game_id).cloned())
                {
                    if let Some(dev) = cached.get("developer").and_then(|v| v.as_str()) {
                        developers.insert(dev.to_string());
                    }
                    if let Some(langs) =
                        cached.get("supported_languages").and_then(|v| v.as_array())
                    {
                        for lang in langs.iter().filter_map(|v| v.as_str()) {
                            languages.insert(lang.to_string());
                        }
                    }
                    if let Some(tag_list) = cached.get("tags").and_then(|v| v.as_array()) {
                        for tag in tag_list.iter().filter_map(|v| v.as_str()) {
                            tags.insert(tag.to_string());
                        }
                    }
                }

                if let Ok(Some(metadata)) = self.read_metadata(&game_id) {
                    tags.extend(GameLibrary::gather_tags_from_metadata(&metadata));
                }
            }
        }

        let stats = json!({
            "total_games": games_by_status.values().sum::<usize>(),
            "total_size_bytes": total_size,
            "total_size_formatted": GameLibrary::format_size(total_size),
            "games_by_status": games_by_status,
            "unique_developers": developers.len(),
            "supported_languages": languages.into_iter().collect::<Vec<_>>(),
            "unique_tags": tags.len(),
            "all_tags": tags.into_iter().collect::<Vec<_>>()
        });

        Python::with_gil(|py| value_to_py(py, &stats))
    }

    pub fn optimize_library<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        let games_dir = self.games_dir.clone();
        let cache_snapshot = self
            .library_cache
            .read()
            .map_err(|_| runtime_error("Failed to lock library cache"))?
            .clone();

        pyo3_asyncio::tokio::future_into_py(py, async move {
            let cleanup = task::spawn_blocking(move || -> Result<_> {
                let mut results = json!({
                    "orphaned_cleaned": 0,
                    "old_backups_cleaned": 0,
                    "validation_results": json!({
                        "valid": 0,
                        "invalid": 0,
                        "no_hash": 0,
                        "errors": Vec::<String>::new()
                    }),
                    "errors": Vec::<String>::new()
                });

                // Clean orphaned games
                let mut orphaned = Vec::new();
                if let Ok(entries) = fs::read_dir(&games_dir) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.is_dir() {
                            if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
                                if let Some(id) = name.strip_prefix("game_") {
                                    if !path.join(".download_complete").exists() {
                                        orphaned.push((id.to_string(), path));
                                    }
                                }
                            }
                        }
                    }
                }

                for (_, path) in &orphaned {
                    fs::remove_dir_all(path).ok();
                }
                results["orphaned_cleaned"] = json!(orphaned.len());

                // Clean old backups (>30 days)
                let cutoff = std::time::SystemTime::now()
                    .checked_sub(std::time::Duration::from_secs(30 * 24 * 60 * 60))
                    .unwrap_or(std::time::SystemTime::now());
                let mut backups_removed = 0usize;

                for entry in WalkDir::new(&games_dir).into_iter().flatten() {
                    let path = entry.path();
                    if path.is_file() {
                        if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                            if ext == "gz" {
                                if let Ok(metadata) = path.metadata() {
                                    if let Ok(modified) = metadata.modified() {
                                        if modified < cutoff {
                                            fs::remove_file(path).ok();
                                            backups_removed += 1;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                results["old_backups_cleaned"] = json!(backups_removed);

                let validation = GameLibrary::validate_all_games(&games_dir, &cache_snapshot)?;
                results["validation_results"] = validation;

                Ok(results)
            })
            .await
            .map_err(|err| runtime_error(format!("Optimize task failed: {}", err)))?
            .map_err(|err| runtime_error(err.to_string()))?;

            Python::with_gil(|py| {
                value_to_py(py, &cleanup)
            })
        })
    }

    pub fn cleanup_download_markers(&self) -> PyResult<usize> {
        let mut removed = 0usize;
        for game_id in self.read_directory_games() {
            let dir = self.game_dir(&game_id);
            let marker = dir.join(".download_progress");
            if marker.exists() {
                if fs::remove_file(&marker).is_ok() {
                    removed += 1;
                }
            }
        }
        Ok(removed)
    }
}

impl GameLibrary {
    fn validate_all_games(
        games_dir: &Path,
        cache_snapshot: &HashMap<String, Value>,
    ) -> Result<Value> {
        let mut result = json!({
            "valid": 0usize,
            "invalid": 0usize,
            "no_hash": 0usize,
            "errors": Vec::<String>::new()
        });

        let mut errors = Vec::new();
        let mut valid = 0usize;
        let mut invalid = 0usize;
        let mut no_hash = 0usize;

        if let Ok(entries) = fs::read_dir(games_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if !path.is_dir() {
                    continue;
                }
                let name = match path.file_name().and_then(|s| s.to_str()) {
                    Some(name) => name,
                    None => continue,
                };
                let game_id = match name.strip_prefix("game_") {
                    Some(id) => id.to_string(),
                    None => continue,
                };

                if !path.join(".download_complete").exists() {
                    continue;
                }

                let expected_hash = cache_snapshot
                    .get(&game_id)
                    .and_then(|value| value.get("integrity_hash"))
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                if let Some(expected) = expected_hash {
                    let validation = GameLibrary::calculate_hash_for_game(&path, &expected);
                    match validation {
                        Ok(true) => valid += 1,
                        Ok(false) => {
                            invalid += 1;
                            errors.push(format!("{}: Integrity check failed", game_id));
                        }
                        Err(err) => {
                            errors.push(format!("{}: {}", game_id, err));
                        }
                    }
                } else {
                    no_hash += 1;
                }
            }
        }

        result["valid"] = json!(valid);
        result["invalid"] = json!(invalid);
        result["no_hash"] = json!(no_hash);
        result["errors"] = json!(errors);
        Ok(result)
    }

    fn calculate_hash_for_game(game_dir: &Path, expected_hash: &str) -> Result<bool> {
        let main_file = GameLibrary::select_main_game_file(game_dir)?;
        let actual_hash = GameLibrary::calculate_sha256(&main_file)?;
        Ok(actual_hash.eq_ignore_ascii_case(expected_hash))
    }

    fn passes_filters(game: &Value, filters: &Value, games_dir: &Path) -> bool {
        if let Some(tags) = filters.get("tags").and_then(|v| v.as_array()) {
            let required: HashSet<&str> = tags.iter().filter_map(|v| v.as_str()).collect();
            if !required.is_empty() {
                let game_tags: HashSet<&str> = game
                    .get("tags")
                    .and_then(|v| v.as_array())
                    .map(|arr| arr.iter().filter_map(|item| item.as_str()).collect())
                    .unwrap_or_default();
                if required.is_disjoint(&game_tags) {
                    return false;
                }
            }
        }

        if let Some(dev) = filters.get("developer").and_then(|v| v.as_str()) {
            let developer = game.get("developer").and_then(|v| v.as_str()).unwrap_or("");
            if !developer.to_lowercase().contains(&dev.to_lowercase()) {
                return false;
            }
        }

        if let Some(min_rating) = filters.get("min_rating").and_then(|v| v.as_f64()) {
            let rating = game.get("rating").and_then(|v| v.as_f64()).unwrap_or(0.0);
            if rating < min_rating {
                return false;
            }
        }

        if let Some(language) = filters.get("language").and_then(|v| v.as_str()) {
            let languages = game
                .get("supported_languages")
                .and_then(|v| v.as_array())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|item| item.as_str())
                        .collect::<HashSet<_>>()
                })
                .unwrap_or_default();
            if !languages.contains(&language) {
                return false;
            }
        }

        if let Some(status) = filters.get("status").and_then(|v| v.as_str()) {
            let game_id = game.get("id").and_then(|v| v.as_str()).unwrap_or("");
            let dir = games_dir.join(format!("game_{}", game_id));
            let installed = dir.join(".download_complete").exists();
            match status {
                "installed" if !installed => return false,
                "not_installed" if installed => return false,
                _ => {}
            }
        }

        let min_size = filters
            .get("min_size")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);
        let max_size = filters
            .get("max_size")
            .and_then(|v| v.as_f64())
            .unwrap_or(f64::MAX);
        let size = game
            .get("expected_size")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);
        if size < min_size || size > max_size {
            return false;
        }

        true
    }

    fn compare_games(
        a: &Value,
        b: &Value,
        key: SortKey,
        reverse: bool,
        games_dir: &Path,
    ) -> Ordering {
        let order = match key {
            SortKey::Name => a
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_lowercase()
                .cmp(
                    &b.get("name")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_lowercase(),
                ),
            SortKey::Size => {
                let a_size = a
                    .get("expected_size")
                    .and_then(|v| v.as_f64())
                    .unwrap_or(0.0);
                let b_size = b
                    .get("expected_size")
                    .and_then(|v| v.as_f64())
                    .unwrap_or(0.0);
                a_size.partial_cmp(&b_size).unwrap_or(Ordering::Equal)
            }
            SortKey::InstallDate => {
                let game_a = a.get("id").and_then(|v| v.as_str()).unwrap_or("");
                let game_b = b.get("id").and_then(|v| v.as_str()).unwrap_or("");
                let time_a = games_dir
                    .join(format!("game_{}", game_a))
                    .join(".download_complete")
                    .metadata()
                    .and_then(|m| m.modified())
                    .ok();
                let time_b = games_dir
                    .join(format!("game_{}", game_b))
                    .join(".download_complete")
                    .metadata()
                    .and_then(|m| m.modified())
                    .ok();
                time_a.cmp(&time_b)
            }
            SortKey::LastPlayed => {
                let time_a = a.get("last_played").and_then(|v| v.as_f64()).unwrap_or(0.0);
                let time_b = b.get("last_played").and_then(|v| v.as_f64()).unwrap_or(0.0);
                time_a.partial_cmp(&time_b).unwrap_or(Ordering::Equal)
            }
            SortKey::Rating => {
                let rating_a = a.get("rating").and_then(|v| v.as_f64()).unwrap_or(0.0);
                let rating_b = b.get("rating").and_then(|v| v.as_f64()).unwrap_or(0.0);
                rating_a.partial_cmp(&rating_b).unwrap_or(Ordering::Equal)
            }
            SortKey::Developer => a
                .get("developer")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_lowercase()
                .cmp(
                    &b.get("developer")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_lowercase(),
                ),
        };

        if reverse {
            order.reverse()
        } else {
            order
        }
    }

    fn get_game_status(&self, game_id: &str) -> PyResult<String> {
        if self.is_game_installed(game_id.to_string())? {
            Ok("installed".to_string())
        } else {
            Ok("not_installed".to_string())
        }
    }
}
