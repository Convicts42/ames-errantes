import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { seedAnimals } from "./seed.mjs";

export function databasePath() {
  // Runtime data lives on a persistent volume, never in the deployment bundle.
  return resolve(
    /*turbopackIgnore: true*/ process.env.DATABASE_PATH ||
      "./data/ame-errante.sqlite",
  );
}

export function transaction(db, action) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = action();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function openDatabase(path = databasePath()) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(
    "PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;",
  );
  transaction(db, () => {
    const { user_version: version } = db.prepare("PRAGMA user_version").get();
    if (version > 2)
      throw new Error("Database schema is newer than this application.");
    if (version === 0) {
      db.exec(`
        CREATE TABLE animals (
          slug TEXT PRIMARY KEY, content TEXT NOT NULL CHECK(json_valid(content)),
          published INTEGER NOT NULL CHECK(published IN (0,1)),
          status TEXT NOT NULL CHECK(status IN ('available','reserved','adopted')),
          version INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
          updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        );
        CREATE TABLE admins (
          id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL
        );
        CREATE TABLE sessions (
          token_hash TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
          expires_at INTEGER NOT NULL
        );
        CREATE INDEX sessions_expiry ON sessions(expires_at);
        CREATE TABLE requests (
          id TEXT PRIMARY KEY, idempotency_key TEXT NOT NULL UNIQUE, payload_hash TEXT NOT NULL,
          kind TEXT NOT NULL CHECK(kind IN ('contact','meeting')),
          animal_slug TEXT REFERENCES animals(slug) ON DELETE SET NULL,
          payload TEXT NOT NULL CHECK(json_valid(payload)),
          status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','in_progress','closed')),
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        );
        CREATE INDEX requests_created ON requests(created_at DESC);
        CREATE TABLE rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
      `);
      const insert = db.prepare(
        "INSERT INTO animals(slug, content, published, status) VALUES(?,?,?,?)",
      );
      for (const animal of seedAnimals)
        insert.run(animal.slug, JSON.stringify(animal), 1, animal.status);
      db.exec("PRAGMA user_version = 1");
    }
    if (version < 2) {
      db.exec(`
        CREATE TABLE settings (id INTEGER PRIMARY KEY CHECK(id=1), content TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1);
        CREATE TABLE request_followup (
          request_id TEXT PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
          content TEXT NOT NULL DEFAULT '{}', version INTEGER NOT NULL DEFAULT 1,
          closed_at TEXT
        );
        CREATE TABLE request_events (
          id INTEGER PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
          actor TEXT NOT NULL, description TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        );
        CREATE TABLE media (id TEXT PRIMARY KEY, bytes BLOB NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
        CREATE TABLE notifications (
          id INTEGER PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
          audience TEXT NOT NULL CHECK(audience IN ('team','applicant')),
          recipient TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
          next_attempt INTEGER NOT NULL DEFAULT 0, provider_id TEXT, error TEXT,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
          UNIQUE(request_id,audience,recipient)
        );
        CREATE TABLE maintenance (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        PRAGMA user_version = 2;
      `);
    }
  });
  return db;
}

export function getDatabase() {
  const key = Symbol.for("ame-errante.database");
  const path = databasePath();
  if (!globalThis[key] || globalThis[key].path !== path) {
    globalThis[key]?.db.close();
    globalThis[key] = { path, db: openDatabase(path) };
  }
  return globalThis[key].db;
}
