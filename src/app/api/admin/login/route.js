import { login, logout, sessionDuration } from "../../../../server/auth.mjs";
import { record } from "../../../../server/validation.mjs";
import {
  body,
  cookieHeader,
  endpoint,
  json,
  tokenFrom,
} from "../../../../server/http";
export const runtime = "nodejs";
export const POST = endpoint(async (request) => {
  const data = record(await body(request));
  const token = await login(data.username, data.password);
  logout(tokenFrom(request));
  return json({ ok: true }, 200, {
    "Set-Cookie": cookieHeader(token, sessionDuration / 1000),
  });
});
