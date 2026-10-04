import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { root, docker } from "./lib/environment.mjs";
import { qaComposeArgs } from "./lib/qa.mjs";
const run = promisify(execFile);
const invoke = (args) =>
  run(docker, args, {
    cwd: root,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
const compose = (args) => invoke(qaComposeArgs(args));
let database;
const containers = [];
try {
  for (const name of ["ames-qa-site", "ames-qa-space"]) {
    let exists = false;
    try {
      await invoke(["container", "inspect", name]);
      exists = true;
    } catch {}
    if (exists)
      throw new Error(
        `Le conteneur ${name} existe déjà. Vérifier son origine avant un nouvel essai.`,
      );
  }
  await compose(["up", "-d", "--wait", "db"]);
  const fixture = await compose([
    "run",
    "--rm",
    "--no-deps",
    "espace",
    "node",
    "/app/tests/ui-fixture.mjs",
  ]);
  database = fixture.stdout.match(/ames_qa_[a-f0-9]{32}/)?.[0];
  if (!database) throw new Error("Base temporaire introuvable.");
  for (const [service, name, port] of [
    ["site", "ames-qa-site", 4473],
    ["espace", "ames-qa-space", 4474],
  ]) {
    // Do not reuse production service aliases on the shared Docker network.
    await compose([
      "run",
      "-d",
      "--name",
      name,
      "--no-deps",
      "-p",
      `127.0.0.1:${port}:3000`,
      "-e",
      `AMES_TEST_DATABASE=${database}`,
      service,
      "node",
      "/app/tests/serve-test.mjs",
    ]);
    containers.push(name);
  }
  for (const port of [4473, 4474]) {
    let ready = false;
    for (let i = 0; i < 30; i++) {
      try {
        if (
          (
            await fetch(`http://localhost:${port}/api/health`, {
              signal: AbortSignal.timeout(1000),
            })
          ).ok
        ) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (!ready) throw new Error(`Le serveur QA ${port} ne répond pas.`);
  }
  for (const file of [
    "browser-check.mjs",
    "admin-check.mjs",
    "media-check.mjs",
    "public-check.mjs",
  ]) {
    const result = await run(process.execPath, [join(root, "tests", file)], {
      cwd: root,
      env: { ...process.env, SITE_CHECK_URL: "http://localhost:4473" },
      windowsHide: true,
    });
    console.log(result.stdout.trim());
  }
} finally {
  for (const name of containers) await invoke(["rm", "-f", name]);
  if (database)
    await compose([
      "run",
      "--rm",
      "--no-deps",
      "espace",
      "node",
      "/app/tests/ui-fixture.mjs",
      "drop",
      database,
    ]);
}
