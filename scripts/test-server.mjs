import { createServer } from "node:http";
import next from "next";
import { readFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { resolve, join } from "node:path";
import { openDatabase } from "../src/server/database.mjs";
import { createUser } from "../src/server/auth.mjs";
import { importDocuments } from "../src/server/store.mjs";

mkdirSync("data/test-runs", { recursive: true });
process.env.DATABASE_PATH = join(
  mkdtempSync(resolve("data/test-runs/browser-")),
  "project.sqlite",
);
process.env.COOKIE_SECURE = "false";
process.env.DISABLE_BACKUPS = "true";
process.env.APP_ORIGIN = "http://127.0.0.1:4184";
const db = openDatabase();
importDocuments(
  JSON.parse(readFileSync("data/import-spaces.json", "utf8")),
  db,
);
await createUser(
  {
    username: "test-owner",
    name: "Jonathan",
    password: "Test-workspace-password!",
  },
  "owner",
  db,
);
await createUser(
  { username: "test-editor", name: "Maman", password: "Test-editor-password!" },
  "editor",
  db,
);
db.close();
const app = next({ dev: false, hostname: "127.0.0.1", port: 4184 });
await app.prepare();
const server = createServer(app.getRequestHandler());
server.listen(4184, "127.0.0.1", () => process.send?.({ ready: true }));
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    server.closeAllConnections();
    server.close();
    void app.close().then(() => process.exit(0));
  });
