use anyhow::anyhow;
use async_graphql::futures_util::TryStreamExt;
use async_graphql::{
    dataloader::Loader, ComplexObject, Context, Enum, Interface, Result as GraphQLResult,
    SimpleObject,
};
use chrono::{NaiveDate, NaiveTime};
use derive_more::{Constructor, Display};
use itertools::{join, Itertools};
use sqlx::sqlite::SqliteRow;
use sqlx::{query, Error, FromRow, Pool, Row, Sqlite};
use std::collections::HashMap;

struct IdKeyGroupedRows<K, V>(anyhow::Result<HashMap<K, Vec<V>>>)
where
    K: Eq + std::hash::Hash + sqlx::Type<Sqlite>;

impl<K, V> Default for IdKeyGroupedRows<K, V>
where
    K: Eq + std::hash::Hash + sqlx::Type<Sqlite>,
{
    fn default() -> Self {
        Self(Ok(HashMap::new()))
    }
}

impl<K, V> TryFrom<IdKeyGroupedRows<K, V>> for HashMap<K, Vec<V>>
where
    K: Eq + std::hash::Hash + sqlx::Type<Sqlite>,
{
    type Error = async_graphql::Error;

    fn try_from(value: IdKeyGroupedRows<K, V>) -> Result<Self, Self::Error> {
        Ok(value.0?)
    }
}

impl<K, V> Extend<SqliteRow> for IdKeyGroupedRows<K, V>
where
    K: Eq + Clone + std::hash::Hash + sqlx::Type<Sqlite> + for<'a> sqlx::Decode<'a, Sqlite>,
    V: for<'b> FromRow<'b, SqliteRow>,
{
    fn extend<T: IntoIterator<Item = SqliteRow>>(&mut self, iter: T) {
        let rows = self.0.as_mut().unwrap();
        let result: Result<(), sqlx::Error> = iter.into_iter().try_for_each(|row| {
            let fk: K = row.try_get::<K, usize>(0)?.clone();
            let value = V::from_row(&row)?;
            rows.entry(fk).or_default().push(value);
            Ok(())
        });

        if let Err(err) = result {
            self.0 = Err(err.into());
        }
    }
}

