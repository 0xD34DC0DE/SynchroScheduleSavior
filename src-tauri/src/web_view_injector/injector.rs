use tauri::{Manager, Runtime};
use tauri::window::Window;
use anyhow::{Context, Result};
use crate::web_view_injector::injection_args::InjectionArgs;
use crate::web_view_injector::inter_webview_promise::PromiseHandle;
use crate::web_view_injector::state::StateManagerExtInternal;

const INJECTION_EVENT_NAME_PREFIX: &'static str = "injection";
const INJECTOR_VAR_NAME: &'static str = "__INJECTOR__";

trait WindowInjectorExtInternal<R: Runtime> {
    fn inject(&self, promise_handle: &PromiseHandle, injection_args: InjectionArgs) -> Result<()>;
}

impl<R: Runtime> WindowInjectorExtInternal<R> for Window<R> {
    fn inject(&self, promise_handle: &PromiseHandle, injection_args: InjectionArgs) -> Result<()> {
        let formatted_injection = format_injection(promise_handle, injection_args)?;
        self.eval(&formatted_injection).context("Failed to 'eval' script")?;
        Ok(())
    }
}

pub trait WindowInjectorExt<R: Runtime> {
    fn inject_into(&self, window: &Window<R>, injection_args: InjectionArgs) -> Result<&PromiseHandle>;
    async fn await_injection(&self, handle: &PromiseHandle) -> Result<String>;
    async fn cancel_injection(&self, handle: &PromiseHandle) -> Result<()>;
}

impl<R: Runtime> WindowInjectorExt<R> for Window<R> {
    fn inject_into(&self, target: &Window<R>, injection_args: InjectionArgs) -> Result<&PromiseHandle> {
        let handle = self.get_state().make_promise(target, INJECTION_EVENT_NAME_PREFIX)?;
        target.inject(handle, injection_args)?;
        Ok(handle)
    }

    async fn await_injection(&self, handle: &PromiseHandle) -> Result<String> {
        todo!()
    }

    async fn cancel_injection(&self, handle: &PromiseHandle) -> Result<()> {
        todo!()
    }
}

fn format_injection(promise_handle: &PromiseHandle, injection_args: InjectionArgs) -> Result<String> {
    let fn_args = serde_json::to_string(&injection_args.js_args.unwrap_or_default())
        .context("Failed to serialize JS function arguments")?;
    Ok(
        format!("window.{}('{}', {}, {});",
                INJECTOR_VAR_NAME,
                promise_handle,
                injection_args.js_function,
                fn_args
        )
    )
}
