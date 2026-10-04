import { createHash } from "node:crypto";
import { getDatabase, transaction, withActor } from "./database.mjs";
const tables = [
  "animals",
  "settings",
  "requests",
  "request_followup",
  "request_events",
  "media",
  "notifications",
  "documents",
  "revisions",
  "tasks",
];
export async function importSqliteExport(source, db = getDatabase()) {
  if (source.format !== "ames-sqlite-migration-v1")
    throw new Error("Format de migration inconnu.");
  const sha = createHash("sha256").update(JSON.stringify(source)).digest("hex");
  return withActor("Migration des deux applications", () =>
    transaction(db, async () => {
      await db.query("SELECT pg_advisory_xact_lock(41734175)");
      const prior = (
        await db.query("SELECT value FROM meta WHERE key='sqlite_import_sha'")
      ).rows[0]?.value;
      if (prior === sha) return { alreadyImported: true };
      if (
        prior ||
        (
          await db.query(
            "SELECT (SELECT count(*) FROM users)+(SELECT count(*) FROM documents)+(SELECT count(*) FROM animals)+(SELECT count(*) FROM requests) AS n",
          )
        ).rows[0].n
      )
        throw new Error(
          "La cible contient déjà des données. Migration interrompue sans écrasement.",
        );
      const names = new Set(),
        accounts = [];
      for (const user of source.workspace.users || []) {
        await db.query(
          "INSERT INTO users(id,username,name,password_hash,role,active) VALUES($1,$2,$3,$4,$5,$6)",
          [
            user.id,
            user.username,
            user.name,
            user.password_hash,
            user.role,
            user.active,
          ],
        );
        names.add(user.username);
      }
      for (const admin of source.site.admins || []) {
        let name = admin.username;
        while (names.has(name)) name = `site-${name}`;
        names.add(name);
        await db.query(
          "INSERT INTO users(id,username,name,password_hash,role) VALUES($1,$2,$3,$4,$5)",
          [admin.id, name, admin.username, admin.password_hash, "owner"],
        );
        accounts.push({ previous: admin.username, current: name });
      }
      const counts = {};
      for (const table of tables) {
        const rows = source.site[table] || source.workspace[table] || [];
        for (const row of rows) {
          const entries = Object.entries(row),
            columns = entries.map(([key]) => key);
          if (columns.some((c) => !/^[a-z_]+$/.test(c)))
            throw new Error("Colonne invalide.");
          const values = entries.map(([key, value]) =>
            key === "bytes" ? Buffer.from(value, "base64") : value,
          );
          await db.query(
            `INSERT INTO ${table}(${columns.join(",")}) VALUES(${columns.map((_, i) => `$${i + 1}`).join(",")})`,
            values,
          );
        }
        counts[table] = rows.length;
      }
      for (const row of source.workspace.meta || [])
        await db.query(
          "INSERT INTO meta(key,value) VALUES($1,$2) ON CONFLICT(key) DO NOTHING",
          [row.key, row.value],
        );
      for (const table of ["revisions", "request_events", "notifications"])
        await db.query(
          `SELECT setval(pg_get_serial_sequence('${table}','id'),coalesce(max(id),1),count(*)>0) FROM ${table}`,
        );
      // Old browser sessions are intentionally expired; passwords and ownership survive.
      await db.query(
        "INSERT INTO meta(key,value) VALUES('sqlite_import_sha',$1),('sqlite_import_report',$2)",
        [sha, JSON.stringify({ counts, accounts })],
      );
      return { imported: true, counts, accounts };
    }),
  );
}
