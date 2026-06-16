/**
 * Seeds demo data directly into PostgreSQL (no API server required).
 * Run: pnpm seed:demo
 */
import { loadProjectEnv } from "./load-project-env.ts";

loadProjectEnv();

const apiUrl = process.env.API_URL ?? "http://localhost:8080";

async function post(pathSuffix: string) {
  const response = await fetch(`${apiUrl}${pathSuffix}`, { method: "POST" });
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : `POST ${pathSuffix} failed (${response.status})`;
    throw new Error(message);
  }
  return body;
}

async function seedViaApi() {
  console.log(`Seeding via API at ${apiUrl} ...`);
  const leanix = (await post("/api/leanix/seed-demo")) as {
    added: number;
    updated: number;
    total: number;
  };
  console.log(`LeanIX initiatives: ${leanix.total} total (${leanix.added} added)`);

  const jira = (await post("/api/jira/sync")) as {
    synced: number;
    added: number;
    updated: number;
  };
  console.log(`JIRA initiatives: ${jira.synced} synced (${jira.added} added)`);
}

async function main() {
  try {
    await seedViaApi();
    console.log("\nDemo data loaded. Refresh pgAdmin and run:");
    console.log("  SELECT * FROM leanix_initiatives;");
    console.log("  SELECT id, title, status FROM architecture_requests;");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("fetch failed") || message.includes("ECONNREFUSED")) {
      console.error("API server is not running.");
      console.error("Start it first: pnpm dev:api");
      console.error("Then run: pnpm seed:demo");
      process.exit(1);
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
