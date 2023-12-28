use std::time::Duration;

use anyhow::Result;
use indoc::formatdoc;
use rand::Rng;
use serde_json::Value;
use tauri::{EventHandler, Window};
use thiserror::Error;
use tokio::sync::mpsc;
use tokio::time;

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
    pub expected_return_type: WebviewInjectionResultType,
    pub args: Option<Vec<(String, Value)>>,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum WebviewInjectionResultType {
    Null,
    Bool,
    Number,
    String,
    Array,
    Object,
    Function,
    None,
}

impl TryFrom<&str> for WebviewInjectionResultType {
    type Error = WebviewScraperError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        match value {
            "null" => Ok(WebviewInjectionResultType::Null),
            "bool" => Ok(WebviewInjectionResultType::Bool),
            "number" => Ok(WebviewInjectionResultType::Number),
            "string" => Ok(WebviewInjectionResultType::String),
            "array" => Ok(WebviewInjectionResultType::Array),
            "object" => Ok(WebviewInjectionResultType::Object),
            "none" => Ok(WebviewInjectionResultType::None),
            _ => Err(WebviewScraperError::InvalidResultType(value.to_string())),
        }
    }
}

pub async fn webview_inject(injection: WebviewInjection) -> Result<Value> {
    let result_listener = ResultListener::new(&injection.window);


    todo!("Implement webview_inject")
}

struct ResultListener<'a> {
    event_identifier: String,
    event_handler: EventHandler,
    receiver: mpsc::Receiver<Result<String>>,
    window: &'a Window,
}

impl<'a> ResultListener<'a> {
    const EVENT_IDENTIFIER_PREFIX: &'static str = "injection-listener-";

    pub fn new(window: &'a Window) -> Self {
        let (sender, receiver) = mpsc::channel::<Result<String>>(1);

        let random_postfix = rand::thread_rng().gen::<u16>();
        let event_identifier = format!("{}{}", Self::EVENT_IDENTIFIER_PREFIX, random_postfix);

        let event_handler = window.listen(
            event_identifier.clone(),
            move |event| {
                sender.try_send(match event.payload() {
                    Some(payload) => anyhow::Ok(payload.to_string()),
                    None => Err(WebviewScraperError::InjectionFailed(
                        "Received event without payload".to_string()
                    ).into()),
                }).unwrap_or_else(|e| {
                    eprintln!("Error sending injection result: {}", e);
                });
            },
        );

        Self {
            event_identifier,
            event_handler,
            receiver,
            window,
        }
    }

    pub async fn wait_for_result(&mut self, timeout: Duration) -> Result<String> {
        match time::timeout(timeout.clone(), self.receiver.recv()).await {
            Ok(r) => match r {
                Some(r) => r,
                None => Err(WebviewScraperError::InjectionFailed(
                    "Received nothing".to_string()
                ).into()),
            }
            Err(_) => Err(WebviewScraperError::InjectionTimeout(
                format!("{:?}", timeout)
            ).into()),
        }
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
    error_field_name: String,
}

impl<'a> Injector<'a> {
    pub fn new(window: &'a Window) -> Self {
        let result_listener = ResultListener::new(window);
        let random_postfix = rand::thread_rng().gen::<u16>();
        let error_field_name = format!("error-{}", random_postfix);
        Self {
            window,
            result_listener,
            error_field_name,
        }
    }

    pub async fn inject(&mut self,
                        js: &str,
                        args: Option<Vec<Value>>,
                        expected_return_type: WebviewInjectionResultType,
                        timeout: Duration) -> Result<Value> {
        let js = Self::bind_args(js, args);
        let js = self.wrap_with_handler(&js);
        println!("Injecting: {}", js);

        self.window.eval(js.as_ref())
            .map_err(|e| WebviewScraperError::InjectionFailed(e.to_string()))?;

        let result = self.result_listener.wait_for_result(timeout).await?;

        self.parse_result(result, expected_return_type)
    }

    fn parse_result(&self,
                    result: String,
                    expected_return_type: WebviewInjectionResultType) -> Result<Value> {
        let result = serde_json::to_value(result)
            .map_err(|e| WebviewScraperError::InjectionFailed(e.to_string()))?;

        let result = result.get("Ok");

        if expected_return_type == WebviewInjectionResultType::None {
            if result.is_some() {
                return Err(WebviewScraperError::InjectionFailed(
                    "Expected no return value, but got one".to_string()
                ).into());
            }
            return Ok(Value::Null);
        }

        if result.is_none() {
            return Err(WebviewScraperError::InjectionFailed(
                "Expected a return value, but got none".to_string()
            ).into());
        }

        let result = result.unwrap();
        if !result.is_string() {
            return Err(WebviewScraperError::InjectionFailed(
                "'Ok' field is not a string".to_string()
            ).into());
        }

        let result = result.as_str().unwrap();
        let result = serde_json::from_str(result)
            .map_err(|e| WebviewScraperError::InjectionFailed(e.to_string()))?;

        if let Value::Object(mut o) = result {
            // If the result is an object, check if it contains the special error field
            if let Some(e) = o.remove(self.error_field_name.as_str()) {
                return Err(WebviewScraperError::InjectionFailed(
                    e.to_string()
                ).into());
            }
            Ok(Value::Object(o))
        } else {
            Ok(result)
        }
    }

    fn wrap_with_handler(&self, js: &str) -> String {
        formatdoc! {r#"
        window.__TAURI__.event.emit('{}', (() => {{
            try {{
                return {};
            }} catch (e) {{
                return {{ '{}': e.toString() }};
            }}
        }})());
        "#,
            self.result_listener.event_identifier,
            js,
            self.error_field_name
        }
    }

    fn bind_args(js: &str, args: Option<Vec<Value>>) -> String {
        let args = args.unwrap_or_default();
        format!("({})({})",
                js,
                args.iter()
                    .map(|v| v.to_string())
                    .collect::<Vec<String>>()
                    .join(", ")
        )
    }
}