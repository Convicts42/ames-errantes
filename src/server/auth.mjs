import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getDatabase, transaction } from "./database.mjs";
import { consumeLimit, hash } from "./repository.mjs";
import { HttpError } from "./validation.mjs";

const derive = promisify(scrypt);
const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
export const sessionCookie = "ame_admin_session";
export const sessionDuration = 8 * 60 * 60 * 1000;

export async function hashPassword(password) {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  )
    throw new HttpError(
      400,
      "Le mot de passe doit contenir entre 12 et 128 caractères.",
    );
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt, 64, options);
  return `scrypt:${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password, encoded) {
  if (typeof password !== "string" || password.length > 128) return false;
  const [, salt = "0".repeat(32), stored = "0".repeat(128)] = (
    encoded || ""
  ).split(":");
  const key = await derive(password, salt, 64, options);
  const expected = Buffer.from(stored, "hex");
  return expected.length === key.length && timingSafeEqual(key, expected);
}
export async function createAdmin(username, password, db = getDatabase()) {
  if (!/^[a-z0-9._-]{3,60}$/.test(username))
    throw new HttpError(400, "Identifiant invalide (3 à 60 caractères).");
  if (db.prepare("SELECT id FROM admins WHERE username = ?").get(username))
    throw new HttpError(409, "Ce compte existe déjà.");
  const passwordHash = await hashPassword(password);
  db.prepare("INSERT INTO admins(id,username,password_hash) VALUES(?,?,?)").run(
    randomUUID(),
    username,
    passwordHash,
  );
}
export async function login(username, password, db = getDatabase()) {
  if (
    typeof username !== "string" ||
    username.length > 60 ||
    typeof password !== "string" ||
    password.length > 128
  )
    throw new HttpError(400, "Identifiants invalides.");
  username = username.trim().toLowerCase();
  transaction(db, () => {
    consumeLimit("login:global", 100, 900000, db);
    consumeLimit(`login:${hash(username)}`, 10, 900000, db);
  });
  const admin = db
    .prepare("SELECT * FROM admins WHERE username = ?")
    .get(username);
  const valid = await verifyPassword(password, admin?.password_hash);
  if (!admin || !valid)
    throw new HttpError(401, "Identifiant ou mot de passe incorrect.");
  const token = randomBytes(32).toString("hex");
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
  db.prepare(
    "INSERT INTO sessions(token_hash,admin_id,expires_at) VALUES(?,?,?)",
  ).run(hash(token), admin.id, Date.now() + sessionDuration);
  return token;
}
export function getSession(token, db = getDatabase()) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return null;
  return (
    db
      .prepare(
        "SELECT admins.id,admins.username FROM sessions JOIN admins ON admins.id = sessions.admin_id WHERE token_hash = ? AND expires_at > ?",
      )
      .get(hash(token), Date.now()) || null
  );
}
export function logout(token, db = getDatabase()) {
  if (typeof token === "string")
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hash(token));
}
export async function changePassword(
  adminId,
  current,
  next,
  db = getDatabase(),
) {
  transaction(db, () => consumeLimit(`password:${adminId}`, 10, 900000, db));
  const admin = db.prepare("SELECT * FROM admins WHERE id = ?").get(adminId);
  if (!admin || !(await verifyPassword(current, admin.password_hash)))
    throw new HttpError(401, "Mot de passe actuel incorrect.");
  const passwordHash = await hashPassword(next);
  transaction(db, () => {
    db.prepare("UPDATE admins SET password_hash = ? WHERE id = ?").run(
      passwordHash,
      adminId,
    );
    db.prepare("DELETE FROM sessions WHERE admin_id = ?").run(adminId);
  });
}
