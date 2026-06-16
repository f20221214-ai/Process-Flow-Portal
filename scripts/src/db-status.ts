import pg from "pg";
import path from "node:path";
import { loadProjectEnv } from "./load-project-env.ts";

loadProjectEnv();

const tables = [
  "architecture_requests",
  "leanix_initiatives",
  "jira_initiatives",
  "arc_sessions",
  "review_outcomes",
  "knowledge_base_articles",
  "kpi_metrics",
] as const;

async function countRows(client: pg.Client, table: string): Promise<number> {
  const result = await client.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM ${table}`,
  );
  return result.rows[0]?.n ?? 0;
}

async function checkDatabase(label: string, connectionString: string) {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    console.log(`\n${label}`);
    console.log(`  ${connectionString.replace(/:[^:@/]+@/, ":****@")}`);
    for (const table of tables) {
      const count = await countRows(client, table);
      console.log(`  ${table}: ${count} row(s)`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`\n${label}`);
    console.log(`  Could not connect: ${message}`);
  } finally {
    await client.end().catch(() => {});
  }
}

async function main() {
  const primary = process.env.DATABASE_URL;
  if (!primary) {
    console.error("DATABASE_URL is not set in .env");
    process.exit(1);
  }

  console.log("Database row counts:");
  await checkDatabase("App database (.env)", primary);

  if (!primary.includes(":5432/")) {
    await checkDatabase(
      "System PostgreSQL (pgAdmin port 5432)",
      primary.replace(":5434/", ":5432/"),
    );
  }

  if (!primary.includes(":5434/")) {
    await checkDatabase(
      "Embedded PostgreSQL (port 5434)",
      primary.replace(":5432/", ":5434/").replace(/postgres:([^@]+)@/, "postgres:postgres@"),
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
