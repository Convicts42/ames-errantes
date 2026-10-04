import { logout } from "../../../../server/auth.mjs";
import {
  sameOrigin,
  cookieHeader,
  endpoint,
  json,
  tokenFrom,
} from "../../../../server/http";
export const runtime = "nodejs";
export const POST = endpoint((request) => {
  sameOrigin(request);
  logout(tokenFrom(request));
  return json({ ok: true }, 200, { "Set-Cookie": cookieHeader("", 0) });
});
