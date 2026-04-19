import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "migrations");

let schemaReady = false;

export async function initSchema() {
  if (schemaReady) return;
  const files = (await fs.readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await pool.query(sql);
  }
  schemaReady = true;
}

export async function resetTables() {
  await pool.query(
    "TRUNCATE TABLE cards, sessions, users RESTART IDENTITY CASCADE",
  );
}

// No-op: the shared pool closes when the vitest process exits.
export async function teardown() {}
