use tauri::{Manager, Runtime, WindowUrl};
use tauri::window::WindowBuilder;

use crate::web_view_injector::state::{StateManagerExtInternal};

pub struct InjectableWindowBuilder {}

impl<'a> InjectableWindowBuilder {
    pub fn new<M: Manager<R>, L: Into<String>, R: Runtime>(manager: &'a M, label: L, url: WindowUrl) -> WindowBuilder<'a, R> {
        manager.state::<WebviewInjectorStateType<R>>().lock().unwrap().register_window(label.into());
        WindowBuilder::new(manager, label, url)
        manager.get_state().register_window(label.into());
            .initialization_script(include_str!("injection_handler.js"))
    }
}