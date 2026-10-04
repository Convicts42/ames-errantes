import { chromium, expect } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const target = JSON.parse(
  await readFile(
    new URL("../deploy/raspberry/target.json", import.meta.url),
    "utf8",
  ),
);
const secret = await readFile(
  new URL("../ame-errante/data/acces-admin.txt", import.meta.url),
  "utf8",
);
const username = secret.match(/Identifiant\s*:\s*([^\r\n]+)/i)?.[1].trim();
const password = secret.match(/Mot de passe\s*:\s*([^\r\n]+)/i)?.[1].trim();
assert.ok(username && password, "Identifiants locaux manquants");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await mkdir("data/qa/raspberry", { recursive: true });
try {
  await page.goto(target.space);
  await page.getByLabel("Identifiant", { exact: true }).fill(username);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrer dans notre espace" }).click();
  await expect(
    page.getByRole("button", { name: "Animaux & demandes" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Animaux & demandes" }).click();
  await page.getByRole("button", { name: "Animaux", exact: true }).click();
  const response = await context.request.get(
    target.space + "/api/admin/animals",
  );
  assert.equal(response.status(), 200);
  const animals = (await response.json()).animals;
  assert.equal(animals.length, 2);
  await expect(
    page.getByRole("button", {
      name: "Modifier " + animals[0].name,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Voir la fiche", exact: true }).first(),
  ).toHaveAttribute("href", target.site + "/" + animals[0].slug);
  await expect.poll(() => page.locator(".admin-animal-grid img").evaluateAll(images => images.length === 2 && images.every(image => image.complete && image.naturalWidth > 0)), { timeout: 15000 }).toBe(true);
  for (const animal of animals) assert.equal((await context.request.get(target.space + animal.image)).status(), 200);
  await page.screenshot({
    path: "data/qa/raspberry/gestion.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Réglages et WhatsApp", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Enregistrer les réglages" }),
  ).toBeVisible();
  assert.equal(
    (await context.request.get(target.site + "/admin")).status(),
    404,
  );
  assert.equal(
    (await context.request.get(target.site + "/api/admin/animals")).status(),
    404,
  );
  const overview = await (
    await context.request.get(target.space + "/api/workspace/overview")
  ).json();
  assert.equal(overview.documents.length, 15);
  assert.equal(overview.tasks.length, 5);
  const doc = overview.documents[0];
  await page.goto(target.space + "/dossiers/" + doc.id);
  await expect(
    page.getByRole("heading", { name: doc.title, exact: true }),
  ).toBeVisible();
  await page.goto(target.space + "/compte");
  await expect(
    page.getByRole("heading", { name: /Mon compte/ }).first(),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(target.space + "/gestion");
  await expect(
    page.getByRole("heading", { name: "Animaux & demandes", exact: true }),
  ).toBeVisible();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.screenshot({
    path: "data/qa/raspberry/mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "Raspberry : connexion existante, 15 dossiers, 5 points, 2 animaux, reglages, comptes, liens publics et affichage mobile verifies. Aucune modification metier.",
  );
} finally {
  await context.request
    .post(target.space + "/api/workspace/logout", {
      data: {},
      headers: { origin: target.space },
    })
    .catch(() => {});
  await browser.close();
}
