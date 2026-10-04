import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  rmdirSync,
} from "node:fs";
import { join } from "node:path";
import { root, docker } from "./lib/environment.mjs";

const production = "/opt/ames-errantes";
if (process.platform !== "linux" || !existsSync(`${production}/shared/.env`))
  throw new Error(
    "Cette commande s'exécute dans le dépôt de travail sur la Raspberry.",
  );
const action = process.argv[2] || "prepare";
const run = (command, args, capture = false) => {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} a échoué (${result.status}).`);
  return result.stdout?.trim();
};
if (["status", "start", "stop", "backup"].includes(action)) {
  run("bash", [`${production}/current/deploy/raspberry/amesctl.sh`, action]);
} else if (["prepare", "activate", "deploy"].includes(action)) {
  mkdirSync(join(root, "data"), { recursive: true });
  const lock = join(root, "data/native-deploy.lock");
  try {
    mkdirSync(lock);
  } catch {
    throw new Error(
      "Une préparation est déjà en cours. Vérifier le processus avant de retirer data/native-deploy.lock.",
    );
  }
  const receiptPath = join(root, "data/prepared-release.json");
  try {
    const revision = run("git", ["rev-parse", "HEAD"], true);
    const clean = () => {
      if (
        run("git", ["status", "--porcelain"], true) ||
        run("git", ["rev-parse", "HEAD"], true) !== revision
      )
        throw new Error(
          "Faire un commit de toutes les modifications avant la préparation. Le code doit rester inchangé pendant les tests.",
        );
    };
    clean();
    if (action !== "activate") {
      run(process.execPath, ["scripts/check.mjs"]);
      run("pnpm", ["format:check"]);
      run(process.execPath, ["scripts/qa.mjs", "build"]);
      const imageId = run(
        docker,
        ["image", "inspect", "ames-errantes-qa:4", "--format", "{{.Id}}"],
        true,
      );
      try {
        run(process.execPath, ["scripts/qa.mjs", "test"]);
        run(process.execPath, ["scripts/run-browser-tests.mjs"]);
      } finally {
        run(process.execPath, ["scripts/qa.mjs", "stop"]);
      }
      clean();
      if (
        imageId !==
        run(
          docker,
          ["image", "inspect", "ames-errantes-qa:4", "--format", "{{.Id}}"],
          true,
        )
      )
        throw new Error(
          "L'image a changé pendant les tests : relancer la préparation.",
        );
      const release = new Date()
        .toISOString()
        .replace(/[-:TZ.]/g, "")
        .slice(0, 14)
        .replace(/^(\d{8})(\d{6})$/, "$1-$2");
      const image = `ames-errantes:pi-${release}`;
      const folder = join(production, "releases", release);
      mkdirSync(folder);
      run(docker, ["tag", imageId, image]);
      const archive = join(folder, "source.tar.gz");
      run("git", ["archive", "--format=tar.gz", "--output", archive, revision]);
      run("tar", ["-xzf", archive, "-C", folder]);
      unlinkSync(archive);
      const receipt = {
        release,
        revision,
        image,
        imageId,
        preparedAt: new Date().toISOString(),
      };
      writeFileSync(join(folder, "release.env"), `APP_IMAGE=${image}\n`, {
        flag: "wx",
      });
      writeFileSync(
        join(folder, "release.json"),
        JSON.stringify(receipt, null, 2) + "\n",
        { flag: "wx" },
      );
      writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + "\n");
      console.log(
        `Version ${release} vérifiée et prête. Les sites en service n'ont pas changé.`,
      );
    }
    if (action !== "prepare") {
      const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
      if (
        !/^\d{8}-\d{6}$/.test(receipt.release) ||
        receipt.revision !== revision ||
        receipt.image !== `ames-errantes:pi-${receipt.release}`
      )
        throw new Error(
          "Préparation absente ou périmée : lancer pnpm deploy:prepare.",
        );
      if (
        receipt.imageId !==
        run(
          docker,
          ["image", "inspect", receipt.image, "--format", "{{.Id}}"],
          true,
        )
      )
        throw new Error("L'image préparée ne correspond plus au contrôle.");
      run("bash", [
        `${production}/releases/${receipt.release}/deploy/raspberry/activate.sh`,
        receipt.release,
      ]);
    }
  } finally {
    rmdirSync(lock);
  }
} else
  throw new Error(
    "Commande : prepare, activate, deploy, status, start, stop ou backup.",
  );
