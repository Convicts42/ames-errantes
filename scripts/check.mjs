import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "parse5";
import { pages } from "../src/data/pages.js";
import { seedAnimals } from "../src/server/seed.mjs";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import net from "node:net";

const probe = net.createServer();
await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const base = `http://127.0.0.1:${port}`;
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    env: {
      ...process.env,
      DATABASE_PATH: resolve("data/test-runs", `${randomUUID()}.sqlite`),
    },
    stdio: ["ignore", "ignore", "pipe"],
    windowsHide: true,
  },
);
let serverErrors = "";
child.stderr.on("data", (chunk) => {
  serverErrors += chunk;
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      ready = (await fetch(base)).ok;
    } catch {}
    if (ready) break;
    if (child.exitCode !== null)
      throw new Error(serverErrors || "Server stopped");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, "Production server did not start");

  const root = process.cwd();
  const paths = new Set(
    pages.map((page) => (page.slug === "index" ? "/" : `/${page.slug}`)),
  );
  const attribute = (node, name) =>
    node.attrs?.find((attr) => attr.name === name)?.value;
  function flatten(node) {
    return [node, ...(node.childNodes || []).flatMap(flatten)];
  }
  let references = 0;
  for (const page of pages) {
    const response = await fetch(
      `${base}${page.slug === "index" ? "/" : `/${page.slug}`}`,
    );
    assert.equal(response.status, 200, page.slug);
    const html = await response.text();
    const nodes = flatten(parse(html));
    assert.equal(
      nodes.filter((node) => node.tagName === "h1").length,
      1,
      `${page.slug}: one h1`,
    );
    assert.equal(
      nodes.filter((node) => node.tagName === "main").length,
      1,
      `${page.slug}: one main`,
    );
    assert.equal(
      attribute(
        nodes.find((node) => node.tagName === "html"),
        "lang",
      ),
      "fr",
    );
    assert.equal(
      nodes.find((node) => node.tagName === "title").childNodes[0].value,
      `${page.title} — Âme Errante`,
    );
    assert.equal(
      attribute(
        nodes.find((node) => attribute(node, "name") === "description"),
        "content",
      ),
      seedAnimals.find((animal) => animal.slug === page.slug)?.description ||
        page.description,
    );
    const ids = nodes.map((node) => attribute(node, "id")).filter(Boolean);
    assert.equal(new Set(ids).size, ids.length, `${page.slug}: unique IDs`);
    assert.equal(
      nodes.filter(
        (node) => node.tagName === "a" && attribute(node, "class") === "active",
      ).length,
      1,
      `${page.slug}: active navigation`,
    );
    for (const node of nodes) {
      for (const name of ["href", "src"]) {
        const value = attribute(node, name);
        if (!value || /^(https?:|data:)/.test(value)) continue;
        if (value.startsWith("#")) {
          assert.ok(
            ids.includes(value.slice(1)),
            `${page.slug}: missing anchor ${value}`,
          );
          continue;
        }
        assert.ok(
          value.startsWith("/"),
          `${page.slug}: absolute local URL ${value}`,
        );
        const path = value.split(/[?#]/)[0];
        assert.ok(
          !path.endsWith(".html"),
          `${page.slug}: legacy internal link ${value}`,
        );
        if (paths.has(path) || path === "/icon.svg") continue;
        const target = path.startsWith("/_next/")
          ? resolve(root, ".next", path.slice(7))
          : resolve(root, "public", path.slice(1));
        await access(target);
        references++;
      }
    }
    console.log(`${page.slug}: OK`);
  }
  const css = await readFile(resolve(root, "src/styles/globals.css"), "utf8");
  for (const [, value] of css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)) {
    assert.ok(value.startsWith("/assets/"), `Local asset required: ${value}`);
    await access(resolve(root, "public", value.slice(1)));
  }
  console.log(
    `${pages.length} pages and ${references} local resources verified in the Next.js production build.`,
  );
} finally {
  child.kill();
  await new Promise((resolve) => {
    if (child.exitCode !== null) resolve();
    else child.once("exit", resolve);
  });
}
