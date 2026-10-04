import { readFile } from "node:fs/promises";
import { getDatabase, transaction } from "./database.mjs";
export async function migrate(db = getDatabase()) {
  await transaction(db, async () => {
    await db.query("SELECT pg_advisory_xact_lock(41734174)");
    const exists = (
      await db.query("SELECT to_regclass('public.schema_migrations') AS name")
    ).rows[0].name;
    if (!exists)
      await db.query(
        await readFile(
          new URL("./migrations/001.sql", import.meta.url),
          "utf8",
        ),
      );
    const version = (
      await db.query("SELECT max(version) AS version FROM schema_migrations")
    ).rows[0].version;
    if (version !== 1) throw new Error("Version de base incompatible.");
  });
}
