use super::input_objects::*;
use super::objects::*;
use async_graphql::{Context, Object, Result as GraphQLResult};
use chrono::{NaiveDate, NaiveTime};

type Pool = sqlx::Pool<sqlx::Sqlite>;

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn create_semester(
        &self,
        ctx: &Context<'_>,
        input: SemesterInput,
    ) -> GraphQLResult<Semester> {
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

    async fn create_credit_block(
        &self,
        ctx: &Context<'_>,
        semester_id: SemesterId,
        input: CreditBlockInput,
    ) -> GraphQLResult<CreditBlock> {
        let pool = ctx.data::<Pool>()?;
        let mut conn = pool.acquire().await?;

        let credit_block = sqlx::query_as!(
            CreditBlock,
            /*language=SQLite*/
            r#"
            INSERT INTO credit_blocks (id, semester_id, name, required_credits)
            VALUES (?, ?, ?, ?)
            RETURNING id, name, required_credits
            "#,
            input.id,
            semester_id,
            input.name,
            input.required_credits,
        )
        .fetch_one(&mut *conn)
        .await?;

        Ok(credit_block)
    }

    async fn create_course(
        &self,
        ctx: &Context<'_>,
        semester_id: SemesterId,
        credit_block_id: CreditBlockId,
        input: CourseInput,
    ) -> GraphQLResult<Course> {
        let pool = ctx.data::<Pool>()?;
        let mut conn = pool.acquire().await?;

        let course = sqlx::query_as!(
            Course,
            /*language=SQLite*/
            r#"
            INSERT INTO courses (
                id, semester_id, credit_block_id, name, year_of_level, level, subject, description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id, name, year_of_level, level as "level: _", subject, description
            "#,
            input.id,
            semester_id,
            credit_block_id,
            input.name,
            input.year_of_level,
            input.level,
            input.subject,
            input.description,
        )
        .fetch_one(&mut *conn)
        .await?;

        Ok(course)
    }

    async fn create_course_requirements(
        &self,
        ctx: &Context<'_>,
        course_id: CourseId,
        input: CourseRequirementsInput,
    ) -> GraphQLResult<CourseRequirements> {
        let pool = ctx.data::<Pool>()?;
        let mut conn = pool.acquire().await?;

        let course_requirements = sqlx::query_as!(
            CourseRequirements,
            /*language=SQLite*/
            r#"
            INSERT INTO course_requirements (id, prerequisites_expr, corequisites_expr)
            VALUES (?, ?, ?)
            RETURNING id, prerequisites_expr, corequisites_expr
            "#,
            course_id,
            input.prerequisites_expr,
            input.corequisites_expr,
        )
        .fetch_one(&mut *conn)
        .await?;

        Ok(course_requirements)
    }

    async fn create_main_section(
        &self,
        ctx: &Context<'_>,
        course_id: CourseId,
        input: MainSectionInput,
    ) -> GraphQLResult<MainSection> {
        let pool = ctx.data::<Pool>()?;
        let mut conn = pool.acquire().await?;

        let main_section = sqlx::query_as!(
            MainSection,
            /*language=SQLite*/
            r#"
            INSERT INTO sections (
               id, course_id, section_type, object_type, start_date, end_date, teacher, location, is_open
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING
                id,
                section_type,
                start_date as "start_date: NaiveDate",
                end_date as "end_date: NaiveDate",
                teacher,
                location,
                is_open
            "#,
            input.id,
            course_id,
            input.section_type,
            SectionObjectType::MainSection,
            input.start_date,
            input.end_date,
            input.teacher,
            input.location,
            input.is_open,
        )
        .fetch_one(&mut *conn)
        .await?;

        Ok(main_section)
    }

    async fn create_sub_section(
        &self,
        ctx: &Context<'_>,
        course_id: CourseId,
        input: SubSectionInput,
    ) -> GraphQLResult<SubSection> {
        let pool = ctx.data::<Pool>()?;
        let mut conn = pool.acquire().await?;

        let sub_section = sqlx::query_as!(
            SubSection,
            /*language=SQLite*/
            r#"
            INSERT INTO sections (
               id, course_id, section_type, object_type, start_date, end_date, teacher, location, is_open
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING
                id,
                section_type,
                start_date as "start_date: NaiveDate",
                end_date as "end_date: NaiveDate",
                teacher,
                location,
                is_open
            "#,
            input.id,
            course_id,
            input.section_type,
            SectionObjectType::SubSection,
            input.start_date,
            input.end_date,
            input.teacher,
            input.location,
            input.is_open,
        )
        .fetch_one(&mut *conn)
        .await?;

        Ok(sub_section)
    }

    async fn create_time_slot(
        &self,
        ctx: &Context<'_>,
        section_id: SectionId,
        input: TimeSlotInput,
    ) -> GraphQLResult<TimeSlot> {
        let pool = ctx.data::<Pool>()?;
        let mut conn = pool.acquire().await?;

        let time_slot = sqlx::query_as!(
            TimeSlot,
            /*language=SQLite*/
            r#"
            INSERT INTO time_slots (section_id, day_of_week, start_time, end_time, location)
            VALUES (?, ?, ?, ?, ?)
            RETURNING
                id,
                day_of_week as "day_of_week: _",
                start_time as "start_time: NaiveTime",
                end_time as "end_time: NaiveTime",
                location
            "#,
            section_id,
            input.day_of_week,
            input.start_time,
            input.end_time,
            input.location,
        )
        .fetch_one(&mut *conn)
        .await?;

        Ok(time_slot)
    }

    async fn create_schedule_gap(
        &self,
        ctx: &Context<'_>,
        section_id: SectionId,
        input: ScheduleGapInput,
    ) -> GraphQLResult<ScheduleGap> {
        let pool = ctx.data::<Pool>()?;
        let mut conn = pool.acquire().await?;

        let schedule_gap = sqlx::query_as!(
            ScheduleGap,
            /*language=SQLite*/
            r#"
            INSERT INTO schedule_gaps (section_id, date, reason)
            VALUES (?, ?, ?)
            RETURNING id, date as "date: NaiveDate", reason
            "#,
            section_id,
            input.date,
            input.reason,
        )
        .fetch_one(&mut *conn)
        .await?;

        Ok(schedule_gap)
    }

    async fn create_exam(&self, ctx: &Context<'_>, section_id: MainSectionId, input: ExamInput) -> GraphQLResult<Exam> {
        let pool = ctx.data::<Pool>()?;
        let mut conn = pool.acquire().await?;

        let exam = sqlx::query_as!(
            Exam,
            /*language=SQLite*/
            r#"
            INSERT INTO exams (section_id, exam_type, date, start_time, end_time, location)
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING
                id,
                exam_type as "exam_type: _",
                date as "date: NaiveDate",
                start_time as "start_time: NaiveTime",
                end_time as "end_time: NaiveTime",
                location
            "#,
            section_id,
            input.exam_type,
            input.date,
            input.start_time,
            input.end_time,
            input.location,
        )
        .fetch_one(&mut *conn)
        .await?;

        Ok(exam)
    }
}
