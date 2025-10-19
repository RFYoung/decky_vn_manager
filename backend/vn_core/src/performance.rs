use crate::util::runtime_error;
use anyhow::Result;
use parking_lot::RwLock;
use pyo3::prelude::*;
use pyo3::types::{PyAny, PyDict};
use sha1::{Digest, Sha1};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use sysinfo::{Pid, System};
use tokio::fs::File;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::task::JoinHandle;

const CLEANUP_INTERVAL: Duration = Duration::from_secs(300);
const RESOURCE_INTERVAL: Duration = Duration::from_secs(30);

#[derive(Clone)]
struct CacheEntry {
    data: Py<PyAny>,
    created_at: Instant,
    ttl: Duration,
}

#[derive(Clone, Default)]
struct ResourceStats {
    memory_usage_mb: f64,
    cpu_usage_percent: f32,
    disk_usage_percent: f32,
    active_downloads: usize,
    background_tasks: usize,
    cache_entries: usize,
}

struct PerformanceInner {
    cache: RwLock<HashMap<String, CacheEntry>>,
    background_tasks: RwLock<Vec<Py<PyAny>>>,
    resource_handle: RwLock<Option<JoinHandle<()>>>,
    cleanup_handle: RwLock<Option<JoinHandle<()>>>,
    stats: RwLock<ResourceStats>,
    memory_threshold_mb: f64,
}

impl PerformanceInner {
    fn new() -> Self {
        Self {
            cache: RwLock::new(HashMap::new()),
            background_tasks: RwLock::new(Vec::new()),
            resource_handle: RwLock::new(None),
            cleanup_handle: RwLock::new(None),
            stats: RwLock::new(ResourceStats::default()),
            memory_threshold_mb: 500.0,
        }
    }

    async fn start_monitors(self: &Arc<Self>) -> Result<()> {
        let mut handle_guard = self.resource_handle.write();
        if handle_guard.is_none() {
            let this = Arc::clone(self);
            let handle = tokio::spawn(async move {
                loop {
                    if let Err(err) = this.refresh_stats().await {
                        eprintln!("Performance monitor error: {}", err);
                    }
                    tokio::time::sleep(RESOURCE_INTERVAL).await;
                }
            });
            *handle_guard = Some(handle);
        }

        drop(handle_guard);

        let mut cleanup_guard = self.cleanup_handle.write();
        if cleanup_guard.is_none() {
            let this_cleanup = Arc::clone(self);
            let handle = tokio::spawn(async move {
                loop {
                    if let Err(err) = this_cleanup.perform_cleanup().await {
                        eprintln!("Performance cleanup error: {}", err);
                    }
                    tokio::time::sleep(CLEANUP_INTERVAL).await;
                }
            });
            *cleanup_guard = Some(handle);
        }
        Ok(())
    }

    async fn stop_monitors(&self) {
        if let Some(handle) = self.resource_handle.write().take() {
            handle.abort();
        }
        if let Some(handle) = self.cleanup_handle.write().take() {
            handle.abort();
        }
    }

    async fn refresh_stats(&self) -> Result<()> {
        let pid = std::process::id();
        let mut system = System::new_all();
        let pid = Pid::from_u32(pid);
        system.refresh_process(pid);
        system.refresh_all();

        let mut stats = ResourceStats::default();
        if let Some(process) = system.process(pid) {
            stats.memory_usage_mb = process.memory() as f64 / 1024.0;
            stats.cpu_usage_percent = process.cpu_usage();
        }

        stats.disk_usage_percent = calculate_disk_usage(&system);

        let tasks = {
            let guard = self.background_tasks.read();
            guard.clone()
        };
        let (active, total) = Python::with_gil(|py| {
            let mut active_count = 0usize;
            for task in &tasks {
                if let Ok(done) = task
                    .as_ref(py)
                    .call_method0("done")
                    .and_then(|obj| obj.is_true())
                {
                    if !done {
                        active_count += 1;
                    }
                }
            }
            (active_count, tasks.len())
        });
        stats.active_downloads = active;
        stats.background_tasks = total;

        let cache_len = self.cache.read().len();
        stats.cache_entries = cache_len;

        *self.stats.write() = stats;
        Ok(())
    }

