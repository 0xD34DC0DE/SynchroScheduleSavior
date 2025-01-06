use chrono::{NaiveDate, NaiveTime};
use tauri_plugin_graphql::async_graphql::{self, Enum, Interface, SimpleObject};

#[derive(SimpleObject, Clone)]
pub struct Semester {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) year: i32,
    pub(crate) start_date: NaiveDate,
    pub(crate) end_date: NaiveDate,
    pub(crate) courses: Vec<String>,
    pub(crate) credit_blocks: Vec<CreditBlock>,
}

#[derive(SimpleObject, Clone)]
pub struct Course {
    id: String,
    name: String,
    year_of_level: i32,
    level: UniversityLevel,
    subject: String,
    description: String,
    requirements: CourseRequirements,
}

#[derive(SimpleObject, Clone)]
pub struct CourseRequirements {
    id: String,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum UniversityLevel {
    Undergraduate,
    Graduate,
    Doctoral,
}

#[derive(SimpleObject, Clone)]
pub struct CreditBlock {
    id: String,
    name: String,
    required_credits: i32,
    courses: Vec<String>,
}

#[derive(Interface)]
#[graphql(
    field(name = "id", type = "String"),
    field(name = "_type", type = "String"),
    field(name = "start_date", type = "&NaiveDate"),
    field(name = "end_date", type = "&NaiveDate"),
    field(name = "teacher", type = "String"),
    field(name = "location", type = "String"),
    field(name = "is_open", type = "&bool"),
    field(name = "time_slots", type = "&Vec<TimeSlot>"),
    field(name = "schedule_gaps", type = "&Vec<ScheduleGap>")
)]
pub enum Section {
    MainSection(MainSection),
    SubSection(SubSection),
}

#[derive(SimpleObject, Clone)]
pub struct MainSection {
    id: String,
    _type: String,
    start_date: NaiveDate,
    end_date: NaiveDate,
    teacher: String,
    location: String,
    is_open: bool,
    time_slots: Vec<TimeSlot>,
    schedule_gaps: Vec<ScheduleGap>,
    mid_term_exam: Option<Exam>,
    final_exam: Option<Exam>,
    sub_sections: Vec<SectionTypeTuple>
}

#[derive(SimpleObject, Clone)]
pub struct SubSection {
    id: String,
    _type: String,
    start_date: NaiveDate,
    end_date: NaiveDate,
    teacher: String,
    location: String,
    is_open: bool,
    time_slots: Vec<TimeSlot>,
    schedule_gaps: Vec<ScheduleGap>,
}

#[derive(SimpleObject, Clone)]
pub struct SectionTypeTuple {
    _type: String,
    sections: Vec<SubSection>,
}

#[derive(SimpleObject, Clone)]
pub struct TimeSlot {
    id: String,
    day_of_week: DayOfWeek,
    start_time: NaiveTime,
    end_time: NaiveTime,
    location: String,
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
    TBD
}

#[derive(SimpleObject, Clone)]
pub struct ScheduleGap {
    id: String,
    date: NaiveDate,
    reason: String,
}

#[derive(SimpleObject, Clone)]
pub struct Exam {
    id: String,
    date: NaiveDate,
    start_time: NaiveTime,
    end_time: NaiveTime,
    location: String,
}