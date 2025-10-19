use crate::util::{runtime_error, value_to_py};
use anyhow::Result;
use pyo3::prelude::*;
use serde_json::{json, Value};
use std::collections::{BTreeMap, HashMap};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use tokio::process::Command;
use tokio::task;

#[derive(Clone, Debug)]
struct ProtonVersion {
    id: String,
    name: String,
    version: String,
    tool_type: String,
    path: String,
    description: String,
}

impl ProtonVersion {
    fn to_dict(&self) -> Value {
        json!({
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "type": self.tool_type,
            "path": self.path,
            "description": self.description
        })
    }
}

#[pyclass(module = "vn_core")]
#[derive(Clone)]
pub struct SteamIntegration {
    games_dir: PathBuf,
    steam_dir: Option<PathBuf>,
    userdata_dir: Option<PathBuf>,
    steam_apps_dir: Option<PathBuf>,
}

impl SteamIntegration {
    fn find_steam_directory() -> Option<PathBuf> {
        let possible_paths = vec![
            dirs::home_dir()?.join(".steam").join("steam"),
            dirs::home_dir()?.join(".local").join("share").join("Steam"),
            PathBuf::from("/usr/share/steam"),
            PathBuf::from("/opt/steam"),
        ];

        for path in possible_paths {
            if path.exists() && path.join("config").exists() {
                return Some(path);
            }
        }

        None
    }

    fn get_primary_user_id(&self) -> Option<String> {
        let userdata_dir = self.userdata_dir.as_ref()?;

        let user_dirs: Vec<_> = fs::read_dir(userdata_dir)
            .ok()?
            .filter_map(|entry| entry.ok())
            .filter(|entry| {
                entry.path().is_dir() &&
                entry.file_name().to_str()
                    .map(|s| s.chars().all(|c| c.is_ascii_digit()))
                    .unwrap_or(false)
            })
            .collect();

        user_dirs.first()?.file_name().to_str().map(|s| s.to_string())
    }

    fn generate_app_id(&self, game_name: &str) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        format!("VNManager_{}", game_name).hash(&mut hasher);
        let hash = hasher.finish();

