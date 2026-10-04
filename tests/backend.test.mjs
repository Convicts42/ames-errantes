import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { unlinkSync } from "node:fs";
import { openDatabase } from "../src/server/database.mjs";
import {
  listAnimals,
  getAnimal,
  saveAnimal,
  submitRequest,
  listRequests,
  updateRequest,
  deleteRequest,
} from "../src/server/repository.mjs";
import {
  createAdmin,
  login,
  getSession,
  logout,
  changePassword,
  verifyPassword,
} from "../src/server/auth.mjs";
import { requestInput } from "../src/server/validation.mjs";
import { meetingOptions } from "../src/data/form-options.js";

const contact = {
  kind: "contact",
  name: "Camille",
  email: "camille@example.test",
  subject: "Une autre question",
  message: "Un message de test.",
  consent: true,
};
const meeting = {
  kind: "meeting",
  name: "Camille",
  email: "camille@example.test",
  animal: "soleil",
  message: "",
  consent: true,
  ...Object.fromEntries(
    Object.entries(meetingOptions).map(([key, values]) => [key, values[0]]),
  ),
};
const withDb = async (action) => {
  const db = openDatabase(":memory:");
  try {
    await action(db);
  } finally {
    db.close();
  }
};

test("migrations, updates and requests survive closing and reopening SQLite", async () => {
  const path = resolve("data/test-runs", `${randomUUID()}.sqlite`);
  let db = openDatabase(path);
  try {
    assert.equal(listAnimals({}, db).length, 2);
    const animal = getAnimal("soleil", {}, db);
    saveAnimal({ ...animal, name: "Soleil modifié" }, "soleil", db);
    const request = submitRequest(contact, randomUUID(), db);
    db.close();
    db = openDatabase(path);
    assert.equal(getAnimal("soleil", {}, db).name, "Soleil modifié");
    assert.equal(listRequests(db)[0].id, request.id);
    assert.equal(listAnimals({}, db).length, 2);
  } finally {
    db.close();
    for (const suffix of ["", "-wal", "-shm"]) {
      try {
        unlinkSync(path + suffix);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
  }
});
test("drafts are private and stale admin updates cannot overwrite newer changes", () =>
  withDb((db) => {
    const animal = getAnimal("soleil", {}, db);
    saveAnimal({ ...animal, published: false }, "soleil", db);
    assert.equal(getAnimal("soleil", {}, db), null);
    assert.equal(listAnimals({}, db).length, 1);
    assert.throws(
      () => saveAnimal({ ...animal, name: "Stale" }, "soleil", db),
      (error) => error.status === 409,
    );
    assert.throws(
      () => submitRequest(meeting, randomUUID(), db),
      (error) => error.status === 409,
    );
  }));
test("a request cannot target an adopted or missing animal", () =>
  withDb((db) => {
    saveAnimal(
      { ...getAnimal("soleil", {}, db), status: "adopted" },
      "soleil",
      db,
    );
    assert.throws(
      () => submitRequest(meeting, randomUUID(), db),
      (error) => error.status === 409,
    );
    assert.throws(
      () => submitRequest({ ...meeting, animal: "missing" }, randomUUID(), db),
      (error) => error.status === 409,
    );
  }));
test("retrying after a lost response does not duplicate a request", () =>
  withDb((db) => {
    const key = randomUUID();
    const first = submitRequest(meeting, key, db);
    assert.deepEqual(submitRequest(meeting, key, db), {
      id: first.id,
      duplicate: true,
    });
    assert.equal(listRequests(db).length, 1);
    assert.throws(
      () => submitRequest({ ...meeting, name: "Changed" }, key, db),
      (error) => error.status === 409,
    );
  }));
test("invalid input, missing consent and unknown enumerations are rejected", () => {
  for (const input of [
    null,
    [],
    { ...contact, name: " " },
    { ...contact, email: "bad" },
    { ...contact, consent: false },
    { ...contact, subject: "unexpected" },
    { ...meeting, home: "unexpected" },
    { ...contact, message: "x".repeat(5001) },
  ])
    assert.throws(
      () => requestInput(input),
      (error) => error.status === 400,
    );
});
test("SQL-looking input is stored as text and rate limits persist", () =>
  withDb((db) => {
    const payload = { ...contact, message: "'); DROP TABLE animals; --" };
    for (let index = 0; index < 5; index++)
      submitRequest(payload, randomUUID(), db);
    assert.equal(listRequests(db)[0].payload.message, payload.message);
    assert.equal(listAnimals({}, db).length, 2);
    assert.throws(
      () => submitRequest(payload, randomUUID(), db),
      (error) => error.status === 429,
    );
  }));
test("request lifecycle supports status updates and removal of personal data", () =>
  withDb((db) => {
    const { id } = submitRequest(contact, randomUUID(), db);
    updateRequest(id, "closed", db);
    assert.equal(listRequests(db)[0].status, "closed");
    deleteRequest(id, db);
    assert.equal(listRequests(db).length, 0);
  }));
test("passwords and session tokens are hashed, and logout invalidates sessions", () =>
  withDb(async (db) => {
    await createAdmin("admin", "A-strong-test-password!", db);
    const stored = db
      .prepare("SELECT password_hash FROM admins")
      .get().password_hash;
    assert.ok(!stored.includes("A-strong-test-password!"));
    assert.equal(await verifyPassword("A-strong-test-password!", stored), true);
    await assert.rejects(
      login("admin", "incorrect", db),
      (error) => error.status === 401,
    );
    const token = await login("admin", "A-strong-test-password!", db);
    assert.notEqual(
      db.prepare("SELECT token_hash FROM sessions").get().token_hash,
      token,
    );
    assert.equal(getSession(token, db).username, "admin");
    logout(token, db);
    assert.equal(getSession(token, db), null);
  }));
test("password changes invalidate every session and expired sessions are refused", () =>
  withDb(async (db) => {
    await createAdmin("admin", "A-strong-test-password!", db);
    const first = await login("admin", "A-strong-test-password!", db);
    const second = await login("admin", "A-strong-test-password!", db);
    await changePassword(
      getSession(first, db).id,
      "A-strong-test-password!",
      "A-new-strong-password!",
      db,
    );
    assert.equal(getSession(first, db), null);
    assert.equal(getSession(second, db), null);
    const token = await login("admin", "A-new-strong-password!", db);
    db.prepare("UPDATE sessions SET expires_at = 0").run();
    assert.equal(getSession(token, db), null);
  }));
