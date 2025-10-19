use crate::util::{extract_zip, runtime_error, sha1_file, value_to_py};
use crate::json_result;
use anyhow::{anyhow, Context, Result};
use futures::StreamExt;
use pyo3::prelude::*;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;
use time::OffsetDateTime;
use tokio::fs;
use tokio::io::{AsyncSeekExt, AsyncWriteExt};
use tokio::sync::RwLock;
use tokio::time::Instant;

const DOWNLOAD_EVENT_NAME: &str = "visual_novel_manager/download-update";

#[derive(Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum DownloadStatus {
    Pending,
    Downloading,
    Paused,
    Completed,
    Failed,
    Cancelled,
}

impl DownloadStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            DownloadStatus::Pending => "pending",
            DownloadStatus::Downloading => "downloading",
            DownloadStatus::Paused => "paused",
            DownloadStatus::Completed => "completed",
            DownloadStatus::Failed => "failed",
            DownloadStatus::Cancelled => "cancelled",
        }
    }

    pub fn is_active(&self) -> bool {
        matches!(
            self,
            DownloadStatus::Pending | DownloadStatus::Downloading | DownloadStatus::Paused
        )
    }
}

#[derive(Clone, Serialize, Deserialize)]
struct DownloadSource {
    url: String,
    priority: u32,
    max_connections: u32,
    active_connections: u32,
    failures: u32,
    last_speed: f64,
}

impl DownloadSource {
    fn new(url: String, priority: u32) -> Self {
        Self {
            url,
            priority,
            max_connections: 4,
            active_connections: 0,
            failures: 0,
            last_speed: 0.0,
        }
    }
}

#[derive(Clone, Serialize, Deserialize)]
struct DownloadChunk {
    id: u32,
    start: u64,
    end: u64,
    size: u64,
    downloaded: u64,
    status: DownloadStatus,
    source_url: String,
    retry_count: u32,
}

impl DownloadChunk {
    fn new(id: u32, start: u64, end: u64) -> Self {
        Self {
            id,
            start,
            end,
            size: end - start + 1,
            downloaded: 0,
            status: DownloadStatus::Pending,
            source_url: String::new(),
            retry_count: 0,
        }
    }
}

#[derive(Serialize, Clone)]
pub struct DownloadSnapshot {
    pub game_id: String,
    pub game_name: String,
    pub status: DownloadStatus,
    pub progress: f64,
    pub downloaded_size: u64,
    pub total_size: u64,
    pub speed: f64,
    pub eta_seconds: u64,
    pub message: Option<String>,
    pub started_at: i64,
    pub updated_at: i64,
}

#[derive(Clone, Serialize, Deserialize)]
struct DownloadState {
    game_id: String,
    game_name: String,
    status: DownloadStatus,
    downloaded_size: u64,
    total_size: u64,
    progress: f64,
    speed: f64,
    eta_seconds: u64,
    message: Option<String>,
    #[serde(with = "time::serde::rfc3339")]
    created_at: OffsetDateTime,
    #[serde(with = "time::serde::rfc3339")]
    updated_at: OffsetDateTime,
    integrity_hash: Option<String>,
    sources: Vec<DownloadSource>,
    chunks: Vec<DownloadChunk>,
    chunk_size: u64,
    max_concurrent_chunks: u32,
    task_id: String,
    #[serde(skip, default = "DownloadState::instant_now")]
    last_event_emit: Instant,
    #[serde(skip, default)]
    last_event_progress: f64,
    #[serde(skip, default = "DownloadState::default_status")]
    last_event_status: DownloadStatus,
}

impl DownloadState {
    fn new(
        game_id: String,
        game_name: String,
        total_size: u64,
        integrity_hash: Option<String>,
        sources: Vec<String>,
        task_id: String,
    ) -> Self {
        let download_sources = sources
            .into_iter()
            .enumerate()
            .map(|(i, url)| DownloadSource::new(url, i as u32))
            .collect();

        let chunk_size = 1024 * 1024; // 1MB chunks
        let chunks = Self::create_chunks(total_size, chunk_size);

        Self {
            game_id,
            game_name,
            status: DownloadStatus::Pending,
            downloaded_size: 0,
            total_size,
            progress: 0.0,
            speed: 0.0,
            eta_seconds: 0,
            message: None,
            created_at: OffsetDateTime::now_utc(),
            updated_at: OffsetDateTime::now_utc(),
            integrity_hash,
            sources: download_sources,
            chunks,
            chunk_size,
            max_concurrent_chunks: 8,
            task_id,
            last_event_emit: Instant::now(),
            last_event_progress: -1.0,
            last_event_status: DownloadStatus::Pending,
        }
    }

