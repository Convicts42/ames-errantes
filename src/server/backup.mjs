import { backup } from "node:sqlite";
import { mkdir, readdir, unlink } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { getDatabase, databasePath } from "./database.mjs";

export async function backupDatabase(
  db = getDatabase(),
  directory = resolve(dirname(databasePath()), "backups"),
  prefix = "manual",
) {
  await mkdir(directory, { recursive: true });
  const filename = `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`;
  const destination = join(directory, filename);
  await backup(db, destination);
  return destination;
}
export async function maybeBackup() {
  const key = Symbol.for("ames.interne.backup");
  if (process.env.DISABLE_BACKUPS === "true" || globalThis[key]) return;
  const db = getDatabase(),
    day = new Date().toISOString().slice(0, 10);
  if (
    db.prepare("SELECT value FROM meta WHERE key='backup_day'").get()?.value ===
    day
  )
    return;
  globalThis[key] = true;
  try {
    const directory = resolve(dirname(databasePath()), "backups");
    await backupDatabase(db, directory, "auto");
    db.prepare(
      "INSERT INTO meta(key,value) VALUES('backup_day',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    ).run(day);
    const files = (await readdir(directory))
      .filter((f) => /^auto-\d{4}-\d{2}-\d{2}T[\d-Z]+\.sqlite$/.test(f))
      .sort()
      .reverse();
    for (const file of files.slice(14)) await unlink(join(directory, file));
  } catch (error) {
    console.error("Automatic backup failed:", error.code || error.name);
  } finally {
    globalThis[key] = false;
  }
}
