// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use anyhow::{anyhow, Result};
use serde_json::Value;
use tauri::{AppHandle, Manager, State, Window};
use tokio::sync::Mutex;
use url::Url;

use crate::webview_inject as wv_inject;

mod webview_inject;

struct InjectorState(Mutex<()>);

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
async fn webview_inject(
    target_window_label: String,
    injection_id: u64,
    js_function: String,
    allow_parallel: bool,
    args: Option<Vec<Value>>,
    initiator_window: Window,
    handle: AppHandle,
    injector_state: State<InjectorState>,
) -> Result<(), String> {
    let _guard = injector_state.0
        // Try to get the lock. If we get it, keep it regardless of the value of allow_parallel
        // This way, other injections that don't allow parallel injections will be blocked
        .try_lock()
        .map(|g| Some(g))
        // If we can't get the lock, and parallel injections are not allowed, wait for the lock
        .unwrap_or_else(|g|
            if allow_parallel { None } else { Some(injector_state.0.lock()) }
        );

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
        .manage(InjectorState(Mutex::default()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
