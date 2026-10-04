export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function text(value, label, maximum, minimum = 1) {
  if (
    typeof value !== "string" ||
    value.trim().length < minimum ||
    value.length > maximum
  )
    throw new AppError(
      400,
      `${label} : entre ${minimum} et ${maximum} caractères.`,
    );
  return value.trim();
}
export function choice(value, allowed, label) {
  if (!allowed.includes(value)) throw new AppError(400, `${label} invalide.`);
  return value;
}
export function version(value) {
  if (!Number.isSafeInteger(value) || value < 1)
    throw new AppError(400, "Version du document manquante. Rechargez-le.");
  return value;
}
