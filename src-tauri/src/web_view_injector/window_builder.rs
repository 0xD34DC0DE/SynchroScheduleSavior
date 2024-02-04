use tauri::{Manager, Runtime, WindowUrl};
use tauri::window::WindowBuilder;
use anyhow::{Context, Result};

use crate::web_view_injector::state::{StateManagerExtInternal};

pub struct InjectableWindowBuilder {}

impl<'a> InjectableWindowBuilder {
    pub fn new<M: Manager<R>, L: Into<String>, R: Runtime>(manager: &'a M, label: L, url: WindowUrl) -> Result<WindowBuilder<'a, R>> {
        manager.get_state().register_window(label.into())?;
        Ok(
            WindowBuilder::new(manager, label, url)
                .initialization_script(include_str!("injection_handler.js"))
                .on_navigation(move |url| {
                    let r = manager.get_state()
                        .get_navigation_channel(label.as_str())
                        .map(|tx| tx.blocking_send(url)?)
                        .context("Failed to send navigation event");

                    if r.is_err() {
                        eprintln!("Failed to send navigation event: {:?}", r.err().unwrap());
                    }

                    true
                })
        )
    }
}