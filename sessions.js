import crypto from "node:crypto";
import { pool } from "./db.js";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function addSession(userId) {
  const sid = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query(
    `INSERT INTO sessions (sid, user_id, expires_at) VALUES ($1, $2, $3)`,
    [sid, userId, expiresAt],
  );
  return sid;
}

export async function getSessionUser(sid) {
  if (!sid) return null;
  const { rows } = await pool.query(
    `SELECT u.id, u.username
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.sid = $1 AND s.expires_at > NOW()`,
    [sid],
  );
  return rows[0] || null;
}

export async function deleteSession(sid) {
  if (!sid) return;
  await pool.query("DELETE FROM sessions WHERE sid = $1", [sid]);
}

export async function purgeExpired() {
  await pool.query("DELETE FROM sessions WHERE expires_at <= NOW()");
}

export default {
  addSession,
  getSessionUser,
  deleteSession,
  purgeExpired,
};
