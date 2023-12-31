use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Duration;

use anyhow::Result;
use rand::Rng;
use serde_json::Value;
use tauri::{plugin::{Builder, TauriPlugin}, Runtime};
use tauri::{AppHandle, EventHandler, Manager, Window};
use thiserror::Error;
use tokio::sync::mpsc;
use tokio::time;
use url::Url;

#[derive(Error, Debug)]
pub enum WebviewScraperError {
    #[error("Invalid result type: {0}")]
    InvalidResultType(String),
    #[error("Webview injection timed out after {0}")]
    InjectionTimeout(String),
    #[error("Webview injection failed: {0}")]
    InjectionFailed(String),
}

pub struct WebviewInjection {
    pub window: Window,
    pub js_function: String,
    pub execution_timeout: Duration,
    pub expected_return_type: ExpectedType,
    pub args: Option<Vec<Value>>,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum ExpectedType {
    Null,
    Bool,
    Number,
    String,
    Object,
    None,
}

impl TryFrom<&str> for ExpectedType {
    type Error = WebviewScraperError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        match value {
            "string" => Ok(ExpectedType::String),
            "number" => Ok(ExpectedType::Number),
            "boolean" => Ok(ExpectedType::Bool),
            "null" => Ok(ExpectedType::Null),
            "object" => Ok(ExpectedType::Object),
            "undefined" => Ok(ExpectedType::None),
            _ => Err(WebviewScraperError::InvalidResultType(value.to_string())),
        }
    }
}

impl ExpectedType {
    pub fn as_str(&self) -> &'static str {
        match self {
            ExpectedType::Null => "null",
            ExpectedType::Bool => "boolean",
            ExpectedType::Number => "number",
            ExpectedType::String => "string",
            ExpectedType::Object => "object",
            ExpectedType::None => "undefined",
        }
    }
}

pub async fn webview_inject(injection: WebviewInjection) -> Result<Value> {
    Injector::new(&injection.window)
        .inject(
            injection.js_function.as_ref(),
            injection.args,
            injection.expected_return_type.as_str(),
            injection.execution_timeout,
        ).await
}

struct ResultListener<'a> {
    event_name: String,
    event_handler: EventHandler,
    receiver: mpsc::Receiver<Option<String>>,
    window: &'a Window,
}

impl<'a> ResultListener<'a> {
    const EVENT_NAME_PREFIX: &'static str = "webview-inject-";

    pub fn new(window: &'a Window) -> Self {
        let (sender, receiver) = mpsc::channel::<Option<String>>(1);

        let random_postfix = rand::thread_rng().gen::<u16>();
        let event_name = format!("{}{}", Self::EVENT_NAME_PREFIX, random_postfix);

        let event_handler = window.listen(
            event_name.clone(),
            move |event| {
                sender.try_send(event.payload().map(|p| p.to_string()))
                    .unwrap_or_else(|e| {
                        eprintln!("Error sending injection result: {}", e);
                    });
            },
        );

        Self {
            event_name,
            event_handler,
            receiver,
            window,
        }
    }

    pub async fn wait_for_result(&mut self, timeout: Duration) -> Result<Option<String>> {
        match time::timeout(timeout.clone(), self.receiver.recv()).await {
            Ok(r) => r.map_or_else(
                || Err(WebviewScraperError::InjectionFailed(
                    "Result listener channel closed unexpectedly".to_string()
                ).into()),
                |r| Ok(r),
            ),
            Err(_) => Err(WebviewScraperError::InjectionTimeout(
                format!("{:?}", timeout)
            ).into()),
        }
    }

    pub fn event_name(&self) -> &str {
        self.event_name.as_str()
    }
}

impl<'a> Drop for ResultListener<'a> {
    fn drop(&mut self) {
        self.window.unlisten(self.event_handler);
    }
}

struct Injector<'a> {
    window: &'a Window,
    result_listener: ResultListener<'a>,
}

impl<'a> Injector<'a> {
    pub fn new(window: &'a Window) -> Self {
        Self {
            window,
            result_listener: ResultListener::new(window),
        }
    }

