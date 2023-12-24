// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use tauri::{AppHandle, Manager};
use url::Url;

#[tauri::command]
async fn open_puppet(url: String, handle: AppHandle) -> Result<(), String> {
    if handle.get_window("synchro").is_some() {
        return Err("Synchro puppet window already open".to_string());
    }

    let url = Url::parse(url.as_ref()).map_err(|e| e.to_string())?;

    tauri::WindowBuilder::new(
        &handle,
        "synchro",
        tauri::WindowUrl::External(url),
    ).title("Synchro - Puppet").build().unwrap();

    Ok(())
}

#[tauri::command]
async fn close_puppet(handle: AppHandle) -> Result<(), String> {
    if let Some(window) = handle.get_window("synchro") {
        window.close().unwrap();
    }
    Ok(())
}

#[tauri::command]
async fn synchro_inject(javascript: String, handle: AppHandle) -> Result<(), String> {
    let window = handle.get_window("synchro");
    if window.is_none() {
        return Err("Synchro puppet window not open".to_string());
    }
    let window = window.unwrap();
    window.eval(javascript.as_ref()).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_puppet, close_puppet, synchro_inject])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
