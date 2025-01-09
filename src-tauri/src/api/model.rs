use crate::api::database::{SQLTable, TableDefinitionQuery};
use async_graphql::futures_util::TryStreamExt;
use async_graphql::{dataloader::Loader, ComplexObject, Enum, FieldError, Interface, SimpleObject};
use chrono::{NaiveDate, NaiveTime};
use itertools::join;
use sqlx::{query, Pool, Sqlite};
use std::collections::HashMap;

pub(crate) type SemesterId = String;

#[derive(sqlx::FromRow, SimpleObject, Clone)]
#[graphql(complex)]
pub struct Semester {
    /// The ID of the semester.
    /// Example: `A21`
    id: SemesterId,

    /// The name of the semester.\
    /// _Example_: `Automne 2021`
    name: String,

    /// The year of the semester.\
    /// _Example_: `2021`
    year: i32,

    /// The start date of the semester.\
    /// _Example_: `2021-09-01`
    start_date: NaiveDate,

    /// The end date of the semester.\
    /// _Example_: `2021-12-31`
    end_date: NaiveDate,
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

#[ComplexObject]
impl Semester {}

pub(crate) struct SQLiteLoader(Pool<Sqlite>);

impl SQLiteLoader {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self(pool)
    }
}

impl Loader<SemesterId> for SQLiteLoader {
    type Value = Semester;
    type Error = FieldError;

    async fn load(
        &self,
        keys: &[SemesterId],
    ) -> Result<HashMap<SemesterId, Self::Value>, Self::Error> {
        Ok(sqlx::query_as(/*language=SQLite*/ "SELECT * FROM semesters WHERE id IN ($1)")
            .bind(join(keys, ", "))
            .fetch(&self.0)
            .map_ok(|semester: Semester| (semester.id.clone(), semester))
            .try_collect()
            .await?)
    }
}

pub(crate) type CreditBlockId = String;

#[derive(SimpleObject, Clone)]
pub struct CreditBlock {
    /// The ID of the credit block.\
    /// _Example_: `76A`
    id: CreditBlockId,

    /// The name of the credit block.\
    /// _Example_: `Interfaces et bases de données`
    name: String,

    /// The number of credits required to complete the credit block.
    required_credits: i32,

    /// The list of courses that are part of the credit block.
    courses: Vec<Course>,
}

impl SQLTable for CreditBlock {
    fn table_definition() -> TableDefinitionQuery {
        query!(
            /*language=SQLite*/
            "CREATE TABLE IF NOT EXISTS credit_blocks (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                required_credits INTEGER NOT NULL
            );"
        )
    }
}

pub(crate) type CourseId = String;

#[derive(SimpleObject, Clone)]
pub struct Course {
    /// The ID of the course\
    /// _Example_: `IFT3065`
    id: CourseId,

    /// The name of the course.\
    /// _Example_: `Langages program., compilation`
    name: String,

    /// The year of the course level.\
    /// _Example_: `3`
    year_of_level: i32,

    /// The level of the course.\
    /// _Example_: `Undergraduate`
    level: UniversityLevel,

    /// The subject of the course.\
    /// _Example_: `IFT`
    subject: String,

    /// The description of the course.\
    /// _Example_: `Méthodes de compilation et interprétation des langages de programmation`
    description: String,

    /// The requirements to take the course.
    requirements: CourseRequirements,

    /// The list of main sections of the course.
    sections: Vec<MainSection>,
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
                FOREIGN KEY(credit_block_id) REFERENCES credit_blocks(id)
            );"
        )
    }
}

#[derive(SimpleObject, Clone)]
pub struct CourseRequirements {
    /// The ID of the course that the requirements are for.\
    /// _Example_: `IFT3065`
    id: CourseId,

    /// The expression of the prerequisites to take the course.\
    /// _Example_: `IFT2065 & (IFT2265 | IFT2295)`
    prerequisites_expr: Option<String>,

    /// The expression of the corequisites to take the course.\
    /// _Example_: `IFT2065 & (IFT2265 | IFT2295)`
    corequisites_expr: Option<String>,
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

#[derive(Interface)]
#[graphql(
    field(name = "id", ty = "String"),
    field(name = "_type", ty = "String"),
    field(name = "start_date", ty = "&NaiveDate"),
    field(name = "end_date", ty = "&NaiveDate"),
    field(name = "teacher", ty = "String"),
    field(name = "location", ty = "String"),
    field(name = "is_open", ty = "&bool"),
    field(name = "time_slots", ty = "&Vec<TimeSlot>"),
    field(name = "schedule_gaps", ty = "&Vec<ScheduleGap>")
)]
pub enum Section {
    MainSection(MainSection),
    SubSection(SubSection),
}

impl SQLTable for Section {
    fn table_definition() -> TableDefinitionQuery {
        query!(
            /*language=SQLite*/
            "CREATE TABLE IF NOT EXISTS sections (
                id TEXT PRIMARY KEY,
                course_id TEXT NOT NULL,
                section_type TEXT NOT NULL,
                _type TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                teacher TEXT NOT NULL,
                location TEXT NOT NULL,
                is_open BOOLEAN NOT NULL,
                FOREIGN KEY(course_id) REFERENCES courses(id)
            );"
        )
    }
}

