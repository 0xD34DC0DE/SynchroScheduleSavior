use std::clone::Clone;
use super::objects::*;
use crate::api::graphql::loaders::SemesterLoader;
use crate::api::graphql::loaders::{
    CourseLoader, CourseRequirementsLoader, CreditBlockLoader, ExamLoader, ScheduleGapLoader,
    SectionLoader, TimeSlotLoader,
};
use async_graphql::dataloader::DataLoader;
use async_graphql::{Context, Object, Result as GraphQLResult};
use chrono::{NaiveDate, NaiveTime};
use sqlx::Sqlite;
use std::collections::HashMap;

type Pool = sqlx::Pool<Sqlite>;

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn semesters(&self, ctx: &Context<'_>) -> GraphQLResult<Vec<Semester>> {
        let pool = ctx.data::<Pool>()?;
        let mut conn = pool.acquire().await?;

        let semesters = sqlx::query_as!(
            Semester,
            /*language=SQLite*/
            r#"
            SELECT
                id,
                name,
                year,
                start_date as "start_date: NaiveDate",
                end_date as "end_date: NaiveDate"
            FROM semesters
            "#,
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(semesters)
    }

    async fn semester(&self, ctx: &Context<'_>, id: SemesterId) -> GraphQLResult<Option<Semester>> {
        ctx.data::<DataLoader<SemesterLoader>>()?.load_one(id).await
    }

    async fn credit_blocks(&self, ctx: &Context<'_>) -> GraphQLResult<Vec<CreditBlock>> {
        let pool = ctx.data::<Pool>()?;
        let mut conn = pool.acquire().await?;

        let credit_blocks = sqlx::query_as!(
            CreditBlock,
            /*language=SQLite*/
            r#"
            SELECT
                id,
                name,
                required_credits
            FROM credit_blocks
            "#,
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(credit_blocks)
    }

    async fn credit_block(
        &self,
        ctx: &Context<'_>,
        id: CreditBlockId,
    ) -> GraphQLResult<Option<CreditBlock>> {
        ctx.data::<DataLoader<CreditBlockLoader>>()?
            .load_one(id)
            .await
    }

    async fn courses(&self, ctx: &Context<'_>) -> GraphQLResult<Vec<Course>> {
        let pool = ctx.data::<Pool>()?;
        let mut conn = pool.acquire().await?;

        let courses = sqlx::query_as!(
            Course,
            /*language=SQLite*/
            r#"
            SELECT
                id,
                name,
                year_of_level,
                level as "level: UniversityLevel",
                subject,
                description
            FROM courses
            "#,
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(courses)
    }

    async fn course(&self, ctx: &Context<'_>, id: CourseId) -> GraphQLResult<Option<Course>> {
        ctx.data::<DataLoader<CourseLoader>>()?.load_one(id).await
    }

    async fn courses_requirements(
        &self,
        ctx: &Context<'_>,
    ) -> GraphQLResult<Vec<CourseRequirements>> {
        let pool = ctx.data::<Pool>()?;
        let mut conn = pool.acquire().await?;

        let course_requirements = sqlx::query_as!(
            CourseRequirements,
            /*language=SQLite*/
            r#"
            SELECT
                id,
                prerequisites_expr,
                corequisites_expr
            FROM course_requirements
            "#,
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(course_requirements)
    }

    async fn course_requirements(
        &self,
        ctx: &Context<'_>,
        id: CourseId,
    ) -> GraphQLResult<Option<CourseRequirements>> {
        ctx.data::<DataLoader<CourseRequirementsLoader>>()?
            .load_one(id)
            .await
    }

    async fn section(&self, ctx: &Context<'_>, id: SectionId) -> GraphQLResult<Option<Section>> {
        ctx.data::<DataLoader<SectionLoader>>()?.load_one(id).await
    }

    async fn sections(
        &self,
        ctx: &Context<'_>,
        course_id: CourseId,
    ) -> GraphQLResult<Option<Vec<Section>>> {
        ctx.data::<DataLoader<SectionLoader>>()?
            .load_many(vec![course_id.clone()])
            .await
            .map(|mut v| v.remove(&course_id))
    }

    async fn schedule_gaps(
        &self,
        ctx: &Context<'_>,
        section_id: SectionId,
    ) -> GraphQLResult<Vec<ScheduleGap>> {
        Ok(ctx
            .data::<DataLoader<ScheduleGapLoader>>()?
            .load_one(section_id)
            .await?
            .unwrap_or_default())
    }

    async fn exams(&self, ctx: &Context<'_>) -> GraphQLResult<Vec<Exam>> {
        let pool = ctx.data::<Pool>()?;
        let mut conn = pool.acquire().await?;
        
        let exams = sqlx::query_as!(
            Exam,
            /*language=SQLite*/
            r#"
            SELECT
                id,
                exam_type as "exam_type: ExamType",
                date as "date: NaiveDate",
                start_time as "start_time: NaiveTime",
                end_time as "end_time: NaiveTime",
                location
            FROM exams
            "#,
        )
        .fetch_all(&mut *conn)
        .await?;
        
        Ok(exams)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use sqlx::pool::PoolConnection;

    #[sqlx::test]
    async fn get_semesters(mut conn: PoolConnection<Sqlite>) -> Result<(), sqlx::Error> {
        // Arrange
        sqlx::query!(
            /*language=SQLite*/
            r#"
            INSERT INTO semesters (id, name, year, start_date, end_date)
            VALUES
                ('Automne2024', 'Automne', 2024, '2024-08-26', '2024-12-13'),
                ('Hiver2025', 'Hiver', 2025, '2025-01-06', '2025-04-18')
            "#,
        )
        .execute(&mut *conn)
        .await?;

        // Act
        let semesters = sqlx::query_as!(
            Semester,
            /*language=SQLite*/
            r#"
            SELECT
                id,
                name,
                year,
                start_date as "start_date: NaiveDate",
                end_date as "end_date: NaiveDate"
            FROM semesters
            "#,
        )
        .fetch_all(&mut *conn)
        .await?;

        // Assert
        assert_eq!(semesters.len(), 2);

        let semester_ids: Vec<String> = semesters.iter().map(|s| s.id.to_string()).collect();

        assert!(semester_ids.contains(&"Automne2024".to_string()));
        assert!(semester_ids.contains(&"Hiver2025".to_string()));

        Ok(())
    }
}