    pub async fn inject(&mut self,
                        js: &str,
                        args: Option<Vec<Value>>,
                        expected_return_type: &'static str,
                        timeout: Duration) -> Result<Value> {
        let js =
            format!("__INJECTOR__('{}', {}, '{}', {})",
                    self.result_listener.event_name(),
                    js,
                    expected_return_type,
                    Self::make_args_array(args)
            );
        println!("Injecting: {}", js);

        self.window.eval(js.as_ref())
            .map_err(|e| WebviewScraperError::InjectionFailed(e.to_string()))?;

        Ok(self.result_listener
            .wait_for_result(timeout)
            .await?
            .ok_or(WebviewScraperError::InjectionFailed(
                "Expected a return value, but got none".to_string()
            ))
            .and_then(|r| {
                let v = serde_json::from_str::<Value>(r.as_ref())
                    .map_err(|e| WebviewScraperError::InjectionFailed(e.to_string()))?;
                if v.is_object() {
                    Ok(v)
                } else {
                    Err(WebviewScraperError::InjectionFailed(
                        format!("Expected an object, but got {}", v)
                    ))
                }
            })?)
    }

    fn make_args_array(args: Option<Vec<Value>>) -> String {
        format!("[{}]",
                args.unwrap_or_default()
                    .iter()
                    .map(|v| v.to_string())
                    .collect::<Vec<String>>()
                    .join(", ")
        )
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("webview_injector")
        .setup(move |app_handle| {
            app_handle.manage(Mutex::new(NavigationHandlerPluginState::new(app_handle)));
            Ok(())
        })
        .on_page_load(|window, payload| {
            println!("Page loaded: {}", payload.url());
            let mut state = window.state::<Mutex<NavigationHandlerPluginState<R>>>();
            state.lock().unwrap().handle(window.clone(), payload.url());
        })
        .build()
}

type WindowLabel = String;
type EventName = String;

#[derive(Debug, Default)]
pub struct NavigationHandlerPluginState<R: Runtime> {
    handlers: Mutex<HashMap<WindowLabel, Vec<NavigationCallback>>>,
    app_handle: Option<AppHandle<R>>,
}

#[derive(Debug)]
struct NavigationCallback {
    emit_to: WindowLabel,
    event_name: String,
    url: String,
    once: bool,
}

impl<R: Runtime> NavigationHandlerPluginState<R> {
    pub fn new(app_handle: &AppHandle<R>) -> Self {
        Self {
            handlers: Mutex::new(HashMap::new()),
            app_handle: Some(app_handle.clone()),
        }
    }

    pub fn handle(&mut self, emitter: Window<R>, url: &str) -> bool {
        let mut handlers = self.handlers.lock().unwrap();
        let handle = self.app_handle.as_ref().unwrap();

        println!("Handling navigation to {}", url);

        if let Some(handlers) = handlers.get_mut(emitter.label()) {
            println!("Found {} handlers for {}", handlers.len(), emitter.label());
            handlers.retain(|h| {
                if h.url == url {
                    if let Some(listener) = handle.get_window(h.emit_to.as_str()) {
                        println!("Emitting navigation event {} to {}", h.event_name, h.emit_to);
                        listener.emit(&h.event_name, emitter.label()).expect("Failed to emit navigation event");
                    }
                    !h.once
                } else {
                    true
                }
            });
        }

        true
    }

    pub fn register(&mut self, listener: &str, emitter: WindowLabel, url: &str, once: bool) -> EventName {
        let mut handlers = self.handlers.lock().unwrap();

        println!("Registering navigation handler for {} to {} (once: {})", url, listener, once);
        let event_name = format!("webview-navigation-{}", rand::thread_rng().gen::<u16>());

        handlers.entry(emitter)
            .or_insert_with(Vec::new)
            .push(NavigationCallback {
                emit_to: listener.to_string(),
                event_name: event_name.clone(),
                url: url.to_string(),
                once,
            });

        event_name
    }

    pub fn unregister(&mut self, emitter: WindowLabel, event_name: EventName) {
        let mut handlers = self.handlers.lock().unwrap();

        println!("Unregistering navigation handler for {} (event: {})", emitter, event_name);

        if let Some(handlers) = handlers.get_mut(emitter.as_str()) {
            handlers.retain(|h| h.event_name != event_name);
        }
    }
}