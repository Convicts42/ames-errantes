import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { isolatedDatabase } from "./database-helper.mjs";
import { transaction, withActor } from "../packages/core/src/database.mjs";
import * as docs from "../packages/core/src/workspace/store.mjs";
import * as auth from "../packages/core/src/auth.mjs";
import * as site from "../packages/core/src/site/repository.mjs";
import * as pub from "../packages/core/src/publications.mjs";
import { seedAnimals } from "../packages/core/src/site/seed.mjs";
import {
  getSettings,
  saveSettings,
  publicSettings,
} from "../packages/core/src/site/settings.mjs";
import { applyWebhook } from "../packages/core/src/site/notifications.mjs";
import { createBackup } from "../packages/core/src/site/maintenance.mjs";
import { readPhoto } from "../packages/core/src/site/media.mjs";
import { consumeRate } from "../packages/core/src/rate-limit.mjs";
import { importSqliteExport } from "../packages/core/src/legacy-import.mjs";
import { mcpClient } from "../services/mcp/test-client.mjs";
const user = { name: "Équipe test" };
const document = {
  title: "Refuge test",
  category: "projet",
  status: "draft",
  html: "<p>Texte privé</p>",
};
const contact = {
  kind: "contact",
  name: "Camille",
  email: "camille@example.test",
  subject: "Une autre question",
  message: "Un message de test.",
  consent: true,
};
const conflict = (error) => error.status === 409;

test("PostgreSQL: document conflicts are atomic and audit actors remain isolated", () =>
  isolatedDatabase(async (db) => {
    const d = await docs.createDocument(document, user, db);
    const results = await Promise.allSettled(
      ["Humain", "IA"].map((actor) =>
        withActor(actor, () =>
          docs.updateDocument(
            d.id,
            { ...d, html: `<p>${actor}</p>` },
            { name: actor },
            db,
          ),
        ),
      ),
    );
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(
      results.find((r) => r.status === "rejected").reason.status,
      409,
    );
    assert.equal((await docs.listRevisions(d.id, db)).length, 2);
    const current = await docs.getDocument(d.id, db);
    const history = await docs.listRevisions(d.id, db);
    const restored = await docs.restoreRevision(
      d.id,
      { revisionId: history.at(-1).id, version: current.version },
      user,
      db,
    );
    assert.equal(restored.html, document.html);
    assert.equal(restored.version, 3);
    await Promise.all(
      ["A", "B"].map((actor) =>
        withActor(actor, () =>
          docs.createDocument(
            { ...document, title: actor },
            { name: actor },
            db,
          ),
        ),
      ),
    );
    const audits = (
      await db.query(
        "SELECT actor,after_data->>'title' AS title FROM audit_events WHERE entity='documents' AND action='INSERT'",
      )
    ).rows;
    for (const actor of ["A", "B"])
      assert.ok(audits.some((a) => a.actor === actor && a.title === actor));
    const before = (await db.query("SELECT count(*) AS n FROM audit_events"))
      .rows[0].n;
    await assert.rejects(
      transaction(db, async () => {
        await docs.createDocument(document, user, db);
        throw new Error("rollback");
      }),
    );
    assert.equal(
      (await db.query("SELECT count(*) AS n FROM audit_events")).rows[0].n,
      before,
    );
  }));

test("Private documents require explicit publication of an immutable revision", () =>
  isolatedDatabase(async (db) => {
    const d = await docs.createDocument(
      { ...document, html: "<p>Public</p><script>alert(1)</script>" },
      user,
      db,
    );
    assert.ok(!d.html.includes("script"));
    assert.deepEqual(await pub.publicDocuments(null, db), []);
    await pub.publishDocument(
      d.id,
      { slug: "projet-test", version: d.version },
      user,
      db,
    );
    await docs.updateDocument(
      d.id,
      { ...d, html: "<p>Nouvelle note privée</p>" },
      user,
      db,
    );
    assert.equal(
      (await pub.publicDocuments("projet-test", db))[0].html,
      "<p>Public</p>",
    );
    await assert.rejects(
      pub.publishDocument(
        d.id,
        { slug: "projet-test", version: d.version },
        user,
        db,
      ),
      conflict,
    );
    await pub.unpublishDocument(d.id, db);
    assert.deepEqual(await pub.publicDocuments(null, db), []);
  }));

test("Shared sessions survive both adapters and are revoked on password change", () =>
  isolatedDatabase(async (db) => {
    const u = await auth.createUser(
      { username: "test-owner", name: "Test", password: "Test-password-12345" },
      "owner",
      db,
    );
    const token = await auth.login(
      { username: u.username, password: "Test-password-12345" },
      db,
    );
    assert.equal((await auth.session(token, db)).id, u.id);
    const adapter = await import("../packages/core/src/site/auth.mjs");
    assert.equal((await adapter.getSession(token, db)).id, u.id);
    await auth.changePassword(
      u,
      { current: "Test-password-12345", password: "Test-password-new-6789" },
      db,
    );
    assert.equal(await auth.session(token, db), null);
    await assert.rejects(
      auth.login({ username: u.username, password: "incorrect" }, db),
      (e) => e.status === 401,
    );
    const people = await auth.listUsers(db);
    assert.ok(!("password_hash" in people[0]));
  }));

