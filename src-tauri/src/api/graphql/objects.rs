use async_graphql::{Enum, Interface, SimpleObject};
use chrono::{NaiveDate, NaiveTime};
use derive_more::Display;
use sqlx::sqlite::SqliteRow;
use sqlx::{FromRow, Row};

#[derive(sqlx::Type, async_graphql::NewType, Clone, Eq, PartialEq, Hash, Display)]
#[sqlx(transparent)]
pub(super) struct SemesterId(String);

#[derive(sqlx::FromRow, SimpleObject, Clone)]
#[graphql(complex)]
pub(in crate::api) struct Semester {
    /// The ID of the semester.
    /// Example: `A21`
    pub(super) id: SemesterId,

    /// The name of the semester.\
    /// _Example_: `Automne 2021`
    pub(super) name: String,

    /// The year of the semester.\
    /// _Example_: `2021`
    pub(super) year: i64,

    /// The start date of the semester.\
    /// _Example_: `2021-09-01`
    pub(super) start_date: NaiveDate,

    /// The end date of the semester.\
    /// _Example_: `2021-12-31`
    pub(super) end_date: NaiveDate,
}

#[derive(sqlx::Type, async_graphql::NewType, Clone, Eq, PartialEq, Hash, Display)]
#[sqlx(transparent)]
pub(super) struct CreditBlockId(String);

#[derive(sqlx::FromRow, SimpleObject, Clone)]
#[graphql(complex)]
pub(in crate::api) struct CreditBlock {
    /// The ID of the credit block.\
    /// _Example_: `76A`
    pub(super) id: CreditBlockId,

    /// The name of the credit block.\
    /// _Example_: `Interfaces et bases de données`
    pub(crate) name: String,

    /// The number of credits required to complete the credit block.
    pub(crate) required_credits: i64,
}

#[derive(sqlx::Type, async_graphql::NewType, Clone, Eq, PartialEq, Hash, Display)]
#[sqlx(transparent)]
pub(super) struct CourseId(String);

#[derive(sqlx::FromRow, SimpleObject, Clone)]
#[graphql(complex)]
pub(in crate::api) struct Course {
    /// The ID of the course\
    /// _Example_: `IFT3065`
    pub(super) id: CourseId,

    /// The name of the course.\
    /// _Example_: `Langages program., compilation`
    pub(crate) name: String,

    /// The year of the course level.\
    /// _Example_: `3`
    pub(crate) year_of_level: i64,

    /// The level of the course.\
    /// _Example_: `Undergraduate`
    pub(crate) level: UniversityLevel,

    /// The subject of the course.\
    /// _Example_: `IFT`
    pub(crate) subject: String,

    /// The description of the course.\
    /// _Example_: `Méthodes de compilation et interprétation des langages de programmation`
    pub(crate) description: String,
}

#[derive(sqlx::FromRow, SimpleObject, Clone)]
pub(in crate::api) struct CourseRequirements {
    /// The ID of the course that the requirements are for.\
    /// _Example_: `IFT3065`
    pub(super) id: CourseId,

    /// The expression of the prerequisites to take the course.\
    /// _Example_: `IFT2065 & (IFT2265 | IFT2295)`
    pub(crate) prerequisites_expr: Option<String>,

    /// The expression of the corequisites to take the course.\
    /// _Example_: `IFT2065 & (IFT2265 | IFT2295)`
    pub(crate) corequisites_expr: Option<String>,
}

#[derive(sqlx::Type, async_graphql::NewType, Clone, Eq, PartialEq, Hash, Display)]
#[sqlx(transparent)]
pub(super) struct SectionId(String);

#[derive(Interface, Clone)]
#[graphql(
    field(name = "id", type = "&SectionId"),
    field(name = "section_type", type = "String"),
    field(name = "start_date", type = "&NaiveDate"),
    field(name = "end_date", type = "&NaiveDate"),
    field(name = "teacher", type = "String"),
    field(name = "location", type = "String"),
    field(name = "is_open", type = "&bool"),
    field(name = "time_slots", type = "Vec<TimeSlot>"),
    field(name = "schedule_gaps", type = "Vec<ScheduleGap>")
)]
pub(in crate::api) enum Section {
    MainSection(MainSection),
    SubSection(SubSection),
}

impl Section {
    pub(super) fn section_id(&self) -> &SectionId {
        match self {
            Section::MainSection(main_section) => &main_section.id,
            Section::SubSection(sub_section) => &sub_section.id,
        }
    }
}

impl FromRow<'_, SqliteRow> for Section {
    fn from_row(row: &'_ SqliteRow) -> Result<Self, sqlx::Error> {
        let object_type: SectionObjectType = row.try_get("object_type")?;

        match object_type {
            SectionObjectType::MainSection => Ok(Section::MainSection(MainSection::from_row(row)?)),
            SectionObjectType::SubSection => Ok(Section::SubSection(SubSection::from_row(row)?)),
        }
    }
}

#[derive(sqlx::Type, Enum, Copy, Clone, Eq, PartialEq)]
pub(in crate::api) enum SectionObjectType {
    MainSection,
    SubSection,
}

