use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{Manager, Runtime, Window};
use anyhow::{Result, anyhow};
use tauri::async_runtime::JoinHandle;
use tokio::sync::mpsc;
use url::Url;
use crate::web_view_injector::inter_webview_promise::{InterWebviewPromise, PromiseHandle};

pub type WebviewInjectorStateType<R: Runtime> = Mutex<WebviewInjectorState<R>>;

pub trait StateManagerExtInternal<T: Manager<R>, R: Runtime> {
    fn get_state(&self) -> &WebviewInjectorState<R>;
}

impl<T: Manager<R>, R: Runtime> StateManagerExtInternal<T, R> for T {
    fn get_state(&self) -> &WebviewInjectorState<R> {
        &self.state::<WebviewInjectorStateType<R>>().lock().unwrap()
    }
}

pub struct WebviewInjectorState<R: Runtime> {
    injectable_windows: HashMap<String, InjectableWindowState<R>>,
}

impl<R: Runtime> WebviewInjectorState<R> {
    pub fn register_window(&mut self, label: String) -> Result<()> {
        match self.injectable_windows.get_mut(&label) {
            Some(_) => Err(anyhow!("Window with label '{}' already registered", label)),
            None => {
                self.injectable_windows.insert(label.clone(), label.into());
                Ok(())
            }
        }
    }

    pub fn get_navigation_channel(&mut self, label: &str) -> Result<mpsc::Sender<Url>> {
        if let Some(mut window_state) = self.injectable_windows.get_mut(label) {
            Ok(window_state.navigation_channel().clone())
        } else {
            Err(anyhow!("Window '{}' is not registered as injectable", label))
        }
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

    pub fn make_promise(&mut self, target: &Window<R>, events_name_prefix: &str) -> Result<&PromiseHandle> {
        if let Some(mut window_state) = self.injectable_windows.get_mut(target.label()) {
            match &window_state.handle_state {
                _ => {
                    let promise = InterWebviewPromise::new(target, events_name_prefix);
                    let handle = promise.handle();
                    window_state.promises.insert(handle.clone(), promise);
                    Ok(handle)
                },
                HandleState::Destroyed => Err(anyhow!("Window '{}' is destroyed", target.label())),
            }
        } else {
            Err(anyhow!("Window '{}' is not registered as injectable", target.label()))
        }
    }

    pub fn find_promise(&self, handle: &PromiseHandle) -> Option<&InterWebviewPromise> {
        self.injectable_windows.values()
            .find(|window_state| window_state.owns_promise(handle))
            .map(|window_state| window_state.promises.get(handle))
            .flatten()
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
    promises: HashMap<PromiseHandle, InterWebviewPromise>,
    navigation_rx: mpsc::Receiver<Url>,
    rx_handle: JoinHandle<()>,
    navigation_tx: mpsc::Sender<Url>,
}

impl<R: Runtime> InjectableWindowState<R> {
    pub fn owns_promise(&self, handle: &PromiseHandle) -> bool {
        self.promises.contains_key(handle)
    }

    pub fn navigation_channel(&self) -> &mpsc::Sender<Url> {
        &self.navigation_tx
    }
}

impl<R: Runtime> From<String> for InjectableWindowState<R> {
    fn from(label: String) -> Self {
        let (tx, mut rx) = mpsc::channel(1);

        let rx_handle = tauri::async_runtime::spawn(async move {
            while let Some(url) = rx.recv().await {
                println!("Received navigation event: {:?}", url);
            }
        });

        Self {
            label,
            handle_state: HandleState::NotReady,
            promises: HashMap::new(),
            navigation_rx: rx,
            rx_handle,
            navigation_tx: tx,
        }
    }
}

#[derive(Debug)]
pub enum HandleState<R: Runtime> {
    NotReady,
    Ready(Window<R>),
    Destroyed,
}
