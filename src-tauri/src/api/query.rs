use crate::api::fields::Semester;
use tauri_plugin_graphql::async_graphql::{self, Object, Result as GraphQLResult};

pub struct Query;

#[Object]
impl Query {
    async fn semesters(&self) -> GraphQLResult<Vec<Semester>> {
        Ok(vec![
            Semester {
                id: "1".to_string(),
                name: "First Semester".to_string(),
                courses: vec![],
                credit_blocks: vec![],
                end_date: "2021-12-31".parse().unwrap(),
                start_date: "2021-01-01".parse().unwrap(),
                year: 2021,
            },
            Semester {
                id: "2".to_string(),
                name: "Second Semester".to_string(),
                courses: vec![],
                credit_blocks: vec![],
                end_date: "2022-12-31".parse().unwrap(),
                start_date: "2022-01-01".parse().unwrap(),
                year: 2022,
            },
        ])
    }
}
