use std::fmt::{Display, Formatter};
use std::time::Duration;
use anyhow::{anyhow, Context, Result};
use rand::Rng;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{EventHandler, Runtime, Window};
use tokio::sync::oneshot::{self, Receiver};
use tokio::time::timeout;

#[derive(Debug)]
pub struct InterWebviewPromise {
    target_receiver: Receiver<Result<String>>,
    target_listener: EventHandler,
    timeout: Duration,
    handle: PromiseHandle,
}

impl InterWebviewPromise {
    pub fn new<R: Runtime>(target: &Window<R>, event_name_prefix: &'static str, timeout: Duration) -> Self {
        let handle = PromiseHandle::new(event_name_prefix);

        let (target_sender, target_receiver) = oneshot::channel();
        let target_listener = target.once(handle.as_ref(), move |event| {
            if target_sender.is_closed() { return; }
            target_sender.send(
                event
                    .payload()
                    .map(|payload| payload.to_string())
                    .ok_or(anyhow!("No payload in event"))
            ).expect("Failed to send result to initiator");
        });

        Self {
            target_receiver,
            target_listener,
            timeout,
            handle,
        }
    }

    pub fn handle(&self) -> &PromiseHandle {
        &self.handle
    }

    pub async fn await_result(self) -> Result<Value> {
        let result = match timeout(self.timeout, self.target_receiver).await {
            Ok(r) => r.context("Result channel closed unexpectedly")?,
            Err(_) => Err(anyhow!("Promise timeout")),
        }.context("Failed to get result from promise")?;
        serde_json::from_str::<Value>(&result).context("Failed to deserialize result")
    }

    pub async fn cancel(self, target: &Window) {
        let cancel_event_name = format!("cancel-{}", self.handle);
        target.emit(&cancel_event_name, Value::Null).expect("Failed to emit cancel event");
        self.await_result().await.expect("Failed to await result");
    }
}

#[derive(Debug, Clone, Eq, PartialEq, Hash, Serialize, Deserialize)]
pub struct PromiseHandle(String);

impl PromiseHandle {
    pub fn new(event_name_prefix: &'static str) -> Self {
        let rng = rand::thread_rng().gen::<u16>();
        Self(
            format!("{}-{:x}", event_name_prefix, rng)
        )
    }
}

impl AsRef<str> for PromiseHandle {
    fn as_ref(&self) -> &str {
        self.0.as_ref()
    }
}

impl Display for PromiseHandle {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", &self.0)
    }
}
