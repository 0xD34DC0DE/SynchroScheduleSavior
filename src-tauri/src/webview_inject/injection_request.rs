use serde::Deserialize;

use super::injector::InjectionArgs;
use super::ejson::EJSON;

#[derive(Debug, Deserialize)]
pub struct InjectionRequest {
    injection_id: u64,
    allow_parallel: bool,
    js_function: EJSON,
    function_args: Option<EJSON>,
}

impl InjectionRequest {
    pub(crate) fn allow_parallel(&self) -> bool {
        self.allow_parallel
    }
}

impl InjectionRequest {
    //TODO: remove allow dead_code when tests are implemented
    #[allow(dead_code)]
    pub(self) fn new(
        injection_id: u64,
        allow_parallel: bool,
        js_function: EJSON,
        function_args: Option<EJSON>,
    ) -> Self {
        Self {
            injection_id,
            allow_parallel,
            js_function,
            function_args,
        }
    }
}

impl Into<InjectionArgs> for InjectionRequest {
    fn into(self) -> InjectionArgs {
        InjectionArgs::new(
            self.injection_id,
            self.js_function,
            self.function_args.unwrap_or(
                EJSON::Value(serde_json::Value::Array(vec![]))
            ),
        )
    }
}

// #[cfg(test)]
// mod tests {
//     use serde_json::json;
//     use tauri;
//     use tauri::{InvokeError, WindowBuilder, WindowUrl};
//     use tauri::test::{self, mock_context, noop_assets};
// 
//     use super::*;
// 
//     struct TestError(anyhow::Error);
// 
//     type TestResult<T> = Result<T, TestError>;
// 
//     impl Into<InvokeError> for TestError {
//         fn into(self) -> InvokeError {
//             InvokeError::from_anyhow(self.0)
//         }
//     }
// 
//     impl<E> From<E> for TestError
//         where E: Into<anyhow::Error>
//     {
//         fn from(error: E) -> Self {
//             Self(error.into())
//         }
//     }
// 
//     #[test]
//     fn deserialize() -> Result<()> {
//         let app = test::mock_builder()
//             .invoke_handler(tauri::generate_handler![test_e2e])
//             .build(mock_context(noop_assets()))?;
// 
//         WindowBuilder::new(&app, "main", WindowUrl::App("index.html".into()))
//             .build()?;
//         WindowBuilder::new(&app, "target", WindowUrl::App("index.html".into()))
//             .build()?;
// 
//         let window = app.get_window("main").unwrap();
// 
//         let mut expected = json!({
//                 "initiator_label": "main",
//                 "injection_id": "1",
//                 "js_function": "#",
//                 "function_args": [42]
//         });
// 
//         test::assert_ipc_response(
//             &window,
//             tauri::InvokePayload {
//                 cmd: "test_e2e".into(),
//                 tauri_module: None,
//                 callback: tauri::api::ipc::CallbackFn(0),
//                 error: tauri::api::ipc::CallbackFn(1),
//                 inner: json!({
//                     "target_window": "main",
//                     "injection_id": 1,
//                     "allow_parallel": true,
//                     "js_function": "function() { return 42; }",
//                     "function_args": [42]
//                 }),
//             },
//             Ok(),
//         );
// 
//         Ok(())
//     }
// 
//     #[tauri::command]
//     fn test_e2e<R>(json: String, app_handle: AppHandle<R>) -> TestResult<String>
//         where R: tauri::Runtime
//     {
//         let mut injection: InjectionRequest = serde_json::from_str(json.as_str())?;
// 
//         injection.resolve_target(app_handle)?;
// 
//         Ok(injection)
//     }
// }