async fn load_many_by_foreign_key<K, V, L>(ctx: &Context<'_>, fk: K) -> GraphQLResult<Vec<V>>
where
    K: Eq
        + std::hash::Hash
        + Clone
        + Send
        + Sync
        + sqlx::Type<Sqlite>
        + for<'a> sqlx::Decode<'a, Sqlite>
        + 'static,
    V: for<'b> FromRow<'b, SqliteRow>,
    L: Loader<K, Value = Vec<V>, Error = async_graphql::Error>,
{
    Ok(ctx
        .data_unchecked::<L>()
        .load(&[fk.clone()])
        .await?
        .remove(&fk)
        .unwrap_or_default())
}

async fn load_one_by_foreign_key<K, V, L>(ctx: &Context<'_>, fk: K) -> GraphQLResult<V>
where
    K: Eq
        + std::hash::Hash
        + Clone
        + Send
        + Sync
        + sqlx::Type<Sqlite>
        + for<'a> sqlx::Decode<'a, Sqlite>
        + 'static,
    V: for<'b> FromRow<'b, SqliteRow>,
    L: Loader<K, Value = V, Error = async_graphql::Error>,
{
    Ok(ctx
        .data_unchecked::<L>()
        .load(&[fk.clone()])
        .await?
        .remove(&fk)
        .ok_or(async_graphql::Error::new("No value found"))?)
}

pub(super) mod sql {
    use super::*;
    use sqlx::query::Query;
    use sqlx::sqlite::{SqliteArguments, SqliteConnectOptions, SqlitePoolOptions};
    use sqlx::Executor;

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
}

#[derive(sqlx::Type, async_graphql::NewType, Clone, Eq, PartialEq, Hash, Display)]
#[sqlx(transparent)]
pub(crate) struct SemesterId(String);

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

#[ComplexObject]
impl Semester {
    async fn credit_blocks(&self, ctx: &Context<'_>) -> GraphQLResult<Vec<CreditBlock>> {
        load_many_by_foreign_key::<SemesterId, CreditBlock, CreditBlockLoader>(ctx, self.id.clone())
            .await
    }

    async fn courses(&self, ctx: &Context<'_>) -> GraphQLResult<Vec<Course>> {
        load_many_by_foreign_key::<SemesterId, Course, CourseLoader>(ctx, self.id.clone()).await
    }
}

#[derive(Constructor)]
pub(crate) struct SemesterLoader(Pool<Sqlite>);

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

#[derive(sqlx::Type, async_graphql::NewType, Clone, Eq, PartialEq, Hash, Display)]
#[sqlx(transparent)]
pub(crate) struct CreditBlockId(String);

#[derive(sqlx::FromRow, SimpleObject, Clone)]
#[graphql(complex)]
pub struct CreditBlock {
    /// The ID of the credit block.\
    /// _Example_: `76A`
    id: CreditBlockId,

    /// The name of the credit block.\
    /// _Example_: `Interfaces et bases de données`
    name: String,

    /// The number of credits required to complete the credit block.
    required_credits: i32,
}

#[ComplexObject]
impl CreditBlock {
    async fn courses(&self, ctx: &Context<'_>) -> GraphQLResult<Vec<Course>> {
        load_many_by_foreign_key::<CreditBlockId, Course, CourseLoader>(ctx, self.id.clone()).await
    }
}

#[derive(Constructor)]
pub(crate) struct CreditBlockLoader(Pool<Sqlite>);

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

#[derive(sqlx::Type, async_graphql::NewType, Clone, Eq, PartialEq, Hash, Display)]
#[sqlx(transparent)]
pub(crate) struct CourseId(String);

#[derive(sqlx::FromRow, SimpleObject, Clone)]
#[graphql(complex)]
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
}

#[ComplexObject]
impl Course {
    /// The requirements to take the course.
    async fn requirements(&self, ctx: &Context<'_>) -> GraphQLResult<CourseRequirements> {
        load_one_by_foreign_key::<CourseId, CourseRequirements, CourseRequirementsLoader>(
            ctx,
            self.id.clone(),
        )
        .await
    }

    /// The list of main sections of the course.
    async fn sections(&self, ctx: &Context<'_>) -> GraphQLResult<Vec<MainSection>> {
        Ok(
            load_many_by_foreign_key::<CourseId, Section, SectionLoader>(ctx, self.id.clone())
                .await?
                .into_iter()
                .map(|section| match section {
                    Section::MainSection(main_section) => main_section,
                    Section::SubSection(_) => panic!("Got a subsection instead of a main section"),
                })
                .collect(),
        )
    }
}

#[derive(Constructor)]
pub(crate) struct CourseLoader(Pool<Sqlite>);

impl Loader<CourseId> for CourseLoader {
    type Value = Course;
    type Error = async_graphql::Error;

    async fn load(&self, keys: &[CourseId]) -> Result<HashMap<CourseId, Self::Value>, Self::Error> {
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

#[derive(sqlx::FromRow, SimpleObject, Clone)]
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

#[derive(Constructor)]
pub(crate) struct CourseRequirementsLoader(Pool<Sqlite>);

impl Loader<CourseId> for CourseRequirementsLoader {
    type Value = CourseRequirements;
    type Error = async_graphql::Error;

    async fn load(&self, keys: &[CourseId]) -> Result<HashMap<CourseId, Self::Value>, Self::Error> {
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

#[derive(Interface, Clone)]
#[graphql(
    field(name = "id", ty = "&SectionId"),
    field(name = "section_type", ty = "&SectionType"),
    field(name = "start_date", ty = "&NaiveDate"),
    field(name = "end_date", ty = "&NaiveDate"),
    field(name = "teacher", ty = "String"),
    field(name = "location", ty = "String"),
    field(name = "is_open", ty = "&bool"),
    field(name = "time_slots", ty = "Vec<TimeSlot>"),
    field(name = "schedule_gaps", ty = "Vec<ScheduleGap>")
)]
pub enum Section {
    MainSection(MainSection),
    SubSection(SubSection),
}

impl Section {
    pub fn section_id(&self) -> &SectionId {
        match self {
            Section::MainSection(main_section) => &main_section.id,
            Section::SubSection(sub_section) => &sub_section.id,
        }
    }
}

impl FromRow<'_, SqliteRow> for Section {
    fn from_row(row: &'_ SqliteRow) -> Result<Self, Error> {
        let section_type: SectionType = row.try_get("object_type")?;

        match section_type {
            SectionType::MainSection => Ok(Section::MainSection(MainSection::from_row(row)?)),
            SectionType::SubSection => Ok(Section::SubSection(SubSection::from_row(row)?)),
        }
    }
}

#[derive(sqlx::Type, async_graphql::NewType, Clone, Eq, PartialEq, Hash, Display)]
#[sqlx(transparent)]
pub(crate) struct SectionId(String);

#[derive(sqlx::Type, async_graphql::NewType, Clone, Eq, PartialEq, Hash, Display)]
#[sqlx(transparent)]
pub(crate) struct MainSectionId(String);

impl Into<MainSectionId> for SectionId {
    fn into(self) -> MainSectionId {
        MainSectionId(self.0)
    }
}

#[derive(sqlx::Type, Enum, Copy, Clone, Eq, PartialEq)]
pub(crate) enum SectionType {
    MainSection,
    SubSection,
}

#[derive(sqlx::FromRow, SimpleObject, Clone)]
#[graphql(complex)]
pub struct MainSection {
    /// The ID of the main section.\
    /// _Example_: `A-TH-13046`
    id: SectionId,

    /// The type of the section.\
    /// _Example_: `TH`
    section_type: SectionType,

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
}

#[ComplexObject]
impl MainSection {
    /// The list of time slots for the section.
    async fn time_slots(&self, ctx: &Context<'_>) -> Result<Vec<TimeSlot>, anyhow::Error> {
        load_many_by_foreign_key::<SectionId, TimeSlot, TimeSlotLoader>(ctx, self.id.clone())
            .await
            .map_err(|e| anyhow!(e.message))
    }

    /// The list of schedule gaps for the section's time slots which simplifies
    /// the schedule of the section, by indicating when the section is not
    /// held instead of splitting the time slots to introduce gaps.
    async fn schedule_gaps(&self, ctx: &Context<'_>) -> Result<Vec<ScheduleGap>, anyhow::Error> {
        load_many_by_foreign_key::<SectionId, ScheduleGap, ScheduleGapLoader>(ctx, self.id.clone())
            .await
            .map_err(|e| anyhow!(e.message))
    }

    /// The midterm exam of the section.
    async fn mid_term_exam(&self, ctx: &Context<'_>) -> GraphQLResult<Option<Exam>> {
        Ok(
            load_many_by_foreign_key::<SectionId, Exam, ExamLoader>(ctx, self.id.clone())
                .await?
                .into_iter()
                .find(|exam: &Exam| exam.is_of_type(ExamType::MidTerm)),
        )
    }

    /// The final exam of the section.
    async fn final_exam(&self, ctx: &Context<'_>) -> GraphQLResult<Option<Exam>> {
        Ok(
            load_many_by_foreign_key::<SectionId, Exam, ExamLoader>(ctx, self.id.clone())
                .await?
                .into_iter()
                .find(|exam: &Exam| exam.is_of_type(ExamType::Final)),
        )
    }

    /// The list of subsections associated with this main section.
    async fn sub_sections(&self, ctx: &Context<'_>) -> GraphQLResult<Vec<SectionTypeTuple>> {
        Ok(
            load_many_by_foreign_key::<MainSectionId, SubSection, SectionLoader>(
                ctx,
                self.id.clone().into(),
            )
            .await?
            .into_iter()
            .chunk_by(|sub_section| sub_section.section_type.clone())
            .into_iter()
            .map(|(section_type, sections)| SectionTypeTuple {
                _type: section_type,
                sections: sections.collect(),
            })
            .collect(),
        )
    }
}

#[derive(sqlx::FromRow, SimpleObject, Clone)]
#[graphql(complex)]
pub struct SubSection {
    /// See [MainSection]
    id: SectionId,

    /// See [MainSection]
    section_type: SectionType,

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
}

#[ComplexObject]
impl SubSection {
    /// See [MainSection]
    async fn time_slots(&self, ctx: &Context<'_>) -> Result<Vec<TimeSlot>, anyhow::Error> {
        load_many_by_foreign_key::<SectionId, TimeSlot, TimeSlotLoader>(ctx, self.id.clone())
            .await
            .map_err(|e| anyhow!(e.message))
    }

    /// See [MainSection]
    async fn schedule_gaps(&self, ctx: &Context<'_>) -> Result<Vec<ScheduleGap>, anyhow::Error> {
        load_many_by_foreign_key::<SectionId, ScheduleGap, ScheduleGapLoader>(ctx, self.id.clone())
            .await
            .map_err(|e| anyhow!(e.message))
    }
}

#[derive(Constructor)]
pub(crate) struct SectionLoader(Pool<Sqlite>);

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

    async fn load(&self, keys: &[CourseId]) -> Result<HashMap<CourseId, Self::Value>, Self::Error> {
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

#[derive(sqlx::FromRow, SimpleObject, Clone)]
pub struct SectionTypeTuple {
    /// The type of the subsections.\
    /// _Example_: `TP`
    _type: SectionType,

    /// Subsections of `_type` associated with the main section.
    sections: Vec<SubSection>,
}

pub(crate) type TimeSlotId = i32;

#[derive(sqlx::FromRow, SimpleObject, Clone)]
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

#[derive(Constructor)]
pub(crate) struct TimeSlotLoader(Pool<Sqlite>);

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

#[derive(sqlx::Type, async_graphql::NewType, Clone, Eq, PartialEq, Hash, Display)]
#[sqlx(transparent)]
pub(crate) struct ScheduleGapId(i32);

#[derive(sqlx::FromRow, SimpleObject, Clone)]
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

#[derive(Constructor)]
pub(crate) struct ScheduleGapLoader(Pool<Sqlite>);

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

#[derive(sqlx::Type, async_graphql::NewType, Clone, Eq, PartialEq, Hash, Display)]
#[sqlx(transparent)]
pub(crate) struct ExamId(i32);

#[derive(sqlx::FromRow, SimpleObject, Clone)]
pub struct Exam {
    /// The ID of the exam.\
    id: ExamId,

    /// The ID of the section that the exam is associated with.\
    /// _Example_: `A-TH-13046`
    section_id: SectionId,

    /// The type of the exam.\
    /// _Example_: `MidTerm`
    exam_type: ExamType,

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

impl Exam {
    pub(crate) fn is_of_type(&self, exam_type: ExamType) -> bool {
        self.exam_type == exam_type
    }
}

#[derive(Constructor)]
pub(crate) struct ExamLoader(Pool<Sqlite>);

impl Loader<ExamId> for ExamLoader {
    type Value = Exam;
    type Error = async_graphql::Error;

    async fn load(&self, keys: &[ExamId]) -> Result<HashMap<ExamId, Self::Value>, Self::Error> {
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

#[derive(sqlx::Type, Enum, Copy, Clone, Eq, PartialEq)]
pub enum UniversityLevel {
    Undergraduate,
    Graduate,
    Doctoral,
}

#[derive(sqlx::Type, Enum, Copy, Clone, Eq, PartialEq)]
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

#[derive(sqlx::Type, Enum, Copy, Clone, Eq, PartialEq)]
pub enum ExamType {
    MidTerm,
    Final,
}
