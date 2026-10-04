import { openBrowser } from "./browser-helper.mjs";
import { expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { docker } from "../scripts/lib/environment.mjs";
import { randomUUID } from "node:crypto";
const execute = promisify(execFile);
const internal = "http://localhost:4474",
  publicSite = "http://localhost:4473";
const browser = await openBrowser();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await mkdir("data/qa", { recursive: true });
const log = (message) => console.log(`PASS ${message}`);
async function ai(name, args = {}) {
  const code = `import {mcpClient} from '/app/services/mcp/test-client.mjs';const u=new URL(process.env.DATABASE_URL);if(!/^ames_qa_[a-f0-9]{32}$/.test(process.env.AMES_TEST_DATABASE))throw Error('QA only');u.pathname='/'+process.env.AMES_TEST_DATABASE;await mcpClient(u.href,async c=>console.log(JSON.stringify(await c.callTool(${JSON.stringify({ name, arguments: args })}))));`;
  const { stdout } = await execute(docker, [
    "exec",
    "ames-qa-space",
    "node",
    "--input-type=module",
    "-e",
    code,
  ]);
  const r = JSON.parse(stdout);
  assert.ok(!r.isError, JSON.stringify(r));
  return JSON.parse(r.content[0].text);
}
async function api(path, method = "GET", data, base = internal) {
  const response = await context.request.fetch(base + path, {
    method,
    data,
    headers: method === "GET" ? {} : { origin: base },
  });
  assert.ok(
    response.ok(),
    `${method} ${path}: ${response.status()} ${await response.text()}`,
  );
  return response.json();
}
try {
  assert.equal(
    (await context.request.get(internal + "/api/workspace/overview")).status(),
    401,
  );
  assert.equal(
    (await context.request.get(publicSite + "/api/admin/animals")).status(),
    404,
  );
  await page.goto(internal);
  await page.getByLabel("Identifiant", { exact: true }).fill("qa-owner");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("Only-test-Password-456");
  await page.getByRole("button", { name: "Entrer dans notre espace" }).click();
  await expect(
    page.getByRole("button", { name: "Animaux & demandes" }),
  ).toBeVisible();
  assert.ok((await api("/api/workspace/overview")).documents.length >= 15);
  assert.equal(
    (await context.request.get(publicSite + "/api/admin/animals")).status(),
    404,
  );
  const denied = await context.request.post(
    internal + "/api/workspace/documents",
    { data: {}, headers: { origin: "https://example.test" } },
  );
  assert.equal(denied.status(), 403);
  log(
    "Connexion intranet, 15 dossiers fictifs et administration publique supprimée",
  );
  await page.screenshot({ path: "data/qa/dashboard.png", fullPage: true });
  await page.getByRole("button", { name: "Animaux & demandes" }).click();
  await page.getByRole("button", { name: "Animaux", exact: true }).click();
  const firstAnimal = (await api("/api/admin/animals")).animals[0];
  await page
    .getByRole("button", { name: "Modifier " + firstAnimal.name, exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Description courte", exact: true })
    .fill("Description modifiée dans l’intranet QA");
  await page
    .getByRole("button", { name: "Enregistrer la fiche", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Fiche enregistrée");
  const updatedAnimal = (await api("/api/admin/animals")).animals.find(
    (a) => a.slug === firstAnimal.slug,
  );
  assert.equal(
    updatedAnimal.description,
    "Description modifiée dans l’intranet QA",
  );
  await expect(
    page.getByRole("link", { name: "Voir la fiche", exact: true }).first(),
  ).toHaveAttribute("href", publicSite + "/" + firstAnimal.slug);
  await page.screenshot({ path: "data/qa/animals.png", fullPage: true });
  log("Édition des animaux et lien vers leur fiche publique depuis l’intranet");
  await page
    .getByRole("button", { name: "Réglages et WhatsApp", exact: true })
    .click();
  await page
    .getByLabel("Zone géographique d’intervention", { exact: true })
    .fill("Zone QA commune");
  await page.getByRole("button", { name: "Enregistrer les réglages" }).click();
  await expect(
    page.getByText("Réglages enregistrés. Les pages publiques sont à jour."),
  ).toBeVisible();
  const publicPage = await context.newPage();
  await publicPage.goto(publicSite + "/contact");
  await expect(
    publicPage.getByText("Zone QA commune", { exact: false }).first(),
  ).toBeVisible();
  log(
    "Une modification des réglages dans l’espace interne apparaît sur le site",
  );
  await page.screenshot({ path: "data/qa/management.png", fullPage: true });
  const previousRequests = (await api("/api/workspace/management")).requests
    .length;
  const requestResponse = await context.request.post(
    publicSite + "/api/requests",
    {
      data: {
        kind: "contact",
        name: "QA",
        email: "qa@example.test",
        subject: "Une autre question",
        message: "Demande de test isolée",
        consent: true,
      },
      headers: { origin: publicSite, "Idempotency-Key": randomUUID() },
    },
  );
  assert.ok(requestResponse.ok(), await requestResponse.text());
  assert.equal(
    (await api("/api/workspace/management")).requests.length,
    previousRequests + 1,
  );
  log("Les demandes du site sont accessibles dans le suivi interne");
  const d = await ai("document_create", {
    title: "Dossier QA connecté",
    category: "projet",
    status: "draft",
    html: "<p>Document de test connecté</p>",
  });
  await page.goto(`${internal}/dossiers/${d.id}`);
  await expect(
    page.getByRole("heading", { name: d.title, exact: true }),
  ).toBeVisible();
  const updated = await ai("document_update", {
    id: d.id,
    version: d.version,
    patch: { html: "<p>Modification IA en direct</p>" },
  });
  await expect(
    page.getByText("Modification IA en direct", { exact: true }),
  ).toBeVisible({ timeout: 23000 });
  await page.getByRole("button", { name: "Modifier", exact: true }).click();
  await page
    .locator("[contenteditable=true]")
    .fill("Brouillon humain à conserver");
  await ai("document_update", {
    id: d.id,
    version: updated.version,
    patch: { html: "<p>Nouvelle version IA</p>" },
  });
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.locator(".notice.error-message")).toContainText(
    "modifié ailleurs",
  );
  await expect(page.locator("[contenteditable=true]")).toContainText(
    "Brouillon humain à conserver",
  );
  log(
    "Modification MCP visible en direct ; brouillon humain préservé en cas de conflit",
  );
  // A fresh browser tab has no local draft and reads the current database revision.
  const docPage = await context.newPage();
  await docPage.goto(`${internal}/dossiers/${d.id}`);
  await docPage
    .getByRole("button", { name: "Publication", exact: true })
    .click();
  await docPage
    .getByLabel("Adresse du document sur le site")
    .fill("qa-connecte");
  await docPage
    .getByRole("button", { name: "Publier cette version", exact: true })
    .click();
  await expect(docPage.getByRole("dialog")).toContainText(
    "La version 3 est visible",
  );
  const anonymous = await browser.newContext();
  const response = await anonymous.request.get(
    publicSite + "/projet/qa-connecte",
  );
  assert.equal(response.status(), 200);
  assert.ok((await response.text()).includes("Nouvelle version IA"));
  await ai("document_update", {
    id: d.id,
    version: 3,
    patch: { html: "<p>Reste privé</p>" },
  });
  assert.ok(
    !(
      await (
        await anonymous.request.get(publicSite + "/projet/qa-connecte")
      ).text()
    ).includes("Reste privé"),
  );
  await docPage.getByRole("button", { name: "Retirer du site" }).click();
  await expect(docPage.getByRole("dialog")).not.toBeVisible();
  assert.equal(
    (await anonymous.request.get(publicSite + "/projet/qa-connecte")).status(),
    404,
  );
  await anonymous.close();
  log("Publication explicite, version publique figée et retrait effectif");
  await page.close();
  const mobile = await context.newPage({
    viewport: { width: 390, height: 844 },
  });
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(internal + "/gestion");
  await expect(
    mobile.getByRole("heading", { name: "Animaux & demandes", exact: true }),
  ).toBeVisible();
  assert.ok(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  );
  await mobile.screenshot({ path: "data/qa/mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  log("Affichage mobile sans débordement et absence d’erreur JavaScript");
  // Imported images are served from the same published public assets.
  const animals = (await api("/api/admin/animals")).animals;
  assert.equal(
    (await context.request.get(internal + animals[0].image)).status(),
    200,
  );
  log("Photos accessibles depuis l’espace commun");
} catch (error) {
  console.error("Browser errors:", errors);
  if (!page.isClosed()) {
    await page.screenshot({ path: "data/qa/failed.png", fullPage: true });
    await writeFile("data/qa/failed.html", await page.content());
  }
  throw error;
} finally {
  await browser.close();
}
