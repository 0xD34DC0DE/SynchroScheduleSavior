use tauri::Runtime;
use tauri::window::Window;
use anyhow::{Context, Result};

const INJECTION_EVENT_NAME_PREFIX: &'static str = "injection";

pub trait WindowInjectorExt<R: Runtime> {
    fn inject(&self, script: &str) -> Result<()>;
}

impl<R: Runtime> WindowInjectorExt<R> for Window<R> {
    fn inject(&self, script: &str) -> Result<()> {
        self.eval(script).context("Failed to 'eval' script")?;
        todo!();
    }
}