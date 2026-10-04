import { getDatabase } from "./database.mjs";
import { createBackup } from "./site/maintenance.mjs";
const db = getDatabase();
try {
  console.log(await createBackup(db));
} finally {
  await db.close();
}
