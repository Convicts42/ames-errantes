import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { root, docker } from "./lib/environment.mjs";
import { spawnSync } from "node:child_process";
const action = process.argv[2] || "start";
if (action === "test") {
  await import("./qa.mjs");
  process.exit(0);
}
if (existsSync(join(root, "deploy/raspberry/active.json"))) {
  const result = spawnSync(
    process.execPath,
    [join(root, "scripts/raspberry.mjs"), action],
    { cwd: root, stdio: "inherit", windowsHide: true },
  );
  process.exit(result.status ?? 1);
}
if (!existsSync(join(root, ".env")) && action === "start") {
  writeFileSync(
    join(root, ".env"),
    `POSTGRES_PASSWORD=${randomBytes(32).toString("hex")}\nSITE_PORT=4173\nSPACE_PORT=4174\nPUBLIC_HOST=localhost\nBIND_ADDRESS=0.0.0.0\n`,
    { flag: "wx", mode: 0o600 },
  );
}
const commands = {
  start: ["up", "-d", "--build", "--wait"],
  stop: ["stop"],
  status: ["ps"],
  backup: [
    "exec",
    "-T",
    "espace",
    "node",
    "/app/packages/core/src/backup-command.mjs",
  ],
};
if (!commands[action])
  throw new Error("Commande : start, stop, status, test ou backup.");
const result = spawnSync(
  docker,
  ["compose", "--project-directory", root, ...commands[action]],
  { cwd: root, stdio: "inherit", windowsHide: true },
);
if (result.error)
  console.error("Docker Desktop doit être installé et démarré.");
process.exitCode = result.status ?? 1;
