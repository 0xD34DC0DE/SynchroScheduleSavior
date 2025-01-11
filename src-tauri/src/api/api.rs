use crate::api::model::{
    sql, CourseLoader, CourseRequirementsLoader, CreditBlockLoader, ExamLoader, ScheduleGapLoader,
    SectionLoader, SemesterLoader, TimeSlotLoader,
};
use anyhow::{anyhow, Result};
use std::path::Path;
use tauri_plugin_graphql::async_graphql::connection::EmptyFields;
use tauri_plugin_graphql::async_graphql::{EmptyMutation, EmptySubscription, Schema};

pub async fn init(db_path: &Path) -> Result<Schema<EmptyFields, EmptyMutation, EmptySubscription>> {
    let db_path = db_path.to_str().ok_or_else(|| anyhow!("Invalid path"))?;
    let pool = sql::init(db_path).await?;

    Ok(Schema::build(EmptyFields, EmptyMutation, EmptySubscription)
        .data(SemesterLoader::new(pool.clone()))
        .data(CreditBlockLoader::new(pool.clone()))
        .data(CourseLoader::new(pool.clone()))
        .data(CourseRequirementsLoader::new(pool.clone()))
        .data(SectionLoader::new(pool.clone()))
        .data(TimeSlotLoader::new(pool.clone()))
        .data(ScheduleGapLoader::new(pool.clone()))
        .data(ExamLoader::new(pool.clone()))
        .finish())
}
