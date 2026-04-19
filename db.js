import pg from "pg";
import logger from "./logger.js";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/flashlearn";

export const pool = new Pool({
  connectionString,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  logger.error({ err }, "postgres pool error");
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function checkDb() {
  await pool.query("SELECT 1");
}

export async function closeDb() {
  await pool.end();
}
