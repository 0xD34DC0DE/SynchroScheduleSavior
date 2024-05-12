use std::{fmt, io};
use std::collections::{HashMap, HashSet};
use std::io::Write;
use std::sync::Mutex;

use serde::{Deserialize, Deserializer, Serialize};
use serde::de::{Error, MapAccess, SeqAccess, Unexpected, Visitor};
use serde_json::ser::Formatter;
use serde_json::Value;
use serde_json::value::{RawValue, to_raw_value};

/// EJSON, or Escaped JSON, is a JSON value where objects with a specific structure represent
/// values that have been serialized as strings to be able to be serialized as JSON.
#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum EJSON {
    // A normal JSON value, anything that isn't an escaped value.
    Value(Value),

    // Container types to make the enum recursive since escaped values might be nested.
    Object(HashMap<String, EJSON>),
    Array(Vec<EJSON>),

    // Escaped represents values that have been serialized as
    // strings to be able to be serialized as JSON.
    Escaped(EscapedString),
}

#[derive(Debug, Serialize)]
pub(self) struct EscapedString(Box<RawValue>);

impl PartialEq for EscapedString {
    fn eq(&self, other: &Self) -> bool {
        self.0.get().eq(other.0.get())
    }
}

impl TryFrom<&str> for EscapedString {
    type Error = serde_json::Error;
    fn try_from(value: &str) -> Result<Self, Self::Error> {
        Ok(EscapedString(to_raw_value(value)?))
    }
}

thread_local! {
    // This set, stores the pointers of the strings that have been escaped.
    // This serves as a way to do in-band signaling to the formatter.
    // Pointers are used since we only need to compare identity and not the content.
    static ESCAPED_STRINGS_HANDLES: Mutex<HashSet<*const str>> = Mutex::new(HashSet::new());
}

/// Formatter for escaped JSON values.
/// 
/// This formatter is used when serializing EJSON values to JSON.
/// Without this formatter, the escaped values would be serialized as strings.
/// Normally, a fully custom serializer should be used to handle this, but since the target
/// is JSON, we can take advantage of serde_json's formatter which exposes its writer and
/// write the escaped values without quotes (otherwise they would be serialized as strings) 
/// in a much simpler manner.
pub(super) struct EJSONFormatter;

impl Formatter for EJSONFormatter {
    fn write_raw_fragment<W>(&mut self, writer: &mut W, fragment: &str) -> io::Result<()> where W: ?Sized + Write {
        ESCAPED_STRINGS_HANDLES.with(|handles| {
            let mut handles = handles.lock().unwrap();
            let ptr: *const str = fragment;
            
            if handles.remove(&ptr) {
                writer.write_all(fragment[1..fragment.len() - 1].as_bytes())?;
            } else {
                writer.write_all(fragment.as_bytes())?;
            }
            
            Ok(())
        })
    }
}

// A visitor for deserializing JSON into EJSON values.
//
// The visitor does nothing special for normal JSON values, it just returns them as is.
// For maps, however, they can either be an escaped value or a normal map.
// Escaped values are maps with a single key-value pair and where the key is a magic value. 
struct EJSONVisitor;

