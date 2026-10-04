import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  openSync,
  closeSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { networkInterfaces } from "node:os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
const localUrl = "http://localhost:4174";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
if (!existsSync("data/projet.sqlite") || !existsSync(".next/BUILD_ID")) {
  throw new Error(
    "L’installation doit être terminée avant le premier démarrage. Consultez le fichier README.md.",
  );
}
async function running() {
  try {
    const response = await fetch(`${localUrl}/api/workspace/session`, {
      signal: AbortSignal.timeout(1000),
    });
    const result = await response.json();
    return response.ok && typeof result.setupRequired === "boolean";
  } catch {
    return false;
  }
}
if (!(await running())) {
  mkdirSync("data", { recursive: true });
  const out = openSync("data/server.log", "a"),
    error = openSync("data/server-error.log", "a");
  const child = spawn(
    process.execPath,
    [
      join(root, "node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "0.0.0.0",
      "--port",
      "4174",
    ],
    {
      cwd: root,
      detached: true,
      windowsHide: true,
      stdio: ["ignore", out, error],
      env: { ...process.env, COOKIE_SECURE: "false", NODE_ENV: "production" },
    },
  );
  await new Promise((resolve, reject) => {
    child.once("spawn", resolve);
    child.once("error", reject);
  });
  writeFileSync("data/server.pid", String(child.pid));
  writeFileSync("data/node-path.txt", process.execPath);
  child.unref();
  closeSync(out);
  closeSync(error);
  for (let attempt = 0; attempt < 40 && !(await running()); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!(await running()))
    throw new Error(
      "Le démarrage a échoué. Consultez data/server-error.log ; le port 4174 est peut-être occupé.",
    );
}
const addresses = Object.entries(networkInterfaces())
  .filter(
    ([name]) => !/vmware|vethernet|virtual|loopback|docker|wsl/i.test(name),
  )
  .flatMap(([, entries]) => entries)
  .filter(
    (entry) =>
      entry.family === "IPv4" &&
      !entry.internal &&
      /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(entry.address),
  )
  .map((entry) => `http://${entry.address}:4174`);
writeFileSync(
  "data/adresses.txt",
  `Âmes errantes — accès à l’espace\n\nSur ce PC : ${localUrl}\nSur le même réseau :\n${addresses.join("\n") || "Adresse à vérifier dans les paramètres réseau."}\n\nLe PC doit rester allumé, sans mise en veille.\n`,
);
console.log(`Application prête : ${localUrl}\n${addresses.join("\n")}`);
