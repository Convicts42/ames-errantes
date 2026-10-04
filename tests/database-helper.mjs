import { randomUUID } from "node:crypto";
import { openDatabase } from "../packages/core/src/database.mjs";
import { migrate } from "../packages/core/src/migrate.mjs";

// All writes are isolated from the association's database, including failed tests.
export async function isolatedDatabase(work) {
  const control = openDatabase();
  const name = `ames_test_${randomUUID().replaceAll("-", "")}`;
  const url = new URL(control.connectionString);
  url.pathname = `/${name}`;
  let db;
  try {
    await control.query(`CREATE DATABASE ${name}`);
    db = openDatabase(url.href);
    await migrate(db);
    return await work(db);
  } finally {
    if (db) await db.close();
    await control.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    await control.close();
  }
}
