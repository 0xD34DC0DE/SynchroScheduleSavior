use std::time::Duration;

use anyhow::{anyhow, Result};
use tauri::{Runtime, Window};
use tokio::sync::oneshot;
use tokio::time::timeout;

use super::ejson::EJSON;
use super::injector_call::InjectorCall;

pub struct InjectionArgs {
    pub id: u64,
    pub js_function: EJSON,
    pub function_args: EJSON,
}

impl InjectionArgs {
    pub fn new(id: u64, js_function: EJSON, function_args: EJSON) -> Self {
        Self {
            id,
            js_function,
            function_args,
        }
    }
}

pub struct InjectorA<'a, R: Runtime> {
    initiator: &'a Window<R>,
    args: Option<InjectionArgs>,
}

impl<'a, R: Runtime> InjectorA<'a, R> {
    pub(crate) async fn inject(self, target: Window<R>) -> Result<()> {
        let args = self.args.ok_or_else(|| anyhow!("missing args"))?;

        let injector_call = InjectorCall::new(
            self.initiator.label(),
            args.id.to_string(),
            args.js_function,
            args.function_args,
        );

        let js = injector_call.to_js()?;

        let (rx, tx) = oneshot::channel::<Option<()>>();

        let _event_handler = target.once(args.id.to_string(), move |event| {
            rx.send(event.payload().map(|_| ())).expect("Couldn't send injection done signal");
        });

        println!("Injecting: {}", js);

        target.eval(&js)?;

        match timeout(Duration::from_secs(10), tx).await {
            Err(_) => Err(anyhow!("Injection timed out")),
            Ok(Err(e)) => Err(anyhow!("Injection failed: {}", e)),
            Ok(Ok(None)) => Err(anyhow!("Injection failed: empty response")),
            Ok(Ok(Some(_))) => Ok(()),
        }
    }

    pub(crate) fn with_args(mut self, call_args: impl Into<InjectionArgs>) -> Self {
        self.args = Some(call_args.into());
        self
    }
}

pub trait AsInjector<'a, R: Runtime> {
    fn as_injector(&'a self) -> InjectorA<'a, R>;
}

impl<'a, R: Runtime> AsInjector<'a, R> for Window<R> {
    fn as_injector(&'a self) -> InjectorA<'a, R> {
        InjectorA {
            initiator: &self,
            args: None,
        }
    }
}
