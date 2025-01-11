pub use loaders::create_schema;
use tauri_plugin_graphql::async_graphql::connection::EmptyFields;
pub(self) use tauri_plugin_graphql::async_graphql::{
    EmptyMutation, EmptySubscription, Schema as GraphQLSchema,
};

pub type Schema = GraphQLSchema<EmptyFields, EmptyMutation, EmptySubscription>;

pub(super) mod objects;
mod resolvers;

mod loaders;

mod utils;

