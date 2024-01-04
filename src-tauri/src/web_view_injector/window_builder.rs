use tauri::{Manager, Runtime, WindowUrl};
use tauri::window::WindowBuilder;

use crate::web_view_injector::state::WebviewInjectorStateType;

pub struct InjectableWindowBuilder {}

impl<'a> InjectableWindowBuilder {
    pub fn new<M: Manager<R>, L: Into<String>, R: Runtime>(manager: &'a M, label: L, url: WindowUrl) -> WindowBuilder<'a, R> {
        manager.state::<WebviewInjectorStateType<R>>().lock().unwrap().register_window(label.into());
        WindowBuilder::new(manager, label, url)
            .initialization_script(include_str!("injection_handler.js"))
    }
}