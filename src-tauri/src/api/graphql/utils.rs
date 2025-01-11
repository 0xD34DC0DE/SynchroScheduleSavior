use async_graphql::dataloader::Loader;
use async_graphql::{Context, Result as GraphQLResult};
use sqlx::sqlite::SqliteRow;
use sqlx::{FromRow, Row, Sqlite};
use std::collections::HashMap;

pub(super) struct IdKeyGroupedRows<K, V>(anyhow::Result<HashMap<K, Vec<V>>>)
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

pub(super) async fn load_many_by_foreign_key<K, V, L>(
    ctx: &Context<'_>,
    fk: K,
) -> GraphQLResult<Vec<V>>
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

pub(super) async fn load_one_by_foreign_key<K, V, L>(
    ctx: &Context<'_>,
    fk: K,
) -> GraphQLResult<V>
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
