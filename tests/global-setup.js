import pg from "pg";

// Vitest global setup — runs once before the test run, at the host level.
// We use it to verify the test Postgres is reachable and to fail fast with
// a useful message if it isn't.
export default async function setup() {
  const url =
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/flashlearn_test";
  process.env.DATABASE_URL = url;
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || "silent";
  process.env.NODE_ENV = "test";

  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    await client.query("SELECT 1");
  } catch (err) {
    throw new Error(
      `Cannot connect to test Postgres at ${url}.\n` +
        `Start one with:\n` +
        `  docker run --rm -d --name flashlearn-test-db \\\n` +
        `    -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=flashlearn_test \\\n` +
        `    -p 5432:5432 postgres:16-alpine\n\n` +
        `Underlying error: ${err.message}`,
    );
  } finally {
    await client.end().catch(() => {});
  }
}
