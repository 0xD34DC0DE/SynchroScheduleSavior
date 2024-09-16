use anyhow::{anyhow, Result};
use serde::Serialize;
use std::io::Write;

use super::ejson::{EJSONFormatter, EJSON};

#[derive(Debug, Serialize)]
pub(super) struct InjectorCall {
    initiator_label: String,
    injection_id: String,
    #[serde(rename = "fn")]
    _fn: EJSON,

    // Since all other fields can be serialized without special handling, this field is skipped
    // and will be manually serialized to add the wrapping function.
    #[serde(skip)]
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
        let buf = "try{__INJECTOR__(".as_bytes().to_vec();

        let mut serializer = serde_json::Serializer::with_formatter(buf, EJSONFormatter);
        self.serialize(&mut serializer)?;
        
        let mut buf = serializer.into_inner();
        buf.pop().ok_or(anyhow!("Failed to serialize"))?;// Remove closing bracket from the end
        
        buf.write_all(b",\"args\": () => ")?;
        let mut serializer = serde_json::Serializer::with_formatter(buf, EJSONFormatter);
        self.args.serialize(&mut serializer)?;
        
        let mut buf = serializer.into_inner();
        buf.write_all(b"});}catch(e){console.error(e);}")?;

        Ok(String::from_utf8(buf)?)
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use super::*;

    #[test]
    fn to_js() {
        let initiator_label = "a";
        let injection_id = "b".to_string();
        let _fn = EJSON::Value(Value::Null);
        let args = EJSON::Array(vec![EJSON::Value(Value::String("test".to_string()))]);

        let injector_call = InjectorCall::new(initiator_label, injection_id, _fn, args);

        let expected_result = r#"__INJECTOR__({"initiator":"a","injection_id":"b","fn":null,"args": () => ["test"]});"#;
        let result = injector_call.to_js().unwrap();

        assert_eq!(result, expected_result);
    }
}
