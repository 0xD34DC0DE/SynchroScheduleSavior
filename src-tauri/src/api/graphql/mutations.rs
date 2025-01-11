use async_graphql::{Context, Object, Result as GraphQLResult};
use super::objects::*;
use super::input_objects::*;
use chrono::NaiveDate;

type Pool = sqlx::Pool<sqlx::Sqlite>;

struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn create_semester(&self, ctx: &Context<'_>, input: SemesterInput) -> GraphQLResult<Semester> {
        let pool = ctx.data::<Pool>()?;
        let mut conn = pool.acquire().await?;
        
        let semester_id = input.id();

        let semester = sqlx::query_as!(
            Semester,
            /*language=SQLite*/
            r#"
            INSERT INTO semesters (id, name, year, start_date, end_date)
            VALUES (?, ?, ?, ?, ?)
            RETURNING id, name, year, start_date as "start_date: NaiveDate", end_date as "end_date: NaiveDate"
            "#,
            semester_id,
            input.name,
            input.year,
            input.start_date,
            input.end_date,
        )
        .fetch_one(&mut *conn)
        .await?;

        Ok(semester)
    }
}