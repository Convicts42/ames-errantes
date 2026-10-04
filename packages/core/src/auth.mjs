import { consumeRate } from "./rate-limit.mjs";
import {
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
import { getDatabase, transaction } from "./database.mjs";
import { AppError, text } from "./workspace/errors.mjs";
const derive = promisify(scrypt),
  options = {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  };
export const cookieName = "ames_session",
  sessionSeconds = 8 * 3600;
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export const limit = (key, maximum, db = getDatabase()) =>
  consumeRate(key, maximum, 900000, db);
export async function hashPassword(password) {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  )
    throw new AppError(
      400,
      "Choisissez un mot de passe de 12 à 128 caractères.",
    );
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${(await derive(password, salt, 64, options)).toString("hex")}`;
}
export async function verifyPassword(password, stored) {
  if (typeof password !== "string" || password.length > 128) return false;
  const [, salt = "0".repeat(32), value = "0".repeat(128)] = (
    stored || ""
  ).split(":");
  const actual = await derive(password, salt, 64, options),
    expected = Buffer.from(value, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function identity(input) {
  const username = text(input.username, "L’identifiant", 60, 3).toLowerCase();
  if (!/^[a-z0-9._-]+$/.test(username))
    throw new AppError(
      400,
      "Identifiant : lettres sans accent, chiffres, point ou tiret.",
    );
  return {
    username,
    name: text(input.name, "Le prénom", 80),
  };
}
async function insertUser(input, passwordHash, role, db) {
  const { username, name } = identity(input);
  if (
    (await db.query("SELECT id FROM users WHERE username=$1", [username]))
      .rows[0]
  )
    throw new AppError(409, "Cet identifiant est déjà utilisé.");
  const id = randomUUID();
  await db.query(
    "INSERT INTO users(id,username,name,password_hash,role) VALUES($1,$2,$3,$4,$5)",
    [id, username, name, passwordHash, role],
  );
  return {
    id,
    username,
    name,
    role,
  };
}
export async function createUser(input, role = "editor", db = getDatabase()) {
  identity(input);
  const passwordHash = await hashPassword(input.password);
  return await transaction(
    db,
    async () => await insertUser(input, passwordHash, role, db),
  );
}
export async function hasUsers(db = getDatabase()) {
  return (await db.query("SELECT count(*) AS n FROM users", [])).rows[0].n > 0;
}
export async function bootstrap(db = getDatabase()) {
  if (await hasUsers(db)) return null;
  const token = randomBytes(24).toString("base64url");
  await db.query(
    "INSERT INTO meta(key,value) VALUES('setup',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    [
      JSON.stringify({
        hash: hash(token),
        expires: Date.now() + 7 * 86400000,
      }),
    ],
  );
  return token;
}
export async function setup(input, db = getDatabase()) {
  await limit("setup", 10, db);
  const passwordHash = await hashPassword(input.password);
  return await transaction(db, async () => {
    await db.query("SELECT pg_advisory_xact_lock(41740001)");
    if (await hasUsers(db))
      throw new AppError(
        409,
        "Le premier compte a déjà été créé. Connectez-vous.",
      );
    const record = (
      await db.query("SELECT value FROM meta WHERE key='setup'", [])
    ).rows[0];
    const data = record ? JSON.parse(record.value) : null;
    if (
      !data ||
      data.expires < Date.now() ||
      typeof input.token !== "string" ||
      input.token.length > 200 ||
      hash(input.token.trim()) !== data.hash
    )
      throw new AppError(403, "Code d’installation incorrect ou expiré.");
    const user = await insertUser(input, passwordHash, "owner", db);
    await db.query("DELETE FROM meta WHERE key='setup'", []);
    return user;
  });
}
export async function login(input, db = getDatabase()) {
  const username = text(input.username, "L’identifiant", 60).toLowerCase();
  await transaction(db, async () => {
    await limit("login:global", 100, db);
    await limit(`login:${hash(username)}`, 10, db);
  });
  const user = (
    await db.query("SELECT * FROM users WHERE username=$1 AND active=1", [
      username,
    ])
  ).rows[0];
  const valid = await verifyPassword(input.password, user?.password_hash);
  if (!user || !valid)
    throw new AppError(401, "Identifiant ou mot de passe incorrect.");
  const token = randomBytes(32).toString("hex");
  await db.query("DELETE FROM sessions WHERE expires_at<=$1", [Date.now()]);
  await db.query(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)",
    [hash(token), user.id, Date.now() + sessionSeconds * 1000],
  );
  return token;
}
export async function session(token, db = getDatabase()) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return null;
  return (
    (
      await db.query(
        "SELECT users.id,username,name,role FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=$1 AND expires_at>$2 AND active=1",
        [hash(token), Date.now()],
      )
    ).rows[0] || null
  );
}
export async function logout(token, db = getDatabase()) {
  if (typeof token === "string")
    await db.query("DELETE FROM sessions WHERE token_hash=$1", [hash(token)]);
}
export async function listUsers(db = getDatabase()) {
  return (
    await db.query(
      "SELECT id,username,name,role FROM users WHERE active=1 ORDER BY name",
      [],
    )
  ).rows;
}
export async function changePassword(user, input, db = getDatabase()) {
  await limit(`password:${user.id}`, 10, db);
  const account = (
    await db.query("SELECT password_hash FROM users WHERE id=$1", [user.id])
  ).rows[0];
  if (!(await verifyPassword(input.current, account?.password_hash)))
    throw new AppError(401, "Mot de passe actuel incorrect.");
  const passwordHash = await hashPassword(input.password);
  await transaction(db, async () => {
    await db.query("UPDATE users SET password_hash=$1 WHERE id=$2", [
      passwordHash,
      user.id,
    ]);
    await db.query("DELETE FROM sessions WHERE user_id=$1", [user.id]);
  });
}
