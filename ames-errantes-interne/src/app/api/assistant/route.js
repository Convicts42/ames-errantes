import { consumeRate } from "@ames/core/rate-limit.mjs";
import { endpoint, json, body, requireUser } from "../../../server/http.mjs";
import { ask, assistantEnabled } from "../../../server/assistant.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = endpoint(async (request) => {
  await requireUser(request);
  return json({ enabled: assistantEnabled() });
});
export const POST = endpoint(async (request) => {
  const user = await requireUser(request);
  const input = await body(request);
  await consumeRate(`assistant:${user.id}`, 60, 3600000);
  return json(await ask(user, input));
});
