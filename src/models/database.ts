import Database from "tauri-plugin-sql-api";

const db = await Database.load("sqlite:data.db");

await db.execute("CREATE TABLE IF NOT EXISTS semesters (id TEXT PRIMARY KEY, name TEXT)");

export default db;