test("Parallel limits and task edits reject excess writes", () =>
  isolatedDatabase(async (db) => {
    const rates = await Promise.allSettled(
      Array.from({ length: 12 }, () => consumeRate("test", 3, 60000, db)),
    );
    assert.equal(rates.filter((r) => r.status === "fulfilled").length, 3);
    assert.ok(
      rates
        .filter((r) => r.status === "rejected")
        .every((r) => r.reason.status === 429),
    );
    const t = await docs.saveTask(
      null,
      { title: "Décider", note: "", status: "pending" },
      user,
      db,
    );
    await docs.saveTask(t.id, { ...t, status: "active" }, user, db);
    await assert.rejects(
      docs.saveTask(t.id, { ...t, status: "done" }, user, db),
      conflict,
    );
  }));

test("Animals, JSONB media references and settings share optimistic versions", () =>
  isolatedDatabase(async (db) => {
    let animal = await site.saveAnimal(seedAnimals[0], null, db);
    const mediaId = randomUUID();
    await db.query("INSERT INTO media(id,bytes) VALUES($1,$2)", [
      mediaId,
      Buffer.from("test-bytes"),
    ]);
    animal = await site.saveAnimal(
      { ...animal, photos: [`/media/${mediaId}`] },
      animal.slug,
      db,
    );
    assert.equal(
      (await readPhoto(mediaId, false, db)).toString(),
      "test-bytes",
    );
    const hidden = await site.saveAnimal(
      { ...animal, published: false },
      animal.slug,
      db,
    );
    assert.equal(await readPhoto(mediaId, false, db), null);
    assert.equal(await site.getAnimal(animal.slug, {}, db), null);
    await assert.rejects(
      site.saveAnimal({ ...animal, name: "Obsolete" }, animal.slug, db),
      conflict,
    );
    assert.equal(hidden.version, 3);
    await assert.rejects(
      site.saveAnimal({ ...seedAnimals[0], slug: "projet" }, null, db),
      (e) => e.status === 400,
    );
    const settings = await getSettings(db);
    const updated = await saveSettings(
      { ...settings, legalName: "Âmes test" },
      db,
    );
    assert.equal((await publicSettings(db)).legalName, "Âmes test");
    await assert.rejects(
      saveSettings({ ...settings, associationName: "Obsolete" }, db),
      conflict,
    );
    assert.equal(updated.version, settings.version + 1);
  }));

