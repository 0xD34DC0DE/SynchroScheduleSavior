// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use indoc::{formatdoc, indoc};
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
async fn synchro_inject(js: String, timeout_ms: u64, expect_return_value: bool, handle: AppHandle) -> Result<Value, String> {
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
                Ok(_) => {}
                Err(e) => {
                    eprintln!("Error sending extracted data: {}", e);
                }
            }
        }
    });

    // Use event_id as a unique identifier for the error field to avoid potential collisions with return values
    let error_field = format!("error-{}", event_id);
    let injected = formatdoc! {r#"
    window.__TAURI__.event.emit('{}', (() => {{
        try {{
            return ({})();
        }} catch (e) {{
            return {{ '{}': e.toString() }};
        }}
    }})());
    "#, event_id, js, error_field};
    println!("Injecting: {}", injected);
    window.eval(injected.as_ref()).map_err(|e| e.to_string())?;

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
        Some(Value::String(s)) => {
            println!("Extracted: {}", s);
            match serde_json::from_str(s.as_str()).map_err(|e| e.to_string())? {
                Value::Object(mut o) => {
                    if let Some(e) = o.remove(error_field.as_str()) {
                        Err(e.to_string())
                    } else {
                        Ok(Value::Object(o))
                    }
                }
                v => Ok(v),
            }
        }
        Some(v) => Err(format!("Extraction error, result is not a string: {}", v)),
        None => if expect_return_value {
            Err("Extraction error, was expecting a return value but got nothing".to_string())
        } else {
            println!("Injection done, no return value expected");
            Ok(Value::Null)
        }
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_puppet, close_puppet, synchro_inject])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