        // Convert to format Steam uses for non-Steam games
        (hash as u32).to_string()
    }

    fn parse_compatibility_tool(&self, tool_dir: &Path) -> Option<ProtonVersion> {
        let vdf_files = ["tool.vdf", "compatibilitytool.vdf"];
        let mut vdf_path = None;

        for vdf_file in &vdf_files {
            let path = tool_dir.join(vdf_file);
            if path.exists() {
                vdf_path = Some(path);
                break;
            }
        }

        let vdf_path = vdf_path?;
        let content = fs::read_to_string(&vdf_path).ok()?;

        let mut name = tool_dir.file_name()?.to_str()?.to_string();
        let version = "unknown".to_string();

        // Basic VDF parsing to extract display name
        if let Some(start) = content.find("\"display_name\"") {
            let start = content[start..].find('\"')? + start + 1;
            let start = content[start..].find('\"')? + start + 1;
            let end = content[start..].find('\"')? + start;
            if end > start {
                name = content[start..end].to_string();
            }
        }

        Some(ProtonVersion {
            id: tool_dir.file_name()?.to_str()?.to_string(),
            name: name.clone(),
            version,
            tool_type: "custom".to_string(),
            path: tool_dir.to_string_lossy().to_string(),
            description: format!("Custom compatibility tool: {}", name),
        })
    }

    fn user_config_dir(&self) -> Option<PathBuf> {
        let userdata = self.userdata_dir.as_ref()?;
        let user_id = self.get_primary_user_id()?;
        Some(userdata.join(user_id).join("config"))
    }

    fn read_compatibility_map(&self, compat_file: &Path) -> Result<BTreeMap<String, String>> {
        let mut map = BTreeMap::new();
        if !compat_file.exists() {
            return Ok(map);
        }

        let content = fs::read_to_string(compat_file)?;
        let mut current_id: Option<String> = None;

        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with('"') && trimmed.ends_with('"') && !trimmed.contains(' ') {
                current_id = Some(trimmed.trim_matches('"').to_string());
                continue;
            }

            if let Some(app_id) = &current_id {
                if trimmed.starts_with("\"tool\"") {
                    if let Some(value) = Self::extract_tool_value(trimmed) {
                        map.insert(app_id.clone(), value);
                    }
                }
            }

            if trimmed == "}" {
                current_id = None;
            }
        }

        Ok(map)
    }

    fn write_compatibility_map(&self, compat_file: &Path, map: &BTreeMap<String, String>) -> Result<()> {
        if map.is_empty() {
            if compat_file.exists() {
                fs::remove_file(compat_file).ok();
            }
            return Ok(());
        }

        let mut payload = String::new();
        for (app_id, tool) in map {
            payload.push_str(&format!(
                "\"{}\"\n{{\n    \"tool\"      \"{}\"\n    \"config\"    \"\"\n}}\n",
                app_id, tool
            ));
        }
        fs::write(compat_file, payload)?;
        Ok(())
    }

    fn upsert_compatibility_tool(&self, compat_file: &Path, app_id: &str, tool: &str) -> Result<()> {
        let mut map = self.read_compatibility_map(compat_file)?;
        map.insert(app_id.to_string(), tool.to_string());
        self.write_compatibility_map(compat_file, &map)
    }

    fn remove_compatibility_tool(&self, compat_file: &Path, app_id: &str) -> Result<()> {
        let mut map = self.read_compatibility_map(compat_file)?;
        if map.remove(app_id).is_some() {
            self.write_compatibility_map(compat_file, &map)?;
        }
        Ok(())
    }

    fn get_compatibility_tool(&self, compat_file: &Path, app_id: &str) -> Result<Option<String>> {
        let map = self.read_compatibility_map(compat_file)?;
        Ok(map.get(app_id).cloned())
    }

    fn extract_tool_value(line: &str) -> Option<String> {
        let parts: Vec<&str> = line.split('"').collect();
        if parts.len() >= 4 {
            Some(parts[3].trim().to_string())
        } else {
            None
        }
    }

    fn read_shortcuts_file(&self, shortcuts_file: &Path) -> Result<Vec<Value>> {
        if !shortcuts_file.exists() {
            return Ok(Vec::new());
        }

        let data = fs::read(shortcuts_file)?;
        let mut shortcuts = Vec::new();
        let mut offset = 0;

        if offset >= data.len() || data[offset] != 0x00 {
            return Ok(shortcuts);
        }
        offset += 1;

        let (root_key, new_offset) = self.read_vdf_string(&data, offset)?;
        offset = new_offset;
        if root_key != "shortcuts" {
            return Ok(shortcuts);
        }

        while offset < data.len() {
            let value_type = data[offset];
            offset += 1;

            if value_type == 0x08 {
                break; // End of root object
            }
            if value_type != 0x00 {
                break;
            }

            // Entry index (ignored)
            let (_, new_offset) = self.read_vdf_string(&data, offset)?;
            offset = new_offset;

            let (entry, new_offset) = self.read_vdf_entry(&data, offset)?;
            offset = new_offset;
            shortcuts.push(entry);
        }

        Ok(shortcuts)
    }

    fn write_shortcuts_file(&self, shortcuts_file: &Path, entries: &[Value]) -> Result<()> {
        let mut payload = Vec::new();
        payload.push(0x00);
        payload.extend_from_slice(b"shortcuts\x00");

        for (index, entry) in entries.iter().enumerate() {
            payload.push(0x00);
            payload.extend_from_slice(index.to_string().as_bytes());
            payload.push(0x00);
            payload.extend_from_slice(&self.serialize_shortcut_entry(entry)?);
        }

        payload.push(0x08); // End root object
        payload.push(0x08); // Final terminator

        fs::write(shortcuts_file, payload)?;
        Ok(())
    }

    fn serialize_shortcut_entry(&self, entry: &Value) -> Result<Vec<u8>> {
        let mut blob = Vec::new();

        if let Some(obj) = entry.as_object() {
            for (key, value) in obj {
                match value {
                    Value::String(s) => {
                        blob.push(0x01);
                        blob.extend_from_slice(key.as_bytes());
                        blob.push(0x00);
                        blob.extend_from_slice(s.as_bytes());
                        blob.push(0x00);
                    }
                    Value::Number(n) if n.is_i64() => {
                        blob.push(0x02);
                        blob.extend_from_slice(key.as_bytes());
                        blob.push(0x00);
                        let val = n.as_i64().unwrap_or(0) as u32;
                        blob.extend_from_slice(&val.to_le_bytes());
                    }
                    Value::Array(arr) => {
                        blob.push(0x00);
                        blob.extend_from_slice(key.as_bytes());
                        blob.push(0x00);
                        for (idx, item) in arr.iter().enumerate() {
                            blob.push(0x01);
                            blob.extend_from_slice(idx.to_string().as_bytes());
                            blob.push(0x00);
                            if let Some(s) = item.as_str() {
                                blob.extend_from_slice(s.as_bytes());
                            }
                            blob.push(0x00);
                        }
                        blob.push(0x08);
                    }
                    _ => {}
                }
            }
        }
        blob.push(0x08);
        Ok(blob)
    }

    fn read_vdf_string(&self, data: &[u8], offset: usize) -> Result<(String, usize)> {
        let end = data[offset..].iter().position(|&b| b == 0x00).unwrap_or(data.len() - offset);
        let value = String::from_utf8_lossy(&data[offset..offset + end]).to_string();
        Ok((value, offset + end + 1))
    }

    fn read_vdf_entry(&self, data: &[u8], mut offset: usize) -> Result<(Value, usize)> {
        let mut entry = serde_json::Map::new();

        while offset < data.len() {
            let value_type = data[offset];
            offset += 1;

            if value_type == 0x08 {
                break;
            }

            let (key, new_offset) = self.read_vdf_string(data, offset)?;
            offset = new_offset;

            match value_type {
                0x01 => {
                    let (value, new_offset) = self.read_vdf_string(data, offset)?;
                    offset = new_offset;
                    entry.insert(key, Value::String(value));
                }
                0x02 => {
                    if offset + 4 <= data.len() {
                        let value = u32::from_le_bytes([data[offset], data[offset+1], data[offset+2], data[offset+3]]) as i64;
                        offset += 4;
                        entry.insert(key, Value::Number(value.into()));
                    }
                }
                0x00 => {
                    let (nested, new_offset) = self.read_vdf_object(data, offset)?;
                    offset = new_offset;
                    entry.insert(key, nested);
                }
                _ => break,
            }
        }

        Ok((Value::Object(entry), offset))
    }

    fn read_vdf_object(&self, data: &[u8], mut offset: usize) -> Result<(Value, usize)> {
        let mut nested = serde_json::Map::new();

        while offset < data.len() {
            let value_type = data[offset];
            offset += 1;

            if value_type == 0x08 {
                break;
            }

            let (key, new_offset) = self.read_vdf_string(data, offset)?;
            offset = new_offset;

            match value_type {
                0x01 => {
                    let (value, new_offset) = self.read_vdf_string(data, offset)?;
                    offset = new_offset;
                    nested.insert(key, Value::String(value));
                }
                0x02 => {
                    if offset + 4 <= data.len() {
                        let value = u32::from_le_bytes([data[offset], data[offset+1], data[offset+2], data[offset+3]]) as i64;
                        offset += 4;
                        nested.insert(key, Value::Number(value.into()));
                    }
                }
                _ => {
                    nested.insert(key, Value::Null);
                }
            }
        }

        // Check if this is an array (all keys are numeric)
        if nested.keys().all(|k| k.parse::<usize>().is_ok()) {
            let mut arr = Vec::new();
            let mut keys: Vec<usize> = nested.keys().filter_map(|k| k.parse().ok()).collect();
            keys.sort();
            for key in keys {
                if let Some(value) = nested.get(&key.to_string()) {
                    arr.push(value.clone());
                }
            }
            Ok((Value::Array(arr), offset))
        } else {
            Ok((Value::Object(nested), offset))
        }
    }

    fn build_shortcut_entry(&self, app_id: &str, game_name: &str, executable_path: &str, game_dir: &str) -> Value {
        json!({
            "appid": app_id,
            "AppName": game_name,
            "Exe": format!("\"{}\"", executable_path),
            "StartDir": format!("\"{}\"", game_dir),
            "icon": "",
            "ShortcutPath": "",
            "LaunchOptions": "",
            "IsHidden": 0,
            "AllowDesktopConfig": 1,
            "AllowOverlay": 1,
            "OpenVR": 0,
            "Devkit": 0,
            "DevkitGameID": "",
            "DevkitOverrideAppID": 0,
            "LastPlayTime": 0,
            "FlatpakAppID": "",
            "tags": ["Visual Novel", "VN Manager"]
        })
    }
}

