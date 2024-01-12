use anyhow::{anyhow, Result};
use tauri::{AppHandle, Manager, Window, WindowUrl};
use url::Url;

use crate::web_view_injector::injection_args::InjectionArgs;
use crate::web_view_injector::injector::WindowInjectorExt;
use crate::web_view_injector::inter_webview_promise::PromiseHandle;
use crate::web_view_injector::window_builder::InjectableWindowBuilder;

#[tauri::command]
async fn create_window(label: String, title: String, url: String, app_handle: AppHandle) -> Result<()> {
    if app_handle.get_window(label.as_str()).is_some() {
        return Err(anyhow::anyhow!("Window '{}' already exists", label));
    }

    InjectableWindowBuilder::new(
        &app_handle,
        label,
        WindowUrl::External(Url::parse(url.as_ref())?),
    )?
        .title(title)
        .build()?;
    Ok(())
}

#[tauri::command]
async fn close_window(label: String, app_handle: AppHandle) -> Result<()> {
    if let Some(window) = app_handle.get_window(label.as_str()) {
        window.close()?;
    }
    Ok(())
}

#[tauri::command]
async fn inject(args: InjectionArgs, window: Window, app_handle: AppHandle) -> Result<PromiseHandle> {
    if let Some(target) = app_handle.get_window(&args.injection_target) {
        Ok(window.inject_into(&target, args)?.clone())
    } else {
        Err(anyhow!("Window '{}' does not exist", args.injection_target))?
    }
}

#[tauri::command]
async fn await_injection(handle: PromiseHandle, window: Window) -> Result<String> {
    window.await_promise(handle)
}

#[tauri::command]
async fn cancel_injection(handle: PromiseHandle, window: Window) -> Result<()> {
    window.cancel_promise(handle)
}