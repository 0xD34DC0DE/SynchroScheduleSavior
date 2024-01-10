use anyhow::Result;
use tauri::{AppHandle, Manager, Window, WindowUrl};
use url::Url;
use crate::web_view_injector::injection_args::InjectionArgs;
use crate::web_view_injector::window_builder::InjectableWindowBuilder;


#[tauri::command]
async fn create_window(label: String, title: String, url:String, app_handle: AppHandle) -> Result<()> {
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
async fn inject(args: InjectionArgs, window: Window) -> Result<CancellationHandle> {
    
}