impl<'de> Visitor<'de> for EJSONVisitor {
    type Value = EJSON;

    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        formatter.write_str("an object or an encoded value")
    }

    fn visit_bool<E>(self, v: bool) -> Result<Self::Value, E> where E: Error {
        Ok(EJSON::Value(Value::Bool(v)))
    }

    fn visit_i64<E>(self, v: i64) -> Result<Self::Value, E> where E: Error {
        Ok(EJSON::Value(Value::Number(v.into())))
    }

    fn visit_u64<E>(self, v: u64) -> Result<Self::Value, E> where E: Error {
        Ok(EJSON::Value(Value::Number(v.into())))
    }

    fn visit_f64<E>(self, v: f64) -> Result<Self::Value, E> where E: Error {
        Ok(EJSON::Value(Value::from(v)))
    }

    fn visit_str<E>(self, v: &str) -> Result<Self::Value, E> where E: Error {
        Ok(EJSON::Value(Value::String(v.to_string())))
    }

    fn visit_string<E>(self, v: String) -> Result<Self::Value, E> where E: Error {
        Ok(EJSON::Value(Value::String(v)))
    }

    fn visit_none<E>(self) -> Result<Self::Value, E> where E: Error {
        Ok(EJSON::Value(Value::Null))
    }

    fn visit_some<D>(self, deserializer: D) -> Result<Self::Value, D::Error> where D: Deserializer<'de> {
        Deserialize::deserialize(deserializer)
    }

    fn visit_unit<E>(self) -> Result<Self::Value, E> where E: Error {
        Ok(EJSON::Value(Value::Null))
    }

    fn visit_seq<V>(self, mut visitor: V) -> Result<Self::Value, V::Error> where V: SeqAccess<'de> {
        let mut values = Vec::new();
        while let Some(value) = visitor.next_element::<Self::Value>()? {
            values.push(value);
        }
        Ok(EJSON::Array(values))
    }

    fn visit_map<V>(self, mut visitor: V) -> Result<Self::Value, V::Error> where V: MapAccess<'de> {
        let first = visitor.next_entry::<String, EJSON>()?;

        if first.is_none() {
            return Ok(EJSON::Object(HashMap::new()));
        }

        let second = visitor.next_entry::<String, EJSON>()?;
        if second.is_some() {
            let mut values = HashMap::from([first.unwrap(), second.unwrap()]);
            while let Some((key, value)) = visitor.next_entry()? {
                values.insert(key, value);
            }

            return Ok(EJSON::Object(values));
        }

        let (key, value) = first.unwrap();

        match (key.as_str(), value) {
            ("_!_", value) => {
                match value {
                    EJSON::Value(Value::String(str)) => {
                        let escaped =  
                            EscapedString::try_from(str.as_str()).map_err(Error::custom)?;
                        
                        let ptr: *const str = escaped.0.get();
                        
                        ESCAPED_STRINGS_HANDLES.with(|handles| {
                            let mut handles = handles.lock().unwrap();
                            handles.insert(ptr);
                        });
                        
                        Ok(EJSON::Escaped(escaped))
                    }
                    _ => {
                        Err(Error::invalid_value(Unexpected::Other("not a string"), &"a string"))
                    }
                }
            }
            (_, value) => {
                Ok(EJSON::Object(HashMap::from([(key, value)])))
            }
        }
    }
}

