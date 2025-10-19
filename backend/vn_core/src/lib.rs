#![allow(non_local_definitions)] // PyO3 generates trampoline helpers that trigger this lint

mod dlsite;
mod downloads;
mod game_library;
mod hikari;
mod performance;
mod steam;
mod util;

use dlsite::{DlsiteClient, DlsiteProduct};
use downloads::DownloadManager;
use game_library::{GameLibrary, SortBy};
use hikari::HikariClient;
use performance::{PerformanceManager, StreamingFileHandler};
use steam::SteamIntegration;
use pyo3::prelude::*;

#[pymodule]
fn vn_core(py: Python<'_>, m: &PyModule) -> PyResult<()> {
    // Ensure tokio runtime is initialised once with all features enabled
    let mut builder = tokio::runtime::Builder::new_multi_thread();
    builder.enable_all();
    pyo3_asyncio::tokio::init(builder);

    m.add_class::<HikariClient>()?;
    m.add_class::<DownloadManager>()?;
    m.add_class::<GameLibrary>()?;
    m.add_class::<SortBy>()?;
    m.add_class::<PerformanceManager>()?;
    m.add_class::<StreamingFileHandler>()?;
    m.add_class::<DlsiteClient>()?;
    m.add_class::<DlsiteProduct>()?;
    m.add_class::<SteamIntegration>()?;
    util::register(py, m)?;
    Ok(())
}