#[pymethods]
impl SteamIntegration {
    #[new]
    pub fn new(games_dir: String) -> PyResult<Self> {
        let games_dir = PathBuf::from(games_dir);
        let steam_dir = Self::find_steam_directory();
        let userdata_dir = steam_dir.as_ref().map(|d| d.join("userdata"));
        let steam_apps_dir = steam_dir.as_ref().map(|d| d.join("steamapps"));

        Ok(Self {
            games_dir,
            steam_dir,
            userdata_dir,
            steam_apps_dir,
        })
    }

    pub fn get_available_proton_versions(&self, py: Python<'_>) -> PyResult<PyObject> {
        let mut versions = Vec::new();

        // Scan custom compatibility tools
        if let Some(steam_dir) = &self.steam_dir {
            let compat_dir = steam_dir.join("compatibilitytools.d");
            if compat_dir.exists() {
                for entry in fs::read_dir(&compat_dir).map_err(|e| runtime_error(e.to_string()))? {
                    let entry = entry.map_err(|e| runtime_error(e.to_string()))?;
                    if entry.path().is_dir() {
                        if let Some(tool_info) = self.parse_compatibility_tool(&entry.path()) {
                            versions.push(tool_info.to_dict());
                        }
                    }
                }
            }
        }

        // Add built-in Steam Proton versions
        let builtin_versions = vec![
            ProtonVersion {
                id: "proton_experimental".to_string(),
                name: "Proton Experimental".to_string(),
                version: "experimental".to_string(),
                tool_type: "builtin".to_string(),
                path: "".to_string(),
                description: "Latest experimental Proton build".to_string(),
            },
            ProtonVersion {
                id: "proton_90".to_string(),
                name: "Proton 9.0".to_string(),
                version: "9.0".to_string(),
                tool_type: "builtin".to_string(),
                path: "".to_string(),
                description: "Stable Proton 9.0 release".to_string(),
            },
            ProtonVersion {
                id: "proton_80".to_string(),
                name: "Proton 8.0".to_string(),
                version: "8.0".to_string(),
                tool_type: "builtin".to_string(),
                path: "".to_string(),
                description: "Stable Proton 8.0 release".to_string(),
            },
        ];

        for version in builtin_versions {
            versions.push(version.to_dict());
        }

        value_to_py(py, &Value::Array(versions))
    }

