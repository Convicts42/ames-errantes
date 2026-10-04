import { createHash } from "node:crypto";
import { getDatabase } from "/app/packages/core/src/database.mjs";
const db = getDatabase();
try {
  const names = (
    await db.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename",
    )
  ).rows.map((r) => r.tablename);
  const result = {};
  for (const name of names) {
    if (!/^[a-z_]+$/.test(name)) throw Error("Unexpected table");
    if (["sessions", "rate_limits", "maintenance"].includes(name)) continue;
    const rows = (
      await db.query(
        `SELECT to_jsonb(t)::text AS value FROM "${name}" t ORDER BY to_jsonb(t)::text`,
      )
    ).rows;
    const hash = createHash("sha256");
    for (const row of rows) hash.update(row.value).update("\n");
    result[name] = { count: rows.length, sha256: hash.digest("hex") };
  }
  console.log(JSON.stringify(result, null, 2));
} finally {
  await db.close();
}
