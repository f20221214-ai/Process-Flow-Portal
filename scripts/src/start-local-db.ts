import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import path from "node:path";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../..");
const dataDir = path.join(projectRoot, ".data", "embedded-postgres");
const port = Number(process.env.EMBEDDED_PG_PORT ?? 5433);
const user = "postgres";
const password = "postgres";
const database = "arc_portal";

const embedded = new EmbeddedPostgres({
  databaseDir: dataDir,
  user,
  password,
  port,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

async function ensureDatabase() {
  const client = new pg.Client({
    connectionString: `postgresql://${user}:${password}@localhost:${port}/postgres`,
  });
  await client.connect();
  const exists = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [database],
  );
  if (exists.rows.length === 0) {
    await client.query(`CREATE DATABASE ${database}`);
    console.log(`Created database "${database}"`);
  }
  await client.end();
}

async function ensureClusterInitialized() {
  const pgVersionFile = path.join(dataDir, "PG_VERSION");

  if (existsSync(pgVersionFile)) {
    return;
  }

  if (existsSync(dataDir)) {
    console.warn("Removing incomplete embedded-postgres data directory...");
    await rm(dataDir, { recursive: true, force: true });
  }

  await embedded.initialise();
}

async function main() {
  console.log("Starting embedded PostgreSQL...");
  await ensureClusterInitialized();
  await embedded.start();
  await ensureDatabase();

  const url = `postgresql://${user}:${password}@localhost:${port}/${database}`;
  console.log(`Embedded PostgreSQL ready: ${url}`);
  console.log("Press Ctrl+C to stop.");

  const shutdown = async () => {
    console.log("\nStopping embedded PostgreSQL...");
    await embedded.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Keep process alive
  await new Promise(() => {});
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
