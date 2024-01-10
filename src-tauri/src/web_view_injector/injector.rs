use tauri::{Manager, Runtime};
use tauri::window::Window;
use anyhow::{anyhow, Context, Result};
use crate::web_view_injector::injection_args::InjectionArgs;
use crate::web_view_injector::inter_webview_promise::{InterWebviewPromise, InterWebviewPromiseHandles};
use crate::web_view_injector::state::StateManagerExtInternal;

const INJECTION_EVENT_NAME_PREFIX: &'static str = "injection";
const INJECTOR_VAR_NAME: &'static str = "__INJECTOR__";

trait WindowInjectorExtInternal<R: Runtime> {
    fn inject(&self, injection_args: InjectionArgs) -> Result<()>;
}

impl<R: Runtime> WindowInjectorExtInternal<R> for Window<R> {
    fn inject(&self, injection_args: InjectionArgs) -> Result<()> {
        self.eval(script).context("Failed to 'eval' script")?;
        todo!()
    }
}

pub trait WindowInjectorExt<R: Runtime> {
    fn inject_into(&self, window: &Window<R>, injection_args: InjectionArgs) -> Result<&InterWebviewPromiseHandles>;
}

impl<R: Runtime> WindowInjectorExt<R> for Window<R> {
    fn inject_into(&self, target: &Window<R>, injection_args: InjectionArgs) -> Result<&InterWebviewPromiseHandles> {
        let handles = self.get_state().make_promise(target, INJECTION_EVENT_NAME_PREFIX)?;
        target.inject(injection_args)?;
        Ok(handles)
    }
}

fn format_injection(return_event_name: &str, injection_args: InjectionArgs) -> Result<String> {
    let fn_args = serde_json::to_string(&injection_args.js_args.unwrap_or_default())
        .context("Failed to serialize JS function arguments")?;
    Ok(
        format!("window.{}('{}', {}, {});",
                INJECTOR_VAR_NAME,
                return_event_name,
                injection_args.js_function,
                fn_args
        )
    )
}
