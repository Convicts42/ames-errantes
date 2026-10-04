import { sessionCookie, getSession } from "./auth.mjs";
import { HttpError } from "./validation.mjs";

export function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}
export function endpoint(handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof HttpError)
        return json(
          { error: error.message },
          error.status,
          error.status === 429 ? { "Retry-After": "900" } : {},
        );
      console.error("Backend operation failed:", error.code || error.name);
      return json(
        { error: "Le serveur n’a pas pu terminer cette opération. Réessayez." },
        500,
      );
    }
  };
}
export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  let allowed = false;
  try {
    const expected =
      process.env.APP_ORIGIN ||
      `${new URL(request.url).protocol}//${request.headers.get("host") || new URL(request.url).host}`;
    allowed = !!origin && new URL(origin).origin === new URL(expected).origin;
  } catch {}
  if (!allowed) throw new HttpError(403, "Origine de la requête refusée.");
}
export async function body(request) {
  sameOrigin(request);
  if (
    !/^application\/json(?:;|$)/i.test(
      request.headers.get("content-type") || "",
    )
  )
    throw new HttpError(415, "Format JSON requis.");
  const bytes = await readBytes(request, 32768);
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new HttpError(400, "Données JSON invalides.");
  }
}
export async function readBytes(request, maximum) {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Données manquantes.");
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maximum) {
      await reader.cancel();
      throw new HttpError(413, "Le message est trop volumineux.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
export function tokenFrom(request) {
  return (request.headers.get("cookie") || "")
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${sessionCookie}=`))
    ?.slice(sessionCookie.length + 1);
}
export function requireAdmin(request) {
  const admin = getSession(tokenFrom(request));
  if (!admin) throw new HttpError(401, "Connectez-vous à l’administration.");
  return admin;
}
export function cookieHeader(token, maxAge) {
  const secure =
    process.env.COOKIE_SECURE === "true" ||
    (process.env.NODE_ENV === "production" &&
      process.env.COOKIE_SECURE !== "false");
  return `${sessionCookie}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}
