export async function api(path, options = {}) {
  const response = await fetch(
    path.startsWith("/api/") ? path : `/api/workspace/${path}`,
    {
      cache: "no-store",
      ...options,
      headers: {
        ...(options.body
          ? {
              "Content-Type": "application/json",
            }
          : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    },
  );
  let data;
  try {
    data = await response.json();
  } catch {
    data = {
      error: "Réponse inattendue. Réessayez.",
    };
  }
  if (!response.ok) {
    const error = new Error(data.error || "L’opération n’a pas abouti.");
    error.status = response.status;
    throw error;
  }
  return data;
}
export const dateLabel = (value) =>
  value
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "—";
export const timeLabel = (value) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
