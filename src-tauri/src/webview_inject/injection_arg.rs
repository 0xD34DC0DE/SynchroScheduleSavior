use std::fmt;
use std::fmt::{Display, Formatter};
use serde_json::Value;

pub enum InjectionArg {
    Value(Value),
    Function(String),
}

impl From<Value> for InjectionArg {
    fn from(value: Value) -> Self {
        match value {
            Value::Object(map) => {
                match map.get("_fn_") {
                    Some(Value::String(s)) => InjectionArg::Function(s.clone()),
                    Some(_) => panic!("Invalid function value"),
                    _ => InjectionArg::Value(Value::Object(map)),
                }
            }
            _ => InjectionArg::Value(value),
        }
    }
}

impl Display for InjectionArg {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        match self {
            InjectionArg::Value(value) => write!(f, "{}", value),
            InjectionArg::Function(value) => write!(f, "{}", value),
        }
    }
}