    fn instant_now() -> Instant {
        Instant::now()
    }

    fn default_status() -> DownloadStatus {
        DownloadStatus::Pending
    }

    fn maybe_emit_event(&mut self) {
        let elapsed = self.last_event_emit.elapsed();
        let progress_delta = (self.progress - self.last_event_progress).abs();
        let state_transition = matches!(
            self.status,
            DownloadStatus::Completed | DownloadStatus::Failed | DownloadStatus::Cancelled
        );

        let status_changed = self.status != self.last_event_status;

        if elapsed >= Duration::from_millis(750) || progress_delta >= 0.5 || state_transition || status_changed {
            self.last_event_emit = Instant::now();
            self.last_event_progress = self.progress;
            self.last_event_status = self.status;
            emit_download_event(self);
        }
    }

    fn create_chunks(total_size: u64, chunk_size: u64) -> Vec<DownloadChunk> {
        if total_size == 0 {
            return Vec::new();
        }

        let mut chunks = Vec::new();
        let mut offset = 0;
        let mut chunk_id = 0;

        while offset < total_size {
            let end = std::cmp::min(offset + chunk_size - 1, total_size - 1);
            chunks.push(DownloadChunk::new(chunk_id, offset, end));
            offset = end + 1;
            chunk_id += 1;
        }

        chunks
    }

    fn select_best_source(&mut self) -> Option<&mut DownloadSource> {
        self.sources
            .iter_mut()
            .filter(|s| s.active_connections < s.max_connections && s.failures < 3)
            .min_by_key(|s| (s.priority, s.active_connections, s.failures))
    }

    async fn save_to_disk(&self, downloads_dir: &Path) -> Result<()> {
        let state_file = downloads_dir.join(format!("{}.json", self.game_id));
        let json = serde_json::to_string_pretty(self)?;
        tokio::fs::write(state_file, json).await?;
        Ok(())
    }

    async fn load_from_disk(game_id: &str, downloads_dir: &Path) -> Option<Self> {
        let state_file = downloads_dir.join(format!("{}.json", game_id));
        if !state_file.exists() {
            return None;
        }

        match tokio::fs::read_to_string(state_file).await {
            Ok(content) => serde_json::from_str(&content).ok(),
            Err(_) => None,
        }
    }

    fn snapshot(&self) -> DownloadSnapshot {
        DownloadSnapshot {
            game_id: self.game_id.clone(),
            game_name: self.game_name.clone(),
            status: self.status,
            progress: self.progress,
            downloaded_size: self.downloaded_size,
            total_size: self.total_size,
            speed: self.speed,
            eta_seconds: self.eta_seconds,
            message: self.message.clone(),
            started_at: self.created_at.unix_timestamp(),
            updated_at: self.updated_at.unix_timestamp(),
        }
    }

    fn update_progress(&mut self) {
        self.updated_at = OffsetDateTime::now_utc();
        self.downloaded_size = self.chunks.iter().map(|c| c.downloaded).sum();
        self.progress = if self.total_size > 0 {
            (self.downloaded_size as f64 / self.total_size as f64 * 100.0).min(100.0)
        } else {
            0.0
        };
        self.maybe_emit_event();
    }
}

fn emit_download_event(state: &DownloadState) {
    if let Ok(value) = serde_json::to_value(state.snapshot()) {
        Python::with_gil(|py| {
            if let (Ok(decky_mod), Ok(asyncio)) = (py.import("decky"), py.import("asyncio")) {
                if let Ok(payload) = value_to_py(py, &value) {
                    // Prefer decky.emit (async); fall back to decky.emit_event if present
                    let emit_attr = decky_mod.getattr("emit").or_else(|_| decky_mod.getattr("emit_event"));
                    if let Ok(emit_fn) = emit_attr {
                        match emit_fn.call1((DOWNLOAD_EVENT_NAME, payload)) {
                            Ok(coro) => {
                                let _ = asyncio.call_method1("create_task", (coro,));
                            }
                            Err(_) => {}
                        }
                    }
                }
            }
        });
    }
}

struct DownloadHandle {
    state: Arc<RwLock<DownloadState>>,
    task: tokio::task::JoinHandle<()>,
}

