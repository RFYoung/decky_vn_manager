use crate::util::{runtime_error, value_to_py};
use crate::json_result;
use anyhow::{Context, Result};
use pyo3::prelude::*;
use pyo3::types::PyList;
use pyo3::Py;
use reqwest::{header::USER_AGENT, redirect::Policy, Client};
use reqwest_cookie_store::{CookieStore, CookieStoreMutex};
use serde_json::Value;
use std::collections::HashMap;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, RwLock,
};
use std::time::{SystemTime, UNIX_EPOCH};

#[pyclass(module = "vn_core")]
#[derive(Clone, Debug)]
pub struct DlsiteProduct {
    #[pyo3(get)]
    pub id: String,
    #[pyo3(get)]
    pub title: String,
    #[pyo3(get)]
    pub thumbnail: String,
    #[pyo3(get)]
    pub group_id: String,
    #[pyo3(get)]
    pub group_name: String,
    #[pyo3(get)]
    pub work_type: String,
    #[pyo3(get)]
    pub age_category: String,
    #[pyo3(get)]
    pub price: i64,
    #[pyo3(get)]
    pub file_size: i64,
    #[pyo3(get)]
    pub release_date: String,
    #[pyo3(get)]
    pub purchased_at: Option<String>,
    #[pyo3(get)]
    pub description: String,
    #[pyo3(get)]
    pub tags: Vec<String>,
}

impl DlsiteProduct {
    fn from_value(data: &Value) -> Option<Self> {
        Some(Self {
            id: data.get("id")?.as_str()?.to_string(),
            title: data
                .get("title")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            thumbnail: data
                .get("thumbnail_url")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            group_id: data
                .get("circle")
                .and_then(Value::as_object)
                .and_then(|obj| obj.get("id"))
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            group_name: data
                .get("circle")
                .and_then(Value::as_object)
                .and_then(|obj| obj.get("name"))
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            work_type: data
                .get("work_type")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            age_category: data
                .get("age_category")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            price: data.get("price").and_then(Value::as_i64).unwrap_or(0),
            file_size: data.get("file_size").and_then(Value::as_i64).unwrap_or(0),
            release_date: data
                .get("regist_date")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            purchased_at: data
                .get("purchased_at")
                .and_then(Value::as_str)
                .map(|s| s.to_string()),
            description: data
                .get("description")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            tags: data
                .get("genre")
                .and_then(Value::as_array)
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(|s| s.to_string()))
                        .collect::<Vec<_>>()
                })
                .unwrap_or_default(),
        })
    }
}

#[pyclass(module = "vn_core")]
pub struct DlsiteClient {
    client: Client,
    base_url: String,
    login_url: String,
    play_api: String,
    maniax_api: String,
    user_agent: String,
    cookie_store: Arc<CookieStoreMutex>,
    logged_in: Arc<AtomicBool>,
    // Simple in-memory cache for library calls
    cached_products: Arc<RwLock<Option<(i64, Vec<DlsiteProduct>)>>>,
}

impl DlsiteClient {
    fn build_client(user_agent: &str, cookie_store: &Arc<CookieStoreMutex>) -> Result<Client> {
        Client::builder()
            .user_agent(user_agent)
            .cookie_provider(Arc::clone(cookie_store))
            .redirect(Policy::none())
            .build()
            .context("failed to create DLsite HTTP client")
    }

