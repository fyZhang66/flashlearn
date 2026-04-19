import bcrypt from "bcrypt";
import { pool } from "./db.js";

const USERNAME_RE = /^[A-Za-z0-9_]+$/;
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

export function isValidUsername(username) {
  return (
    typeof username === "string" &&
    username.trim().length > 0 &&
    USERNAME_RE.test(username)
  );
}

export function isValidPassword(password) {
  return typeof password === "string" && password.length >= 6;
}

export async function findUserByUsername(username) {
  const { rows } = await pool.query(
    "SELECT id, username, password_hash FROM users WHERE username = $1",
    [username],
  );
  return rows[0] || null;
}

export async function isUserRegistered(username) {
  const user = await findUserByUsername(username);
  return !!user;
}

export async function registerUser(username, password) {
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id, username`,
      [username, hash],
    );
    return rows[0];
  } catch (err) {
    // 23505 = unique_violation
    if (err.code === "23505") return null;
    throw err;
  }
}

export async function verifyPassword(username, password) {
  const user = await findUserByUsername(username);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? { id: user.id, username: user.username } : null;
}

export default {
  isValidUsername,
  isValidPassword,
  isUserRegistered,
  registerUser,
  verifyPassword,
  findUserByUsername,
};