#[derive(sqlx::FromRow, SimpleObject, Clone)]
#[graphql(complex)]
pub(in crate::api) struct MainSection {
    /// The ID of the main section.\
    /// _Example_: `A-TH-13046`
    pub(crate) id: SectionId,

    /// The type of the section.\
    /// _Example_: `TH`
    pub(crate) section_type: String,

    /// The start of the section's schedule.\
    /// _Example_: `2021-09-01`
    pub(crate) start_date: NaiveDate,

    /// The end of the section's schedule.\
    /// _Example_: `2021-12-31`
    pub(crate) end_date: NaiveDate,

    /// The teacher of the section.\
    /// _Example_: `John Doe`
    pub(crate) teacher: String,

    /// The place where the section is held.\
    /// _Example_: `Pavillon André-Aisenstadt`
    pub(crate) location: String,

    /// Whether the section is open or not for registration.
    pub(crate) is_open: bool,
}

#[derive(sqlx::Type, async_graphql::NewType, Clone, Eq, PartialEq, Hash, Display)]
#[sqlx(transparent)]
pub(super) struct MainSectionId(String);

impl Into<MainSectionId> for SectionId {
    fn into(self) -> MainSectionId {
        MainSectionId(self.0)
    }
}

#[derive(sqlx::FromRow, SimpleObject, Clone)]
#[graphql(complex)]
pub(in crate::api) struct SubSection {
    /// See [MainSection]
    pub(super) id: SectionId,

    /// See [MainSection]
    pub(in crate::api) section_type: String,

    /// See [MainSection]
    pub(crate) start_date: NaiveDate,

    /// See [MainSection]
    pub(crate) end_date: NaiveDate,

    /// See [MainSection]
    pub(crate) teacher: String,

    /// See [MainSection]
    pub(crate) location: String,

    /// See [MainSection]
    pub(crate) is_open: bool,
}

#[derive(sqlx::FromRow, SimpleObject, Clone)]
pub(super) struct SectionTypeTuple {
    /// The type of the subsections.\
    /// _Example_: `TP`
    pub(crate) section_type: String,

    /// Subsections of `_type` associated with the main section.
    pub(crate) sections: Vec<SubSection>,
}

pub(super) type TimeSlotId = i64;

#[derive(sqlx::FromRow, SimpleObject, Clone)]
pub(in crate::api) struct TimeSlot {
    /// The ID of the time slot.\
    /// This field is not exposed to the GraphQL schema.
    pub(crate) id: TimeSlotId,

    /// The day of the week of the time slot.\
    /// _Example_: `Monday`
    pub(crate) day_of_week: DayOfWeek,

    /// The start time of the time slot.\
    /// _Example_: `08:30`
    pub(crate) start_time: NaiveTime,

    /// The end time of the time slot.\
    /// _Example_: `10:00`
    pub(crate) end_time: NaiveTime,

    /// The place where the section is held.\
    /// _Example_: `Pavillon André-Aisenstadt`
    pub(crate) location: String,
}

#[derive(sqlx::Type, async_graphql::NewType, Clone, Eq, PartialEq, Hash, Display)]
#[sqlx(transparent)]
pub(super) struct ScheduleGapId(i64);

#[derive(sqlx::FromRow, SimpleObject, Clone)]
pub(in crate::api) struct ScheduleGap {
    /// The ID of the schedule gap.\
    /// This field is not exposed to the GraphQL schema.
    pub(super) id: ScheduleGapId,

    /// The date of the schedule gap.\
    /// _Example_: `2021-09-06`
    pub(crate) date: NaiveDate,

    /// The reason for the schedule gap.\
    /// _Example_: `Labor Day`
    pub(crate) reason: String,
}

#[derive(sqlx::Type, async_graphql::NewType, Clone, Eq, PartialEq, Hash, Display)]
#[sqlx(transparent)]
pub(super) struct ExamId(i64);

#[derive(sqlx::FromRow, SimpleObject, Clone)]
pub(in crate::api) struct Exam {
    /// The ID of the exam.\
    pub(super) id: ExamId,

    /// The type of the exam.\
    /// _Example_: `MidTerm`
    pub(crate) exam_type: ExamType,

    /// The date of the exam.\
    /// _Example_: `2021-12-15`
    pub(crate) date: NaiveDate,

    /// The start time of the exam.\
    /// _Example_: `08:30`
    pub(crate) start_time: NaiveTime,

    /// The end time of the exam.\
    /// _Example_: `10:00`
    pub(crate) end_time: NaiveTime,

    /// The place where the exam is held.\
    /// _Example_: `Pavillon André-Aisenstadt`
    pub(crate) location: String,
}

impl Exam {
    pub(super) fn is_of_type(&self, exam_type: ExamType) -> bool {
        self.exam_type == exam_type
    }
}

#[derive(sqlx::Type, Enum, Copy, Clone, Eq, PartialEq)]
pub(super) enum UniversityLevel {
    Undergraduate,
    Graduate,
    Doctoral,
}

#[derive(sqlx::Type, Enum, Copy, Clone, Eq, PartialEq)]
pub(super) enum DayOfWeek {
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
    Sunday,
    TBD,
}

#[derive(sqlx::Type, Enum, Copy, Clone, Eq, PartialEq)]
pub(super) enum ExamType {
    MidTerm,
    Final,
}