    fn parse_product_list(data: &Value) -> Vec<DlsiteProduct> {
        data.get("products")
            .and_then(Value::as_array)
            .map(|arr| {
                arr.iter()
                    .filter_map(DlsiteProduct::from_value)
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default()
    }

    fn parse_search_results(data: &Value) -> Vec<DlsiteProduct> {
        data.get("items")
            .and_then(Value::as_array)
            .map(|arr| {
                arr.iter()
                    .filter_map(DlsiteProduct::from_value)
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default()
    }

    fn to_py_product_list(py: Python<'_>, products: Vec<DlsiteProduct>) -> PyResult<PyObject> {
        let list = PyList::empty(py);
        for product in products {
            list.append(Py::new(py, product)?.into_py(py))?;
        }
        Ok(list.into())
    }

    pub fn logged_in_sync(&self) -> bool {
        self.logged_in.load(Ordering::SeqCst)
    }
}

#[pymethods]
impl DlsiteClient {
    #[new]
    pub fn new() -> PyResult<Self> {
        let user_agent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string();
        let cookie_store = Arc::new(CookieStoreMutex::new(CookieStore::default()));
        let client = Self::build_client(&user_agent, &cookie_store)
            .map_err(|err| runtime_error(err.to_string()))?;

        Ok(Self {
            client,
            base_url: "https://www.dlsite.com".to_string(),
            login_url: "https://login.dlsite.com".to_string(),
            play_api: "https://play.dlsite.com/api".to_string(),
            maniax_api: "https://www.dlsite.com/maniax/api".to_string(),
            user_agent,
            cookie_store,
            logged_in: Arc::new(AtomicBool::new(false)),
            cached_products: Arc::new(RwLock::new(None)),
        })
    }

    pub fn initialize<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        let client = self.client.clone();
        let user_agent = self.user_agent.clone();
        pyo3_asyncio::tokio::future_into_py(py, async move {
            // touch client to ensure it works
            let _ = client
                .get("https://www.dlsite.com")
                .header(USER_AGENT, user_agent)
                .send()
                .await;
            Ok(())
        })
    }

    pub fn cleanup<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        self.logout(py)
    }

    pub fn login<'py>(
        &'py self,
        py: Python<'py>,
        username: String,
        password: String,
    ) -> PyResult<&'py PyAny> {
        let client = self.client.clone();
        let base_url = self.base_url.clone();
        let login_url = self.login_url.clone();
        let cookie_store = Arc::clone(&self.cookie_store);
        let logged_in = Arc::clone(&self.logged_in);
        pyo3_asyncio::tokio::future_into_py(py, async move {
            client
                .get(format!("{}/maniax/login/=/skip_register/1", base_url))
                .send()
                .await
                .map_err(|err| runtime_error(format!("Initial cookie request failed: {}", err)))?;

            let login_page = client
                .get(format!("{}/login", login_url))
                .send()
                .await
                .map_err(|err| runtime_error(format!("Failed to access login page: {}", err)))?;

            let csrf_token = login_page
                .cookies()
                .find(|cookie| cookie.name() == "XSRF-TOKEN")
                .map(|cookie| cookie.value().to_string())
                .ok_or_else(|| runtime_error("CSRF token not found"))?;

            let params = [
                ("login_id", username),
                ("password", password),
                ("_token", csrf_token),
            ];

            let response = client
                .post(format!("{}/login", login_url))
                .form(&params)
                .send()
                .await
                .map_err(|err| runtime_error(format!("Login request failed: {}", err)))?;

            let status = response.status();
            if !(status.is_success() || status.is_redirection()) {
                return Err(runtime_error(format!(
                    "Invalid credentials (status {})",
                    status
                )));
            }

            logged_in.store(true, Ordering::SeqCst);
            if let Ok(store) = cookie_store.lock() {
                if store.iter_any().count() == 0 {
                    return Err(runtime_error("Login cookies not stored"));
                }
            }

            json_result!({
                "success": true,
                "message": "Login successful"
            })
        })
    }