impl<'de> Deserialize<'de> for EJSON {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
        where
            D: Deserializer<'de>,
    {
        deserializer.deserialize_any(EJSONVisitor)
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    #[test]
    fn deserialize_value() {
        let data = json!(42);
        let arg: EJSON = serde_json::from_value(data).unwrap();
        println!("Deserialized value: {:?}", arg);
        match arg {
            EJSON::Value(Value::Number(n)) => assert_eq!(n.as_i64().unwrap(), 42),
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn deserialize_object() {
        let data = json!({"key": "value"});
        let arg: EJSON = serde_json::from_value(data).unwrap();
        println!("Deserialized object: {:?}", arg);
        match arg {
            EJSON::Object(map) => {
                assert_eq!(map.len(), 1);
                match map.get("key") {
                    Some(EJSON::Value(Value::String(s))) => assert_eq!(s, "value"),
                    _ => panic!("Unexpected variant"),
                }
            }
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn deserialize_array() {
        let data = json!([1, 2, 3]);
        let arg: EJSON = serde_json::from_value(data).unwrap();
        println!("Deserialized array: {:?}", arg);
        match arg {
            EJSON::Array(arr) => {
                assert_eq!(arr.len(), 3);
                for (i, arg) in arr.into_iter().enumerate() {
                    match arg {
                        EJSON::Value(Value::Number(n)) =>
                            assert_eq!(n.as_i64().unwrap(), i as i64 + 1),
                        _ => panic!("Unexpected variant"),
                    }
                }
            }
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn deserialize_function() {
        let data = json!({"_!_": "myFunc"});
        let arg: EJSON = serde_json::from_value(data).unwrap();
        println!("Deserialized function: {:?}", arg);
        match arg {
            EJSON::Escaped(s) =>
                assert_eq!(s, EscapedString::try_from("myFunc").unwrap()),
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn deserialize_invalid_function() {
        let data = json!({"_!_": 42});
        let result: Result<EJSON, _> = serde_json::from_value(data);
        println!("Deserialization result for invalid function: {:?}", result);
        assert!(result.is_err());
    }

    #[test]
    fn deserialize_empty_object() {
        let data = json!({});
        let arg: EJSON = serde_json::from_value(data).unwrap();
        println!("Deserialized empty object: {:?}", arg);
        match arg {
            EJSON::Object(map) => assert_eq!(map.len(), 0),
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn deserialize_empty_array() {
        let data = json!([]);
        let arg: EJSON = serde_json::from_value(data).unwrap();
        println!("Deserialized empty array: {:?}", arg);
        match arg {
            EJSON::Array(arr) => assert_eq!(arr.len(), 0),
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn deserialize_null() {
        let data = json!(null);
        let arg: EJSON = serde_json::from_value(data).unwrap();
        println!("Deserialized null: {:?}", arg);
        match arg {
            EJSON::Value(Value::Null) => (),
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn deserialize_bool() {
        let data = json!(true);
        let arg: EJSON = serde_json::from_value(data).unwrap();
        println!("Deserialized bool: {:?}", arg);
        match arg {
            EJSON::Value(Value::Bool(b)) => assert_eq!(b, true),
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn deserialize_string() {
        let data = json!("hello");
        let arg: EJSON = serde_json::from_value(data).unwrap();
        println!("Deserialized string: {:?}", arg);
        match arg {
            EJSON::Value(Value::String(s)) => assert_eq!(s, "hello"),
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn deserialize_empty_string() {
        let data = json!("");
        let arg: EJSON = serde_json::from_value(data).unwrap();
        println!("Deserialized empty string: {:?}", arg);
        match arg {
            EJSON::Value(Value::String(s)) => assert_eq!(s, ""),
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn deserialize_empty() {
        let data = json!("");
        let arg: EJSON = serde_json::from_value(data).unwrap();
        println!("Deserialized empty: {:?}", arg);
        match arg {
            EJSON::Value(Value::String(s)) => assert_eq!(s, ""),
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn deserialize_unit() {
        let data = json!(null);
        let arg: EJSON = serde_json::from_value(data).unwrap();
        println!("Deserialized unit: {:?}", arg);
        match arg {
            EJSON::Value(Value::Null) => (),
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn deserialize_nested() {
        let data = json!({
            "key": {"_!_": "func_1"},
            "array": [1, {"_!_": "func_2"}],
            "object": {
                "nested": {"_!_": "func_3"}
            }
        });
        let arg: EJSON = serde_json::from_value(data).unwrap();
        println!("Deserialized nested: {:?}", arg);
        match arg {
            EJSON::Object(map) => {
                assert_eq!(map.len(), 3);
                match map.get("key") {
                    Some(EJSON::Escaped(s)) =>
                        assert_eq!(*s, EscapedString::try_from("func_1").unwrap()),
                    _ => panic!("Unexpected variant"),
                }
                match map.get("array") {
                    Some(EJSON::Array(arr)) => {
                        assert_eq!(arr.len(), 2);
                        match &arr[0] {
                            EJSON::Value(Value::Number(n)) =>
                                assert_eq!(n.as_i64().unwrap(), 1),
                            _ => panic!("Unexpected variant"),
                        }
                        match &arr[1] {
                            EJSON::Escaped(s) =>
                                assert_eq!(*s, EscapedString::try_from("func_2").unwrap()),
                            _ => panic!("Unexpected variant"),
                        }
                    }
                    _ => panic!("Unexpected variant"),
                }
                match map.get("object") {
                    Some(EJSON::Object(inner)) => {
                        assert_eq!(inner.len(), 1);
                        match inner.get("nested") {
                            Some(EJSON::Escaped(s)) =>
                                assert_eq!(*s, EscapedString::try_from("func_3").unwrap()),
                            _ => panic!("Unexpected variant"),
                        }
                    }
                    _ => panic!("Unexpected variant"),
                }
            }
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn serialize_value() {
        let str = json!({
            "a": {"_!_": "console.log('Hello, World!');"}
        }).to_string();
        let arg: EJSON = serde_json::from_str(&str).unwrap();
        let mut serializer = serde_json::Serializer::with_formatter(Vec::new(), EJSONFormatter);
        arg.serialize(&mut serializer).unwrap();
        let serialized = String::from_utf8(serializer.into_inner()).unwrap();
        
        assert_eq!(serialized, "{\"a\":console.log('Hello, World!');}");
        
        println!("Serialized value: {}", serialized);
    }
}