test("Requests are idempotent under concurrency; STOP and privacy deletion use JSONB correctly", () =>
  isolatedDatabase(async (db) => {
    const key = randomUUID();
    const sent = await Promise.all([
      site.submitRequest(contact, key, db),
      site.submitRequest(contact, key, db),
    ]);
    assert.equal(sent[0].id, sent[1].id);
    assert.equal(sent.filter((r) => r.duplicate).length, 1);
    await assert.rejects(
      site.submitRequest({ ...contact, name: "Changed" }, key, db),
      conflict,
    );
    const request = (await site.listRequests(db))[0];
    await site.updateRequest(
      request.id,
      {
        status: "in_progress",
        followup: { ...request.followup, notes: "Privé" },
      },
      db,
      "Test",
    );
    await assert.rejects(
      site.updateRequest(
        request.id,
        { status: "closed", followup: request.followup },
        db,
      ),
      conflict,
    );
    const phone = "+33600000000";
    await db.query(
      "UPDATE requests SET payload=payload || $1::jsonb WHERE id=$2",
      [JSON.stringify({ phone, whatsappConsent: true }), request.id],
    );
    await db.query(
      "INSERT INTO notifications(request_id,audience,recipient,provider_id) VALUES($1,'applicant',$2,'provider-test')",
      [request.id, phone],
    );
    await applyWebhook(
      {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [{ id: "provider-test", status: "delivered" }],
                  messages: [
                    {
                      type: "text",
                      from: "33600000000",
                      text: { body: "STOP" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      db,
    );
    assert.equal(
      (await site.listRequests(db))[0].payload.whatsappConsent,
      false,
    );
    assert.equal(
      (await db.query("SELECT status FROM notifications")).rows[0].status,
      "delivered",
    );
    await site.deleteRequest(request.id, db);
    assert.equal(
      (await db.query("SELECT count(*) AS n FROM notifications")).rows[0].n,
      0,
    );
    const audit = JSON.stringify(
      (
        await db.query(
          "SELECT before_data,after_data FROM audit_events WHERE entity IN('requests','request_followup')",
        )
      ).rows,
    );
    assert.ok(!audit.includes(contact.email));
    assert.ok(!audit.includes("Privé"));
  }));

test("The real SQLite export migrates every document and revision without replacing data", () =>
  isolatedDatabase(async (db) => {
    const source = JSON.parse(
      await readFile(
        process.env.LEGACY_EXPORT || "/migration/source.json",
        "utf8",
      ),
    );
    const result = await importSqliteExport(source, db);
    assert.equal(result.counts.documents, source.workspace.documents.length);
    for (const d of source.workspace.documents) {
      const row = (
        await db.query("SELECT * FROM documents WHERE id=$1", [d.id])
      ).rows[0];
      for (const key of [
        "html",
        "title",
        "version",
        "source_id",
        "imported_markdown",
      ])
        assert.equal(row[key], d[key]);
    }
    assert.equal((await importSqliteExport(source, db)).alreadyImported, true);
    await assert.rejects(
      importSqliteExport({ ...source, changed: true }, db),
      /sans écrasement/,
    );
    assert.equal(
      (await site.listAnimals({ admin: true }, db)).length,
      source.site.animals.length,
    );
    const d = await docs.createDocument(document, user, db);
    assert.equal((await docs.listRevisions(d.id, db)).length, 1);
  }));

test("A failed import rolls back accounts, content and history", () =>
  isolatedDatabase(async (db) => {
    const source = JSON.parse(
      await readFile(
        process.env.LEGACY_EXPORT || "/migration/source.json",
        "utf8",
      ),
    );
    source.workspace.documents[0].invalid_column = "bad";
    await assert.rejects(importSqliteExport(source, db));
    for (const table of ["users", "animals", "documents", "audit_events"])
      assert.equal(
        (await db.query(`SELECT count(*) AS n FROM ${table}`)).rows[0].n,
        0,
      );
  }));

test("A PostgreSQL dump really restores content and revision history", () =>
  isolatedDatabase(async (db) => {
    const d = await docs.createDocument(document, user, db);
    const dir = await mkdtemp(join(tmpdir(), "ames-backup-test-"));
    try {
      const file = await createBackup(db, dir);
      await isolatedDatabase(async (restored) => {
        await restored.query("DROP SCHEMA public CASCADE");
        await restored.query("CREATE SCHEMA public");
        const u = new URL(restored.connectionString);
        const processResult = spawnSync(
          "pg_restore",
          [
            "--exit-on-error",
            "--no-owner",
            "--no-acl",
            "--dbname",
            u.pathname.slice(1),
            file,
          ],
          {
            env: {
              ...process.env,
              PGHOST: u.hostname,
              PGPORT: u.port || "5432",
              PGUSER: decodeURIComponent(u.username),
              PGPASSWORD: decodeURIComponent(u.password),
            },
          },
        );
        assert.equal(processResult.status, 0, processResult.stderr.toString());
        assert.equal(
          (await docs.getDocument(d.id, restored)).html,
          document.html,
        );
        assert.equal((await docs.listRevisions(d.id, restored)).length, 1);
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }));

test("Real MCP stdio: edits, conflict protection, history, actor and restricted settings", () =>
  isolatedDatabase((db) =>
    mcpClient(db.connectionString, async (client) => {
      const tools = await client.listTools();
      assert.equal(tools.tools.length, 18);
      const call = async (name, args = {}) => {
        const r = await client.callTool({ name, arguments: args });
        return { error: !!r.isError, data: JSON.parse(r.content[0].text) };
      };
      const created = await call("document_create", document);
      assert.equal(created.error, false);
      const d = created.data;
      const changed = await call("document_update", {
        id: d.id,
        version: d.version,
        patch: { html: "<p>Modifié par Codex</p>" },
      });
      assert.equal(changed.error, false);
      assert.equal(changed.data.version, 2);
      const stale = await call("document_update", {
        id: d.id,
        version: 1,
        patch: { html: "Obsolete" },
      });
      assert.equal(stale.error, true);
      assert.equal(stale.data.status, 409);
      assert.equal(
        (await call("document_history", { id: d.id })).data.length,
        2,
      );
      assert.equal(
        (await call("document_read", { id: d.id })).data.publication,
        null,
      );
      assert.equal((await call("activity_read")).data[0].actor, "IA · Codex");
      const settings = (await call("settings_read")).data;
      assert.equal(
        (
          await call("settings_update", {
            version: settings.version,
            patch: { whatsappEnabled: true },
          })
        ).error,
        true,
      );
      assert.equal(
        (
          await call("document_publish", {
            id: d.id,
            version: 2,
            slug: "mcp-test",
          })
        ).error,
        false,
      );
      assert.equal((await pub.publicDocuments("mcp-test", db))[0].version, 2);
    }),
  ));
