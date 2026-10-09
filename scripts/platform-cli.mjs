import { existsSync } from "node:fs";
import { join } from "node:path";
import { root } from "./lib/environment.mjs";
import { spawnSync } from "node:child_process";
const action = process.argv[2] || "start";
if (action === "test") {
  await import("./qa.mjs");
  process.exit(0);
}
if (
  process.platform === "linux" &&
  existsSync("/opt/ames-errantes/current/deploy/raspberry/amesctl.sh")
) {
  await import("./deploy-native.mjs");
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
throw new Error(
  "Aucune cible : lancer sur la Raspberry, ou depuis un PC configuré avec deploy/raspberry/target.json et active.json.",
);
