export async function api(url, { method = "GET", data, key } = {}) {
  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  }).catch(() => {
    throw new Error("Connexion impossible. Vérifiez le réseau puis réessayez.");
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result)
    throw new Error(
      result?.error || "Le serveur est momentanément indisponible. Réessayez.",
    );
  return result;
}
export function submissionKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
