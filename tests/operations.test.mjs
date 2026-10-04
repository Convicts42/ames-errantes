import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { openDatabase } from "../src/server/database.mjs";
import {
  getSettings,
  saveSettings,
  publicSettings,
} from "../src/server/settings.mjs";
import {
  submitRequest,
  listRequests,
  updateRequest,
  deleteRequest,
  getAnimal,
  saveAnimal,
} from "../src/server/repository.mjs";
import {
  dispatchNotifications,
  verifyWebhook,
  applyWebhook,
  retryNotification,
} from "../src/server/notifications.mjs";
import { createBackup, purgeExpired } from "../src/server/maintenance.mjs";
import { savePhoto, readPhoto } from "../src/server/media.mjs";

const contact = {
  kind: "contact",
  name: "Nom privé",
  email: "private@example.test",
  message: "Contenu privé",
  subject: "Une autre question",
  consent: true,
};
const env = {
  WHATSAPP_ACCESS_TOKEN: "fake-token",
  WHATSAPP_PHONE_NUMBER_ID: "123",
  WHATSAPP_API_VERSION: "v99.0",
  WHATSAPP_TEAM_TEMPLATE: "team",
  WHATSAPP_RECEIPT_TEMPLATE: "receipt",
};
const withDb = async (action) => {
  const db = openDatabase(":memory:");
  try {
    await action(db);
  } finally {
    db.close();
  }
};
const enable = (db) =>
  saveSettings(
    {
      ...getSettings(db),
      whatsappEnabled: true,
      whatsappTeamConsent: true,
      whatsappTeam: "+33600000000",
    },
    db,
  );

test("settings validate links, consent and stale writes; public settings exclude internal phone", () =>
  withDb((db) => {
    const original = getSettings(db);
    assert.throws(() =>
      saveSettings({ ...original, donationUrl: "javascript:alert(1)" }, db),
    );
    assert.throws(() =>
      saveSettings(
        { ...original, donationUrl: "https://helloasso.com.evil.test" },
        db,
      ),
    );
    assert.throws(() =>
      saveSettings({ ...original, whatsappEnabled: true }, db),
    );
    const saved = saveSettings(
      {
        ...original,
        legalName: "Association test",
        donationUrl: "https://www.helloasso.com/associations/test",
      },
      db,
    );
    assert.equal(saved.version, 1);
    assert.throws(
      () => saveSettings(original, db),
      (e) => e.status === 409,
    );
    assert.equal(publicSettings(db).whatsappTeam, undefined);
  }));
test("private workflow persists with conflict detection, history and closure date", () =>
  withDb((db) => {
    const { id } = submitRequest(contact, randomUUID(), db);
    const f = listRequests(db)[0].followup;
    updateRequest(
      id,
      {
        status: "in_progress",
        followup: {
          ...f,
          stage: "meeting",
          assignee: "Camille",
          notes: "Note privée",
          appointment: "2026-11-05T14:00:00.000Z",
        },
      },
      db,
      "admin",
    );
    assert.equal(listRequests(db)[0].followup.assignee, "Camille");
    assert.equal(listRequests(db)[0].events[0].actor, "admin");
    assert.throws(
      () => updateRequest(id, { status: "closed", followup: f }, db),
      (e) => e.status === 409,
    );
    assert.equal(listRequests(db)[0].status, "in_progress");
    updateRequest(id, "closed", db);
    assert.ok(
      db.prepare("SELECT closed_at FROM request_followup").get().closed_at,
    );
    updateRequest(id, "new", db);
    assert.equal(
      db.prepare("SELECT closed_at FROM request_followup").get().closed_at,
      null,
    );
  }));
test("outbox is transactional, opt-in only and idempotent; only approved minimal data leave", () =>
  withDb(async (db) => {
    enable(db);
    const key = randomUUID();
    const payload = {
      ...contact,
      phone: "+33600000001",
      whatsappConsent: true,
    };
    const { id } = submitRequest(payload, key, db);
    submitRequest(payload, key, db);
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM notifications").get().n,
      2,
    );
    const sent = [];
    await dispatchNotifications(
      db,
      async (url, options) => {
        const body = JSON.parse(options.body);
        sent.push(body);
        assert.equal(url, "https://graph.facebook.com/v99.0/123/messages");
        assert.equal(body.template.components[0].parameters[0].text, id);
        assert.ok(
          !options.body.includes(contact.name) &&
            !options.body.includes(contact.email) &&
            !options.body.includes(contact.message),
        );
        return Response.json({ messages: [{ id: `wamid-${sent.length}` }] });
      },
      env,
    );
    assert.equal(sent.length, 2);
    await dispatchNotifications(
      db,
      () => {
        throw new Error("must not resend");
      },
      env,
    );
    assert.equal(
      db
        .prepare(
          "SELECT count(*) AS n FROM notifications WHERE status='accepted'",
        )
        .get().n,
      2,
    );
    deleteRequest(id, db);
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM notifications").get().n,
      0,
    );
  }));