    pub fn add_game_to_steam<'py>(
        &'py self,
        py: Python<'py>,
        _game_id: String,
        game_name: String,
        executable_path: String,
        game_dir: String,
        compatibility_tool: Option<String>,
    ) -> PyResult<&'py PyAny> {
        let integrator = self.clone();
        let user_config_dir = self.user_config_dir();
        let compatibility_tool = compatibility_tool.unwrap_or_else(|| "proton_experimental".to_string());
        let resolved_game_dir = {
            let candidate = PathBuf::from(&game_dir);
            if candidate.is_absolute() {
                candidate
            } else {
                self.games_dir.join(candidate)
            }
        };
        let resolved_executable = {
            let candidate = PathBuf::from(&executable_path);
            if candidate.is_absolute() {
                candidate
            } else {
                resolved_game_dir.join(candidate)
            }
        };
        let shortcut_game_dir = resolved_game_dir.to_string_lossy().to_string();
        let shortcut_executable = resolved_executable.to_string_lossy().to_string();

        pyo3_asyncio::tokio::future_into_py(py, async move {
            let user_config_dir = match user_config_dir {
                Some(path) => path,
                None => {
                    let result = json!({
                        "success": false,
                        "message": "Steam directory not found"
                    });
                    return Python::with_gil(|py| value_to_py(py, &result));
                }
            };

            tokio::fs::create_dir_all(&user_config_dir)
                .await
                .map_err(|e| runtime_error(e.to_string()))?;

            let app_id = integrator.generate_app_id(&game_name);

            let shortcuts_file = user_config_dir.join("shortcuts.vdf");
            let mut shortcuts = task::spawn_blocking({
                let integrator = integrator.clone();
                let shortcuts_file = shortcuts_file.clone();
                move || -> Result<Vec<Value>> {
                    if shortcuts_file.exists() {
                        integrator.read_shortcuts_file(&shortcuts_file)
                    } else {
                        Ok(Vec::new())
                    }
                }
            })
            .await
            .map_err(|e| runtime_error(e.to_string()))?
            .map_err(|e| runtime_error(e.to_string()))?;

            shortcuts.retain(|entry| {
                entry.get("appid").and_then(|v| v.as_str()) != Some(app_id.as_str())
            });
            shortcuts.push(
                integrator.build_shortcut_entry(&app_id, &game_name, &shortcut_executable, &shortcut_game_dir),
            );

            let shortcuts_for_write = shortcuts.clone();
            task::spawn_blocking({
                let integrator = integrator.clone();
                let shortcuts_file = shortcuts_file.clone();
                move || integrator.write_shortcuts_file(&shortcuts_file, &shortcuts_for_write)
            })
            .await
            .map_err(|e| runtime_error(e.to_string()))?
            .map_err(|e| runtime_error(e.to_string()))?;

            let compat_file = user_config_dir.join("compatibilitytools.vdf");
            let app_id_for_compat = app_id.clone();
            let tool_for_compat = compatibility_tool.clone();
            task::spawn_blocking({
                let integrator = integrator.clone();
                move || integrator.upsert_compatibility_tool(&compat_file, &app_id_for_compat, &tool_for_compat)
            })
            .await
            .map_err(|e| runtime_error(e.to_string()))?
            .map_err(|e| runtime_error(e.to_string()))?;

            let result = json!({
                "success": true,
                "app_id": app_id,
                "message": format!("Game '{}' added to Steam library", game_name)
            });

            Python::with_gil(|py| value_to_py(py, &result))
        })
    }

    pub fn remove_game_from_steam<'py>(
        &'py self,
        py: Python<'py>,
        app_id: String,
    ) -> PyResult<&'py PyAny> {
        let integrator = self.clone();
        let user_config_dir = self.user_config_dir();

        pyo3_asyncio::tokio::future_into_py(py, async move {
            if let Some(user_config_dir) = user_config_dir {
                let shortcuts_file = user_config_dir.join("shortcuts.vdf");
                if shortcuts_file.exists() {
                    let filtered = task::spawn_blocking({
                        let integrator = integrator.clone();
                        let shortcuts_file = shortcuts_file.clone();
                        let target_app_id = app_id.clone();
                        move || -> Result<Vec<Value>> {
                            let mut entries = integrator.read_shortcuts_file(&shortcuts_file)?;
                            entries.retain(|entry| entry.get("appid").and_then(|v| v.as_str()) != Some(target_app_id.as_str()));
                            Ok(entries)
                        }
                    })
                    .await
                    .map_err(|e| runtime_error(e.to_string()))?
                    .map_err(|e| runtime_error(e.to_string()))?;

                    let filtered_clone = filtered.clone();
                    task::spawn_blocking({
                        let integrator = integrator.clone();
                        let shortcuts_file = shortcuts_file.clone();
                        move || integrator.write_shortcuts_file(&shortcuts_file, &filtered_clone)
                    })
                    .await
                    .map_err(|e| runtime_error(e.to_string()))?
                    .map_err(|e| runtime_error(e.to_string()))?;
                }

                let compat_file = user_config_dir.join("compatibilitytools.vdf");
                if compat_file.exists() {
                    task::spawn_blocking({
                        let integrator = integrator.clone();
                        let app_id = app_id.clone();
                        move || integrator.remove_compatibility_tool(&compat_file, &app_id)
                    })
                    .await
                    .map_err(|e| runtime_error(e.to_string()))?
                    .map_err(|e| runtime_error(e.to_string()))?;
                }
            }

            let result = json!({
                "success": true,
                "message": "Game removed from Steam library"
            });
            Python::with_gil(|py| value_to_py(py, &result))
        })
    }

    pub fn configure_winetricks<'py>(
        &'py self,
        py: Python<'py>,
        app_id: String,
        components: Vec<String>,
        locale: Option<String>,
    ) -> PyResult<&'py PyAny> {
        let steam_apps_dir = self.steam_apps_dir.clone();

        pyo3_asyncio::tokio::future_into_py(py, async move {
            let result = configure_winetricks_impl(steam_apps_dir, app_id, components, locale).await;
            Python::with_gil(|py| {
                value_to_py(py, &result)
            })
        })
    }

    pub fn get_game_steam_info(&self, py: Python<'_>, app_id: String) -> PyResult<Option<PyObject>> {
        let user_config_dir = match self.user_config_dir() {
            Some(path) => path,
            None => return Ok(None),
        };

        let shortcuts_file = user_config_dir.join("shortcuts.vdf");
        if !shortcuts_file.exists() {
            return Ok(None);
        }

        let entries = self
            .read_shortcuts_file(&shortcuts_file)
            .map_err(|e| runtime_error(e.to_string()))?;

        let entry = entries.into_iter().find(|entry| {
            entry.get("appid").and_then(|v| v.as_str()) == Some(app_id.as_str())
        });

        let entry = match entry {
            Some(value) => value,
            None => return Ok(None),
        };

        let exe_path = entry
            .get("Exe")
            .and_then(|v| v.as_str())
            .map(|s| s.trim_matches('"').to_string())
            .unwrap_or_default();
        let start_dir = entry
            .get("StartDir")
            .and_then(|v| v.as_str())
            .map(|s| s.trim_matches('"').to_string())
            .unwrap_or_default();

        let compat_file = user_config_dir.join("compatibilitytools.vdf");
        let compat_tool = self
            .get_compatibility_tool(&compat_file, &app_id)
            .unwrap_or(None)
            .unwrap_or_else(|| "proton_experimental".to_string());

        let info = json!({
            "app_id": app_id,
            "game_path": start_dir,
            "executable": exe_path,
            "compatibility_tool": compat_tool,
            "prefix_path": format!("steamapps/compatdata/{}/pfx", app_id),
            "components": Vec::<String>::new(),
        });

        Ok(Some(value_to_py(py, &info)?))
    }
}