#[pyclass]
pub struct DownloadManager {
    http: Client,
    base_dir: PathBuf,
    downloads_dir: PathBuf,
    downloads: Arc<RwLock<HashMap<String, DownloadHandle>>>,
}

impl DownloadManager {
    async fn download_chunk(
        client: &Client,
        chunk: &mut DownloadChunk,
        source: &DownloadSource,
        temp_path: &Path,
    ) -> Result<bool> {
        let request = client
            .get(&source.url)
            .header("Range", format!("bytes={}-{}", chunk.start, chunk.end));

        let response = request.send().await?;

        if !response.status().is_success() && response.status().as_u16() != 206 {
            return Err(anyhow!("HTTP error {}", response.status()));
        }

        let mut file = tokio::fs::OpenOptions::new()
            .write(true)
            .create(true)
            .open(temp_path)
            .await?;

        file.seek(tokio::io::SeekFrom::Start(chunk.start)).await?;

        let mut stream = response.bytes_stream();
        chunk.downloaded = 0;
        chunk.status = DownloadStatus::Downloading;

        while let Some(bytes_result) = stream.next().await {
            let bytes = bytes_result?;
            file.write_all(&bytes).await?;
            chunk.downloaded += bytes.len() as u64;

            if chunk.downloaded > chunk.size {
                return Err(anyhow!("Chunk downloaded more data than expected"));
            }
        }

        file.flush().await?;
        chunk.status = DownloadStatus::Completed;
        Ok(chunk.downloaded == chunk.size)
    }

    async fn perform_chunked_download(
        client: Client,
        state: Arc<RwLock<DownloadState>>,
        base_dir: PathBuf,
        downloads_dir: PathBuf,
    ) -> Result<()> {
        let game_id;
        let game_name;
        {
            let guard = state.read().await;
            game_id = guard.game_id.clone();
            game_name = guard.game_name.clone();

            if guard.sources.is_empty() {
                return Err(anyhow!("No download sources available"));
            }
        }

        let game_dir = base_dir.join(format!("game_{}", game_id));
        fs::create_dir_all(&game_dir)
            .await
            .with_context(|| format!("Failed to create directory {}", game_dir.display()))?;

        let temp_path = game_dir.join(format!("{}.tmp", game_id));

        {
            let mut guard = state.write().await;
            guard.status = DownloadStatus::Downloading;
            guard.update_progress();
            guard.save_to_disk(&downloads_dir).await?;
        }

        // Main download loop with chunking
        let mut chunk_tasks = Vec::new();
        loop {
            let has_pending_chunks = {
                let mut guard = state.write().await;
                let max_concurrent_chunks = guard.max_concurrent_chunks as usize;
                let available_capacity = max_concurrent_chunks.saturating_sub(chunk_tasks.len());

                // Find pending chunks
                let pending_chunks: Vec<usize> = guard
                    .chunks
                    .iter()
                    .enumerate()
                    .filter(|(_, c)| {
                        c.status == DownloadStatus::Pending
                            || (c.status == DownloadStatus::Failed && c.retry_count < 3)
                    })
                    .map(|(i, _)| i)
                    .collect();

                // Start chunk downloads up to available capacity
                for chunk_idx in pending_chunks.into_iter().take(available_capacity) {
                    if let Some(source) = guard.select_best_source() {
                        let source_url = source.url.clone();
                        source.active_connections += 1;
                        guard.chunks[chunk_idx].status = DownloadStatus::Downloading;
                        guard.chunks[chunk_idx].source_url = source_url.clone();

                        let chunk = guard.chunks[chunk_idx].clone();
                        let client_clone = client.clone();
                        let temp_path_clone = temp_path.clone();
                        let state_clone = state.clone();
                        let downloads_dir_clone = downloads_dir.clone();

                        let task = tokio::spawn(async move {
                            let mut chunk = chunk;
                            let source = DownloadSource::new(source_url, 0);
                            let result = Self::download_chunk(
                                &client_clone,
                                &mut chunk,
                                &source,
                                &temp_path_clone,
                            )
                            .await;

                            // Update chunk status in state
                            {
                                let mut guard = state_clone.write().await;
                                guard.chunks[chunk_idx] = chunk;
                                guard.update_progress();
                                let _ = guard.save_to_disk(&downloads_dir_clone).await;
                            }

                            result
                        });

                        chunk_tasks.push(task);
                    }
                }

                guard
                    .chunks
                    .iter()
                    .any(|c| c.status == DownloadStatus::Pending
                        || (c.status == DownloadStatus::Failed && c.retry_count < 3))
            };

            if chunk_tasks.is_empty() {
                if has_pending_chunks {
                    break; // No sources available for remaining chunks
                }
                break; // All work completed
            }

            // Wait for at least one chunk to complete
            let (finished, _, remaining_tasks) = futures::future::select_all(chunk_tasks).await;
            chunk_tasks = remaining_tasks;

            match finished {
                Ok(Ok(_)) => {}, // Chunk completed successfully
                Ok(Err(e)) => {
                    // Chunk failed, will retry if retry_count < 3
                    eprintln!("Chunk download failed: {}", e);
                }
                Err(e) => {
                    eprintln!("Chunk task failed: {}", e);
                }
            }

            // Update source connection counts
            {
                let mut guard = state.write().await;
                for source in &mut guard.sources {
                    if source.active_connections > 0 {
                        source.active_connections -= 1;
                    }
                }
            }
        }

        // Check if all chunks completed
        let (all_completed, integrity_hash) = {
            let guard = state.read().await;
            let completed = guard.chunks.iter().all(|c| c.status == DownloadStatus::Completed);
            (completed, guard.integrity_hash.clone())
        };

        if !all_completed {
            return Err(anyhow!("Download failed - not all chunks completed"));
        }
        // All chunks completed, assemble final file
        let final_path = game_dir.join(format!("{}.zip", game_name));

        // Simple rename for single-file download
        fs::rename(&temp_path, &final_path)
            .await
            .with_context(|| format!("Failed to move file to {}", final_path.display()))?;

        // Verify integrity if hash provided
        if let Some(expected_hash) = integrity_hash {
            let actual_hash = sha1_file(final_path.to_string_lossy().as_ref())
                .map_err(|err| anyhow!(err.to_string()))?;
            if actual_hash.to_lowercase() != expected_hash.to_lowercase() {
                return Err(anyhow!("Integrity check failed"));
            }
        }

        // Extract the downloaded archive
        let _ = extract_zip(
            final_path.to_string_lossy().as_ref(),
            game_dir.to_string_lossy().as_ref(),
        );

        // Mark download as completed
        {
            let mut guard = state.write().await;
            guard.status = DownloadStatus::Completed;
            guard.progress = 100.0;
            guard.speed = 0.0;
            guard.eta_seconds = 0;
            guard.message = Some("Download complete".to_string());
            guard.update_progress();
            let _ = guard.save_to_disk(&downloads_dir).await;
        }

        // Clean up state file
        let state_file = downloads_dir.join(format!("{}.json", game_id));
        let _ = fs::remove_file(state_file).await;

        Ok(())
    }

