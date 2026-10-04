import { createHmac, timingSafeEqual } from "node:crypto";
import { getDatabase } from "./database.mjs";
import { getSettings } from "./settings.mjs";
import { HttpError } from "./validation.mjs";

export function whatsappConfig(env = process.env) {
  const required = [
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_API_VERSION",
    "WHATSAPP_TEAM_TEMPLATE",
    "WHATSAPP_RECEIPT_TEMPLATE",
  ];
  const missing = required.filter((key) => !env[key]);
  if (env.WHATSAPP_API_VERSION && !/^v\d+\.\d+$/.test(env.WHATSAPP_API_VERSION))
    missing.push("WHATSAPP_API_VERSION (format vXX.0)");
  if (
    env.WHATSAPP_PHONE_NUMBER_ID &&
    !/^\d+$/.test(env.WHATSAPP_PHONE_NUMBER_ID)
  )
    missing.push("WHATSAPP_PHONE_NUMBER_ID (chiffres)");
  return {
    ready: missing.length === 0,
    missing,
    webhookReady: !!(env.WHATSAPP_APP_SECRET && env.WHATSAPP_VERIFY_TOKEN),
  };
}
export function whatsappAvailable(db = getDatabase()) {
  const settings = getSettings(db);
  return (
    settings.whatsappEnabled &&
    settings.whatsappTeamConsent &&
    whatsappConfig().ready
  );
}
export function notificationState(db = getDatabase()) {
  return {
    ...whatsappConfig(),
    enabled: getSettings(db).whatsappEnabled,
    items: db
      .prepare(
        "SELECT id,request_id,audience,status,attempts,error,created_at FROM notifications ORDER BY id DESC LIMIT 100",
      )
      .all(),
  };
}
export function retryNotification(id, db = getDatabase()) {
  if (!Number.isSafeInteger(id))
    throw new HttpError(400, "Notification invalide.");
  if (
    !db
      .prepare(
        "UPDATE notifications SET status='pending',next_attempt=0,error=NULL,attempts=0 WHERE id=? AND status IN ('failed','unknown')",
      )
      .run(id).changes
  )
    throw new HttpError(409, "Cette notification ne peut pas être relancée.");
}
export async function dispatchNotifications(
  db = getDatabase(),
  transport = fetch,
  env = process.env,
) {
  const settings = getSettings(db);
  if (!settings.whatsappEnabled || !whatsappConfig(env).ready) return;
  // A crash or timeout is ambiguous: do not automatically duplicate a possibly sent message.
  db.prepare(
    "UPDATE notifications SET status='unknown',error='Envoi interrompu : vérifier WhatsApp avant de relancer.' WHERE status='sending' AND next_attempt < ?",
  ).run(Date.now());
  const rows = db
    .prepare(
      "SELECT * FROM notifications WHERE status='pending' AND next_attempt <= ? ORDER BY id LIMIT 10",
    )
    .all(Date.now());
  for (const row of rows) {
    const request = db
      .prepare("SELECT payload FROM requests WHERE id=?")
      .get(row.request_id);
    if (!request) continue;
    const payload = JSON.parse(request.payload);
    if (
      payload.demo ||
      (row.audience === "team" &&
        (!settings.whatsappTeamConsent ||
          settings.whatsappTeam !== row.recipient)) ||
      (row.audience === "applicant" &&
        (!payload.whatsappConsent || payload.phone !== row.recipient))
    ) {
      db.prepare("UPDATE notifications SET status='cancelled' WHERE id=?").run(
        row.id,
      );
      continue;
    }
    if (
      !db
        .prepare(
          "UPDATE notifications SET status='sending',attempts=attempts+1,next_attempt=? WHERE id=? AND status='pending'",
        )
        .run(Date.now() + 120000, row.id).changes
    )
      continue;
    try {
      const response = await transport(
        `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          signal: AbortSignal.timeout(15000),
          headers: {
            Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: row.recipient.slice(1),
            type: "template",
            template: {
              name:
                row.audience === "team"
                  ? env.WHATSAPP_TEAM_TEMPLATE
                  : env.WHATSAPP_RECEIPT_TEMPLATE,
              language: { code: env.WHATSAPP_LANGUAGE || "fr" },
              components: [
                {
                  type: "body",
                  parameters: [{ type: "text", text: row.request_id }],
                },
              ],
            },
          }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.messages?.[0]?.id) {
        db.prepare(
          "UPDATE notifications SET status='accepted',provider_id=?,error=NULL WHERE id=?",
        ).run(data.messages[0].id, row.id);
      } else {
        const retry = response.status === 429 && row.attempts < 4;
        const status = response.ok ? "unknown" : retry ? "pending" : "failed";
        db.prepare(
          "UPDATE notifications SET status=?,error=?,next_attempt=? WHERE id=?",
        ).run(
          status,
          `Meta HTTP ${response.status}${Number.isInteger(data.error?.code) ? ` · code ${data.error.code}` : ""}`,
          Date.now() + 60000 * 2 ** row.attempts,
          row.id,
        );
      }
    } catch {
      db.prepare(
        "UPDATE notifications SET status='unknown',error='Réponse réseau inconnue : vérifier WhatsApp avant de relancer.' WHERE id=?",
      ).run(row.id);
    }
  }
}
export function verifyWebhook(
  bytes,
  signature,
  secret = process.env.WHATSAPP_APP_SECRET,
) {
  if (!secret || !/^sha256=[a-f0-9]{64}$/.test(signature || "")) return false;
  return timingSafeEqual(
    Buffer.from(signature.slice(7), "hex"),
    createHmac("sha256", secret).update(bytes).digest(),
  );
}
export function applyWebhook(data, db = getDatabase()) {
  const ranks = { accepted: 0, sent: 1, delivered: 2, read: 3 };
  for (const entry of data.entry || [])
    for (const change of entry.changes || []) {
      for (const status of change.value?.statuses || []) {
        const row = db
          .prepare("SELECT id,status FROM notifications WHERE provider_id=?")
          .get(status.id || "");
        if (!row) continue;
        if (
          (Object.hasOwn(ranks, status.status) &&
            ranks[status.status] > (ranks[row.status] ?? -1)) ||
          (status.status === "failed" &&
            !["delivered", "read"].includes(row.status))
        )
          db.prepare(
            "UPDATE notifications SET status=?,error=? WHERE id=?",
          ).run(
            status.status,
            status.status === "failed"
              ? "Livraison refusée par WhatsApp."
              : null,
            row.id,
          );
      }
      // No inbound conversation is stored; STOP only withdraws the existing opt-in.
      for (const message of change.value?.messages || [])
        if (
          message.type === "text" &&
          /^(stop|arr[eê]t)$/i.test(message.text?.body?.trim() || "")
        ) {
          const phone = `+${message.from}`;
          db.prepare(
            "UPDATE requests SET payload=json_set(payload,'$.whatsappConsent',json('false')) WHERE json_extract(payload,'$.phone')=?",
          ).run(phone);
          db.prepare(
            "UPDATE notifications SET status='cancelled' WHERE recipient=? AND status='pending'",
          ).run(phone);
          if (getSettings(db).whatsappTeam === phone)
            db.prepare(
              "UPDATE settings SET content=json_set(content,'$.whatsappTeamConsent',json('false'),'$.whatsappEnabled',json('false')),version=version+1 WHERE id=1",
            ).run();
        }
    }
}
