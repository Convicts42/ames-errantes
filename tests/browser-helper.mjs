import { chromium } from "@playwright/test";
export function openBrowser() {
  if (process.env.PLAYWRIGHT_WS_ENDPOINT)
    return chromium.connect(process.env.PLAYWRIGHT_WS_ENDPOINT);
  return chromium.launch({
    channel:
      process.env.PLAYWRIGHT_CHANNEL ||
      (process.platform === "win32" ? "chrome" : undefined),
    headless: true,
  });
}
