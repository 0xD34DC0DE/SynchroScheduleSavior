use anyhow::{anyhow, Result};
use rand::Rng;
use serde::{Deserialize, Serialize};
use tauri::{EventHandler, Runtime, Window};
use tokio::sync::oneshot::{self, Receiver};

pub struct InterWebviewPromise {
    target_receiver: Receiver<Result<String>>,
    target_listener: EventHandler,
    handles: InterWebviewPromiseHandles,
}

impl InterWebviewPromise {
    pub fn new<R: Runtime>(target: &Window<R>, event_name_prefix: &'static str) -> Self {
        let handles = InterWebviewPromiseHandles::new(event_name_prefix);

        let (target_sender, target_receiver) = oneshot::channel();
        let target_listener = target.once(handles.result.as_ref(), move |event| {
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
            handles,
        }
    }

    pub fn handles(&self) -> &InterWebviewPromiseHandles {
        &self.handles
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromiseEventHandle(String);

impl PromiseEventHandle {
    pub fn new(event_name: String) -> Self {
        Self(event_name)
    }
}

impl AsRef<str> for PromiseEventHandle {
    fn as_ref(&self) -> &str {
        self.0.as_ref()
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct InterWebviewPromiseHandles {
    pub result: PromiseEventHandle,
    pub cancel: PromiseEventHandle,
}

impl InterWebviewPromiseHandles {
    pub fn new(prefix: &'static str) -> Self {
        let rng = rand::thread_rng().gen::<u16>();
        Self {
            result: PromiseEventHandle::new(format!("{}-{:x}", prefix, rng)),
            cancel: PromiseEventHandle::new(format!("{}-cancel-{:x}", prefix, rng)),
        }
    }
}
