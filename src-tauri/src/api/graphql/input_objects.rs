use async_graphql::InputObject;
use chrono::NaiveDate;
use chrono::NaiveTime;
use super::objects::{SectionObjectType, UniversityLevel, DayOfWeek, ExamType, SectionId};

#[derive(InputObject, Clone)]
pub(crate) struct SemesterInput {
    /// The name of the semester.\
    /// _Example_: `Automne 2021`
    pub(crate) name: String,

    /// The year of the semester.\
    /// _Example_: `2021`
    pub(crate) year: i64,

    /// The start date of the semester.\
    /// _Example_: `2021-09-01`
    pub(crate) start_date: NaiveDate,

    /// The end date of the semester.\
    /// _Example_: `2021-12-31`
    pub(crate) end_date: NaiveDate,
}

impl SemesterInput {
    pub(crate) fn id(&self) -> String {
        [self.name.clone(), self.year.to_string()].concat()
    }
}

#[derive(InputObject, Clone)]
pub(crate) struct CreditBlockInput {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) required_credits: i64,
}

#[derive(InputObject, Clone)]
pub(crate) struct CourseInput {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) year_of_level: i64,
    pub(crate) level: UniversityLevel,
    pub(crate) subject: String,
    pub(crate) description: String,
}

#[derive(InputObject, Clone)]
pub(crate) struct CourseRequirementsInput {
    pub(crate) prerequisites_expr: Option<String>,
    pub(crate) corequisites_expr: Option<String>,
}

#[derive(InputObject, Clone)]
pub(crate) struct MainSectionInput {
    pub(crate) id: SectionId,
    pub(crate) section_type: String,
    pub(crate) start_date: NaiveDate,
    pub(crate) end_date: NaiveDate,
    pub(crate) teacher: String,
    pub(crate) location: String,
    pub(crate) is_open: bool,
}

#[derive(InputObject, Clone)]
pub(crate) struct SubSectionInput {
    pub(crate) id: SectionId,
    pub(crate) section_type: String,
    pub(crate) start_date: NaiveDate,
    pub(crate) end_date: NaiveDate,
    pub(crate) teacher: String,
    pub(crate) location: String,
    pub(crate) is_open: bool,
}

#[derive(InputObject, Clone)]
pub(crate) struct TimeSlotInput {
    pub(crate) day_of_week: DayOfWeek,
    pub(crate) start_time: NaiveTime,
    pub(crate) end_time: NaiveTime,
    pub(crate) location: String,
}

#[derive(InputObject, Clone)]
pub(crate) struct ScheduleGapInput {
    pub(crate) date: NaiveDate,
    pub(crate) reason: String,
}

#[derive(InputObject, Clone)]
pub(crate) struct ExamInput {
    pub(crate) exam_type: ExamType,
    pub(crate) date: NaiveDate,
    pub(crate) start_time: NaiveTime,
    pub(crate) end_time: NaiveTime,
    pub(crate) location: String,
}