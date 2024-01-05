use std::time::Duration;
use serde::{Deserialize, Deserializer};
use serde_json::Value;

#[derive(Debug, Deserialize)]
pub struct InjectionArgs {
    injection_target: String,
    js_function: String,
    js_args: Option<Vec<Value>>,
    #[serde(deserialize_with = "from_duration_str")]
    execution_timeout: Duration,
}

fn from_duration_str<'de, D>(deserializer: D) -> Result<Duration, D::Error>
    where
        D: Deserializer<'de>,
{
    let s: &str = Deserialize::deserialize(deserializer)?;
    if s.ends_with("ms") {
        let s = s.trim_end_matches("ms");
        let millis: u64 = s.parse().map_err(serde::de::Error::custom)?;
        Ok(Duration::from_millis(millis))
    } else if s.ends_with('s') {
        let s = s.trim_end_matches('s');
        let secs: u64 = s.parse().map_err(serde::de::Error::custom)?;
        Ok(Duration::from_secs(secs))
    } else {
        Err(serde::de::Error::custom("Invalid duration format"))
    }
}
