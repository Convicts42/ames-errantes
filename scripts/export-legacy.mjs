import { DatabaseSync, backup } from "node:sqlite";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const folder = resolve("data/migration");
mkdirSync(folder, { recursive: true });
const exportData = {
  format: "ames-sqlite-migration-v1",
  site: {},
  workspace: {},
};
for (const [key, path] of [
  ["site", "ame-errante/data/ame-errante.sqlite"],
  ["workspace", "ames-errantes-interne/data/projet.sqlite"],
]) {
  const original = new DatabaseSync(resolve(path), { readOnly: true });
  const snapshot = resolve(folder, `${key}-${Date.now()}.sqlite`);
  await backup(original, snapshot);
  original.close();
  const db = new DatabaseSync(snapshot, { readOnly: true });
  for (const { name } of db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
    .all()) {
    if (["sessions", "rate_limits", "limits"].includes(name)) continue;
    exportData[key][name] = db
      .prepare(`SELECT * FROM "${name}"`)
      .all()
      .map((row) => ({
        ...row,
        ...(row.bytes
          ? { bytes: Buffer.from(row.bytes).toString("base64") }
          : {}),
      }));
  }
  db.close();
}
writeFileSync(resolve(folder, "source.json"), JSON.stringify(exportData));
const counts = Object.fromEntries(
  ["site", "workspace"].map((key) => [
    key,
    Object.fromEntries(
      Object.entries(exportData[key]).map(([table, rows]) => [
        table,
        rows.length,
      ]),
    ),
  ]),
);
console.log(JSON.stringify(counts));
