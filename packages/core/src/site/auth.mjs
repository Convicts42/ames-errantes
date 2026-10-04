import {
  createUser,
  login as signIn,
  session,
  logout,
  changePassword as change,
  hashPassword,
  verifyPassword,
  cookieName,
  sessionSeconds,
} from "../auth.mjs";
import { getDatabase } from "../database.mjs";
export const sessionCookie = cookieName,
  sessionDuration = sessionSeconds * 1000;
export { session as getSession, logout, hashPassword, verifyPassword };
export const createAdmin = (username, password, db = getDatabase()) =>
  createUser({ username, password, name: username }, "owner", db);
export const login = (username, password, db = getDatabase()) =>
  signIn({ username, password }, db);
export const changePassword = (id, current, password, db = getDatabase()) =>
  change({ id }, { current, password }, db);
