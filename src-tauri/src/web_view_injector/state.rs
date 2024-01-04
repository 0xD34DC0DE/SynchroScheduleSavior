use std::collections::{HashMap};
use std::sync::Mutex;
use tauri::{Manager, Runtime, Window};

pub type WebviewInjectorStateType<R: Runtime> = Mutex<WebviewInjectorState<R>>;

pub trait StateManagerExtInternal<T: Manager<R>, R: Runtime> {
    fn get_state(&self) -> &WebviewInjectorState<R>;
    fn get_state_mut(&self) -> &mut WebviewInjectorState<R>;
}

impl<T: Manager<R>, R: Runtime> StateManagerExtInternal<T, R> for T {
    fn get_state(&self) -> &WebviewInjectorState<R> {
        &self.state::<WebviewInjectorStateType<R>>().lock().unwrap()
    }

    fn get_state_mut(&self) -> &mut WebviewInjectorState<R> {
        &mut self.state::<WebviewInjectorStateType<R>>().lock().unwrap()
    }
}

pub struct WebviewInjectorState<R: Runtime> {
    injectable_windows: HashMap<String, InjectableWindowState<R>>,
}

impl<R: Runtime> WebviewInjectorState<R> {
    pub fn register_window(&mut self, label: String) {
        self.injectable_windows.insert(label.clone(), label.into());
    }

    pub fn unregister_window(&mut self, label: &str) {
        self.injectable_windows.remove(label);
    }

    pub fn is_window_registered(&self, label: &str) -> bool {
        self.injectable_windows.contains_key(label)
    }

    pub fn set_window_ready(&mut self, window: Window<R>) {
        if let Some(window_state) = self.injectable_windows.get_mut(window.label()) {
            window_state.handle_state = HandleState::Ready(window);
        }
    }
}

impl<R: Runtime> Default for WebviewInjectorState<R> {
    fn default() -> Self {
        Self {
            injectable_windows: HashMap::new(),
        }
    }
}

#[derive(Debug)]
pub struct InjectableWindowState<R: Runtime> {
    label: String,
    handle_state: HandleState<R>,
}

impl<R: Runtime> From<String> for InjectableWindowState<R> {
    fn from(label: String) -> Self {
        Self {
            label,
            handle_state: HandleState::NotReady,
        }
    }
}

#[derive(Debug)]
pub enum HandleState<R: Runtime> {
    NotReady,
    Ready(Window<R>),
}