pub(crate) type SectionId = String;
pub(crate) type SectionType = String;

#[derive(SimpleObject, Clone)]
pub struct MainSection {
    /// The ID of the main section.\
    /// _Example_: `A-TH-13046`
    id: SectionId,

    /// The type of the section.\
    /// _Example_: `TH`
    _type: SectionType,

    /// The start of the section's schedule.\
    /// _Example_: `2021-09-01`
    start_date: NaiveDate,

    /// The end of the section's schedule.\
    /// _Example_: `2021-12-31`
    end_date: NaiveDate,

    /// The teacher of the section.\
    /// _Example_: `John Doe`
    teacher: String,

    /// The place where the section is held.\
    /// _Example_: `Pavillon André-Aisenstadt`
    location: String,

    /// Whether the section is open or not for registration.
    is_open: bool,

    /// The list of time slots for the section.
    time_slots: Vec<TimeSlot>,

    /// The list of schedule gaps for the section's time slots which simplifies
    /// the schedule of the section, by indicating when the section is not
    /// held instead of splitting the time slots to introduce gaps.
    schedule_gaps: Vec<ScheduleGap>,

    /// The midterm exam of the section.
    mid_term_exam: Option<Exam>,

    /// The final exam of the section.
    final_exam: Option<Exam>,

    /// The list of subsections associated with this main section.
    sub_sections: Vec<SectionTypeTuple>,
}

#[derive(SimpleObject, Clone)]
pub struct SubSection {
    /// See [MainSection]
    id: SectionId,

    /// See [MainSection]
    _type: SectionType,

    /// See [MainSection]
    start_date: NaiveDate,

    /// See [MainSection]
    end_date: NaiveDate,

    /// See [MainSection]
    teacher: String,

    /// See [MainSection]
    location: String,

    /// See [MainSection]
    is_open: bool,

    /// See [MainSection]
    time_slots: Vec<TimeSlot>,

    /// See [MainSection]
    schedule_gaps: Vec<ScheduleGap>,
}

#[derive(SimpleObject, Clone)]
pub struct SectionTypeTuple {
    /// The type of the subsections.\
    /// _Example_: `TP`
    _type: SectionType,

    /// Subsections of `_type` associated with the main section.
    sections: Vec<SubSection>,
}

pub(crate) type TimeSlotId = i32;

#[derive(SimpleObject, Clone)]
pub struct TimeSlot {
    /// The ID of the time slot.\
    /// This field is not exposed to the GraphQL schema.
    id: TimeSlotId,

    /// The ID of the section that the time slot is associated with.\
    /// _Example_: `A-TH-13046`
    section_id: SectionId,

    /// The day of the week of the time slot.\
    /// _Example_: `Monday`
    day_of_week: DayOfWeek,

    /// The start time of the time slot.\
    /// _Example_: `08:30`
    start_time: NaiveTime,

    /// The end time of the time slot.\
    /// _Example_: `10:00`
    end_time: NaiveTime,

    /// The place where the section is held.\
    /// _Example_: `Pavillon André-Aisenstadt`
    location: String,
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

pub(crate) type ScheduleGapId = i32;

#[derive(SimpleObject, Clone)]
pub struct ScheduleGap {
    /// The ID of the schedule gap.\
    /// This field is not exposed to the GraphQL schema.
    id: ScheduleGapId,

    /// The ID of the section that the schedule gap is associated with.\
    /// _Example_: `A-TH-13046`
    section_id: SectionId,

    /// The date of the schedule gap.\
    /// _Example_: `2021-09-06`
    date: NaiveDate,

    /// The reason for the schedule gap.\
    /// _Example_: `Labor Day`
    reason: String,
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

pub(crate) type ExamId = i32;

#[derive(SimpleObject, Clone)]
pub struct Exam {
    /// The ID of the exam.\
    id: ExamId,

    /// The ID of the section that the exam is associated with.\
    /// _Example_: `A-TH-13046`
    section_id: SectionId,

    /// The date of the exam.\
    /// _Example_: `2021-12-15`
    date: NaiveDate,

    /// The start time of the exam.\
    /// _Example_: `08:30`
    start_time: NaiveTime,

    /// The end time of the exam.\
    /// _Example_: `10:00`
    end_time: NaiveTime,

    /// The place where the exam is held.\
    /// _Example_: `Pavillon André-Aisenstadt`
    location: String,
}

impl SQLTable for Exam {
    fn table_definition() -> TableDefinitionQuery {
        query!(
            /*language=SQLite*/
            "CREATE TABLE IF NOT EXISTS exams (
                id INTEGER PRIMARY KEY,
                section_id TEXT NOT NULL,
                date TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                location TEXT NOT NULL,
                FOREIGN KEY(section_id) REFERENCES sections(id)
            );"
        )
    }
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum UniversityLevel {
    Undergraduate,
    Graduate,
    Doctoral,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum DayOfWeek {
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
    Sunday,
    TBD,
}
