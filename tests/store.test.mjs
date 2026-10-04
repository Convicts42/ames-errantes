import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { mkdirSync } from "node:fs";
import { openDatabase } from "../src/server/database.mjs";
import {
  importDocuments,
  listDocuments,
  getDocument,
  updateDocument,
  createDocument,
  listRevisions,
  restoreRevision,
  saveTask,
  exportProject,
} from "../src/server/store.mjs";
import {
  createUser,
  bootstrap,
  setup,
  login,
  session,
  logout,
  changePassword,
} from "../src/server/auth.mjs";
import { cleanHtml } from "../src/server/content.mjs";
import { backupDatabase } from "../src/server/backup.mjs";

const source = JSON.parse(
  readFileSync(resolve("data/import-spaces.json"), "utf8"),
);
const actor = { id: "test", name: "Compte test" };
function fixture() {
  const db = openDatabase(":memory:");
  importDocuments(source, db);
  return db;
}
test("the complete import preserves originals, internal links and later edits", () => {
  const db = fixture();
  assert.equal(listDocuments(db).length, 15);
  for (const d of source.documents) {
    const saved = db.prepare("SELECT * FROM documents WHERE id=?").get(d.id);
    assert.equal(saved.imported_markdown, d.markdown);
    assert.ok(saved.html.length > 0);
    assert.doesNotMatch(saved.html, /https:\/\/chatgpt.com\/space\/page_/);
  }
  const doc = getDocument("projet", db);
  updateDocument(
    doc.id,
    { ...doc, title: "Titre modifié par un membre" },
    actor,
    db,
  );
  assert.equal(importDocuments(source, db), 0);
  assert.equal(getDocument("projet", db).title, "Titre modifié par un membre");
  db.close();
});
test("concurrent edits are rejected without loss, restoration creates a new version", () => {
  const db = fixture(),
    doc = getDocument("statuts", db),
    revisions = listRevisions(doc.id, db);
  const saved = updateDocument(
    doc.id,
    { ...doc, html: "<p>Un choix discuté ensemble.</p>" },
    actor,
    db,
  );
  assert.equal(saved.version, 2);
  assert.throws(
    () =>
      updateDocument(
        doc.id,
        { ...doc, html: "<p>Ancienne saisie</p>" },
        actor,
        db,
      ),
    { status: 409 },
  );
  assert.equal(getDocument(doc.id, db).html, saved.html);
  const restored = restoreRevision(
    doc.id,
    { version: 2, revisionId: revisions[0].id },
    actor,
    db,
  );
  assert.equal(restored.html, doc.html);
  assert.equal(restored.version, 3);
  assert.equal(listRevisions(doc.id, db).length, 3);
  db.close();
});
test("HTML sanitization blocks executable markup and keeps document tables and citations", () => {
  const cleaned = cleanHtml(
    '<script>alert(1)</script><p onclick="alert(1)">Texte <a href="javascript:alert(1)">lien</a><a href="https://example.org" target="_blank">source</a></p><iframe src="https://evil.invalid"></iframe><img src="x" onerror="alert(1)"><table><tr><th>Budget</th><td>1800 €</td></tr></table>',
  );
  assert.doesNotMatch(
    cleaned,
    /<script|onclick|javascript:|iframe|onerror|<img/,
  );
  assert.match(cleaned, /<table>/);
  assert.match(cleaned, /noopener noreferrer/);
  assert.match(cleaned, /https:\/\/example.org/);
});
test("private setup is one-time; separate accounts, logout and password invalidation work", async () => {
  const db = fixture(),
    code = bootstrap(db);
  await assert.rejects(
    setup(
      {
        token: "invalid",
        name: "Porteur",
        username: "porteur",
        password: "A-long-test-password!",
      },
      db,
    ),
    { status: 403 },
  );
  const user = await setup(
    {
      token: code,
      name: "Porteur",
      username: "porteur",
      password: "A-long-test-password!",
    },
    db,
  );
  await assert.rejects(
    setup(
      {
        token: code,
        name: "Autre",
        username: "autre",
        password: "A-long-test-password!",
      },
      db,
    ),
    { status: 409 },
  );
  const mother = await createUser(
    { name: "Maman", username: "maman", password: "Another-long-password!" },
    "editor",
    db,
  );
  assert.equal(mother.role, "editor");
  const token = await login(
    { username: "porteur", password: "A-long-test-password!" },
    db,
  );
  assert.equal(session(token, db).id, user.id);
  const token2 = await login(
    { username: "porteur", password: "A-long-test-password!" },
    db,
  );
  logout(token, db);
  assert.equal(session(token, db), null);
  assert.ok(session(token2, db));
  await changePassword(
    user,
    { current: "A-long-test-password!", password: "A-new-long-password!" },
    db,
  );
  assert.equal(session(token2, db), null);
  assert.doesNotMatch(
    JSON.stringify(exportProject(db)),
    /password_hash|token_hash|A-new-long-password/,
  );
  db.close();
});
test("login attempts remain bounded and errors do not expose passwords", async () => {
  const db = fixture();
  for (let i = 0; i < 10; i++)
    await assert.rejects(
      login({ username: "absent", password: "incorrect" }, db),
      { status: 401 },
    );
  await assert.rejects(
    login({ username: "absent", password: "incorrect" }, db),
    { status: 429 },
  );
  db.close();
});
test("checklist keeps unresolved choices and detects editing conflicts", () => {
  const db = fixture(),
    t = db.prepare("SELECT * FROM tasks WHERE id='siege'").get();
  assert.equal(t.status, "parked");
  saveTask(t.id, { ...t, status: "active" }, actor, db);
  assert.throws(() => saveTask(t.id, { ...t, status: "done" }, actor, db), {
    status: 409,
  });
  assert.throws(
    () =>
      saveTask(
        null,
        { title: "A task", status: "done", assignee: "missing" },
        actor,
        db,
      ),
    { status: 400 },
  );
  db.close();
});
test("a real database and backup preserve edits, histories and accounts after reopening", async () => {
  mkdirSync("data/test-runs", { recursive: true });
  const directory = mkdtempSync(resolve("data/test-runs/store-")),
    path = join(directory, "project.sqlite");
  let db = openDatabase(path);
  importDocuments(source, db);
  await createUser(
    { name: "Test", username: "test-owner", password: "Test-backup-password!" },
    "owner",
    db,
  );
  const created = createDocument(
    {
      title: "Document persistant",
      category: "projet",
      status: "draft",
      html: "<p>Des données à conserver.</p>",
    },
    actor,
    db,
  );
  updateDocument(
    created.id,
    { ...created, title: "Version conservée" },
    actor,
    db,
  );
  const backup = await backupDatabase(db, join(directory, "backups"));
  db.close();
  db = openDatabase(path);
  assert.equal(getDocument(created.id, db).title, "Version conservée");
  db.close();
  db = openDatabase(backup);
  assert.equal(getDocument(created.id, db).version, 2);
  assert.equal(listRevisions(created.id, db).length, 2);
  assert.equal(
    db.prepare("PRAGMA integrity_check").get().integrity_check,
    "ok",
  );
  assert.ok(
    session(
      await login(
        { username: "test-owner", password: "Test-backup-password!" },
        db,
      ),
      db,
    ),
  );
  db.close();
});
