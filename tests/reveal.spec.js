import { test, expect } from "@playwright/test";

test("reveal effects preserve hydrated markup and respect reduced motion", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(() => {
    window.revealAttributeChanges = [];
    new MutationObserver((records) => {
      for (const record of records) {
        if (record.target.matches("[data-reveal]")) {
          window.revealAttributeChanges.push(record.attributeName);
        }
      }
    }).observe(document, { subtree: true, attributes: true });
  });
  await page.goto("/");
  // An interactive control confirms that client hydration has started.
  await page.getByRole("button", { name: "Faire un don" }).click();
  await expect(page.locator("#don")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.locator(".home-doors").scrollIntoViewIfNeeded();
  await expect(page.locator(".home-doors")).toBeVisible();
  expect(await page.evaluate(() => window.revealAttributeChanges)).toEqual([]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      page
        .locator("[data-reveal]")
        .evaluateAll(
          (elements) =>
            elements.flatMap((element) => element.getAnimations()).length,
        ),
    )
    .toBe(0);
  await expect(page.locator(".home-doors")).toHaveCSS("opacity", "1");
  await page.reload();
  await page.getByRole("button", { name: "Faire un don" }).click();
  await expect(page.locator("#don")).toBeVisible();
  expect(await page.evaluate(() => window.revealAttributeChanges)).toEqual([]);
  expect(errors).toEqual([]);
});
