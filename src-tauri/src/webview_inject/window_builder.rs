use anyhow::Result;
use tauri::{Manager, Runtime, WindowUrl};
use tauri::window::WindowBuilder;

pub struct InjectableWindowBuilder {}

impl<'a> InjectableWindowBuilder {
    pub fn new<M: Manager<R>, L: Into<String>, R: Runtime>(manager: &'a M, label: L, url: WindowUrl) -> Result<WindowBuilder<'a, R>> {
        Ok(
            WindowBuilder::new(manager, label, url)
                .initialization_script(include_str!("injection_handler.js"))
        )
    }
}