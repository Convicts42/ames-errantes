import { withActor, setActor } from "@ames/core/database.mjs";
import { AppError } from "./errors.mjs";
import { session, cookieName } from "./auth.mjs";
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
      return await withActor("Visiteur", () => handler(...args));
    } catch (error) {
      if (error.code === "23505")
        return json(
          { error: "Cet élément existe déjà. Actualisez la page." },
          409,
        );
      if (error instanceof AppError)
        return json(
          {
            error: error.message,
          },
          error.status,
          error.status === 429
            ? {
                "Retry-After": "900",
              }
            : {},
        );
      console.error("Workspace request failed:", error.name, error.code || "");
      return json(
        {
          error:
            "L’opération n’a pas abouti. Votre saisie est conservée ; réessayez.",
        },
        500,
      );
    }
  };
}
export function tokenFrom(request) {
  return (request.headers.get("cookie") || "")
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
}
export async function requireUser(request) {
  const user = await session(tokenFrom(request));
  if (!user)
    throw new AppError(
      401,
      "Votre session a expiré. Reconnectez-vous pour continuer.",
    );
  setActor(`Équipe · ${user.name}`);
  return user;
}
export function requireOwner(user) {
  if (user.role !== "owner")
    throw new AppError(
      403,
      "Seul le responsable de l’espace peut créer un compte.",
    );
}
export function cookie(token, maxAge) {
  const secure =
    process.env.COOKIE_SECURE === "true" ||
    (process.env.NODE_ENV === "production" &&
      process.env.COOKIE_SECURE !== "false");
  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}
export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  // On a direct LAN connection, Next may normalize request.url to localhost.
  // Host is supplied by the browser; forwarded headers are deliberately ignored.
  const expected =
    process.env.APP_ORIGIN ||
    `${new URL(request.url).protocol}//${request.headers.get("host") || new URL(request.url).host}`;
  if (!origin || origin !== new URL(expected).origin)
    throw new AppError(403, "Origine de la requête refusée.");
}
export async function body(request) {
  sameOrigin(request);
  if (
    !/^application\/json(?:;|$)/i.test(
      request.headers.get("content-type") || "",
    )
  )
    throw new AppError(415, "Format JSON requis.");
  const bytes = await readBytes(request, 500000);
  try {
    const value = JSON.parse(bytes.toString("utf8"));
    if (!value || Array.isArray(value) || typeof value !== "object")
      throw Error();
    return value;
  } catch {
    throw new AppError(400, "Données invalides.");
  }
}
export async function readBytes(request, maximum) {
  const reader = request.body?.getReader();
  if (!reader) throw new AppError(400, "Données manquantes.");
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximum) {
      await reader.cancel();
      throw new AppError(413, "Fichier ou document trop volumineux.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