impl SteamIntegration {
    async fn install_wine_component(prefix_path: &Path, component: &str) -> Value {
        let component_map: HashMap<&str, &str> = [
            ("wmp9", "wmp9"),
            ("wmp10", "wmp10"),
            ("wmp11", "wmp11"),
            ("wmv9vcm", "wmv9vcm"),
            ("vcrun2019", "vcrun2019"),
            ("vcrun2022", "vcrun2022"),
            ("cjkfonts", "cjkfonts"),
            ("fakejapanese", "fakejapanese"),
        ].iter().cloned().collect();

        let winetricks_component = component_map.get(component).unwrap_or(&component);

        // Check if winetricks is available
        match Command::new("which").arg("winetricks").output().await {
            Ok(output) if output.status.success() => {
                // Run winetricks
                let mut cmd = Command::new("winetricks");
                cmd.arg("-q")
                   .arg(winetricks_component)
                   .env("WINEPREFIX", prefix_path)
                   .env("WINEDEBUG", "-all")
                   .stdout(Stdio::piped())
                   .stderr(Stdio::piped());

                match cmd.output().await {
                    Ok(output) if output.status.success() => {
                        json!({
                            "success": true,
                            "component": component,
                            "message": format!("Installed {}", component)
                        })
                    }
                    Ok(output) => {
                        let error_msg = String::from_utf8_lossy(&output.stderr);
                        json!({
                            "success": false,
                            "component": component,
                            "message": format!("Failed to install {}: {}", component, error_msg)
                        })
                    }
                    Err(e) => {
                        json!({
                            "success": false,
                            "component": component,
                            "message": format!("Exception installing {}: {}", component, e)
                        })
                    }
                }
            }
            _ => {
                json!({
                    "success": false,
                    "component": component,
                    "message": "winetricks not available"
                })
            }
        }
    }

