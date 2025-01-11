use super::objects::*;
use super::utils::*;
use super::{EmptyFields, EmptyMutation, EmptySubscription, GraphQLSchema, Schema};
use async_graphql::dataloader::Loader;
use async_graphql::futures_util::TryStreamExt;
use derive_more::Constructor;
use itertools::join;
use sqlx::{Pool, Sqlite};
use std::collections::HashMap;

pub fn create_schema(x: &Pool<Sqlite>) -> Schema {
    GraphQLSchema::build(EmptyFields, EmptyMutation, EmptySubscription)
        .data(SemesterLoader::new(x.clone()))
        .data(CreditBlockLoader::new(x.clone()))
        .data(CourseLoader::new(x.clone()))
        .data(CourseRequirementsLoader::new(x.clone()))
        .data(SectionLoader::new(x.clone()))
        .data(TimeSlotLoader::new(x.clone()))
        .data(ScheduleGapLoader::new(x.clone()))
        .data(ExamLoader::new(x.clone()))
        .finish()
}

#[derive(Constructor)]
pub(super) struct SemesterLoader(Pool<Sqlite>);

impl Loader<SemesterId> for SemesterLoader {
    type Value = Semester;
    type Error = async_graphql::Error;

    async fn load(
        &self,
        keys: &[SemesterId],
    ) -> Result<HashMap<SemesterId, Self::Value>, Self::Error> {
        Ok(sqlx::query_as(
            /*language=SQLite*/
            "SELECT id, name, year, start_date, end_date
         FROM semesters
         WHERE id IN ($1)",
        )
        .bind(join(keys, ", "))
        .fetch(&self.0)
        .map_ok(|semester: Semester| (semester.id.clone(), semester))
        .try_collect()
        .await?)
    }
}

#[derive(Constructor)]
pub(super) struct CreditBlockLoader(Pool<Sqlite>);

impl Loader<CreditBlockId> for CreditBlockLoader {
    type Value = CreditBlock;
    type Error = async_graphql::Error;

    async fn load(
        &self,
        keys: &[CreditBlockId],
    ) -> Result<HashMap<CreditBlockId, Self::Value>, Self::Error> {
        Ok(sqlx::query_as(
            /*language=SQLite*/
            "SELECT id, name, required_credits FROM credit_blocks WHERE id IN ($1)",
        )
        .bind(join(keys, ", "))
        .fetch(&self.0)
        .map_ok(|credit_block: CreditBlock| (credit_block.id.clone(), credit_block))
        .try_collect()
        .await?)
    }
}

impl Loader<SemesterId> for CreditBlockLoader {
    type Value = Vec<CreditBlock>;
    type Error = async_graphql::Error;

    async fn load(
        &self,
        keys: &[SemesterId],
    ) -> Result<HashMap<SemesterId, Self::Value>, Self::Error> {
        sqlx::query(
            /*language=SQLite*/
            "SELECT semester_id, id, name, required_credits
         FROM credit_blocks
         WHERE semester_id IN ($1)",
        )
        .bind(join(keys, ", "))
        .fetch(&self.0)
        .try_collect::<IdKeyGroupedRows<SemesterId, CreditBlock>>()
        .await?
        .try_into()
    }
}

#[derive(Constructor)]
pub(super) struct CourseLoader(Pool<Sqlite>);

impl Loader<CourseId> for CourseLoader {
    type Value = Course;
    type Error = async_graphql::Error;

    async fn load(
        &self,
        keys: &[CourseId],
    ) -> Result<HashMap<CourseId, Self::Value>, Self::Error> {
        Ok(sqlx::query_as(
            /*language=SQLite*/
            "SELECT id, name, year_of_level, level, subject, description
         FROM courses
         WHERE id IN ($1)",
        )
        .bind(join(keys, ", "))
        .fetch(&self.0)
        .map_ok(|course: Course| (course.id.clone(), course))
        .try_collect()
        .await?)
    }
}

impl Loader<SemesterId> for CourseLoader {
    type Value = Vec<Course>;
    type Error = async_graphql::Error;

