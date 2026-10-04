import { randomUUID } from "node:crypto";
import { legacyFixture } from "./fixtures/legacy.mjs";
import { openDatabase } from "../packages/core/src/database.mjs";
import { migrate } from "../packages/core/src/migrate.mjs";
import { importSqliteExport } from "../packages/core/src/legacy-import.mjs";
import { createUser } from "../packages/core/src/auth.mjs";
const control = openDatabase();
let db;
try {
  if (process.argv[2] === "drop") {
    const name = process.argv[3];
    if (!/^ames_qa_[a-f0-9]{32}$/.test(name))
      throw new Error("Refusing unsafe test database name");
    await control.query(`DROP DATABASE ${name} WITH (FORCE)`);
  } else {
    const name = `ames_qa_${randomUUID().replaceAll("-", "")}`;
    await control.query(`CREATE DATABASE ${name}`);
    const url = new URL(control.connectionString);
    url.pathname = `/${name}`;
    db = openDatabase(url.href);
    await migrate(db);
    await importSqliteExport(legacyFixture(), db);
    await createUser(
      { username: "qa-owner", name: "QA", password: "Only-test-Password-456" },
      "owner",
      db,
    );
    console.log(name);
  }
} finally {
  if (db) await db.close();
  await control.close();
}
