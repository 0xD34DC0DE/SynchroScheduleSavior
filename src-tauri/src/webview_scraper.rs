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

pub async fn webview_inject(injection: WebviewInjection) -> Result<Value> {
    Injector::new(&injection.window)
        .inject(
            injection.js_function.as_ref(),
            injection.args,
            injection.expected_return_type,
            injection.execution_timeout,
        ).await
}

struct ResultListener<'a> {
    event_identifier: String,
    event_handler: EventHandler,
    receiver: mpsc::Receiver<Option<String>>,
    window: &'a Window,
}

impl<'a> ResultListener<'a> {
    const EVENT_IDENTIFIER_PREFIX: &'static str = "injection-listener-";

    pub fn new(window: &'a Window) -> Self {
        let (sender, receiver) = mpsc::channel::<Option<String>>(1);

        let random_postfix = rand::thread_rng().gen::<u16>();
        let event_identifier = format!("{}{}", Self::EVENT_IDENTIFIER_PREFIX, random_postfix);

        let event_handler = window.listen(
            event_identifier.clone(),
            move |event| {
                sender.try_send(event.payload().map(|p| p.to_string()))
                .unwrap_or_else(|e| {
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
    special_field_name: String,
}

impl<'a> Injector<'a> {
    pub fn new(window: &'a Window) -> Self {
        let result_listener = ResultListener::new(window);
        let random_postfix = rand::thread_rng().gen::<u16>();
        let error_field_name = format!("error-{}", random_postfix);
        let special_field_name = format!("special-{}", random_postfix);
        Self {
            window,
            result_listener,
            error_field_name,
            special_field_name,
        }
    }

    pub async fn inject(&mut self,
                        js: &str,
                        args: Option<Vec<Value>>,
                        expected_return_type: ExpectedType,
                        timeout: Duration) -> Result<Value> {
        let js = self.prepare_js(&js, expected_return_type, args);
        println!("Injecting: {}", js);

        self.window.eval(js.as_ref())
            .map_err(|e| WebviewScraperError::InjectionFailed(e.to_string()))?;

        let result = self.result_listener.wait_for_result(timeout).await?;

        self.parse_result(result)
    }

    fn parse_result(&self, result: Option<String>) -> Result<Value> {
        if result.is_none() {
            return Err(WebviewScraperError::InjectionFailed(
                "Expected a return value, but got none".to_string()
            ).into());
        }

        let result = serde_json::to_value(result)
            .map_err(|e| WebviewScraperError::InjectionFailed(e.to_string()))?;

        println!("{}", result.to_string());

        if !result.is_string() {
            return Err(WebviewScraperError::InjectionFailed(
                "payload is not a string".to_string()
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
            if let Some(v) = o.remove(self.special_field_name.as_str()) {
                return Ok(v);
            }
            Ok(Value::Object(o))
        } else {
            Ok(result)
        }
    }

    fn prepare_js(&self, js: &str, expected_return_type: ExpectedType, args: Option<Vec<Value>>) -> String {
        let js = Self::bind_args(js, args);
        let type_check = Self::generate_return_type_check(expected_return_type);
        let serializer = self.generate_serializer(expected_return_type);

        formatdoc! {r#"
        window.__TAURI__.event.emit('{0}', (() => {{
            try {{
                console.log('Evaluating: {0}');
                const result = {1};
                if (!({2})) {{
                    return {{ '{3}': 'Returned value does not match expected type' }};
                }}
                {4}
            }} catch (e) {{
                return {{ '{3}': e.toString() }};
            }}
        }})());
        "#,
            self.result_listener.event_identifier,
            js,
            type_check,
            self.error_field_name,
            serializer,
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

    fn generate_return_type_check(expected_return_type: ExpectedType) -> String {
        match expected_return_type {
            ExpectedType::Null => "typeof result === 'object' && result === null",
            ExpectedType::Bool => "typeof result === 'boolean'",
            ExpectedType::Number => "typeof result === 'number'",
            ExpectedType::String => "typeof result === 'string'",
            ExpectedType::Object => "typeof result === 'object'",
            ExpectedType::None => "result === undefined",
        }.to_string()
    }

    fn generate_serializer(&self, expected_return_type: ExpectedType) -> String {
        match expected_return_type {
            ExpectedType::Null |
            ExpectedType::Bool |
            ExpectedType::Object |
            ExpectedType::String => "return result;".to_string(),
            ExpectedType::Number => formatdoc! {
            r#"
                if (Number.isNaN(result)) {{ return {{ '{0}': 'NaN' }}; }}
                if (result === Infinity) {{ return {{ '{0}': 'Infinity' }}; }}
                if (result === -Infinity) {{ return {{ '{0}': '-Infinity' }};
                return result;
            "#, self.special_field_name},
            ExpectedType::None => format!("return {{ '{}': 'undefined' }};", self.special_field_name),
        }
    }
}