use std::time::Duration;
use tokio::sync::oneshot::Receiver;
use anyhow::Result;
use rand::Rng;

pub struct InterWebviewPromise {
    webview_receiver: Receiver<Result<String>>,
    result_receiver: Receiver<Result<String>>,
    timeout: Duration,
    // Need another Receiver to hold the result until the front-end requests it
    // Need another since the first one might receive nothing (timeout) and we still need
    // something to hold onto that error (or success) until the front-end requests it
}

impl InterWebviewPromise {
    pub fn new(event_name_prefix: &'static str) -> Self {
        todo!()
    }
}

struct UniqueEventsName {
    pub result: String,
    pub cancel: String,
}

impl UniqueEventsName {
    pub fn new(prefix: &'static str) -> Self {
        let rng = rand::thread_rng().gen::<u16>();
        Self {
            result: format!("{}-{:x}", prefix, rng),
            cancel: format!("{}-cancel-{:x}", prefix, rng),
        }
    }
}
