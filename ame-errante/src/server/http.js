import { withActor } from "@ames/core/database.mjs";
import { HttpError } from "@ames/core/site/validation.mjs";
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
      if (error instanceof HttpError)
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
      console.error("Backend operation failed:", error.code || error.name);
      return json(
        {
          error: "Le serveur n’a pas pu terminer cette opération. Réessayez.",
        },
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
