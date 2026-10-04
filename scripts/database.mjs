import { backup } from "node:sqlite";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { getDatabase, databasePath } from "../src/server/database.mjs";
import { createAdmin } from "../src/server/auth.mjs";

const command = process.argv[2];
const db = getDatabase();
try {
  if (command === "init") console.log(`SQLite initialisé : ${databasePath()}`);
  else if (command === "backup") {
    const folder = resolve("data/backups");
    await mkdir(folder, { recursive: true });
    const target = resolve(
      folder,
      `ame-errante-${new Date().toISOString().replaceAll(":", "-")}.sqlite`,
    );
    await backup(db, target);
    console.log(`Sauvegarde cohérente : ${target}`);
  } else if (command === "admin") {
    const username = process.argv[3] || "admin";
    if (!/^[a-z0-9._-]{3,60}$/.test(username))
      throw new Error("Identifiant invalide.");
    const password = randomBytes(24).toString("base64url");
    const path = resolve(`data/acces-${username}.txt`);
    await mkdir(resolve("data"), { recursive: true });
    await writeFile(
      path,
      `Administration Âme Errante\nAdresse : /admin\nIdentifiant : ${username}\nMot de passe : ${password}\n\nChangez ce mot de passe depuis l’administration, puis supprimez ce fichier.\n`,
      { mode: 0o600, flag: "wx" },
    );
    try {
      await createAdmin(username, password, db);
    } catch (error) {
      await unlink(path);
      throw error;
    }
    console.log(`Compte créé. Identifiants locaux : ${path}`);
  } else throw new Error("Utiliser init, backup ou admin [identifiant].");
} finally {
  db.close();
}
