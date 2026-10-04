import { spawn } from "node:child_process";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = JSON.parse(
  await readFile(join(root, "deploy/raspberry/target.json"), "utf8"),
);
if (
  !/^[a-z0-9_-]+@[a-z0-9.-]+$/i.test(target.ssh) ||
  target.root !== "/opt/ames-errantes"
)
  throw Error("Cible SSH invalide");
const docker =
  process.platform === "win32"
    ? join(
        process.env.LOCALAPPDATA,
        "Programs/DockerDesktop/resources/bin/docker.exe",
      )
    : "docker";
async function run(command, args, { capture = false } = {}) {
  return new Promise((ok, fail) => {
    const p = spawn(command, args, {
      cwd: root,
      windowsHide: true,
      stdio: ["ignore", capture ? "pipe" : "inherit", "inherit"],
    });
    let out = "";
    if (capture) p.stdout.on("data", (b) => (out += b));
    p.on("error", fail);
    p.on("exit", (code) =>
      code === 0
        ? ok(out.trim())
        : fail(Error(`${command} a echoue (${code})`)),
    );
  });
}
const ssh = (command, options) =>
  run(
    "ssh",
    ["-o", "BatchMode=yes", "-o", "ConnectTimeout=10", target.ssh, command],
    options,
  );
const control = `bash ${target.root}/current/deploy/raspberry/amesctl.sh`;
const action = process.argv[2] || "status";
if (["status", "start", "stop"].includes(action))
  await ssh(`${control} ${action}`);
else if (action === "logs") {
  const service = process.argv[3] || "espace";
  if (!["espace", "site", "worker", "db"].includes(service))
    throw Error("Service invalide");
  await ssh(`${control} logs ${service}`);
} else if (action === "backup") {
  const output = await ssh(`${control} backup`, { capture: true });
  const match = output.match(/\/data\/backups\/(ames-auto-[\dTZ-]+\.dump)/);
  if (!match) throw Error("Sauvegarde non localisee");
  const folder = join(root, "data/backups-raspberry");
  await mkdir(folder, { recursive: true });
  await run("scp", [
    "-o",
    "BatchMode=yes",
    `${target.ssh}:${target.root}/shared/backups/${match[1]}`,
    join(folder, match[1]),
  ]);
  console.log(
    `Sauvegarde Raspberry copiee sur le PC : ${join(folder, match[1])}`,
  );
} else if (action === "deploy") {
  // QA never writes into the Raspberry database or the archived local business database.
  await run(docker, ["compose", "build", "site"]);
  await run(docker, ["compose", "up", "-d", "--wait", "db"]);
  await run(process.execPath, ["scripts/platform-cli.mjs", "test"]);
  await run(process.execPath, ["scripts/run-browser-tests.mjs"]);
  const release = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14)
    .replace(/^(\d{8})(\d{6})$/, "$1-$2");
  const image = `ames-errantes:pi-${release}`;
  const folder = join(root, "data/raspberry-releases", release);
  await mkdir(folder, { recursive: true });
  const archive = join(folder, "source.tar.gz"),
    imageFile = join(folder, "application.tar");
  await run(docker, [
    "buildx",
    "build",
    "--platform",
    "linux/arm64",
    "--load",
    "--tag",
    image,
    ".",
  ]);
  await run(docker, ["image", "save", "--output", imageFile, image]);
  await run("tar", [
    "-czf",
    archive,
    "--exclude=node_modules",
    "--exclude=.next",
    "--exclude=.git",
    "--exclude=.env*",
    "--exclude=test-results",
    "--exclude=ame-errante/data",
    "--exclude=ames-errantes-interne/data",
    "Dockerfile",
    "compose.yaml",
    "Platform.ps1",
    "Demarrer.cmd",
    "Arreter.cmd",
    "Sauvegarder.cmd",
    "VALIDATION.md",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ".dockerignore",
    "ame-errante",
    "ames-errantes-interne",
    "packages",
    "services",
    "scripts",
    "tests",
    "deploy",
    "README.md",
    "AGENTS.md",
  ]);
  await writeFile(join(folder, "release.env"), `APP_IMAGE=${image}\n`, {
    flag: "wx",
  });
  const remote = `${target.root}/releases/${release}`;
  await ssh(`umask 077; mkdir ${remote}`);
  await run("scp", [
    "-o",
    "BatchMode=yes",
    archive,
    join(folder, "release.env"),
    imageFile,
    `${target.ssh}:${remote}/`,
  ]);
  await ssh(
    `set -e; cd ${remote}; tar -xzf source.tar.gz; docker load --input application.tar; bash deploy/raspberry/activate.sh ${release}`,
  );
  // Only transfer artifacts created by this deployment are removed, never volumes or backups.
  await ssh(`rm -- ${remote}/application.tar ${remote}/source.tar.gz`);
  console.log(`Version ${release} en service : ${target.space}`);
} else if (action === "check") {
  for (const url of [target.site, target.space]) {
    const r = await fetch(url + "/api/health", {
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw Error(`Service indisponible : ${url}`);
    console.log(`OK ${url}`);
  }
  if ((await fetch(target.site + "/admin")).status !== 404)
    throw Error("Administration publique exposee");
  await run(process.execPath, ["services/mcp/verify-raspberry.mjs"]);
} else
  throw Error("Actions : status, start, stop, logs, backup, check, deploy");
