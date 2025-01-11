use async_graphql::InputObject;
use chrono::NaiveDate;

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