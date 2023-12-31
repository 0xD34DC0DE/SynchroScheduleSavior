// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use std::sync::Mutex;
use serde_json::Value;
use tauri::{AppHandle, Manager, Runtime, Window};
use tokio::time::Duration;
use url::Url;

use crate::webview_injector::{NavigationHandlerPluginState, WebviewInjection, WebviewScraperError};

mod webview_injector;

#[tauri::command]
async fn open_webview(window_label: String, title: String, url: String, handle: AppHandle) -> Result<(), String> {
    if handle.get_window(window_label.as_str()).is_some() {
        return Err(format!("Window '{}' already exists", window_label));
    }

    let url = Url::parse(url.as_ref()).map_err(|e| e.to_string())?;

    tauri::WindowBuilder::new(
        &handle,
        window_label.as_str(),
        tauri::WindowUrl::External(url),
    )
        .title(title.as_str())
        .initialization_script(include_str!("injector.js"))
        .build().map_err(|e| e.to_string())?;

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
    window_label: String,
    js: String,
    args: Option<Vec<Value>>,
    expected_return_type: String,
    timeout_ms: u64,
    handle: AppHandle) -> Result<Value, String> {
    let window = handle.get_window(window_label.as_str());
    if window.is_none() {
        return Err(format!("Window '{}' not found", window_label));
    }
    let window = window.unwrap();

    println!("Expected return type: {}", expected_return_type);

    let expected_return_type = expected_return_type.as_str()
        .try_into().map_err(|e: WebviewScraperError| e.to_string())?;

    let injection = WebviewInjection {
        window,
        js_function: js,
        execution_timeout: Duration::from_millis(timeout_ms),
        expected_return_type,
        args,
    };

    webview_injector::webview_inject(injection).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn webview_listen_navigation<R: Runtime>(listen_to: String,
                                               url: String,
                                               once: bool,
                                               window: Window<R>,
                                               handle: AppHandle) -> Result<String, String> {
    Ok(handle
        .state::<Mutex<NavigationHandlerPluginState<R>>>()
        .lock()
        .unwrap()
        .register(window.label(), listen_to, url.as_ref(), once)
    )
}

#[tauri::command]
async fn webview_unlisten_navigation<R: Runtime>(event_name: String,
                                                 window: Window<R>,
                                                 handle: AppHandle) -> Result<(), String> {
    Ok(handle
        .state::<Mutex<NavigationHandlerPluginState<R>>>()
        .lock()
        .unwrap()
        .unregister(window.label().to_string(), event_name)
    )
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_webview,
            close_webview,
            webview_inject,
            webview_listen_navigation,
            webview_unlisten_navigation
        ])
        .plugin(webview_injector::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
