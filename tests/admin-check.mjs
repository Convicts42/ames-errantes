import { request } from "@playwright/test";
import assert from "node:assert/strict";
const internal = "http://localhost:4474",
  site = "http://localhost:4473";
const owner = await request.newContext(),
  anonymous = await request.newContext(),
  editor = await request.newContext();
async function send(client, path, method = "GET", data, origin = internal) {
  return client.fetch(origin + path, { method, data, headers: { origin } });
}
try {
  for (const [method, path] of [
    ["GET", "animals"],
    ["POST", "animals"],
    ["PUT", "animals/soleil"],
    ["GET", "requests"],
    ["PATCH", "requests/missing"],
    ["DELETE", "requests/missing"],
    ["GET", "settings"],
    ["PUT", "settings"],
    ["POST", "settings"],
    ["POST", "media"],
  ]) {
    assert.equal(
      (
        await send(
          anonymous,
          "/api/admin/" + path,
          method,
          method === "GET" ? undefined : {},
        )
      ).status(),
      401,
      path,
    );
  }
  assert.equal(
    (
      await send(owner, "/api/workspace/login", "POST", {
        username: "qa-owner",
        password: "Only-test-Password-456",
      })
    ).status(),
    200,
  );
  const oldRoutes = [
    ["GET", "/admin"],
    ["GET", "/admin/"],
    ["POST", "/api/admin/login"],
    ["POST", "/api/admin/logout"],
    ["POST", "/api/admin/password"],
    ["GET", "/api/admin/animals"],
    ["POST", "/api/admin/animals"],
    ["PUT", "/api/admin/animals/soleil"],
    ["GET", "/api/admin/requests"],
    ["PATCH", "/api/admin/requests/missing"],
    ["DELETE", "/api/admin/requests/missing"],
    ["GET", "/api/admin/settings"],
    ["PUT", "/api/admin/settings"],
    ["POST", "/api/admin/settings"],
    ["POST", "/api/admin/media"],
  ];
  for (const client of [anonymous, owner])
    for (const [method, path] of oldRoutes) {
      const response = await send(
        client,
        path,
        method,
        method === "GET" ? undefined : {},
        site,
      );
      assert.equal(
        response.status(),
        404,
        `${method} ${path} must not expose administration`,
      );
      assert.equal(response.headers()["set-cookie"], undefined);
    }
  assert.equal((await send(owner, "/api/workspace/session")).status(), 200);
  const animals = (await (await send(owner, "/api/admin/animals")).json())
    .animals;
  const draftResponse = await send(owner, "/api/admin/animals", "POST", {
    ...animals[0],
    slug: "qa-private-draft",
    name: "Brouillon privé QA",
    published: false,
  });
  assert.equal(draftResponse.status(), 201, await draftResponse.text());
  const draft = (await draftResponse.json()).animal;
  assert.equal(
    (await owner.get(site + "/api/animals/" + draft.slug)).status(),
    404,
  );
  const publicAnimals = (await (await owner.get(site + "/api/animals")).json())
    .animals;
  assert.ok(!publicAnimals.some((a) => a.slug === draft.slug));
  const forbidden = await owner.put(
    internal + "/api/admin/animals/" + draft.slug,
    { data: draft, headers: { origin: site } },
  );
  assert.equal(forbidden.status(), 403);
  const newUser = await send(owner, "/api/workspace/users", "POST", {
    username: "qa-editor",
    name: "Équipe QA",
    password: "Only-test-editor-456",
  });
  assert.equal(newUser.status(), 201, await newUser.text());
  assert.equal(
    (
      await send(editor, "/api/workspace/login", "POST", {
        username: "qa-editor",
        password: "Only-test-editor-456",
      })
    ).status(),
    200,
  );
  assert.equal((await send(editor, "/api/admin/settings")).status(), 200);
  const changed = await send(
    editor,
    "/api/admin/animals/" + draft.slug,
    "PUT",
    { ...draft, name: "Brouillon modifié en intranet" },
  );
  assert.equal(changed.status(), 200, await changed.text());
  assert.equal(
    (
      await send(editor, "/api/workspace/users", "POST", {
        username: "unauthorized",
        name: "Denied",
        password: "Only-test-editor-456",
      })
    ).status(),
    403,
  );
  assert.equal(
    (
      await send(editor, "/api/workspace/password", "POST", {
        current: "Only-test-editor-456",
        password: "Only-test-editor-new-789",
      })
    ).status(),
    200,
  );
  assert.equal((await send(editor, "/api/admin/animals")).status(), 401);
  assert.equal(
    (
      await send(editor, "/api/workspace/login", "POST", {
        username: "qa-editor",
        password: "Only-test-editor-new-789",
      })
    ).status(),
    200,
  );
  const audit = (await (await send(owner, "/api/workspace/activity")).json())
    .events;
  assert.ok(
    audit.some(
      (e) =>
        e.entity === "animals" &&
        e.entity_id === draft.slug &&
        e.actor === "Équipe · Équipe QA",
    ),
  );
  console.log(
    "PASS Administration accessible uniquement dans l’intranet : anciennes routes publiques fermées, comptes/permissions conservés, brouillons privés, contrôle d’origine et historique vérifiés.",
  );
} finally {
  await owner.dispose();
  await anonymous.dispose();
  await editor.dispose();
}
