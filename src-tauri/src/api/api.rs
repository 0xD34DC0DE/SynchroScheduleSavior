use crate::api::database::{Database, TableDefinition};
use crate::api::model::{
    Course, CourseRequirements, CreditBlock, Exam, ScheduleGap, Section, Semester, SQLiteLoader,
    TimeSlot,
};
use anyhow::{anyhow, Result};
use std::path::Path;
use tauri_plugin_graphql::async_graphql::connection::EmptyFields;
use tauri_plugin_graphql::async_graphql::{EmptyMutation, EmptySubscription, Schema};

pub async fn init(db_path: &Path) -> Result<Schema<EmptyFields, EmptyMutation, EmptySubscription>> {
    let db_path = db_path.to_str().ok_or_else(|| anyhow!("Invalid path"))?;
    let db = Database::new(
        db_path,
        vec![
            Semester::get_table_definition(),
            Course::get_table_definition(),
            CourseRequirements::get_table_definition(),
            CreditBlock::get_table_definition(),
            Section::get_table_definition(),
            TimeSlot::get_table_definition(),
            ScheduleGap::get_table_definition(),
            Exam::get_table_definition(),
        ],
    )
    .await?;

    Ok(Schema::build(EmptyFields, EmptyMutation, EmptySubscription)
        .data(SQLiteLoader::new(db.pool().clone()))
        .finish())
}
