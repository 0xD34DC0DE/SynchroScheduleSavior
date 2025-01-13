pub use loaders::create_schema;
use tauri_plugin_graphql::async_graphql::connection::EmptyFields;
pub(self) use tauri_plugin_graphql::async_graphql::{
    EmptyMutation, EmptySubscription, Schema as GraphQLSchema,
};
use crate::api::graphql::mutations::MutationRoot;
use crate::api::graphql::queries::QueryRoot;

pub type Schema = GraphQLSchema<QueryRoot, MutationRoot, EmptySubscription>;

pub(super) mod objects;

mod resolvers;

mod loaders;

mod utils;

mod queries;

mod mutations;

mod input_objects;