    pub fn snapshot_all(&self) -> HashMap<String, DownloadSnapshot> {
        let handles: Vec<(String, Arc<RwLock<DownloadState>>)> = {
            let guard = self.downloads.blocking_read();
            guard
                .iter()
                .map(|(id, handle)| (id.clone(), handle.state.clone()))
                .collect()
        };

        let mut snapshots = HashMap::with_capacity(handles.len());
        for (id, state) in handles {
            let snapshot = state.blocking_read().snapshot();
            snapshots.insert(id, snapshot);
        }
        snapshots
    }

    pub fn snapshot_for(&self, game_id: &str) -> Option<DownloadSnapshot> {
        let state_opt = {
            let guard = self.downloads.blocking_read();
            guard.get(game_id).map(|handle| handle.state.clone())
        };
        state_opt.map(|state| state.blocking_read().snapshot())
    }

    pub fn is_active(&self, game_id: &str) -> bool {
        self.snapshot_for(game_id)
            .map(|snapshot| snapshot.status.is_active())
            .unwrap_or(false)
    }
}

#[pymethods]
impl DownloadManager {
    #[new]
    pub fn new(games_dir: String) -> PyResult<Self> {
        let http = Client::builder()
            .user_agent(crate::hikari::DEFAULT_USER_AGENT.as_str())
            .build()
            .map_err(|err| runtime_error(format!("Failed to create HTTP client: {}", err)))?;
        let base_dir = PathBuf::from(games_dir);
        let downloads_dir = base_dir.join(".downloads");
        Ok(Self {
            http,
            base_dir: base_dir.clone(),
            downloads_dir,
            downloads: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    pub fn start_download<'py>(
        &'py self,
        py: Python<'py>,
        game_id: String,
        game_name: String,
        sources: Vec<String>,
        expected_size: Option<u64>,
        integrity_hash: Option<String>,
    ) -> PyResult<&'py PyAny> {
        let http = self.http.clone();
        let base_dir = self.base_dir.clone();
        let downloads_dir = self.downloads_dir.clone();
        let downloads = self.downloads.clone();
        let size = expected_size.unwrap_or(0);

        if sources.is_empty() {
            return Err(runtime_error("No sources provided"));
        }

        let task_id = format!("download_{}", uuid::Uuid::new_v4());
        let state = Arc::new(RwLock::new(DownloadState::new(
            game_id.clone(),
            game_name.clone(),
            size,
            integrity_hash,
            sources,
            task_id,
        )));

        pyo3_asyncio::tokio::future_into_py(py, async move {
            {
                let mut guard = downloads.write().await;
                if guard.contains_key(&game_id) {
                    return Err(runtime_error("Download already exists"));
                }

                let state_clone = state.clone();
                let task = tokio::spawn(async move {
                    if let Err(err) =
                        Self::perform_chunked_download(http, state_clone.clone(), base_dir, downloads_dir.clone()).await
                    {
                        let mut guard = state_clone.write().await;
                        guard.status = DownloadStatus::Failed;
                        guard.message = Some(err.to_string());
                        guard.maybe_emit_event();
                        let _ = guard.save_to_disk(&downloads_dir).await;
                    }
                });

                guard.insert(
                    game_id.clone(),
                    DownloadHandle {
                        state: state.clone(),
                        task,
                    },
                );
            }

            {
                let mut guard = state.write().await;
                guard.maybe_emit_event();
            }

            let result = serde_json::json!({
                "success": true,
                "message": "Download started"
            });
            Python::with_gil(|py| {
                value_to_py(py, &result)
            })
        })
    }

    pub fn get_active_downloads(&self, py: Python<'_>) -> PyResult<Vec<PyObject>> {
        let downloads = self.downloads.clone();
        let asyncio = py.import("asyncio")?;
        let event_loop = asyncio.call_method0("get_event_loop")?;
        pyo3_asyncio::tokio::run_until_complete(event_loop, async move {
            let guard = downloads.read().await;
            let mut list = Vec::new();
            for handle in guard.values() {
                let snapshot = handle.state.read().await.snapshot();
                list.push(snapshot);
            }
            Ok::<_, PyErr>(list)
        })?
        .into_iter()
        .map(|snapshot| {
            serde_json::to_value(snapshot).map_err(|err| runtime_error(err.to_string()))
        })
        .map(|res| res.and_then(|value| crate::util::value_to_py(py, &value)))
        .collect::<Result<Vec<_>, _>>()
    }

    pub fn cleanup<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        let downloads = self.downloads.clone();
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let mut guard = downloads.write().await;

            // Cancel all active downloads
            for (_, handle) in guard.drain() {
                handle.task.abort();
            }

            Ok::<_, PyErr>(())
        })
    }

    pub fn cancel_download<'py>(
        &'py self,
        py: Python<'py>,
        game_id: String,
    ) -> PyResult<&'py PyAny> {
        let downloads = self.downloads.clone();
        let downloads_dir = self.downloads_dir.clone();

        pyo3_asyncio::tokio::future_into_py(py, async move {
            let mut guard = downloads.write().await;
            if let Some(handle) = guard.remove(&game_id) {
                handle.task.abort();
                {
                    let mut state = handle.state.write().await;
                    state.status = DownloadStatus::Cancelled;
                    state.message = Some("Cancelled by user".to_string());
                    state.maybe_emit_event();
                }

                // Clean up state file
                let state_file = downloads_dir.join(format!("{}.json", game_id));
                let _ = tokio::fs::remove_file(state_file).await;

                let result = serde_json::json!({"success": true});
                Python::with_gil(|py| {
                    value_to_py(py, &result)
                })
            } else {
                let result = serde_json::json!({"success": false});
                Python::with_gil(|py| {
                    value_to_py(py, &result)
                })
            }
        })
    }

    pub fn pause_download<'py>(
        &'py self,
        py: Python<'py>,
        game_id: String,
    ) -> PyResult<&'py PyAny> {
        let downloads = self.downloads.clone();
        let downloads_dir = self.downloads_dir.clone();

        pyo3_asyncio::tokio::future_into_py(py, async move {
            let mut guard = downloads.write().await;
            if let Some(handle) = guard.get_mut(&game_id) {
                // Cancel the task
                handle.task.abort();

                // Update state to paused
                {
                    let mut state = handle.state.write().await;
                    state.status = DownloadStatus::Paused;
                    state.message = Some("Paused by user".to_string());
                    state.maybe_emit_event();
                    let _ = state.save_to_disk(&downloads_dir).await;
                }

                // Remove from active downloads but keep state file for resume
                guard.remove(&game_id);

                let result = serde_json::json!({
                    "success": true,
                    "message": "Download paused"
                });
                Python::with_gil(|py| {
                    value_to_py(py, &result)
                })
            } else {
                let result = serde_json::json!({
                    "success": false,
                    "message": "Download not found"
                });
                Python::with_gil(|py| {
                    value_to_py(py, &result)
                })
            }
        })
    }

    pub fn resume_download<'py>(
        &'py self,
        py: Python<'py>,
        game_id: String,
    ) -> PyResult<&'py PyAny> {
        let http = self.http.clone();
        let base_dir = self.base_dir.clone();
        let downloads_dir = self.downloads_dir.clone();
        let downloads = self.downloads.clone();

        pyo3_asyncio::tokio::future_into_py(py, async move {
            // Check if download is already active
            {
                let guard = downloads.read().await;
                if guard.contains_key(&game_id) {
                    return json_result!({
                        "success": false,
                        "message": "Download is already active"
                    });
                }
            }

            // Load existing state
            if let Some(mut existing_state) = DownloadState::load_from_disk(&game_id, &downloads_dir).await {
                if existing_state.status == DownloadStatus::Paused ||
                   existing_state.status == DownloadStatus::Failed {

                    existing_state.status = DownloadStatus::Pending;
                    existing_state.message = Some("Resuming download".to_string());

                    let state = Arc::new(RwLock::new(existing_state));
                    let state_clone = state.clone();

                    let task = tokio::spawn(async move {
                        if let Err(err) = Self::perform_chunked_download(
                            http,
                            state_clone.clone(),
                            base_dir,
                            downloads_dir.clone(),
                        ).await {
                            let mut guard = state_clone.write().await;
                            guard.status = DownloadStatus::Failed;
                            guard.message = Some(err.to_string());
                            guard.maybe_emit_event();
                            let _ = guard.save_to_disk(&downloads_dir).await;
                        }
                    });

                    {
                        let mut guard = downloads.write().await;
                        guard.insert(
                            game_id,
                            DownloadHandle {
                                state: state.clone(),
                                task,
                            },
                        );
                    }

                    {
                        let mut state_guard = state.write().await;
                        state_guard.maybe_emit_event();
                    }

                    json_result!({
                        "success": true,
                        "message": "Download resumed"
                    })
                } else {
                    json_result!({
                        "success": false,
                        "message": "Download cannot be resumed in current state"
                    })
                }
            } else {
                json_result!({
                    "success": false,
                    "message": "No paused download found"
                })
            }
        })
    }

    pub fn get_download_status<'py>(
        &'py self,
        py: Python<'py>,
        game_id: String,
    ) -> PyResult<&'py PyAny> {
        let downloads = self.downloads.clone();
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let guard = downloads.read().await;
            if let Some(handle) = guard.get(&game_id) {
                let snapshot = handle.state.read().await.snapshot();
                let value = serde_json::to_value(snapshot)
                    .map_err(|err| runtime_error(err.to_string()))?;
                Python::with_gil(|py| {
                    crate::util::value_to_py(py, &value)
                })
            } else {
                Python::with_gil(|py| {
                    Ok(py.None())
                })
            }
        })
    }

    /// Switch primary source by matching substring in URL; moves preferred source to highest priority.
    pub fn switch_download_source<'py>(
        &'py self,
        py: Python<'py>,
        game_id: String,
        preferred_substring: String,
    ) -> PyResult<&'py PyAny> {
        let downloads = self.downloads.clone();
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let mut guard = downloads.write().await;
            if let Some(handle) = guard.get_mut(&game_id) {
                let mut state = handle.state.write().await;
                let mut found = false;
                for src in &mut state.sources {
                    if src.url.contains(&preferred_substring) {
                        src.priority = 0;
                        found = true;
                    } else if src.priority == 0 {
                        src.priority = 1;
                    }
                }
                // Re-sort
                state.sources.sort_by_key(|s| (s.priority, s.active_connections, s.failures));
                state.maybe_emit_event();
                if found {
                    json_result!({"success": true})
                } else {
                    json_result!({"success": false, "message": "Preferred source not found"})
                }
            } else {
                json_result!({"success": false, "message": "Download not active"})
            }
        })
    }

}
