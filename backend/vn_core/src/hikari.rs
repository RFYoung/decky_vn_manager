use crate::util::{runtime_error, value_to_py};
use crate::json_result;
use once_cell::sync::Lazy;
use pyo3::prelude::*;
use reqwest::header::{ACCEPT, CONTENT_TYPE};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

pub(crate) static DEFAULT_USER_AGENT: Lazy<String> =
    Lazy::new(|| format!("VisualNovelManager/{} (Rust)", env!("CARGO_PKG_VERSION")));

#[derive(Default, Clone, Debug)]
struct HikariState {
    token: Option<String>,
    cdn_servers: Vec<HashMap<String, Value>>,
    selected_cdn: Option<String>,
    cached_library: Option<Value>,
}

#[pyclass]
pub struct HikariClient {
    http: Client,
    api_base: String,
    state: Arc<RwLock<HikariState>>,
}

#[derive(Serialize, Deserialize, Debug)]
struct LoginResponse {
    access_token: String,
    #[serde(default)]
    user: Value,
}

#[pymethods]
impl HikariClient {
    #[new]
    pub fn new(api_base: Option<String>) -> PyResult<Self> {
        let api_base = api_base.unwrap_or_else(|| "https://api.hikarifield.co.jp/v1/".to_string());
        let http = Client::builder()
            .user_agent(DEFAULT_USER_AGENT.as_str())
            .build()
            .map_err(|err| runtime_error(format!("Failed to create HTTP client: {}", err)))?;

        Ok(Self {
            http,
            api_base,
            state: Arc::new(RwLock::new(HikariState::default())),
        })
    }