    async fn load(
        &self,
        keys: &[SemesterId],
    ) -> Result<HashMap<SemesterId, Self::Value>, Self::Error> {
        sqlx::query(
            /*language=SQLite*/
            "SELECT semester_id, id, name, year_of_level, level, subject, description
         FROM courses
         WHERE semester_id IN ($1)",
        )
        .bind(join(keys, ", "))
        .fetch(&self.0)
        .try_collect::<IdKeyGroupedRows<SemesterId, Course>>()
        .await?
        .try_into()
    }
}

impl Loader<CreditBlockId> for CourseLoader {
    type Value = Vec<Course>;
    type Error = async_graphql::Error;

    async fn load(
        &self,
        keys: &[CreditBlockId],
    ) -> Result<HashMap<CreditBlockId, Self::Value>, Self::Error> {
        sqlx::query(
            /*language=SQLite*/
            "SELECT credit_block_id, id, name, year_of_level, level, subject, description
         FROM courses
         WHERE credit_block_id IN ($1)",
        )
        .bind(join(keys, ", "))
        .fetch(&self.0)
        .try_collect::<IdKeyGroupedRows<CreditBlockId, Course>>()
        .await?
        .try_into()
    }
}

#[derive(Constructor)]
pub(super) struct CourseRequirementsLoader(Pool<Sqlite>);

impl Loader<CourseId> for CourseRequirementsLoader {
    type Value = CourseRequirements;
    type Error = async_graphql::Error;

    async fn load(
        &self,
        keys: &[CourseId],
    ) -> Result<HashMap<CourseId, Self::Value>, Self::Error> {
        Ok(sqlx::query_as(
            /*language=SQLite*/
            "SELECT id, prerequisites_expr, corequisites_expr
         FROM course_requirements
         WHERE id IN ($1)",
        )
        .bind(join(keys, ", "))
        .fetch(&self.0)
        .map_ok(|requirements: CourseRequirements| (requirements.id.clone(), requirements))
        .try_collect()
        .await?)
    }
}

#[derive(Constructor)]
pub(super) struct SectionLoader(Pool<Sqlite>);
impl Loader<SectionId> for SectionLoader {
    type Value = Section;
    type Error = async_graphql::Error;

    async fn load(
        &self,
        keys: &[SectionId],
    ) -> Result<HashMap<SectionId, Self::Value>, Self::Error> {
        Ok(sqlx::query_as(
            /*language=SQLite*/
            "SELECT id, course_id, section_type, object_type, start_date, end_date, teacher, location, is_open
         FROM sections
         WHERE id IN ($1)",
        )
            .bind(join(keys, ", "))
            .fetch(&self.0)
            .map_ok(|section: Section| (section.section_id().clone(), section))
            .try_collect()
            .await?)
    }
}

impl Loader<MainSectionId> for SectionLoader {
    type Value = Vec<SubSection>;
    type Error = async_graphql::Error;

    async fn load(
        &self,
        keys: &[MainSectionId],
    ) -> Result<HashMap<MainSectionId, Self::Value>, Self::Error> {
        sqlx::query(
            /*language=SQLite*/
            "SELECT main_section_id, id, section_type, object_type, start_date, end_date, teacher, location, is_open
         FROM sections
         WHERE main_section_id IN ($1)",
        )
            .bind(join(keys, ", "))
            .fetch(&self.0)
            .try_collect::<IdKeyGroupedRows<MainSectionId, SubSection>>()
            .await?
            .try_into()
    }
}

impl Loader<CourseId> for SectionLoader {
    type Value = Vec<Section>;
    type Error = async_graphql::Error;

    async fn load(
        &self,
        keys: &[CourseId],
    ) -> Result<HashMap<CourseId, Self::Value>, Self::Error> {
        sqlx::query(
            /*language=SQLite*/
            "SELECT course_id, id, section_type, object_type, start_date, end_date, teacher, location, is_open
         FROM sections
         WHERE course_id IN ($1)",
        )
            .bind(join(keys, ", "))
            .fetch(&self.0)
            .try_collect::<IdKeyGroupedRows<CourseId, Section>>()
            .await?
            .try_into()
    }
}

#[derive(Constructor)]
pub(super) struct TimeSlotLoader(Pool<Sqlite>);

