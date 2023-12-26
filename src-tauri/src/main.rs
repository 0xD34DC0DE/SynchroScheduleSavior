// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use rand::Rng;
use serde_json::Value;
use tauri::{AppHandle, Manager};
use tokio::sync::mpsc;
use tokio::time::{self, Duration};
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
async fn synchro_inject(js: String, timeout_ms: u64, handle: AppHandle) -> Result<Value, String> {
    let window = handle.get_window("synchro");
    if window.is_none() {
        return Err("Synchro puppet window not open".to_string());
    }
    let window = window.unwrap();

    let (tx, mut rx) = mpsc::channel::<String>(1);

    let event_id = format!("synchro-extraction-{}", rand::thread_rng().gen::<u16>());

    let event_handler = window.listen(event_id.clone(), move |extraction_event| {
        if let Some(payload) = extraction_event.payload() {
            match tx.try_send(payload.to_string()) {
                Ok(_) => {},
                Err(e) => {
                    eprintln!("Error sending extracted data: {}", e);
                }
            }
        }
    });

    let extraction_wrapper = format!("window.__TAURI__.event.emit('{}', ({})());", event_id, js);

    window.eval(extraction_wrapper.as_ref()).map_err(|e| e.to_string())?;

    let result = match time::timeout(Duration::from_millis(timeout_ms), rx.recv()).await {
        Ok(r) => match r {
            Some(r) => Ok(r),
            None => Err("Extraction did not send any data".to_string()),
        }
        Err(e) => Err(e.to_string()),
    };

    window.unlisten(event_handler);

    let result = serde_json::to_value(result).map_err(|e| e.to_string())?;
    match result.get("Ok") {
        Some(Value::String(s)) => Ok(serde_json::from_str(s.as_str()).map_err(|e| e.to_string())?),
        Some(v) => Err(format!("Extraction error, result is not a string: {}", v)),
        None => Err("Extraction did not send any data".to_string()),
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_puppet, close_puppet, synchro_inject])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
