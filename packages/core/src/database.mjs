import pg from "pg";
import { AsyncLocalStorage } from "node:async_hooks";
const contexts = new AsyncLocalStorage();
pg.types.setTypeParser(1184, (value) => new Date(value).toISOString());
pg.types.setTypeParser(20, (value) => {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error("Integer outside safe range");
  return n;
});
export function withActor(actor, work) {
  return contexts.run({ ...contexts.getStore(), actor }, work);
}
export function setActor(actor) {
  const context = contexts.getStore();
  if (context) context.actor = actor;
}
export function openDatabase(connectionString = process.env.DATABASE_URL) {
  if (!connectionString?.startsWith("postgres"))
    throw new Error("DATABASE_URL PostgreSQL est requis. Aucun repli SQLite.");
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
  pool.on("error", (error) =>
    console.error("PostgreSQL pool:", error.code || error.name),
  );
  const db = {
    pool,
    connectionString,
    async query(sql, values = []) {
      const current = contexts.getStore();
      if (current?.db === db && current.client)
        return current.client.query(sql, values);
      if (/^\s*(INSERT|UPDATE|DELETE)\b/i.test(sql))
        return transaction(db, () => db.query(sql, values));
      return pool.query(sql, values);
    },
    close: () => pool.end(),
  };
  return db;
}
export async function transaction(db, work) {
  const previous = contexts.getStore();
  if (previous?.db === db && previous.client) return work();
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('ames.actor',$1,true)", [
      previous?.actor || "Système",
    ]);
    const result = await contexts.run({ ...previous, db, client }, work);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export function getDatabase() {
  const key = Symbol.for("ames.postgres");
  if (!globalThis[key]) globalThis[key] = openDatabase();
  return globalThis[key];
}
