// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use tauri::Manager;

mod web_view_injector;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![])
        .plugin(web_view_injector::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
