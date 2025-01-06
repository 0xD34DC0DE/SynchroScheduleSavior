use crate::api::query::Query;
use tauri_plugin_graphql::async_graphql::{EmptyMutation, EmptySubscription, Schema};

pub fn create_schema() -> Schema<Query, EmptyMutation, EmptySubscription> {
    Schema::build(Query, EmptyMutation, EmptySubscription)
        .finish()
}


