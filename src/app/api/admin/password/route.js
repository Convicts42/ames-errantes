import { changePassword } from "../../../../server/auth.mjs";
import { record } from "../../../../server/validation.mjs";
import {
  body,
  cookieHeader,
  endpoint,
  json,
  requireAdmin,
} from "../../../../server/http";
export const runtime = "nodejs";
export const POST = endpoint(async (request) => {
  const admin = requireAdmin(request);
  const data = record(await body(request));
  await changePassword(admin.id, data.current, data.password);
  return json({ ok: true }, 200, { "Set-Cookie": cookieHeader("", 0) });
});
