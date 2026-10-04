import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { openDatabase } from "../src/server/database.mjs";
import { createAdmin } from "../src/server/auth.mjs";

const database = resolve("data/test-runs", `${randomUUID()}.sqlite`);
process.env.DATABASE_PATH = database;
process.env.COOKIE_SECURE = "false";
process.env.DISABLE_MAINTENANCE = "true";
for (const key of Object.keys(process.env))
  if (key.startsWith("WHATSAPP_")) delete process.env[key];
delete process.env.APP_ORIGIN;
const db = openDatabase(database);
await createAdmin("test-admin", "Test-only-password-2026!", db);
db.close();
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "4183",
  ],
  { env: process.env, stdio: "inherit", windowsHide: true },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    child.kill();
  });
child.on("exit", (code) => process.exit(code || 0));
