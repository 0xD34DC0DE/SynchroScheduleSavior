use tauri::{AppHandle, generate_handler, Manager, PageLoadPayload, RunEvent, Runtime, Window, WindowEvent};
use tauri::plugin::{Builder as PluginBuilder, TauriPlugin};

use crate::web_view_injector::state::{StateManagerExtInternal, WebviewInjectorStateType};

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    PluginBuilder::new("webview_injector")
        .invoke_handler(generate_handler![])
        .on_event(|app_handle, run_event| app_handle.on_event(run_event))
        .on_page_load(|window, payload| window.on_page_load(payload))
        .on_webview_ready(|window| window.on_webview_ready())
        .setup(|app_handle| {
            app_handle.manage(WebviewInjectorStateType::<R>::default());
            Ok(())
        })
        .build()
}

trait AppHandleExtInternal {
    fn on_event(&self, run_event: &RunEvent);
    fn unregister_window(&self, label: &str);
}

impl<R: Runtime> AppHandleExtInternal for AppHandle<R> {
    fn on_event(&self, run_event: &RunEvent) {
        if let RunEvent::WindowEvent { label, event, .. } = run_event {
            match event {
                WindowEvent::CloseRequested { .. } |
                WindowEvent::Destroyed => {
                    self.unregister_window(label);
                }
                _ => {}
            }
        }
    }

    fn unregister_window(&self, label: &str) {
        let mut state = self.get_state();
        if state.is_window_registered(label) {
            state.unregister_window(label);
        }
    }
}

trait WindowExtInternal {
    fn on_page_load(&self, payload: PageLoadPayload);
    fn on_webview_ready(self);
}

impl<R: Runtime> WindowExtInternal for Window<R> {
    fn on_page_load(&self, payload: PageLoadPayload) {
        let state = self.get_state();
        if state.is_window_registered(self.label()) {
           todo!();
        }
    }

    fn on_webview_ready(self) {
        let mut state = self.get_state();
        if state.is_window_registered(self.label()) {
            state.set_window_ready(self);
        }
    }
}
