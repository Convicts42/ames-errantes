import { request } from "@playwright/test";
import assert from "node:assert/strict";
const internal = "http://localhost:4474",
  site = "http://localhost:4473";
const client = await request.newContext();
try {
  assert.equal(
    (
      await client.post(internal + "/api/workspace/login", {
        data: { username: "qa-owner", password: "Only-test-Password-456" },
        headers: { origin: internal },
      })
    ).status(),
    200,
  );
  const animal = (
    await (await client.get(internal + "/api/admin/animals")).json()
  ).animals[0];
  const bytes = await (await client.get(site + animal.image)).body();
  const uploaded = await client.post(internal + "/api/admin/media", {
    data: bytes,
    headers: { origin: internal, "content-type": "image/webp" },
  });
  assert.equal(uploaded.status(), 201);
  const { url } = await uploaded.json();
  assert.equal((await client.get(internal + url)).status(), 200);
  assert.equal((await fetch(internal + url)).status, 401);
  assert.equal((await client.get(site + url)).status(), 404);
  assert.equal((await fetch(site + url)).status, 404);
  const saved = await client.put(
    internal + "/api/admin/animals/" + animal.slug,
    { data: { ...animal, photos: [url] }, headers: { origin: internal } },
  );
  assert.equal(saved.status(), 200);
  assert.equal((await fetch(site + url)).status, 200);
  console.log(
    "Photo importée : visible dans les deux interfaces, privée avant son rattachement à une fiche publiée.",
  );
} finally {
  await client.dispose();
}
