import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(scriptDir, "../init-schema.sql");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const sql = fs.readFileSync(schemaPath, "utf8");

async function main() {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("Schema applied from init-schema.sql");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
