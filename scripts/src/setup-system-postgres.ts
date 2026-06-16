import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(scriptDir, "../init-schema.sql");

const adminUrl =
  process.env.PG_ADMIN_URL ??
  process.env.DATABASE_URL?.replace(/\/[^/]+$/, "/postgres") ??
  "postgresql://postgres:postgres@127.0.0.1:5432/postgres";

const database = process.env.PG_DATABASE ?? "arc_portal";
const appUrl =
  process.env.DATABASE_URL ??
  adminUrl.replace(/\/postgres$/, `/${database}`);

async function main() {
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();

  const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
  if (exists.rows.length === 0) {
    await admin.query(`CREATE DATABASE ${database}`);
    console.log(`Created database "${database}"`);
  } else {
    console.log(`Database "${database}" already exists`);
  }
  await admin.end();

  const app = new pg.Client({ connectionString: appUrl });
  await app.connect();
  const sql = fs.readFileSync(schemaPath, "utf8");
  await app.query(sql);
  await app.end();

  console.log("Schema applied.");
  console.log(`Use this in your .env file:\nDATABASE_URL=${appUrl}`);
}

main().catch((error) => {
  console.error("Setup failed:", error instanceof Error ? error.message : error);
  console.error("Set PG_ADMIN_URL if your postgres user/password differ, e.g.:");
  console.error('  PG_ADMIN_URL=postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/postgres');
  process.exit(1);
});
