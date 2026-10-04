import { spawn } from "node:child_process";
import { mkdir, readdir, unlink } from "node:fs/promises";
import { resolve, join } from "node:path";
import { getDatabase, transaction } from "../database.mjs";
import { getSettings } from "./settings.mjs";
import { dispatchNotifications } from "./notifications.mjs";
const state = (db, key, value) =>
  db.query(
    "INSERT INTO maintenance(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    [key, String(value)],
  );
export async function maintenanceState(db = getDatabase()) {
  return {
    ...Object.fromEntries(
      (await db.query("SELECT * FROM maintenance")).rows.map(
        ({ key, value }) => [key, value],
      ),
    ),
    externalBackupConfigured: !!process.env.BACKUP_DIRECTORY,
    automatic: process.env.DISABLE_MAINTENANCE !== "true",
  };
}
function pgEnvironment(db) {
  const u = new URL(db.connectionString);
  return {
    ...process.env,
    PGHOST: u.hostname,
    PGPORT: u.port || "5432",
    PGUSER: decodeURIComponent(u.username),
    PGPASSWORD: decodeURIComponent(u.password),
    PGDATABASE: decodeURIComponent(u.pathname.slice(1)),
  };
}
function command(name, args, env) {
  return new Promise((resolve, reject) => {
    const p = spawn(name, args, {
      env,
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true,
    });
    let error = "";
    p.stderr.on("data", (x) => (error += x.toString().slice(0, 500)));
    p.on("error", reject);
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${name} a échoué (${code}).`)),
    );
  });
}
export async function createBackup(
  db = getDatabase(),
  folder = process.env.BACKUP_DIRECTORY || "/data/backups",
) {
  await mkdir(folder, { recursive: true });
  const file = join(
    folder,
    `ames-auto-${new Date().toISOString().replace(/[:.]/g, "-")}.dump`,
  );
  await command(
    "pg_dump",
    ["--format=custom", "--no-owner", "--no-acl", "--file", file],
    pgEnvironment(db),
  );
  await command("pg_restore", ["--list", file], pgEnvironment(db));
  await state(db, "lastBackup", new Date().toISOString());
  await state(db, "backupError", "");
  const files = (await readdir(folder))
    .filter((name) => /^ames-auto-\d{4}-\d{2}-\d{2}T[\dZ-]+\.dump$/.test(name))
    .sort()
    .reverse();
  for (const old of files.slice(14)) await unlink(resolve(folder, old));
  return file;
}
export async function purgeExpired(db = getDatabase(), now = Date.now()) {
  const s = await getSettings(db);
  if (!s.purgeEnabled) return 0;
  const { rowCount } = await db.query(
    "DELETE FROM requests WHERE status='closed' AND id IN(SELECT request_id FROM request_followup WHERE closed_at<$1)",
    [new Date(now - s.retentionDays * 86400000).toISOString()],
  );
  await state(db, "lastPurge", new Date(now).toISOString());
  return rowCount;
}
export async function maintain(db = getDatabase()) {
  // A dedicated worker owns the lock: two processes cannot dispatch the same job.
  const client = await db.pool.connect();
  try {
    if (
      !(await client.query("SELECT pg_try_advisory_lock(41739999) AS locked"))
        .rows[0].locked
    )
      return;
    try {
      await state(db, "lastRun", new Date().toISOString());
      await purgeExpired(db);
      await dispatchNotifications(db);
      const last = (
        await db.query("SELECT value FROM maintenance WHERE key='lastBackup'")
      ).rows[0]?.value;
      if (!last || Date.now() - Date.parse(last) > 86400000) {
        try {
          await createBackup(db);
        } catch {
          await state(
            db,
            "backupError",
            "La sauvegarde a échoué. Vérifiez le volume de sauvegardes et son espace libre.",
          );
        }
      }
    } finally {
      await client.query("SELECT pg_advisory_unlock(41739999)");
    }
  } finally {
    client.release();
  }
}
export function startMaintenance() {
  // Web processes only report state. Compose runs one explicit worker.
  if (process.env.RUN_MAINTENANCE_WORKER !== "true") return;
  const key = Symbol.for("ames.worker");
  if (globalThis[key]) return;
  const tick = () =>
    maintain().catch((error) =>
      console.error("Maintenance:", error.code || error.name),
    );
  globalThis[key] = setInterval(tick, 60000);
  void tick();
}
