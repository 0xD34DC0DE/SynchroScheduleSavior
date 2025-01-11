use crate::api::model::{
    sql, graphql::{create_schema, Schema},
};
use anyhow::{anyhow, Result};
use std::path::Path;

pub async fn init(db_path: &Path) -> Result<Schema> {
    let db_path = db_path.to_str().ok_or_else(|| anyhow!("Invalid path"))?;
    let pool = sql::init(db_path).await?;

    
    Ok(create_schema( &pool))
}
