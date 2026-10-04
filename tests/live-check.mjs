import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const internal = "http://localhost:4174",
  site = "http://localhost:4173";
const secret = await readFile("ame-errante/data/acces-admin.txt", "utf8");
const username = secret.match(/Identifiant\s*:\s*([^\r\n]+)/i)?.[1].trim();
const password = secret.match(/Mot de passe\s*:\s*([^\r\n]+)/i)?.[1].trim();
assert.ok(username && password, "Fichier local des identifiants à vérifier");
const login = await fetch(internal + "/api/workspace/login", {
  method: "POST",
  headers: { origin: internal, "content-type": "application/json" },
  body: JSON.stringify({ username, password }),
});
assert.equal(login.status, 200, "Le compte existant doit pouvoir se connecter");
const cookie = login.headers.get("set-cookie").split(";")[0];
try {
  const overview = await (
    await fetch(internal + "/api/workspace/overview", { headers: { cookie } })
  ).json();
  assert.equal(overview.documents.length, 15);
  assert.equal(overview.tasks.length, 5);
  const exported = await (
    await fetch(internal + "/api/workspace/export", { headers: { cookie } })
  ).json();
  const original = JSON.parse(
    await readFile("data/migration/source.json", "utf8"),
  );
  for (const d of original.workspace.documents) {
    const current = exported.documents.find((x) => x.id === d.id);
    for (const field of [
      "title",
      "html",
      "version",
      "source_id",
      "imported_markdown",
    ])
      assert.equal(current[field], d[field]);
  }
  assert.equal(exported.revisions.length, original.workspace.revisions.length);
  const animals = await (
    await fetch(internal + "/api/admin/animals", { headers: { cookie } })
  ).json();
  assert.equal(animals.animals.length, 2);
  assert.equal(
    (await fetch(site + "/api/admin/animals", { headers: { cookie } })).status,
    404,
  );
  assert.equal(
    (await fetch(site + "/admin", { headers: { cookie } })).status,
    404,
  );
  const settings = await (
    await fetch(internal + "/api/admin/settings", { headers: { cookie } })
  ).json();
  assert.ok(settings.maintenance.lastBackup);
  assert.equal(settings.settings.whatsappEnabled, false);
  const published = await fetch(site + "/projet");
  assert.equal(published.status, 200);
  assert.ok(
    (await published.text()).includes("Nous préparons les premiers documents"),
  );
  assert.equal((await fetch(internal + "/api/workspace/overview")).status, 401);
  for (const base of [
    site,
    internal,
    "http://192.168.1.7:4173",
    "http://192.168.1.7:4174",
  ])
    assert.equal((await fetch(base + "/api/health")).status, 200);
  console.log(
    "Migration vérifiée : 15 documents, 15 révisions, 5 points, 2 fiches ; compte préservé dans l’intranet, administration publique supprimée, dossiers privés, sauvegarde créée, accès LAN répondant.",
  );
} finally {
  await fetch(internal + "/api/workspace/logout", {
    method: "POST",
    headers: { origin: internal, "content-type": "application/json", cookie },
    body: "{}",
  });
}