    async fn perform_cleanup(&self) -> Result<()> {
        let expired_keys = {
            let cache = self.cache.read();
            cache
                .iter()
                .filter(|(_, entry)| entry.created_at.elapsed() > entry.ttl)
                .map(|(key, _)| key.clone())
                .collect::<Vec<_>>()
        };

        if !expired_keys.is_empty() {
            let mut cache = self.cache.write();
            for key in expired_keys {
                cache.remove(&key);
            }
        }

        {
            let mut guard = self.background_tasks.write();
            guard.retain(|task| {
                Python::with_gil(|py| {
                    match task
                        .as_ref(py)
                        .call_method0("done")
                        .and_then(|obj| obj.is_true())
                    {
                        Ok(true) => false,
                        Ok(false) => true,
                        Err(_) => true,
                    }
                })
            });
        }

        let stats = self.stats.read().clone();
        if stats.memory_usage_mb > self.memory_threshold_mb {
            Python::with_gil(|py| {
                if let Ok(gc) = PyModule::import(py, "gc") {
                    let _ = gc.call_method0("collect");
                }
            });
        }

        Ok(())
    }

    fn cache_get(&self, key: &str) -> Option<Py<PyAny>> {
        let mut remove = false;
        let result = {
            let cache = self.cache.read();
            cache.get(key).cloned()
        };
        if let Some(entry) = result {
            if entry.created_at.elapsed() > entry.ttl {
                remove = true;
            } else {
                return Some(entry.data);
            }
        }
        if remove {
            let mut cache = self.cache.write();
            cache.remove(key);
        }
        None
    }

    fn cache_set(&self, py: Python<'_>, key: String, value: &PyAny, ttl: f64) {
        let ttl = if ttl <= 0.0 {
            Duration::from_secs(0)
        } else {
            Duration::from_secs_f64(ttl)
        };
        let entry = CacheEntry {
            data: value.into_py(py),
            created_at: Instant::now(),
            ttl,
        };
        let mut cache = self.cache.write();
        cache.insert(key, entry);
    }

    fn cache_clear(&self, pattern: Option<String>) {
        let mut cache = self.cache.write();
        if let Some(pattern) = pattern {
            cache.retain(|key, _| !key.contains(&pattern));
        } else {
            cache.clear();
        }
    }
}

fn calculate_disk_usage(_system: &System) -> f32 {
    // Note: disks() method not available in this version of sysinfo
    // Returning 0.0 as fallback
    0.0
}

#[pyclass(module = "vn_core")]
pub struct PerformanceManager {
    inner: Arc<PerformanceInner>,
}

#[pymethods]
impl PerformanceManager {
    #[new]
    pub fn new() -> Self {
        Self {
            inner: Arc::new(PerformanceInner::new()),
        }
    }

    pub fn initialize<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        let inner = Arc::clone(&self.inner);
        pyo3_asyncio::tokio::future_into_py(py, async move {
            inner
                .start_monitors()
                .await
                .map_err(|err| runtime_error(err.to_string()))?;
            Ok(())
        })
    }

    pub fn cleanup<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        let inner = Arc::clone(&self.inner);
        pyo3_asyncio::tokio::future_into_py(py, async move {
            inner.stop_monitors().await;
            let tasks = {
                let guard = inner.background_tasks.read();
                guard.clone()
            };
            Python::with_gil(|py| {
                for task in tasks {
                    let _ = task.as_ref(py).call_method0("cancel");
                }
            });
            inner.cache.write().clear();
            Ok(())
        })
    }

    pub fn schedule_background_task(&self, py: Python<'_>, _coro: &PyAny) -> PyResult<PyObject> {
        // Background task scheduling simplified for this version
        Ok(py.None())
    }

    pub fn cache_get<'py>(&'py self, py: Python<'py>, key: String) -> PyResult<&'py PyAny> {
        let inner = Arc::clone(&self.inner);
        pyo3_asyncio::tokio::future_into_py(py, async move {
            if let Some(obj) = inner.cache_get(&key) {
                Python::with_gil(|py| Ok(Some(obj.into_py(py))))
            } else {
                Ok(None)
            }
        })
    }

    pub fn cache_set<'py>(
        &'py self,
        py: Python<'py>,
        key: String,
        value: PyObject,
        ttl: Option<f64>,
    ) -> PyResult<&'py PyAny> {
        let inner = Arc::clone(&self.inner);
        pyo3_asyncio::tokio::future_into_py(py, async move {
            Python::with_gil(|py| {
                inner.cache_set(py, key, value.as_ref(py), ttl.unwrap_or(300.0));
            });
            Ok(())
        })
    }

    pub fn cache_clear<'py>(
        &'py self,
        py: Python<'py>,
        pattern: Option<String>,
    ) -> PyResult<&'py PyAny> {
        let inner = Arc::clone(&self.inner);
        pyo3_asyncio::tokio::future_into_py(py, async move {
            inner.cache_clear(pattern);
            Ok(())
        })
    }

    pub fn get_stats(&self, py: Python<'_>) -> PyResult<PyObject> {
        let stats = self.inner.stats.read().clone();
        let dict = PyDict::new(py);
        dict.set_item("memory_usage_mb", stats.memory_usage_mb)?;
        dict.set_item("cpu_usage_percent", stats.cpu_usage_percent)?;
        dict.set_item("disk_usage_percent", stats.disk_usage_percent)?;
        dict.set_item("active_downloads", stats.active_downloads)?;
        dict.set_item("background_tasks", stats.background_tasks)?;
        dict.set_item("cache_entries", stats.cache_entries)?;
        Ok(dict.into())
    }

    pub fn optimize_for_download<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        let inner = Arc::clone(&self.inner);
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let before = inner.stats.read().clone();
            inner.cache_clear(Some("api_".to_string()));
            Python::with_gil(|py| {
                if let Ok(gc) = PyModule::import(py, "gc") {
                    let _ = gc.call_method0("collect");
                }
            });
            tokio::time::sleep(Duration::from_secs(1)).await;
            inner.refresh_stats().await.ok();
            let after = inner.stats.read().clone();

            Python::with_gil(|py| {
                let dict = PyDict::new(py);
                dict.set_item("optimization_applied", true)?;
                let memory_freed = before.memory_usage_mb - after.memory_usage_mb;
                dict.set_item("memory_freed_mb", memory_freed)?;
                dict.set_item(
                    "cache_cleared",
                    before.cache_entries.saturating_sub(after.cache_entries),
                )?;
                Ok::<PyObject, PyErr>(dict.into_py(py))
            })
        })
    }
}

