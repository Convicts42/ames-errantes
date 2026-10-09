import { endpoint, json, readBytes } from "../../../../server/http";
import {
  verifyWebhook,
  applyWebhook,
} from "@ames/core/site/notifications.mjs";
import { HttpError } from "@ames/core/site/validation.mjs";
export const runtime = "nodejs";
export const GET = endpoint(async (request) => {
  const p = new URL(request.url).searchParams;
  if (
    !process.env.WHATSAPP_VERIFY_TOKEN ||
    p.get("hub.mode") !== "subscribe" ||
    p.get("hub.verify_token") !== process.env.WHATSAPP_VERIFY_TOKEN
  )
    throw new HttpError(403, "Vérification refusée.");
  return new Response(p.get("hub.challenge") || "", {
    headers: {
      "Content-Type": "text/plain",
    },
  });
});
export const POST = endpoint(async (request) => {
  const bytes = await readBytes(request, 256 * 1024);
  if (!verifyWebhook(bytes, request.headers.get("x-hub-signature-256")))
    throw new HttpError(403, "Signature refusée.");
  let data;
  try {
    data = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new HttpError(400, "JSON invalide.");
  }
  await applyWebhook(data);
  return json({
    ok: true,
  });
});
