import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

const origin = "http://127.0.0.1:4183";
const credentials = {
  username: "test-admin",
  password: "Test-only-password-2026!",
};
const contact = {
  kind: "contact",
  name: "Personne test",
  email: "api@example.test",
  subject: "Une autre question",
  message: "Message conservé en SQLite.",
  consent: true,
};
async function login(request) {
  const response = await request.post("/api/admin/login", {
    headers: { origin },
    data: credentials,
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["set-cookie"]).toContain("HttpOnly");
  expect(response.headers()["set-cookie"]).toContain("SameSite=Strict");
}

test("private endpoints reject unauthenticated requests and forged origins", async ({
  request,
}) => {
  for (const path of ["/api/admin/animals", "/api/admin/requests"])
    expect((await request.get(path)).status()).toBe(401);
  expect(
    (
      await request.post("/api/admin/animals", {
        headers: { origin },
        data: {},
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.patch("/api/admin/requests/missing", {
        headers: { origin },
        data: { status: "closed" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.delete("/api/admin/requests/missing", {
        headers: { origin },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/requests", {
        headers: { origin: "https://untrusted.example" },
        data: contact,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/requests", {
        headers: { origin, "Content-Type": "application/json" },
        data: "{",
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/requests", {
        headers: { origin },
        data: { ...contact, message: "x".repeat(40000) },
      })
    ).status(),
  ).toBe(413);
  expect((await request.get("/data/ame-errante.sqlite")).status()).toBe(404);
  expect((await request.get("/api/requests")).status()).toBe(405);
  const publicData = await (await request.get("/api/animals")).text();
  expect(publicData).not.toMatch(/password_hash|token_hash|@example/);
});

test("saved messages are private, deduplicated and manageable after login", async ({
  request,
}) => {
  const key = randomUUID();
  const response = await request.post("/api/requests", {
    headers: { origin, "Idempotency-Key": key },
    data: contact,
  });
  expect(response.status()).toBe(201);
  const { id } = await response.json();
  const retry = await request.post("/api/requests", {
    headers: { origin, "Idempotency-Key": key },
    data: contact,
  });
  expect((await retry.json()).id).toBe(id);
  await login(request);
  const records = await (await request.get("/api/admin/requests")).json();
  expect(records.requests.filter((item) => item.id === id)).toHaveLength(1);
  expect(records.requests.find((item) => item.id === id).payload.message).toBe(
    contact.message,
  );
  expect(
    (
      await request.patch(`/api/admin/requests/${id}`, {
        headers: { origin: "https://untrusted.example" },
        data: { status: "closed" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.patch(`/api/admin/requests/${id}`, {
        headers: { origin },
        data: { status: "closed" },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.delete(`/api/admin/requests/${id}`, { headers: { origin } })
    ).status(),
  ).toBe(200);
  await request.post("/api/admin/logout", { headers: { origin } });
  expect((await request.get("/api/admin/requests")).status()).toBe(401);
});

test("administration edits, publishes and withdraws a real database record", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("button", { name: "Se connecter" }),
  ).toBeVisible();
  await page.locator("#admin-username").fill(credentials.username);
  await page.locator("#admin-password").fill(credentials.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(
    page.getByRole("button", { name: "Se déconnecter" }),
  ).toBeVisible();
  const seed = (await (await page.request.get("/api/animals/soleil")).json())
    .animal;
  const animal = {
    ...seed,
    slug: "essai-admin",
    name: "Essai admin",
    published: false,
  };
  expect(
    (
      await page.request.post("/api/admin/animals", {
        headers: { origin },
        data: animal,
      })
    ).status(),
  ).toBe(201);
  expect((await page.request.get("/api/animals/essai-admin")).status()).toBe(
    404,
  );
  await page.reload();
  await page.getByRole("button", { name: "Animaux", exact: true }).click();
  await page.getByRole("button", { name: "Modifier Essai admin" }).click();
  await page.locator("#animal-name").fill("Compagnon mis à jour");
  await page.getByLabel("Publier la fiche dans le catalogue").check();
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(page.getByRole("status")).toContainText("Fiche enregistrée");
  const publicAnimal = await (
    await page.request.get("/api/animals/essai-admin")
  ).json();
  expect(publicAnimal.animal.name).toBe("Compagnon mis à jour");
  expect((await page.request.get("/essai-admin")).status()).toBe(200);
  await page
    .getByRole("button", { name: "Modifier Compagnon mis à jour" })
    .click();
  await page.getByLabel("Publier la fiche dans le catalogue").uncheck();
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(page.getByRole("status")).toContainText("Fiche enregistrée");
  expect((await page.request.get("/essai-admin")).status()).toBe(404);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("h1").click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/admin-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(
    page.getByRole("button", { name: "Se connecter" }),
  ).toBeVisible();
});

test("meeting sends only after confirmation and appears in the protected inbox", async ({
  page,
}) => {
  await page.goto("/rencontre?animal=plume");
  await expect(page.locator("#meet-animal")).toHaveValue("plume");
  await page.locator("#meet-name").fill("Demande test");
  await page.locator("#meet-email").fill("meeting-backend@example.test");
  await page.locator("#meet-home").selectOption("Maison");
  await page.locator("#meet-household").selectOption("Une personne");
  await page.locator("#meeting-next").click();
  await page
    .locator("#meet-presence")
    .selectOption("Des absences de quelques heures");
  await page.locator("#meet-pets").selectOption("Aucun animal");
  await page.locator("#meet-time").selectOption("Quand le projet sera prêt");
  await page.locator("#meeting-next").click();
  await page.locator("#meeting-submit").click();
  await page.locator("#meeting-send").click();
  await expect(
    page.locator("#meeting-result").getByRole("alert"),
  ).toContainText("accepter");
  await page.locator('#meeting-result input[type="checkbox"]').check();
  await page
    .locator("#meeting-prepared")
    .fill("Récapitulatif personnalisé à enregistrer.");
  await page.locator("#meeting-send").click();
  await expect(page.locator("#meeting-result")).toContainText(
    "Votre demande a bien été enregistrée",
  );
  await login(page.request);
  const records = await (await page.request.get("/api/admin/requests")).json();
  const saved = records.requests.find(
    (item) => item.payload.email === "meeting-backend@example.test",
  );
  expect(saved.payload.summary).toBe(
    "Récapitulatif personnalisé à enregistrer.",
  );
  expect(saved.payload.animalName).toBe("Plume");
  expect(saved.payload.demo).toBe(true);
  await page.goto("/admin");
  const card = page
    .locator(".request-card")
    .filter({ hasText: "meeting-backend@example.test" });
  await card.getByText("Lire la demande").click();
  await expect(card).toContainText(saved.payload.summary);
  await card.getByLabel("État").selectOption("in_progress");
  await expect(card.getByLabel("État")).toHaveValue("in_progress");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("h1").click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.screenshot({
    path: "test-results/admin-desktop.png",
    fullPage: true,
  });
});

test("failed contact submission keeps its contents and never shows false success", async ({
  page,
}) => {
  await page.goto("/contact");
  await page.locator("#name").fill("Camille");
  await page.locator("#email").fill("failure@example.test");
  await page.locator("#message").fill("À conserver si le serveur échoue.");
  await page.locator('input[name="consent"]').check();
  await page.route("**/api/requests", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Serveur momentanément indisponible." }),
    }),
  );
  await page.getByRole("button", { name: "Envoyer mon message" }).click();
  await expect(page.locator("#contact-form").getByRole("alert")).toContainText(
    "indisponible",
  );
  await expect(page.locator("#message-result")).toBeHidden();
  await expect(page.locator("#message")).toHaveValue(
    "À conserver si le serveur échoue.",
  );
});
