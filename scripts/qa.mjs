import { spawnSync } from "node:child_process";
import { root, docker } from "./lib/environment.mjs";
import { qaComposeArgs } from "./lib/qa.mjs";

const action = process.argv[2];
const commands = {
  build: ["build", "site"],
  stop: ["stop"],
  status: ["ps"],
  test: [
    "run",
    "--rm",
    "--no-deps",
    "espace",
    "node",
    "--test",
    "/app/tests/platform.test.mjs",
  ],
};
if (!commands[action]) throw new Error("QA : build, test, stop ou status.");
function run(args) {
  const result = spawnSync(docker, qaComposeArgs(args), {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (action === "test") run(["up", "-d", "--wait", "db"]);
run(commands[action]);