    pub fn logout<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        let cookie_store = Arc::clone(&self.cookie_store);
        let logged_in = Arc::clone(&self.logged_in);
        pyo3_asyncio::tokio::future_into_py(py, async move {
            logged_in.store(false, Ordering::SeqCst);
            if let Ok(mut store) = cookie_store.lock() {
                store.clear();
            }
            Ok(true)
        })
    }

    pub fn is_logged_in<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        let logged = self.logged_in.load(Ordering::SeqCst);
        pyo3_asyncio::tokio::future_into_py(py, async move { Ok(logged) })
    }

    pub fn test_authentication<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        let client = self.client.clone();
        let play_api = self.play_api.clone();
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let resp = client
                .get(format!("{}/product_count", play_api))
                .send()
                .await;
            Ok(matches!(resp, Ok(ref response) if response.status().is_success()))
        })
    }

    pub fn get_library<'py>(&'py self, py: Python<'py>) -> PyResult<&'py PyAny> {
        let client = self.client.clone();
        let play_api = self.play_api.clone();
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let count_resp = client
                .get(format!("{}/product_count", play_api))
                .send()
                .await
                .map_err(|err| runtime_error(format!("Failed to get product count: {}", err)))?;

            if !count_resp.status().is_success() {
                return Ok(Python::with_gil(|py| PyList::empty(py).into()));
            }

            let count_json: Value = count_resp
                .json()
                .await
                .map_err(|err| runtime_error(format!("Invalid count response: {}", err)))?;

            let total_products = count_json
                .get("product_count")
                .and_then(Value::as_i64)
                .unwrap_or(0);
            if total_products <= 0 {
                return Ok(Python::with_gil(|py| PyList::empty(py).into()));
            }

            let mut collected = Vec::new();
            let page_limit = 50;
            let total_pages = ((total_products as f64) / page_limit as f64).ceil() as i64;

            for page in 1..=total_pages {
                let response = client
                    .get(format!("{}/purchases", play_api))
                    .query(&[("page", page)])
                    .send()
                    .await;

                let response = match response {
                    Ok(resp) => resp,
                    Err(_) => continue,
                };

                if !response.status().is_success() {
                    continue;
                }

                let page_json: Value = match response.json().await {
                    Ok(value) => value,
                    Err(_) => continue,
                };

                collected.extend(Self::parse_product_list(&page_json));
            }

            Python::with_gil(|py| Self::to_py_product_list(py, collected))
        })
    }

    /// Cached library with optional force refresh and TTL.
    /// Default TTL = 45 seconds when not provided.
    pub fn get_library_cached<'py>(
        &'py self,
        py: Python<'py>,
        force_refresh: Option<bool>,
        ttl_seconds: Option<i64>,
    ) -> PyResult<&'py PyAny> {
        let client = self.client.clone();
        let play_api = self.play_api.clone();
        let cache = Arc::clone(&self.cached_products);
        let ttl = ttl_seconds.unwrap_or(45);
        let force = force_refresh.unwrap_or(false);

        pyo3_asyncio::tokio::future_into_py(py, async move {
            // Use cache if valid and not forced
            if !force {
                if let Ok(guard) = cache.read() {
                    if let Some((ts, ref items)) = *guard {
                        let now = SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap_or_default()
                            .as_secs() as i64;
                        if now - ts <= ttl {
                            // Return cached copy
                            return Python::with_gil(|py| {
                                Self::to_py_product_list(py, items.clone())
                            });
                        }
                    }
                }
            }

            // Fetch count
            let count_resp = client
                .get(format!("{}/product_count", play_api))
                .send()
                .await
                .map_err(|err| runtime_error(format!("Failed to get product count: {}", err)))?;

            if !count_resp.status().is_success() {
                return Python::with_gil(|py| Ok(PyList::empty(py).into()));
            }

            let count_json: Value = count_resp
                .json()
                .await
                .map_err(|err| runtime_error(format!("Invalid count response: {}", err)))?;

            let total_products = count_json
                .get("product_count")
                .and_then(Value::as_i64)
                .unwrap_or(0);
            if total_products <= 0 {
                return Python::with_gil(|py| Ok(PyList::empty(py).into()));
            }

            let mut collected = Vec::new();
            let page_limit = 50;
            let total_pages = ((total_products as f64) / page_limit as f64).ceil() as i64;

            for page in 1..=total_pages {
                let response = client
                    .get(format!("{}/purchases", play_api))
                    .query(&[("page", page)])
                    .send()
                    .await;

                let response = match response {
                    Ok(resp) => resp,
                    Err(_) => continue,
                };

                if !response.status().is_success() {
                    continue;
                }

                let page_json: Value = match response.json().await {
                    Ok(value) => value,
                    Err(_) => continue,
                };

                collected.extend(Self::parse_product_list(&page_json));
            }

            // Update cache
            if let Ok(mut guard) = cache.write() {
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs() as i64;
                *guard = Some((now, collected.clone()));
            }

            Python::with_gil(|py| Self::to_py_product_list(py, collected))
        })
    }

    pub fn get_download_urls<'py>(
        &'py self,
        py: Python<'py>,
        product_id: String,
    ) -> PyResult<&'py PyAny> {
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let url = format!(
                "https://www.dlsite.com/maniax/download/=/product_id/{}.html",
                product_id
            );
            Ok(vec![url])
        })
    }

    pub fn get_voice_comic_info<'py>(
        &'py self,
        py: Python<'py>,
        product_id: String,
    ) -> PyResult<&'py PyAny> {
        let client = self.client.clone();
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let url = "https://play.dl.dlsite.com/api/download/sign/cookie";
            let resp = client
                .get(url)
                .query(&[("workno", product_id)])
                .send()
                .await
                .map_err(|err| runtime_error(format!("Voice comic request failed: {}", err)))?;

            if resp.status().is_success() {
                let value: Value = resp.json().await.map_err(|err| {
                    runtime_error(format!("Invalid voice comic response: {}", err))
                })?;
                Python::with_gil(|py| value_to_py(py, &value))
            } else {
                Python::with_gil(|py| Ok(py.None()))
            }
        })
    }

    pub fn get_product_metadata<'py>(
        &'py self,
        py: Python<'py>,
        product_id: String,
    ) -> PyResult<&'py PyAny> {
        let client = self.client.clone();
        let maniax_api = self.maniax_api.clone();
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let url = format!("{}/=/product.json", maniax_api);
            let resp = client
                .get(&url)
                .query(&[("workno", product_id)])
                .send()
                .await
                .map_err(|err| {
                    runtime_error(format!("Product metadata request failed: {}", err))
                })?;

            if resp.status().is_success() {
                let value: Value = resp
                    .json()
                    .await
                    .map_err(|err| runtime_error(format!("Invalid metadata response: {}", err)))?;
                Python::with_gil(|py| value_to_py(py, &value))
            } else {
                Python::with_gil(|py| Ok(py.None()))
            }
        })
    }

    pub fn search_products<'py>(
        &'py self,
        py: Python<'py>,
        query: String,
        category: Option<String>,
    ) -> PyResult<&'py PyAny> {
        let client = self.client.clone();
        let maniax_api = self.maniax_api.clone();
        pyo3_asyncio::tokio::future_into_py(py, async move {
            let url = format!("{}/search", maniax_api);
            let mut params = HashMap::new();
            params.insert("keyword", query);
            params.insert("order", "trend".to_string());
            params.insert("per_page", "50".to_string());
            params.insert("category", category.unwrap_or_else(|| "all".to_string()));

            let response = client.get(&url).query(&params).send().await;
            if let Ok(resp) = response {
                if resp.status().is_success() {
                    if let Ok(data) = resp.json::<Value>().await {
                        let products = Self::parse_search_results(&data);
                        return Python::with_gil(|py| Self::to_py_product_list(py, products));
                    }
                }
            }

            Python::with_gil(|py| Ok(PyList::empty(py).into()))
        })
    }
}