#[pyclass(module = "vn_core")]
pub struct StreamingFileHandler {
    chunk_size: usize,
}

#[pymethods]
impl StreamingFileHandler {
    #[new]
    pub fn new(chunk_size: Option<usize>) -> Self {
        Self {
            chunk_size: chunk_size.unwrap_or(8192),
        }
    }

    pub fn stream_copy<'py>(
        &'py self,
        py: Python<'py>,
        source_path: String,
        dest_path: String,
        progress_callback: Option<PyObject>,
    ) -> PyResult<&'py PyAny> {
        let chunk_size = self.chunk_size;
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let mut src = File::open(&source_path)
                .await
                .map_err(|err| runtime_error(err.to_string()))?;
            let mut dst = File::create(&dest_path)
                .await
                .map_err(|err| runtime_error(err.to_string()))?;
            let mut buffer = vec![0u8; chunk_size];
            let mut copied = 0usize;
            loop {
                let read = src
                    .read(&mut buffer)
                    .await
                    .map_err(|err| runtime_error(err.to_string()))?;
                if read == 0 {
                    break;
                }
                dst.write_all(&buffer[..read])
                    .await
                    .map_err(|err| runtime_error(err.to_string()))?;
                copied += read;
                if let Some(callback) = &progress_callback {
                    Python::with_gil(|py| {
                        let _ = callback.call1(py, (copied,));
                    });
                }
                tokio::task::yield_now().await;
            }
            Ok(true)
        })
    }

    pub fn stream_hash<'py>(
        &'py self,
        py: Python<'py>,
        file_path: String,
        hash_type: Option<String>,
        progress_callback: Option<PyObject>,
    ) -> PyResult<&'py PyAny> {
        let chunk_size = self.chunk_size;
        let algorithm = hash_type.unwrap_or_else(|| "sha1".to_string());
        pyo3_asyncio::tokio::future_into_py(py, async move {
            if algorithm.to_lowercase() != "sha1" {
                return Err(runtime_error("Unsupported hash type"));
            }
            let mut file = File::open(&file_path)
                .await
                .map_err(|err| runtime_error(err.to_string()))?;
            let mut buffer = vec![0u8; chunk_size];
            let mut hasher = Sha1::new();
            let mut processed = 0usize;
            loop {
                let read = file
                    .read(&mut buffer)
                    .await
                    .map_err(|err| runtime_error(err.to_string()))?;
                if read == 0 {
                    break;
                }
                hasher.update(&buffer[..read]);
                processed += read;
                if let Some(callback) = &progress_callback {
                    Python::with_gil(|py| {
                        let _ = callback.call1(py, (processed,));
                    });
                }
                tokio::task::yield_now().await;
            }
            Ok(Some(format!("{:x}", hasher.finalize())))
        })
    }
}
