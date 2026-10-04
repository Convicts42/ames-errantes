import { backup, DatabaseSync } from "node:sqlite";
import { mkdir, readdir, unlink } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { getDatabase, databasePath } from "./database.mjs";
import { getSettings } from "./settings.mjs";
import { dispatchNotifications } from "./notifications.mjs";

const state = (db, key, value) =>
  db
    .prepare(
      "INSERT INTO maintenance(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    )
    .run(key, String(value));
export function maintenanceState(db = getDatabase()) {
  return {
    ...Object.fromEntries(
      db
        .prepare("SELECT * FROM maintenance")
        .all()
        .map(({ key, value }) => [key, value]),
    ),
    externalBackupConfigured: !!process.env.BACKUP_DIRECTORY,
    automatic: process.env.DISABLE_MAINTENANCE !== "true",
  };
}
export async function createBackup(
  db = getDatabase(),
  folder = process.env.BACKUP_DIRECTORY ||
    resolve(/*turbopackIgnore: true*/ dirname(databasePath()), "backups"),
) {
  await mkdir(folder, { recursive: true });
  const target = resolve(
    /*turbopackIgnore: true*/ folder,
    `ame-errante-auto-${new Date().toISOString().replaceAll(":", "-")}-${randomUUID()}.sqlite`,
  );
  await backup(db, target);
  const copy = new DatabaseSync(target, { readOnly: true });
  try {
    if (copy.prepare("PRAGMA integrity_check").get().integrity_check !== "ok")
      throw new Error("Backup integrity failed");
  } finally {
    copy.close();
  }
  state(db, "lastBackup", new Date().toISOString());
  state(db, "backupError", "");
  // Only rotate this job's archives; never touch manually named backups.
  const entries = (await readdir(folder))
    .filter((name) =>
      /^ame-errante-auto-\d{4}-\d{2}-\d{2}T[\d.Z-]+-[a-f0-9-]{36}\.sqlite$/.test(
        name,
      ),
    )
    .sort()
    .reverse();
  for (const name of entries.slice(14))
    await unlink(resolve(/*turbopackIgnore: true*/ folder, name));
  return target;
}
export function purgeExpired(db = getDatabase(), now = Date.now()) {
  const s = getSettings(db);
  if (!s.purgeEnabled) return 0;
  const cutoff = new Date(now - s.retentionDays * 86400000).toISOString();
  const result = db
    .prepare(
      "DELETE FROM requests WHERE status='closed' AND id IN (SELECT request_id FROM request_followup WHERE closed_at < ?)",
    )
    .run(cutoff);
  state(db, "lastPurge", new Date(now).toISOString());
  return result.changes;
}
export async function maintain(db = getDatabase()) {
  state(db, "lastRun", new Date().toISOString());
  purgeExpired(db);
  await dispatchNotifications(db);
  const last = db
    .prepare("SELECT value FROM maintenance WHERE key='lastBackup'")
    .get()?.value;
  if (!last || Date.now() - Date.parse(last) > 86400000) {
    try {
      await createBackup(db);
    } catch {
      state(
        db,
        "backupError",
        "La sauvegarde a échoué. Vérifiez le dossier et les droits d’accès.",
      );
    }
  }
}
export function startMaintenance() {
  if (process.env.DISABLE_MAINTENANCE === "true") return;
  const key = Symbol.for("ame-errante.maintenance");
  if (globalThis[key]) return;
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await maintain();
    } catch {
      console.error("Maintenance: opération interrompue.");
    } finally {
      running = false;
    }
  };
  globalThis[key] = setInterval(tick, 60000);
  globalThis[key].unref();
  void tick();
}
