use super::objects::*;
use async_graphql::{Context, Object, Result as GraphQLResult};
use chrono::NaiveDate;
use sqlx::Sqlite;

type Pool = sqlx::Pool<Sqlite>;

struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn semesters(&self, ctx: &Context<'_>) -> GraphQLResult<Vec<Semester>> {
        let pool = ctx.data::<Pool>()?;
        let mut conn = pool.acquire().await?;

        let semesters = sqlx::query_as!(
            Semester,
            /*language=SQLite*/
            r#"
            SELECT
                id,
                name,
                year,
                start_date as "start_date: NaiveDate",
                end_date as "end_date: NaiveDate"
            FROM semesters
            "#,
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(semesters)
    }
}


#[cfg(test)]
mod test {
    use sqlx::pool::PoolConnection;
    use super::*;

    #[sqlx::test]
    async fn get_semesters(mut conn: PoolConnection<Sqlite>) -> Result<(), sqlx::Error> {
        // Arrange
        sqlx::query!(
            /*language=SQLite*/
            r#"
            INSERT INTO semesters (id, name, year, start_date, end_date)
            VALUES
                ('Automne2024', 'Automne', 2024, '2024-08-26', '2024-12-13'),
                ('Hiver2025', 'Hiver', 2025, '2025-01-06', '2025-04-18')
            "#,
        ).execute(&mut *conn).await?;
        
        // Act
        let semesters = sqlx::query_as!(
            Semester,
            /*language=SQLite*/
            r#"
            SELECT
                id,
                name,
                year,
                start_date as "start_date: NaiveDate",
                end_date as "end_date: NaiveDate"
            FROM semesters
            "#,
        )
        .fetch_all(&mut *conn)
        .await?;

        // Assert
        assert_eq!(semesters.len(), 2);
        
        let semester_ids: Vec<String> = semesters.iter().map(|s| s.id.to_string()).collect();
        
        assert!(semester_ids.contains(&"Automne2024".to_string()));
        assert!(semester_ids.contains(&"Hiver2025".to_string()));

        Ok(())
    }
    
}