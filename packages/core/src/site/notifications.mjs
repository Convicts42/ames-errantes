import { createHmac, timingSafeEqual } from "node:crypto";
import { getDatabase } from "../database.mjs";
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
export async function whatsappAvailable(db = getDatabase()) {
  const settings = await getSettings(db);
  return (
    settings.whatsappEnabled &&
    settings.whatsappTeamConsent &&
    whatsappConfig().ready
  );
}
export async function notificationState(db = getDatabase()) {
  return {
    ...whatsappConfig(),
    enabled: (await getSettings(db)).whatsappEnabled,
    items: (
      await db.query(
        "SELECT id,request_id,audience,status,attempts,error,created_at FROM notifications ORDER BY id DESC LIMIT 100",
        [],
      )
    ).rows,
  };
}
export async function retryNotification(id, db = getDatabase()) {
  if (!Number.isSafeInteger(id))
    throw new HttpError(400, "Notification invalide.");
  if (
    !(
      await db.query(
        "UPDATE notifications SET status='pending',next_attempt=0,error=NULL,attempts=0 WHERE id=$1 AND status IN ('failed','unknown')",
        [id],
      )
    ).rowCount
  )
    throw new HttpError(409, "Cette notification ne peut pas être relancée.");
}
export async function dispatchNotifications(
  db = getDatabase(),
  transport = fetch,
  env = process.env,
) {
  const settings = await getSettings(db);
  if (!settings.whatsappEnabled || !whatsappConfig(env).ready) return;
  // A crash or timeout is ambiguous: do not automatically duplicate a possibly sent message.
  await db.query(
    "UPDATE notifications SET status='unknown',error='Envoi interrompu : v\xE9rifier WhatsApp avant de relancer.' WHERE status='sending' AND next_attempt < $1",
    [Date.now()],
  );
  const rows = (
    await db.query(
      "SELECT * FROM notifications WHERE status='pending' AND next_attempt <= $1 ORDER BY id LIMIT 10",
      [Date.now()],
    )
  ).rows;
  for (const row of rows) {
    const request = (
      await db.query("SELECT payload FROM requests WHERE id=$1", [
        row.request_id,
      ])
    ).rows[0];
    if (!request) continue;
    const payload = request.payload;
    if (
      payload.demo ||
      (row.audience === "team" &&
        (!settings.whatsappTeamConsent ||
          settings.whatsappTeam !== row.recipient)) ||
      (row.audience === "applicant" &&
        (!payload.whatsappConsent || payload.phone !== row.recipient))
    ) {
      await db.query(
        "UPDATE notifications SET status='cancelled' WHERE id=$1",
        [row.id],
      );
      continue;
    }
    if (
      !(
        await db.query(
          "UPDATE notifications SET status='sending',attempts=attempts+1,next_attempt=$1 WHERE id=$2 AND status='pending'",
          [Date.now() + 120000, row.id],
        )
      ).rowCount
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
              language: {
                code: env.WHATSAPP_LANGUAGE || "fr",
              },
              components: [
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text",
                      text: row.request_id,
                    },
                  ],
                },
              ],
            },
          }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.messages?.[0]?.id) {
        await db.query(
          "UPDATE notifications SET status='accepted',provider_id=$1,error=NULL WHERE id=$2",
          [data.messages[0].id, row.id],
        );
      } else {
        const retry = response.status === 429 && row.attempts < 4;
        const status = response.ok ? "unknown" : retry ? "pending" : "failed";
        await db.query(
          "UPDATE notifications SET status=$1,error=$2,next_attempt=$3 WHERE id=$4",
          [
            status,
            `Meta HTTP ${response.status}${Number.isInteger(data.error?.code) ? ` · code ${data.error.code}` : ""}`,
            Date.now() + 60000 * 2 ** row.attempts,
            row.id,
          ],
        );
      }
    } catch {
      await db.query(
        "UPDATE notifications SET status='unknown',error='R\xE9ponse r\xE9seau inconnue : v\xE9rifier WhatsApp avant de relancer.' WHERE id=$1",
        [row.id],
      );
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
export async function applyWebhook(data, db = getDatabase()) {
  const ranks = {
    accepted: 0,
    sent: 1,
    delivered: 2,
    read: 3,
  };
  for (const entry of data.entry || [])
    for (const change of entry.changes || []) {
      for (const status of change.value?.statuses || []) {
        const row = (
          await db.query(
            "SELECT id,status FROM notifications WHERE provider_id=$1",
            [status.id || ""],
          )
        ).rows[0];
        if (!row) continue;
        if (
          (Object.hasOwn(ranks, status.status) &&
            ranks[status.status] > (ranks[row.status] ?? -1)) ||
          (status.status === "failed" &&
            !["delivered", "read"].includes(row.status))
        )
          await db.query(
            "UPDATE notifications SET status=$1,error=$2 WHERE id=$3",
            [
              status.status,
              status.status === "failed"
                ? "Livraison refusée par WhatsApp."
                : null,
              row.id,
            ],
          );
      }
      // No inbound conversation is stored; STOP only withdraws the existing opt-in.
      for (const message of change.value?.messages || [])
        if (
          message.type === "text" &&
          /^(stop|arr[eê]t)$/i.test(message.text?.body?.trim() || "")
        ) {
          const phone = `+${message.from}`;
          await db.query(
            "UPDATE requests SET payload=jsonb_set(payload,'{whatsappConsent}','false'::jsonb) WHERE payload->>'phone'=$1",
            [phone],
          );
          await db.query(
            "UPDATE notifications SET status='cancelled' WHERE recipient=$1 AND status='pending'",
            [phone],
          );
          if ((await getSettings(db)).whatsappTeam === phone)
            await db.query(
              'UPDATE settings SET content=content || \'{"whatsappTeamConsent":false,"whatsappEnabled":false}\'::jsonb,version=version+1 WHERE id=1',
              [],
            );
        }
    }
}
