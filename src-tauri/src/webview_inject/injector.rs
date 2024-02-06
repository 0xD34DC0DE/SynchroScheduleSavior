use anyhow::Result;
use serde_json::Value;
use tauri::Window;

pub async fn inject(target: Window,
                    initiator: Window,
                    injection_id: String,
                    js_function: String,
                    args: Option<Vec<Value>>) -> Result<()> {
    Injector::new(&target)
        .inject(
            initiator,
            injection_id,
            js_function.as_ref(),
            args,
        ).await
}


struct Injector<'a> {
    window: &'a Window,
}

impl<'a> Injector<'a> {
    pub fn new(window: &'a Window) -> Self {
        Self {
            window
        }
    }

    pub async fn inject(&mut self,
                        initiator: Window,
                        injection_id: String,
                        js_fn: &str,
                        args: Option<Vec<Value>>,
    ) -> Result<()> {
        let js =
            format!("__INJECTOR__('{}', {}, '{}', {})",
                    initiator.label(),
                    injection_id,
                    js_fn,
                    Self::make_args_array(args)
            );
        println!("Injecting: {}", js);

        self.window.eval(js.as_ref())?;

        Ok(())
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