    pub fn login<'py>(
        &'py self,
        py: Python<'py>,
        email: String,
        password: String,
    ) -> PyResult<&'py PyAny> {
        let client = self.http.clone();
        let api = self.api_base.clone();
        let state = self.state.clone();

        pyo3_asyncio::tokio::future_into_py(py, async move {
            let payload = json!({
                "email": email,
                "password": password,
            });

            let resp = client
                .post(format!("{}auth/login", api))
                .header(CONTENT_TYPE, "application/json")
                .header(ACCEPT, "application/json")
                .json(&payload)
                .send()
                .await
                .map_err(|err| runtime_error(format!("Login request failed: {}", err)))?;

            if !resp.status().is_success() {
                let message = resp
                    .text()
                    .await
                    .unwrap_or_else(|_| "Authentication failed".to_string());
                return Err(runtime_error(format!("Hikari login failed: {}", message)));
            }

            let parsed: LoginResponse = resp
                .json()
                .await
                .map_err(|err| runtime_error(format!("Invalid login response: {}", err)))?;

            {
                let mut guard = state.write().await;
                guard.token = Some(parsed.access_token.clone());
            }

            json_result!({
                "success": true,
                "token": parsed.access_token,
            })
        })
    }

    pub fn logout<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        let client = self.http.clone();
        let api = self.api_base.clone();
        let state = self.state.clone();

        pyo3_asyncio::tokio::future_into_py(py, async move {
            let token = {
                let guard = state.read().await;
                guard.token.clone()
            };

            if let Some(token_value) = token {
                let _ = client
                    .delete(format!("{}auth/logout", api))
                    .bearer_auth(token_value)
                    .send()
                    .await;
            }

            let mut guard = state.write().await;
            guard.token = None;
            guard.cdn_servers.clear();
            guard.selected_cdn = None;

            json_result!({
                "success": true
            })
        })
    }

    pub fn get_login_status<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        let state = self.state.clone();
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let guard = state.read().await;
            let cdn = guard.cdn_servers.clone();
            let selected = guard.selected_cdn.clone();
            json_result!({
                "isLoggedIn": guard.token.is_some(),
                "cdnServers": cdn,
                "selectedCdn": selected
            })
        })
    }

    pub fn fetch_cdn_servers<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        let client = self.http.clone();
        let api = self.api_base.clone();
        let state = self.state.clone();

        pyo3_asyncio::tokio::future_into_py(py, async move {
            let token = {
                let guard = state.read().await;
                guard.token.clone()
            };

            let token_value = token.ok_or_else(|| runtime_error("Not logged in"))?;

            let resp = client
                .get(format!("{}clients/iplist", api))
                .bearer_auth(&token_value)
                .send()
                .await
                .map_err(|err| runtime_error(format!("Failed to fetch CDN servers: {}", err)))?;

            let data: Value = resp
                .json()
                .await
                .map_err(|err| runtime_error(format!("Invalid CDN response: {}", err)))?;

            let ips = data
                .get("ips")
                .cloned()
                .unwrap_or_else(|| Value::Array(Vec::new()));

            let cdn_list = match ips {
                Value::Array(arr) => arr
                    .into_iter()
                    .filter_map(|item| item.as_object().cloned())
                    .collect::<Vec<_>>(),
                _ => Vec::new(),
            };

            {
                let mut guard = state.write().await;
                guard.cdn_servers = cdn_list.clone().into_iter().map(|map| {
                    map.into_iter().collect::<HashMap<String, Value>>()
                }).collect();
                if guard.selected_cdn.is_none() {
                    guard.selected_cdn = cdn_list
                        .get(0)
                        .and_then(|entry| entry.get("ip"))
                        .and_then(|ip| ip.as_str())
                        .map(|s| s.to_string());
                }
            }

            json_result!({
                "servers": cdn_list
            })
        })
    }

    pub fn select_cdn<'py>(&'py self, py: Python<'py>, server_ip: String) -> PyResult<&'py PyAny> {
        let state = self.state.clone();
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let mut guard = state.write().await;
            let exists = guard
                .cdn_servers
                .iter()
                .any(|entry| entry.get("ip").and_then(|v| v.as_str()) == Some(server_ip.as_str()));
            if exists {
                guard.selected_cdn = Some(server_ip);
                json_result!({"success": true})
            } else {
                Err(runtime_error("Server IP not found"))
            }
        })
    }

    pub fn fetch_library<'py>(
        &'py self,
        py: Python<'py>,
        force_refresh: Option<bool>,
    ) -> PyResult<&'py PyAny> {
        let client = self.http.clone();
        let api = self.api_base.clone();
        let state = self.state.clone();
        let refresh = force_refresh.unwrap_or(false);

        pyo3_asyncio::tokio::future_into_py(py, async move {
            {
                let guard = state.read().await;
                if !refresh {
                    if let Some(ref cached) = guard.cached_library {
                        return Python::with_gil(|py| {
                            value_to_py(py, &cached)
                        });
                    }
                }
            }

            let token = {
                let guard = state.read().await;
                guard.token.clone()
            };
            let token_value = token.ok_or_else(|| runtime_error("Not logged in"))?;

            let payload = json!({
                "category_id": 1
            });

            let resp = client
                .post(format!("{}apps", api))
                .bearer_auth(&token_value)
                .header(CONTENT_TYPE, "application/json")
                .json(&payload)
                .send()
                .await
                .map_err(|err| runtime_error(format!("Failed to fetch library: {}", err)))?;

            if !resp.status().is_success() {
                let message = resp
                    .text()
                    .await
                    .unwrap_or_else(|_| "Failed to fetch library".to_string());
                return Err(runtime_error(message));
            }

            let result: Value = resp
                .json()
                .await
                .map_err(|err| runtime_error(format!("Invalid library response: {}", err)))?;

            {
                let mut guard = state.write().await;
                guard.cached_library = Some(result.clone());
            }

            Python::with_gil(|py| {
                value_to_py(py, &result)
            })
        })
    }

    pub fn get_signed_urls<'py>(
        &'py self,
        py: Python<'py>,
        game_build_id: String,
        task_type: Option<i32>,
    ) -> PyResult<&'py PyAny> {
        let client = self.http.clone();
        let api = self.api_base.clone();
        let state = self.state.clone();
        let task_type_value = task_type.unwrap_or(0);

        pyo3_asyncio::tokio::future_into_py(py, async move {
            let token = {
                let guard = state.read().await;
                guard.token.clone()
            };
            let token_value = token.ok_or_else(|| runtime_error("Not logged in"))?;

            let payload = json!({
                "game_build_id": game_build_id,
                "task_type": task_type_value,
                "uuid": Uuid::new_v4().to_string(),
            });

            let resp = client
                .post(format!("{}builds/sign", api))
                .bearer_auth(&token_value)
                .header(CONTENT_TYPE, "application/json")
                .json(&payload)
                .send()
                .await
                .map_err(|err| runtime_error(format!("Failed to sign download URL: {}", err)))?;

            if !resp.status().is_success() {
                let message = resp
                    .text()
                    .await
                    .unwrap_or_else(|_| "Failed to sign download URL".to_string());
                return Err(runtime_error(message));
            }

            let value: Value = resp
                .json()
                .await
                .map_err(|err| runtime_error(format!("Invalid sign response: {}", err)))?;

            Python::with_gil(|py| {
                value_to_py(py, &value)
            })
        })
    }

    pub fn get_cached_server<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        let state = self.state.clone();
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let guard = state.read().await;
            json_result!({
                "selected": guard.selected_cdn,
                "servers": guard.cdn_servers
            })
        })
    }

    pub fn export_state<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        let state = self.state.clone();
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let guard = state.read().await;
            json_result!({
                "token": guard.token,
                "selected_cdn": guard.selected_cdn
            })
        })
    }

    pub fn import_state<'py>(
        &'py self,
        py: Python<'py>,
        token: Option<String>,
        selected_cdn: Option<String>,
    ) -> PyResult<&'py PyAny> {
        let state = self.state.clone();
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let mut guard = state.write().await;
            guard.token = token;
            guard.selected_cdn = selected_cdn;
            json_result!({"success": true})
        })
    }

    pub fn to_dict<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        let state = self.state.clone();
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let guard = state.read().await;
            json_result!({
                "token": guard.token,
                "cdnServers": guard.cdn_servers,
                "selectedCdn": guard.selected_cdn
            })
        })
    }

    pub fn is_logged_in(&self) -> PyResult<bool> {
        if let Ok(guard) = self.state.try_read() {
            Ok(guard.token.is_some())
        } else {
            Ok(false)
        }
    }
}