    async fn set_wine_locale(prefix_path: &Path, locale: &str) -> Value {
        let locale_map: HashMap<&str, &str> = [
            ("japanese", "ja_JP.UTF-8"),
            ("chinese", "zh_CN.UTF-8"),
            ("korean", "ko_KR.UTF-8"),
            ("english", "en_US.UTF-8"),
        ].iter().cloned().collect();

        let lowercase_locale = locale.to_lowercase();
        let wine_locale = locale_map.get(lowercase_locale.as_str()).unwrap_or(&locale);

        let registry_commands = format!(
            "Windows Registry Editor Version 5.00\n\n\
            [HKEY_CURRENT_USER\\Control Panel\\International]\n\
            \"Locale\"=\"{}\"\n\
            \"LocaleName\"=\"{}\"\n",
            wine_locale, wine_locale
        );

        let reg_file = prefix_path.join("temp_locale.reg");

        match tokio::fs::write(&reg_file, &registry_commands).await {
            Ok(()) => {
                // Apply registry changes
                match Command::new("which").arg("wine").output().await {
                    Ok(output) if output.status.success() => {
                        let mut cmd = Command::new("wine");
                        cmd.arg("regedit")
                           .arg(&reg_file)
                           .env("WINEPREFIX", prefix_path)
                           .stdout(Stdio::piped())
                           .stderr(Stdio::piped());

                        let result = match cmd.output().await {
                            Ok(_) => {
                                json!({
                                    "success": true,
                                    "component": format!("locale_{}", locale),
                                    "message": format!("Set locale to {}", wine_locale)
                                })
                            }
                            Err(e) => {
                                json!({
                                    "success": false,
                                    "component": format!("locale_{}", locale),
                                    "message": format!("Failed to apply registry: {}", e)
                                })
                            }
                        };

                        // Clean up temp file
                        let _ = tokio::fs::remove_file(&reg_file).await;
                        result
                    }
                    _ => {
                        json!({
                            "success": false,
                            "component": format!("locale_{}", locale),
                            "message": "Wine not available"
                        })
                    }
                }
            }
            Err(e) => {
                json!({
                    "success": false,
                    "component": format!("locale_{}", locale),
                    "message": format!("Failed to create registry file: {}", e)
                })
            }
        }
    }
}

async fn configure_winetricks_impl(
    steam_apps_dir: Option<std::path::PathBuf>,
    app_id: String,
    components: Vec<String>,
    locale: Option<String>,
) -> serde_json::Value {
    if steam_apps_dir.is_none() {
        return json!({
            "success": false,
            "message": "Steam apps directory not found"
        });
    }

    let steam_apps_dir = steam_apps_dir.unwrap();
    let compat_data_dir = steam_apps_dir.join("compatdata").join(&app_id);
    let prefix_path = compat_data_dir.join("pfx");

    if !prefix_path.exists() {
        return json!({
            "success": false,
            "message": "Wine prefix not found"
        });
    }

    let mut results = Vec::new();

    // Install components
    for component in components {
        let result = SteamIntegration::install_wine_component(&prefix_path, &component).await;
        results.push(result);
    }

    // Set locale if specified
    if let Some (locale_str) = locale {
        let locale_result = SteamIntegration::set_wine_locale(&prefix_path, &locale_str).await;
        results.push(locale_result);
    }

    let success_count = results.iter().filter(|r| r["success"].as_bool().unwrap_or(false)).count();

    json!({
        "success": success_count > 0,
        "message": format!("Configured {}/{} components", success_count, results.len()),
        "results": results
    })
}
