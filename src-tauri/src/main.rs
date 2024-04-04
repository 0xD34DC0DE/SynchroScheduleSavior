// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use std::sync::Arc;

use anyhow::{anyhow, Result};
use serde_json::Value;
use tauri::{AppHandle, Manager, State, Window};
use tokio::sync::Semaphore;
use url::Url;

use crate::webview_inject as wv_inject;

mod webview_inject;

const MAX_PARALLEL_INJECTIONS: u32 = 8;

struct InjectorState(Arc<Semaphore>);

#[tauri::command]
async fn open_webview(window_label: String, title: String, url: String, handle: AppHandle) -> Result<(), String> {
    if handle.get_window(window_label.as_str()).is_some() {
        return Err(anyhow!("Window '{}' already exists", window_label).to_string());
    }

    let url = Url::parse(url.as_ref()).map_err(|e| e.to_string())?;

    wv_inject::InjectableWindowBuilder::new(
        &handle,
        window_label.as_str(),
        tauri::WindowUrl::External(url),
    ).map_err(|e| e.to_string())?
        .title(title.as_str())
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn close_webview(window_label: String, handle: AppHandle) -> Result<(), String> {
    if let Some(window) = handle.get_window(window_label.as_str()) {
        window.close().unwrap();
    }
    Ok(())
}

#[tauri::command]
async fn webview_inject<'r>(
    target_window_label: String,
    injection_id: u64,
    js_function: String,
    allow_parallel: bool,
    args: Option<Vec<Value>>,
    initiator_window: Window,
    handle: AppHandle,
    injector_state: State<'r, InjectorState>,
) -> Result<(), String> {
    let semaphore = injector_state.0.clone();
    let _permit = if allow_parallel {
        // If parallel injections are allowed, acquire a single permit to stay within the limit
        // of MAX_PARALLEL_INJECTIONS
        Some(semaphore.acquire().await)
    } else {
        // If this injection is not allowed to run in parallel, acquire all permits
        // to block until all previous injections are done
        Some(semaphore.acquire_many(MAX_PARALLEL_INJECTIONS).await)
    };

    let target_window = handle.get_window(target_window_label.as_str());
    if target_window.is_none() {
        return Err(anyhow!("Window '{}' not found", target_window_label).to_string());
    }
    let target_window = target_window.unwrap();

    wv_inject::inject(
        target_window,
        initiator_window,
        injection_id.to_string(),
        js_function,
        args,
    ).await
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_webview,
            close_webview,
            webview_inject
        ])
        .manage(InjectorState(Arc::new(Semaphore::new(MAX_PARALLEL_INJECTIONS as usize))))
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