test("WhatsApp handles throttling, uncertain responses, signed delivery and opt-out", () =>
  withDb(async (db) => {
    enable(db);
    submitRequest(contact, randomUUID(), db);
    await dispatchNotifications(
      db,
      async () => Response.json({ error: { code: 4 } }, { status: 429 }),
      env,
    );
    assert.equal(
      db.prepare("SELECT status FROM notifications").get().status,
      "pending",
    );
    db.prepare("UPDATE notifications SET next_attempt=0").run();
    await dispatchNotifications(
      db,
      async () => {
        throw new Error("network");
      },
      env,
    );
    assert.equal(
      db.prepare("SELECT status FROM notifications").get().status,
      "unknown",
    );
    retryNotification(1, db);
    await dispatchNotifications(
      db,
      async () => Response.json({ messages: [{ id: "wamid" }] }),
      env,
    );
    const event = {
      entry: [
        {
          changes: [
            { value: { statuses: [{ id: "wamid", status: "delivered" }] } },
          ],
        },
      ],
    };
    const bytes = Buffer.from(JSON.stringify(event));
    const signature = `sha256=${createHmac("sha256", "test-secret").update(bytes).digest("hex")}`;
    assert.ok(verifyWebhook(bytes, signature, "test-secret"));
    assert.equal(
      verifyWebhook(Buffer.from("{}"), signature, "test-secret"),
      false,
    );
    applyWebhook(event, db);
    applyWebhook(
      {
        entry: [
          {
            changes: [
              { value: { statuses: [{ id: "wamid", status: "sent" }] } },
            ],
          },
        ],
      },
      db,
    );
    assert.equal(
      db.prepare("SELECT status FROM notifications").get().status,
      "delivered",
    );
    applyWebhook(
      {
        entry: [
          {
            changes: [
              {
                value: {
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
    assert.equal(getSettings(db).whatsappEnabled, false);
  }));
test("purge only deletes closed expired requests and cascades private history", () =>
  withDb((db) => {
    const expired = submitRequest(contact, randomUUID(), db).id;
    const active = submitRequest(contact, randomUUID(), db).id;
    updateRequest(expired, "closed", db);
    db.prepare(
      "UPDATE request_followup SET closed_at='2000-01-01T00:00:00.000Z' WHERE request_id=?",
    ).run(expired);
    assert.equal(purgeExpired(db), 0);
    saveSettings(
      { ...getSettings(db), purgeEnabled: true, retentionDays: 30 },
      db,
    );
    assert.equal(purgeExpired(db), 1);
    assert.equal(listRequests(db)[0].id, active);
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM request_events").get().n,
      0,
    );
  }));
test("photo decoding rejects disguised files and draft photos stay private; backup restores bytes", () =>
  withDb(async (db) => {
    await assert.rejects(
      savePhoto(Buffer.from('<svg onload="alert(1)"></svg>'), db),
      (e) => e.status === 400,
    );
    const source = await sharp({
      create: { width: 40, height: 20, channels: 3, background: "#224433" },
    })
      .png()
      .toBuffer();
    const url = await savePhoto(source, db),
      id = url.slice(7);
    assert.equal(readPhoto(id, false, db), null);
    assert.ok(readPhoto(id, true, db));
    saveAnimal(
      { ...getAnimal("soleil", {}, db), image: url, photos: [url] },
      "soleil",
      db,
    );
    assert.ok(readPhoto(id, false, db));
    saveAnimal(
      { ...getAnimal("soleil", {}, db), published: false },
      "soleil",
      db,
    );
    assert.equal(readPhoto(id, false, db), null);
    const folder = await mkdtemp(resolve("data/test-runs", "backup-"));
    try {
      const path = await createBackup(db, folder);
      const restored = openDatabase(path);
      try {
        assert.deepEqual(
          readPhoto(id, true, restored),
          readPhoto(id, true, db),
        );
      } finally {
        restored.close();
      }
    } finally {
      assert.ok(
        resolve(folder).startsWith(
          resolve("data/test-runs") +
            "/".replace("/", process.platform === "win32" ? "\\" : "/"),
        ),
      );
      await rm(folder, { recursive: true, force: true });
    }
  }));
