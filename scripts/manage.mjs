import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { openDatabase } from "../src/server/database.mjs";
import { importDocuments } from "../src/server/store.mjs";
import { bootstrap } from "../src/server/auth.mjs";
import { backupDatabase } from "../src/server/backup.mjs";

const db = openDatabase();
try {
  const command = process.argv[2];
  if (command === "init") {
    const source = resolve("data/import-spaces.json");
    if (existsSync(source))
      console.log(
        `${importDocuments(JSON.parse(readFileSync(source, "utf8")), db)} document(s) ajouté(s). Les documents existants sont conservés.`,
      );
    const code = bootstrap(db);
    if (code) {
      writeFileSync(
        "data/acces-initial.txt",
        `Âmes errantes — première connexion\n\nOuvrir http://localhost:4174\nCode d’installation (valable 7 jours, une seule utilisation) :\n${code}\n\nChoisissez ensuite votre identifiant et votre mot de passe dans l’application.\nAjoutez le compte de votre mère depuis « Mon compte ».\nSupprimez ce fichier après l’installation.\n`,
      );
      console.log(
        "Le code privé de première installation est enregistré dans data/acces-initial.txt.",
      );
    }
  } else if (command === "backup")
    console.log(`Sauvegarde créée : ${await backupDatabase(db)}`);
  else throw new Error("Commande : init ou backup");
} finally {
  db.close();
}
