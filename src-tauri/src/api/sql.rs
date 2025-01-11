use crate::api::graphql::objects::*;
use sqlx::query::Query;
use sqlx::sqlite::{SqliteArguments, SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{query, Executor, Pool, Sqlite};

pub(crate) async fn init(database_url: &str) -> anyhow::Result<Pool<Sqlite>> {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(
            SqliteConnectOptions::new()
                .filename(database_url)
                .create_if_missing(true),
        )
        .await?;

    let mut transaction = pool.begin().await?;
    transaction.execute("PRAGMA foreign_keys = ON;").await?;

    for table_definition in table_definitions() {
        transaction.execute(table_definition).await?;
    }

    transaction.commit().await?;

    Ok(pool)
}

fn table_definitions() -> Vec<TableDefinitionQuery> {
    vec![
        Semester::table_definition(),
        CreditBlock::table_definition(),
        Course::table_definition(),
        Section::table_definition(),
        CourseRequirements::table_definition(),
        TimeSlot::table_definition(),
        ScheduleGap::table_definition(),
        Exam::table_definition(),
    ]
}

type TableDefinitionQuery = Query<'static, Sqlite, SqliteArguments<'static>>;

trait SQLTable {
    fn table_definition() -> TableDefinitionQuery;
}

impl SQLTable for Semester {
    fn table_definition() -> TableDefinitionQuery {
        query!(
            /*language=SQLite*/
            "CREATE TABLE IF NOT EXISTS semesters (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                year INTEGER NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL
            );"
        )
    }
}

impl SQLTable for CreditBlock {
    fn table_definition() -> TableDefinitionQuery {
        query!(
            /*language=SQLite*/
            "CREATE TABLE IF NOT EXISTS credit_blocks (
                id TEXT PRIMARY KEY,
                semester_id TEXT NOT NULL,
                name TEXT NOT NULL,
                required_credits INTEGER NOT NULL,
                FOREIGN KEY(semester_id) REFERENCES semesters(id)
             );"
        )
    }
}

impl SQLTable for Course {
    fn table_definition() -> TableDefinitionQuery {
        query!(
            /*language=SQLite*/
            "CREATE TABLE IF NOT EXISTS courses (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                year_of_level INTEGER NOT NULL,
                level TEXT NOT NULL,
                subject TEXT NOT NULL,
                description TEXT NOT NULL,
                credit_block_id TEXT NOT NULL,
                semester_id TEXT NOT NULL,
                FOREIGN KEY(credit_block_id) REFERENCES credit_blocks(id),
                FOREIGN KEY(semester_id) REFERENCES semesters(id)
            );"
        )
    }
}

impl SQLTable for Section {
    fn table_definition() -> TableDefinitionQuery {
        query!(
            /*language=SQLite*/
            "CREATE TABLE IF NOT EXISTS sections (
                id TEXT PRIMARY KEY,
                course_id TEXT NOT NULL,
                main_section_id TEXT,
                section_type TEXT NOT NULL,
                object_type TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                teacher TEXT NOT NULL,
                location TEXT NOT NULL,
                is_open BOOLEAN NOT NULL,
                FOREIGN KEY(course_id) REFERENCES courses(id),
                FOREIGN KEY(main_section_id) REFERENCES sections(id)
            );"
        )
    }
}

impl SQLTable for CourseRequirements {
    fn table_definition() -> TableDefinitionQuery {
        query!(
            /*language=SQLite*/
            "CREATE TABLE IF NOT EXISTS course_requirements (
                id TEXT PRIMARY KEY REFERENCES courses(id),
                prerequisites_expr TEXT,
                corequisites_expr TEXT
            );"
        )
    }
}

impl SQLTable for TimeSlot {
    fn table_definition() -> TableDefinitionQuery {
        query!(
            /*language=SQLite*/
            "CREATE TABLE IF NOT EXISTS time_slots (
                id INTEGER PRIMARY KEY,
                section_id TEXT NOT NULL,
                day_of_week TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                location TEXT NOT NULL,
                FOREIGN KEY(section_id) REFERENCES sections(id)
            );"
        )
    }
}

impl SQLTable for ScheduleGap {
    fn table_definition() -> TableDefinitionQuery {
        query!(
            /*language=SQLite*/
            "CREATE TABLE IF NOT EXISTS schedule_gaps (
                id INTEGER PRIMARY KEY,
                section_id TEXT NOT NULL,
                date TEXT NOT NULL,
                reason TEXT NOT NULL,
                FOREIGN KEY(section_id) REFERENCES sections(id)
            );"
        )
    }
}

impl SQLTable for Exam {
    fn table_definition() -> TableDefinitionQuery {
        query!(
            /*language=SQLite*/
            "CREATE TABLE IF NOT EXISTS exams (
                id INTEGER PRIMARY KEY,
                section_id TEXT NOT NULL,
                exam_type TEXT NOT NULL,
                date TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                location TEXT NOT NULL,
                FOREIGN KEY(section_id) REFERENCES sections(id)
            );"
        )
    }
}
