import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../db.js";
import logger from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "..", "migrations");

// Fixed advisory-lock key so concurrent migrators (e.g. several replicas
// coming up at once) serialize on the same key rather than racing.
const LOCK_KEY = 4216547298n;

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT        PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function applied(client) {
  const { rows } = await client.query(
    "SELECT filename FROM schema_migrations",
  );
  return new Set(rows.map((r) => r.filename));
}

async function run() {
  const lockClient = await pool.connect();
  let haveLock = false;
  try {
    await lockClient.query("SELECT pg_advisory_lock($1)", [LOCK_KEY.toString()]);
    haveLock = true;

    await ensureTable(lockClient);
    const done = await applied(lockClient);

    const files = (await fs.readdir(migrationsDir))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (done.has(file)) {
        logger.info({ file }, "migration already applied");
        continue;
      }
      const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
      logger.info({ file }, "applying migration");

      try {
        await lockClient.query("BEGIN");
        await lockClient.query(sql);
        await lockClient.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [file],
        );
        await lockClient.query("COMMIT");
        logger.info({ file }, "migration applied");
      } catch (err) {
        await lockClient.query("ROLLBACK");
        logger.error({ err, file }, "migration failed");
        throw err;
      }
    }
  } finally {
    if (haveLock) {
      try {
        await lockClient.query("SELECT pg_advisory_unlock($1)", [
          LOCK_KEY.toString(),
        ]);
      } catch (err) {
        logger.warn({ err }, "advisory unlock failed");
      }
    }
    lockClient.release();
    await pool.end();
  }
}

run().catch((err) => {
  logger.error({ err }, "migrate failed");
  process.exit(1);
});
