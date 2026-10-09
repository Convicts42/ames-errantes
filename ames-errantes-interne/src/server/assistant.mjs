import http from "node:http";
import { AppError } from "@ames/core/workspace/errors.mjs";

// L'assistant passe par le pont Claude Code de la Raspberry
// (deploy/raspberry/claude-bridge.mjs), qui utilise l'abonnement personnel
// du responsable : il reste donc réservé à son compte.
const socketPath =
  process.env.CLAUDE_BRIDGE_SOCKET || "/run/claude-bridge/bridge.sock";

function call(method, path, payload, timeout) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        socketPath,
        method,
        path,
        timeout,
        headers: payload ? { "content-type": "application/json" } : {},
      },
      (response) => {
        let text = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => (text += chunk));
        response.on("end", () => {
          try {
            resolve([response.statusCode, JSON.parse(text)]);
          } catch {
            reject(new Error("Réponse du pont illisible."));
          }
        });
      },
    );
    request.on("timeout", () => request.destroy(new Error("Délai dépassé.")));
    request.on("error", reject);
    request.end(payload ? JSON.stringify(payload) : undefined);
  });
}

// La page ouverte vient de l'interface du responsable : elle situe la demande
// (« ce document ») sans remplacer ses consignes.
function describeContext(context) {
  if (!context || typeof context !== "object") return "";
  const clean = (value, size) =>
    typeof value === "string"
      ? value.replace(/[\r\n[\]]/g, " ").slice(0, size)
      : "";
  const page = clean(context.page, 80),
    d =
      context.document && typeof context.document === "object"
        ? context.document
        : null;
  const lines = [];
  if (page) lines.push(`Page ouverte dans l’intranet : ${page}.`);
  if (d && clean(d.id, 200))
    lines.push(
      `Document affiché : « ${clean(d.title, 180)} » (id ${clean(d.id, 200)}, catégorie ${clean(d.category, 40)}). « Ce document » ou « cette page » désigne celui-ci : lis-le avec document_read avant de le modifier.`,
    );
  return lines.length ? `[Contexte : ${lines.join(" ")}]\n\n` : "";
}

export const assistantAllowed = (user) => user.role === "owner";

export async function assistantStatus(user) {
  if (!assistantAllowed(user)) return { available: false, reason: "owner" };
  try {
    const [status] = await call("GET", "/health", null, 3000);
    return status === 200
      ? { available: true }
      : { available: false, reason: "offline" };
  } catch {
    return { available: false, reason: "offline" };
  }
}

export async function ask(user, input) {
  if (!assistantAllowed(user))
    throw new AppError(
      403,
      "L’assistant Claude est réservé au responsable de l’espace.",
    );
  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (!message || message.length > 8000)
    throw new AppError(
      400,
      "Message vide ou trop long (8 000 caractères max).",
    );
  const session =
    typeof input.conversation === "string" ? input.conversation : undefined;
  const prompt = `${describeContext(input.context)}${message}`;
  let status, data;
  try {
    [status, data] = await call(
      "POST",
      "/ask",
      { message: prompt, session },
      330000,
    );
  } catch {
    throw new AppError(
      503,
      "Le pont Claude ne répond pas sur la Raspberry. Vérifier le service ames-claude-bridge.",
    );
  }
  if (status !== 200)
    throw new AppError(status, data.error || "Claude n’a pas pu répondre.");
  return {
    conversation: data.session,
    reply: data.reply,
    actions: Array.isArray(data.actions) ? data.actions : [],
  };
}
