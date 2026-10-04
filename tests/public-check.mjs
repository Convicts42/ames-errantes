import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { pages } from "../packages/core/src/data/pages.js";
const base = process.env.SITE_CHECK_URL || "http://localhost:4173";
const browser = await chromium.launch({
  channel:
    process.env.PLAYWRIGHT_CHANNEL ||
    (process.platform === "win32" ? "chrome" : undefined),
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await mkdir("data/qa", { recursive: true });
  for (const p of [...pages, { slug: "projet" }]) {
    const response = await page.goto(
      base + (p.slug === "index" ? "/" : "/" + p.slug),
    );
    assert.equal(response.status(), 200, p.slug);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
    if (p.slug === "index")
      await page.screenshot({
        path: "data/qa/public-home.png",
        fullPage: true,
      });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/projet");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  assert.deepEqual(errors, []);
  console.log(
    `${pages.length + 1} pages publiques vérifiées, sans erreur JavaScript ; page projet vérifiée sur mobile.`,
  );
} finally {
  await browser.close();
}
