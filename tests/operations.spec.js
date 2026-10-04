import { test, expect } from "@playwright/test";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
const origin = "http://127.0.0.1:4183";
async function login(page) {
  await page.goto("/admin");
  await page.locator("#admin-username").fill("test-admin");
  await page.locator("#admin-password").fill("Test-only-password-2026!");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Se déconnecter" }),
  ).toBeVisible();
}
test("settings and WhatsApp setup are protected and public details update", async ({
  page,
  request,
}) => {
  expect((await request.get("/api/admin/settings")).status()).toBe(401);
  expect(
    (
      await request.post("/api/admin/media", {
        headers: { origin },
        data: Buffer.from("invalid"),
      })
    ).status(),
  ).toBe(401);
  expect(
    (await request.post("/api/whatsapp/webhook", { data: {} })).status(),
  ).toBe(403);
  await login(page);
  await page.getByRole("button", { name: "Réglages et WhatsApp" }).click();
  await page
    .getByLabel("Nom légal de l’association")
    .fill("Association de test");
  await page
    .getByLabel("Zone géographique d’intervention")
    .fill("Secteur de test");
  await page.getByLabel("Délai habituel de réponse").fill("Trois jours ouvrés");
  await page.getByRole("button", { name: "Enregistrer les réglages" }).click();
  await expect(page.getByRole("status")).toContainText("Réglages enregistrés");
  await page
    .getByText("Configurer WhatsApp Business, étape par étape", { exact: true })
    .click();
  await expect(
    page.getByText("WHATSAPP_ACCESS_TOKEN", { exact: false }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("h1").click();
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/settings-mobile.png",
    fullPage: true,
  });
  await page.goto("/adopter");
  await expect(
    page.getByText("Secteur de test", { exact: true }),
  ).toBeVisible();
  await page.goto("/mentions-legales");
  await expect(
    page.getByText("Association de test", { exact: true }),
  ).toBeVisible();
});
test("photo import, rich animal record and adoption story publish together", async ({
  page,
  browser,
}) => {
  await login(page);
  const seed = (await (await page.request.get("/api/animals/soleil")).json())
    .animal;
  await page.request.post("/api/admin/animals", {
    headers: { origin },
    data: {
      ...seed,
      slug: "photo-test",
      name: "Photo test",
      published: false,
      demo: false,
    },
  });
  await page.reload();
  await page.getByRole("button", { name: "Animaux", exact: true }).click();
  await page.getByRole("button", { name: "Modifier Photo test" }).click();
  const buffer = await sharp({
    create: { width: 60, height: 40, channels: 3, background: "#548c63" },
  })
    .png()
    .toBuffer();
  await page
    .getByLabel("Ajouter des photos")
    .setInputFiles({ name: "test.png", mimeType: "image/png", buffer });
  await expect(page.locator(".photo-grid img")).toHaveCount(2);
  const upload = await page
    .locator(".photo-grid img")
    .nth(1)
    .getAttribute("src");
  await page
    .locator(".photo-grid")
    .getByRole("button", { name: "Couverture", exact: true })
    .nth(1)
    .click();
  await page.getByLabel("Gabarit", { exact: true }).fill("Petit gabarit");
  await page.getByLabel("Localisation approximative").fill("Commune de test");
  await page
    .getByLabel("Santé, identification et soins à prévoir")
    .fill("Informations de test");
  await page
    .getByRole("combobox", { name: "Disponibilité", exact: true })
    .selectOption("adopted");
  await page
    .getByLabel("Nouvelles après adoption")
    .fill("Une belle histoire de test.");
  await page.getByLabel("J’ai l’autorisation de publier").check();
  await page.getByLabel("Publier la fiche dans le catalogue").check();
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(page.getByRole("status")).toContainText("Fiche enregistrée");
  const context = await browser.newContext();
  try {
    expect((await context.request.get(origin + upload)).status()).toBe(200);
    const profile = await context.newPage();
    await profile.goto(origin + "/photo-test");
    await expect(
      profile.getByText("Petit gabarit", { exact: true }),
    ).toBeVisible();
    await profile.goto(origin + "/belles-histoires");
    await expect(
      profile.getByText("Une belle histoire de test."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Modifier Photo test" }).click();
    await page.getByLabel("Publier la fiche dans le catalogue").uncheck();
    await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
    await expect(page.getByRole("status")).toContainText("Fiche enregistrée");
    expect((await context.request.get(origin + upload)).status()).toBe(404);
  } finally {
    await context.close();
  }
});
test("dedicated foster form saves contextual answers and staff can track the case", async ({
  page,
}) => {
  await page.goto("/famille-accueil");
  await page.getByLabel("Votre prénom").fill("Accueil test");
  await page
    .getByLabel("Votre adresse e-mail")
    .fill(`foster-${randomUUID()}@example.test`);
  await page.getByLabel("Votre commune ou secteur").fill("Ville de test");
  await page.getByLabel("Vos disponibilités").fill("Les week-ends");
  await page
    .getByLabel("Quelques mots sur votre projet")
    .fill("Un accueil de test.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Envoyer mon message" }).click();
  await expect(page.locator("#message-result")).toContainText(
    "bien été enregistré",
  );
  await login(page);
  await page.getByLabel("Rechercher un dossier").fill("Accueil test");
  const card = page
    .locator(".request-card")
    .filter({ hasText: "Accueil test" });
  await card.getByText("Lire la demande", { exact: true }).click();
  await expect(card).toContainText("Les week-ends");
  await card.locator(".followup-details summary").click();
  await card.getByLabel("Responsable", { exact: true }).fill("Camille");
  await card
    .getByRole("combobox", { name: "Étape", exact: true })
    .selectOption("conversation");
  await card
    .getByLabel("Prochaine action", { exact: true })
    .fill("Organiser un échange");
  await card.getByLabel("Notes privées").fill("Note interne de test");
  await card.getByRole("button", { name: "Enregistrer le suivi" }).click();
  await expect(
    card.getByText("Suivi enregistré · Premier échange"),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel("Rechercher un dossier").fill("Accueil test");
  await card.locator(".followup-details summary").click();
  await expect(card.getByLabel("Responsable", { exact: true })).toHaveValue(
    "Camille",
  );
});
