use anyhow::{Context, Result};
use pyo3::exceptions::PyRuntimeError;
use pyo3::prelude::*;
use serde_json::Value;
use pythonize::{pythonize, depythonize};
use sha1::{Digest, Sha1};
use std::fs::{self, File};
use std::io::{BufReader, Read};
use std::path::Path;
use walkdir::WalkDir;
use zip::ZipArchive;

pub fn value_to_py(py: Python<'_>, value: &Value) -> PyResult<PyObject> {
    pythonize(py, value).map_err(|e| pyo3::exceptions::PyRuntimeError::new_err(e.to_string()))
}

pub fn extract_value(obj: &PyAny) -> PyResult<Value> {
    depythonize(obj).map_err(|e| pyo3::exceptions::PyRuntimeError::new_err(e.to_string()))
}

pub fn extract_serde<T: serde::de::DeserializeOwned>(obj: &PyAny) -> PyResult<T> {
    depythonize(obj).map_err(|e| pyo3::exceptions::PyRuntimeError::new_err(e.to_string()))
}

// Helper macro for async functions that return JSON
#[macro_export]
macro_rules! json_result {
    ($($json:tt)+) => {
        {
            let result = serde_json::json!($($json)+);
            Python::with_gil(|py| {
                crate::util::value_to_py(py, &result)
            })
        }
    };
}

fn sha1_file_inner(path: &Path) -> Result<String> {
    let file = File::open(path).with_context(|| format!("Failed to open {}", path.display()))?;
    let mut reader = BufReader::new(file);
    let mut hasher = Sha1::new();
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

#[pyfunction]
pub fn sha1_file(path: &str) -> PyResult<String> {
    let path = Path::new(path);
    sha1_file_inner(path).map_err(|err| PyRuntimeError::new_err(err.to_string()))
}

#[pyfunction]
pub fn extract_zip(zip_path: &str, destination: &str) -> PyResult<usize> {
    let file = File::open(zip_path)
        .with_context(|| format!("Failed to open archive {}", zip_path))
        .map_err(|err| PyRuntimeError::new_err(err.to_string()))?;
    let mut archive = ZipArchive::new(file)
        .with_context(|| format!("Failed to read archive {}", zip_path))
        .map_err(|err| PyRuntimeError::new_err(err.to_string()))?;

    let mut count = 0usize;
    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .with_context(|| format!("Failed to access entry {}", i))
            .map_err(|err| PyRuntimeError::new_err(err.to_string()))?;
        let outpath = Path::new(destination).join(file.mangled_name());

        if (&*file.name()).ends_with('/') {
            fs::create_dir_all(&outpath).map_err(|err| PyRuntimeError::new_err(err.to_string()))?;
        } else {
            if let Some(parent) = outpath.parent() {
                fs::create_dir_all(parent)
                    .map_err(|err| PyRuntimeError::new_err(err.to_string()))?;
            }
            let mut outfile = File::create(&outpath)
                .with_context(|| format!("Failed to create {}", outpath.display()))
                .map_err(|err| PyRuntimeError::new_err(err.to_string()))?;
            std::io::copy(&mut file, &mut outfile)
                .with_context(|| format!("Failed to write {}", outpath.display()))
                .map_err(|err| PyRuntimeError::new_err(err.to_string()))?;
        }
        count += 1;
    }

    Ok(count)
}

#[pyfunction]
pub fn remove_empty_directories(root: &str) -> PyResult<usize> {
    let mut removed = 0usize;
    for entry in WalkDir::new(root)
        .contents_first(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.is_dir() {
            if fs::read_dir(path)
                .map_err(|err| PyRuntimeError::new_err(err.to_string()))?
                .next()
                .is_none()
            {
                fs::remove_dir(path).map_err(|err| PyRuntimeError::new_err(err.to_string()))?;
                removed += 1;
            }
        }
    }
    Ok(removed)
}

pub fn register(_py: Python<'_>, module: &PyModule) -> PyResult<()> {
    module.add_function(wrap_pyfunction!(sha1_file, module)?)?;
    module.add_function(wrap_pyfunction!(extract_zip, module)?)?;
    module.add_function(wrap_pyfunction!(remove_empty_directories, module)?)?;
    Ok(())
}

pub fn runtime_error(message: impl Into<String>) -> PyErr {
    PyRuntimeError::new_err(message.into())
}

