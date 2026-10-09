import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { migrate } from "./migrate.mjs";
import { getDatabase } from "./database.mjs";
import { hasUsers, bootstrap } from "./auth.mjs";
const db = getDatabase();
try {
  await migrate(db);
  const pending = (await db.query("SELECT value FROM meta WHERE key='setup'"))
    .rows[0];
  if (!(await hasUsers(db)) && !pending) {
    const code = await bootstrap(db);
    const folder = process.env.APP_DATA || "/data";
    mkdirSync(folder, { recursive: true });
    writeFileSync(
      resolve(folder, "acces-initial.txt"),
      `Âmes errantes — code initial valable 7 jours :\n${code}\n`,
    );
    console.log("Code initial écrit dans le volume privé.");
  }
  console.log("PostgreSQL prêt.");
} finally {
  await db.close();
}
