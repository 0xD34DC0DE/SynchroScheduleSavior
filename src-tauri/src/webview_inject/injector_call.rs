use std::io::Write;
use anyhow::Result;
use serde::Serialize;

use super::ejson::{EJSON, EJSONFormatter};

#[derive(Debug, Serialize)]
pub(super) struct InjectorCall {
    #[serde(rename = "initiator")]
    initiator_label: String,
    injection_id: String,
    #[serde(rename = "fn")]
    _fn: EJSON,
    args: EJSON,
}

impl InjectorCall {
    pub(super) fn new(
        initiator_label: &str,
        injection_id: String,
        _fn: EJSON,
        args: EJSON,
    ) -> Self {
        Self {
            initiator_label: initiator_label.to_string(),
            injection_id,
            _fn,
            args,
        }
    }

    pub(super) fn to_js(&self) -> Result<String> {
        let buf = "__INJECTOR__(".as_bytes().to_vec();
        
        let mut serializer = serde_json::Serializer::with_formatter(
            buf,
            EJSONFormatter,
        );
        self.serialize(&mut serializer)?;
        
        let mut buf = serializer.into_inner();
        buf.write_all(b");")?;
        
        Ok(String::from_utf8(buf)?)
    }
}
