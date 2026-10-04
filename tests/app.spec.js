import { test, expect } from "@playwright/test";

const origin = "http://127.0.0.1:4184",
  credentials = {
    username: "test-owner",
    password: "Test-workspace-password!",
  };
async function login(page) {
  await page.goto("/");
  await page
    .getByLabel("Identifiant", { exact: true })
    .fill(credentials.username);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill(credentials.password);
  await page.getByRole("button", { name: "Entrer dans notre espace" }).click();
  await expect(
    page.getByRole("heading", { name: "Bonjour Jonathan." }),
  ).toBeVisible();
}
async function apiLogin(request, body = credentials) {
  const r = await request.post("/api/workspace/login", {
    headers: { origin },
    data: body,
  });
  expect(r.status()).toBe(200);
  return r;
}
test("anonymous visitors cannot read or modify the project, even by direct URL", async ({
  request,
  page,
}) => {
  for (const path of [
    "overview",
    "documents",
    "documents/statuts",
    "documents/statuts/history",
    "users",
    "tasks",
    "export",
  ])
    expect((await request.get(`/api/workspace/${path}`)).status()).toBe(401);
  expect(
    (
      await request.put("/api/workspace/documents/statuts", {
        headers: { origin },
        data: { title: "intrusion" },
      })
    ).status(),
  ).toBe(401);
  await page.goto("/dossiers/statuts");
  await expect(
    page.getByRole("heading", { name: "On reprend le fil ?" }),
  ).toBeVisible();
  await expect(
    page.getByText("Article 11 Bénévolat et intérêts personnels", {
      exact: false,
    }),
  ).toHaveCount(0);
  for (const path of [
    "/data/import-spaces.json",
    "/data/projet.sqlite",
    "/src/server/auth.mjs",
  ]) {
    const r = await request.get(path);
    expect(await r.text()).not.toMatch(
      /390 route de la Creuse|password_hash|imported_markdown/,
    );
  }
});
test("CSRF, private account permissions and sanitized content are enforced on the server", async ({
  request,
}) => {
  const r = await apiLogin(request);
  expect(r.headers()["set-cookie"]).toContain("HttpOnly");
  expect(r.headers()["set-cookie"]).toContain("SameSite=Strict");
  expect(
    (
      await request.post("/api/workspace/documents", {
        headers: { origin: "https://untrusted.invalid" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  const created = await request.post("/api/workspace/documents", {
    headers: { origin },
    data: {
      title: "Sécurité du document",
      category: "projet",
      status: "draft",
      html: "<p>Texte<script>alert(1)</script><img src=x onerror=alert(1)></p>",
    },
  });
  expect(created.status()).toBe(201);
  expect((await created.json()).document.html).not.toMatch(
    /script|onerror|<img/,
  );
  await apiLogin(request, {
    username: "test-editor",
    password: "Test-editor-password!",
  });
  expect(
    (
      await request.post("/api/workspace/users", {
        headers: { origin },
        data: {
          name: "Unauthorized",
          username: "unauthorized",
          password: "Test-password-123!",
        },
      })
    ).status(),
  ).toBe(403);
  const docs = await request.get("/api/workspace/documents");
  expect(docs.status()).toBe(200);
});
test("dashboard, search and internal document links work on desktop", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Nos dossiers" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Rechercher un document" }).click();
  await page.getByLabel("Rechercher dans les dossiers").fill("présence");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button")
      .filter({ hasText: "Conditions à réunir" }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button")
    .filter({ hasText: "Conditions à réunir" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Conditions à réunir avant les premiers accueils",
    }),
  ).toBeVisible();
  const link = page
    .locator('.document-content a[href="/dossiers/besoins-lieu"]')
    .first();
  await link.click();
  await expect(page).toHaveURL(/besoins-lieu/);
  expect(errors).toEqual([]);
});
test("both accounts edit documents, conflicts preserve drafts and history can restore an earlier version", async ({
  page,
  request,
}) => {
  await apiLogin(request);
  const response = await request.post("/api/workspace/documents", {
    headers: { origin },
    data: {
      title: "Dossier partagé",
      category: "projet",
      status: "draft",
      html: "<p>Version initiale.</p>",
    },
  });
  const { document: d } = await response.json();
  await login(page);
  await page.goto(`/dossiers/${d.id}`);
  await page.getByRole("button", { name: "Modifier", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Contenu du dossier" })
    .fill("Texte proposé par Jonathan.");
  await apiLogin(request, {
    username: "test-editor",
    password: "Test-editor-password!",
  });
  const current = (
    await (await request.get(`/api/workspace/documents/${d.id}`)).json()
  ).document;
  expect(
    (
      await request.put(`/api/workspace/documents/${d.id}`, {
        headers: { origin },
        data: { ...current, html: "<p>Version enregistrée par maman.</p>" },
      })
    ).status(),
  ).toBe(200);
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "modifié ailleurs" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Contenu du dossier" }),
  ).toContainText("Texte proposé par Jonathan.");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  await page.reload();
  await expect(page.locator(".document-content")).toContainText(
    "Version enregistrée par maman.",
  );
  await page.getByRole("button", { name: "Modifier", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Contenu du dossier" })
    .fill("Texte relu à deux.");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Modifications enregistrées",
  );
  await page.reload();
  await expect(page.locator(".document-content")).toContainText(
    "Texte relu à deux.",
  );
  await page.getByRole("button", { name: "Historique", exact: true }).click();
  await page
    .getByRole("button")
    .filter({ hasText: /Version 1/ })
    .click();
  await expect(page.locator(".revision-preview")).toContainText(
    "Version initiale.",
  );
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Restaurer cette version" }).click();
  await expect(page.locator("article .document-content")).toContainText(
    "Version initiale.",
  );
});
test("new document, checklist assignment and export persist through navigation", async ({
  page,
  request,
}) => {
  await login(page);
  await page.getByRole("button", { name: "Tout voir", exact: true }).click();
  await page
    .getByRole("button", { name: "Nouveau document", exact: true })
    .click();
  await page
    .getByLabel("Titre", { exact: true })
    .fill("Notre carnet de travail");
  await page.getByRole("button", { name: "Créer le document" }).click();
  await expect(
    page.getByRole("heading", { name: "Notre carnet de travail" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Points à suivre/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Ajouter un point" }).click();
  await page
    .getByLabel("À faire ou à décider")
    .fill("Relire le projet ensemble");
  await page.getByLabel("Qui s’en occupe ?").selectOption({ label: "Maman" });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(
    page.locator(".task-card").filter({ hasText: "Relire le projet ensemble" }),
  ).toContainText("Maman");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Relire le projet ensemble" }),
  ).toBeVisible();
  await apiLogin(request);
  const exported = await request.get("/api/workspace/export");
  expect(exported.status()).toBe(200);
  const data = await exported.json();
  expect(
    data.documents.some((d) => d.title === "Notre carnet de travail"),
  ).toBe(true);
  expect(data.revisions.length).toBeGreaterThan(14);
  expect(JSON.stringify(data)).not.toMatch(/password_hash|token_hash/);
});
test("phone layout has no page overflow and keeps navigation and reading usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
  expect(
    await page
      .locator(".welcome-banner h2")
      .evaluate(
        (el) =>
          el.getBoundingClientRect().right <=
          el.closest(".welcome-banner").getBoundingClientRect().right,
      ),
  ).toBe(true);
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page
    .getByRole("button", { name: "Budget & financements", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Budget & financements" }),
  ).toBeVisible();
  await page.goto("/dossiers/budget-previsionnel");
  await expect(page.locator(".document-content table").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/document-mobile.png",
    fullPage: true,
  });
});
test("logout removes access to every private endpoint", async ({ request }) => {
  await apiLogin(request);
  expect(
    (
      await request.post("/api/workspace/logout", {
        headers: { origin },
        data: {},
      })
    ).status(),
  ).toBe(200);
  expect((await request.get("/api/workspace/export")).status()).toBe(401);
});

test("the owner can create a member who can sign in and change their password", async ({
  page,
  browser,
}) => {
  await login(page);
  await page.getByRole("button", { name: /Mon compte & l’équipe/ }).click();
  await page
    .getByRole("button", { name: "Créer le compte d’un proche" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Prénom", { exact: true }).fill("Nouveau membre");
  await dialog
    .getByLabel("Identifiant", { exact: true })
    .fill("nouveau-membre");
  await dialog.getByLabel("Mot de passe initial").fill("Initial-password-123!");
  await dialog
    .getByRole("button", { name: "Créer le compte", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Compte créé");
  await expect(
    page.locator(".member-row").filter({ hasText: "Nouveau membre" }),
  ).toBeVisible();
  const context = await browser.newContext();
  const member = await context.newPage();
  await member.goto(origin);
  await member
    .getByLabel("Identifiant", { exact: true })
    .fill("nouveau-membre");
  await member
    .getByLabel("Mot de passe", { exact: true })
    .fill("Initial-password-123!");
  await member
    .getByRole("button", { name: "Entrer dans notre espace" })
    .click();
  await expect(
    member.getByRole("heading", { name: "Bonjour Nouveau membre." }),
  ).toBeVisible();
  await member.getByRole("button", { name: /Mon compte & l’équipe/ }).click();
  await expect(
    member.getByRole("button", { name: "Créer le compte d’un proche" }),
  ).toHaveCount(0);
  await member
    .getByLabel("Mot de passe actuel", { exact: true })
    .fill("Initial-password-123!");
  await member
    .getByLabel("Nouveau mot de passe", { exact: true })
    .fill("Changed-password-123!");
  await member
    .getByLabel("Confirmer le nouveau mot de passe")
    .fill("Changed-password-123!");
  await member
    .getByRole("button", { name: "Mettre à jour mon mot de passe" })
    .click();
  await expect(
    member.getByRole("heading", { name: "On reprend le fil ?" }),
  ).toBeVisible();
  await member
    .getByLabel("Identifiant", { exact: true })
    .fill("nouveau-membre");
  await member
    .getByLabel("Mot de passe", { exact: true })
    .fill("Changed-password-123!");
  await member
    .getByRole("button", { name: "Entrer dans notre espace" })
    .click();
  await expect(
    member.getByRole("heading", { name: "Bonjour Nouveau membre." }),
  ).toBeVisible();
  await context.close();
});
