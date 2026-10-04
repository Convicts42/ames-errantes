import { test, expect } from "@playwright/test";
import { pages } from "../src/data/pages.js";

test("every page, old URL and query string works; unknown paths return 404", async ({
  request,
}) => {
  for (const page of pages) {
    const route = page.slug === "index" ? "/" : `/${page.slug}`;
    expect((await request.get(route)).status()).toBe(200);
    const old = await request.get(`/${page.slug}.html?animal=plume`, {
      maxRedirects: 0,
    });
    expect(old.status()).toBe(308);
    expect(old.headers().location).toBe(`${route}?animal=plume`);
  }
  expect((await request.get("/inconnue")).status()).toBe(404);
  expect((await request.get("/toString")).status()).toBe(404);
});

test("client navigation, catalog filters, portrait and donation dialogs", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.evaluate(() => {
    window.navigationMarker = "same-document";
  });
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Nos animaux" })
    .click();
  await expect(page).toHaveURL(/\/animaux$/);
  expect(await page.evaluate(() => window.navigationMarker)).toBe(
    "same-document",
  );
  await page.getByRole("button", { name: "Les chats", exact: true }).click();
  await expect(page.locator(".catalog-count")).toHaveText(
    "1 portrait à découvrir",
  );
  await expect(page.locator('[data-animal="chien"]')).toBeHidden();
  await page
    .getByRole("link", { name: "Découvrir Plume, fiche d’exemple" })
    .click();
  await page
    .getByRole("link", { name: "Voir le portrait de Plume en grand" })
    .click();
  await expect(page.locator("#portrait-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#portrait-dialog")).toBeHidden();
  await page.getByRole("button", { name: "Faire un don" }).click();
  await expect(page.locator("#don")).toBeVisible();
  await page.locator("#don").getByRole("link").click();
  await expect(page).toHaveURL(/\/nous-aider$/);
  await expect(page.locator("#don")).toBeHidden();
  await page.getByRole("button", { name: "Faire un don" }).last().click();
  await expect(page.locator("#don")).toBeVisible();
  expect(errors).toEqual([]);
});

test("meeting validates every step, preserves answers and prepares an editable message", async ({
  page,
}) => {
  await page.goto("/soleil");
  await page
    .getByRole("link", { name: "Je souhaite rencontrer Soleil" })
    .click();
  await expect(page.locator("#meet-animal")).toHaveValue("soleil");
  await page.locator("#meeting-next").click();
  await expect(page.locator("#meeting-status")).toHaveText("Étape 1 sur 3");
  await page.locator("#meet-name").fill("   ");
  await page.locator("#meeting-next").click();
  await expect(page.locator("#meeting-status")).toHaveText("Étape 1 sur 3");
  await page.locator("#meet-name").fill("Camille");
  await page.locator("#meet-email").fill("meeting-ui@example.test");
  await page.locator("#meet-home").selectOption("Maison");
  await page.locator("#meet-household").selectOption("Plusieurs adultes");
  await page.locator("#meeting-next").click();
  await expect(page.locator('[data-meeting-step="1"] legend')).toBeFocused();
  await page.locator("#meeting-next").click();
  await expect(page.locator("#meeting-status")).toHaveText("Étape 2 sur 3");
  await page
    .locator("#meet-presence")
    .selectOption("Des absences de quelques heures");
  await page.locator("#meet-pets").selectOption("Aucun animal");
  await page.locator("#meet-time").selectOption("Quand le projet sera prêt");
  await page.locator("#meeting-next").click();
  await page.locator("#meet-message").fill("Comment préparer son arrivée ?");
  await page.locator("#meeting-submit").click();
  await expect(page.locator("#meeting-result-title")).toBeFocused();
  await expect(page.locator("#meeting-prepared")).toHaveValue(
    /Soleil[\s\S]*Camille[\s\S]*Maison[\s\S]*Comment préparer/,
  );
  await page.locator("#meeting-prepared").fill("Mon récapitulatif modifié");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.copiedMessage = text;
        },
      },
    });
  });
  await page.locator("#meeting-copy").click();
  expect(await page.evaluate(() => window.copiedMessage)).toBe(
    "Mon récapitulatif modifié",
  );
  await page.locator("#meeting-edit").click();
  await expect(page.locator("#meet-name")).toHaveValue("Camille");
  await expect(page.locator("#meet-home")).toHaveValue("Maison");
  await page.locator("#meet-animal").selectOption("plume");
  await expect(page.locator("#meeting-name")).toHaveText("Plume");
  await page.locator("#meeting-next").click();
  await expect(page.locator("#meet-pets")).toHaveValue("Aucun animal");
  await page.locator("#meeting-next").click();
  await page.locator("#meeting-submit").click();
  await expect(page.locator("#meeting-prepared")).toHaveValue(
    /rencontre avec Plume/,
  );
  await page.reload();
  await expect(page.locator("#meet-name")).toHaveValue("");
  await page.goto("/rencontre?animal=toString");
  await expect(page.locator("#meet-animal")).toHaveValue("");
  await expect(page.locator("#meeting-photo")).toBeHidden();
});

