import { endpoint, json, body, requireUser } from "../../../server/http.mjs";
import { ask, assistantStatus } from "../../../server/assistant.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = endpoint(async (request) => {
  const user = await requireUser(request);
  return json(await assistantStatus(user));
});
export const POST = endpoint(async (request) => {
  const user = await requireUser(request);
  const input = await body(request);
  return json(await ask(user, input));
});
