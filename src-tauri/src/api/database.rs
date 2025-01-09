use anyhow::Result;
use sqlx::error::BoxDynError;
use sqlx::query::Query;
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::{sqlite::SqlitePoolOptions, Execute, Executor, Pool, Sqlite};

pub struct Database {
    pool: Pool<Sqlite>,
}

impl Database {
    pub(crate) async fn new(
        database_url: &str,
        table_definitions: Vec<SQLTableDefinition>,
    ) -> Result<Self> {
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
        for table_definition in table_definitions {
            transaction.execute(table_definition).await?;
        }

        transaction.commit().await?;

        Ok(Self { pool })
    }

    pub(crate) fn pool(&self) -> &Pool<Sqlite> {
        &self.pool
    }
}

pub(crate) type TableDefinitionQuery =
    Query<'static, Sqlite, sqlx::sqlite::SqliteArguments<'static>>;

pub(crate) struct SQLTableDefinition {
    table_definition: TableDefinitionQuery,
}

impl<'q> Execute<'q, Sqlite> for SQLTableDefinition {
    fn sql(&self) -> &'q str {
        self.table_definition.sql()
    }

    fn statement(&self) -> Option<&<Sqlite as sqlx::Database>::Statement<'q>> {
        self.table_definition.statement()
    }

    fn take_arguments(
        &mut self,
    ) -> std::result::Result<Option<<Sqlite as sqlx::Database>::Arguments<'q>>, BoxDynError> {
        Ok(None)
    }

    fn persistent(&self) -> bool {
        false
    }
}

pub(crate) trait SQLTable {
    fn table_definition() -> TableDefinitionQuery;
}

pub(crate) trait TableDefinition {
    fn get_table_definition() -> SQLTableDefinition;
}

impl<T> TableDefinition for T
where
    T: SQLTable,
{
    fn get_table_definition() -> SQLTableDefinition {
        SQLTableDefinition {
            table_definition: T::table_definition(),
        }
    }
}