impl Loader<TimeSlotId> for TimeSlotLoader {
    type Value = TimeSlot;
    type Error = async_graphql::Error;

    async fn load(
        &self,
        keys: &[TimeSlotId],
    ) -> Result<HashMap<TimeSlotId, Self::Value>, Self::Error> {
        Ok(sqlx::query_as(
            /*language=SQLite*/
            "SELECT id, section_id, day_of_week, start_time, end_time, location
         FROM time_slots
         WHERE id IN ($1)",
        )
        .bind(join(keys, ", "))
        .fetch(&self.0)
        .map_ok(|time_slot: TimeSlot| (time_slot.id, time_slot))
        .try_collect()
        .await?)
    }
}

impl Loader<SectionId> for TimeSlotLoader {
    type Value = Vec<TimeSlot>;
    type Error = async_graphql::Error;

    async fn load(
        &self,
        keys: &[SectionId],
    ) -> Result<HashMap<SectionId, Self::Value>, Self::Error> {
        sqlx::query(
            /*language=SQLite*/
            "SELECT section_id, id, day_of_week, start_time, end_time, location
         FROM time_slots
         WHERE section_id IN ($1)",
        )
        .bind(join(keys, ", "))
        .fetch(&self.0)
        .try_collect::<IdKeyGroupedRows<SectionId, TimeSlot>>()
        .await?
        .try_into()
    }
}

#[derive(Constructor)]
pub(super) struct ScheduleGapLoader(Pool<Sqlite>);

impl Loader<ScheduleGapId> for ScheduleGapLoader {
    type Value = ScheduleGap;
    type Error = async_graphql::Error;

    async fn load(
        &self,
        keys: &[ScheduleGapId],
    ) -> Result<HashMap<ScheduleGapId, Self::Value>, Self::Error> {
        Ok(sqlx::query_as(
            /*language=SQLite*/
            "SELECT id, section_id, date, reason
         FROM schedule_gaps
         WHERE id IN ($1)",
        )
        .bind(join(keys, ", "))
        .fetch(&self.0)
        .map_ok(|schedule_gap: ScheduleGap| (schedule_gap.id.clone(), schedule_gap))
        .try_collect()
        .await?)
    }
}

impl Loader<SectionId> for ScheduleGapLoader {
    type Value = Vec<ScheduleGap>;
    type Error = async_graphql::Error;

    async fn load(
        &self,
        keys: &[SectionId],
    ) -> Result<HashMap<SectionId, Self::Value>, Self::Error> {
        sqlx::query(
            /*language=SQLite*/
            "SELECT section_id, id, date, reason
         FROM schedule_gaps
         WHERE section_id IN ($1)",
        )
        .bind(join(keys, ", "))
        .fetch(&self.0)
        .try_collect::<IdKeyGroupedRows<SectionId, ScheduleGap>>()
        .await?
        .try_into()
    }
}

#[derive(Constructor)]
pub(super) struct ExamLoader(Pool<Sqlite>);

impl Loader<ExamId> for ExamLoader {
    type Value = Exam;
    type Error = async_graphql::Error;

    async fn load(
        &self,
        keys: &[ExamId],
    ) -> Result<HashMap<ExamId, Self::Value>, Self::Error> {
        Ok(sqlx::query_as(
            /*language=SQLite*/
            "SELECT id, section_id, date, start_time, end_time, location
         FROM exams
         WHERE id IN ($1)",
        )
        .bind(join(keys, ", "))
        .fetch(&self.0)
        .map_ok(|exam: Exam| (exam.id.clone(), exam))
        .try_collect()
        .await?)
    }
}

impl Loader<SectionId> for ExamLoader {
    type Value = Vec<Exam>;
    type Error = async_graphql::Error;

    async fn load(
        &self,
        keys: &[SectionId],
    ) -> Result<HashMap<SectionId, Self::Value>, Self::Error> {
        sqlx::query(
            /*language=SQLite*/
            "SELECT section_id, id, date, start_time, end_time, location
         FROM exams
         WHERE section_id IN ($1)",
        )
        .bind(join(keys, ", "))
        .fetch(&self.0)
        .try_collect::<IdKeyGroupedRows<SectionId, Exam>>()
        .await?
        .try_into()
    }
}