test("contact preselection, validation and clipboard fallback", async ({
  page,
}) => {
  await page.goto("/nous-aider");
  await page
    .getByRole("main")
    .getByRole("link", { name: "Devenir bénévole" })
    .click();
  await expect(page.locator("#subject")).toHaveValue("Devenir bénévole");
  await page.locator("#name").fill("Camille");
  await page.locator("#email").fill("contact-ui@example.test");
  await page.locator('input[name="consent"]').check();
  await page.locator("#message").fill("   ");
  await page.getByRole("button", { name: "Envoyer mon message" }).click();
  await expect(page.locator("#message-result")).toBeHidden();
  await page.locator("#message").fill("Je souhaite vous aider.");
  await page.getByRole("button", { name: "Envoyer mon message" }).click();
  await expect(page.locator("#prepared-message")).toHaveValue(
    /Devenir bénévole[\s\S]*Je souhaite vous aider.[\s\S]*Camille/,
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
    });
  });
  await page.locator("#copy-message").click();
  await expect(page.locator("#copy-status")).toContainText(
    "Le texte est sélectionné",
  );
  await expect(page.locator("#prepared-message")).toBeFocused();
  await page.goto("/contact?subject=inconnu");
  await expect(page.locator("#subject")).toHaveValue("Un projet d’adoption");
});

test("mobile menu, FAQ and 320px layout on all pages", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await expect(page.locator("#navigation")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".menu-toggle")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page
    .locator("#navigation")
    .getByRole("link", { name: "Adopter", exact: true })
    .click();
  await expect(page.locator(".menu-toggle")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page.locator("summary").first().click();
  await expect(page.locator("details").first()).toHaveAttribute("open", "");
  for (const { slug } of pages) {
    await page.goto(slug === "index" ? "/" : `/${slug}`);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      slug,
    ).toBe(true);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/rencontre?animal=plume");
  await expect(page.locator("#meet-animal")).toHaveValue("plume");
  await page.screenshot({
    path: "test-results/rencontre-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("reduced motion, legacy anchors and remounting the home scene", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".hero")).toHaveAttribute(
    "data-effect-state",
    "reduced",
  );
  await page.screenshot({
    path: "test-results/accueil-desktop.png",
    fullPage: true,
  });
  await page.goto("/#mission");
  await expect(page).toHaveURL(/\/association$/);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page
    .locator("#navigation")
    .getByRole("link", { name: "Accueil", exact: true })
    .click();
  await expect(page.locator(".hero")).toHaveAttribute(
    "data-effect-state",
    /running|fallback/,
    { timeout: 15000 },
  );
  const state = await page.locator(".hero").getAttribute("data-effect-state");
  console.log(`Three.js state in Chrome: ${state}`);
  const oldHero = await page.locator(".hero").elementHandle();
  await page
    .locator("#navigation")
    .getByRole("link", { name: "Nos animaux" })
    .click();
  await expect(page).toHaveURL(/\/animaux$/);
  if (state === "running") {
    await expect
      .poll(() => oldHero.evaluate((element) => element.dataset.effectState))
      .toBe("disposed");
  }
  const frames = await oldHero.evaluate(
    (element) => element.dataset.effectFrames,
  );
  await page
    .locator("#navigation")
    .getByRole("link", { name: "Accueil", exact: true })
    .click();
  await expect(page.locator(".hero")).toHaveAttribute(
    "data-effect-state",
    /running|fallback/,
    { timeout: 15000 },
  );
  expect(
    await oldHero.evaluate((element) => element.dataset.effectFrames),
  ).toBe(frames);
  if (state === "running") {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".hero")).toHaveAttribute(
      "data-effect-state",
      "reduced",
    );
  }
  expect(errors).toEqual([]);
});
