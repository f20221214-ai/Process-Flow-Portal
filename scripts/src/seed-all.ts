import { loadProjectEnv } from "./load-project-env.ts";

loadProjectEnv();

const SEED_TOKEN = "arc-demo-seed-2026";

async function tryAdminSeed(): Promise<boolean> {
  const base = process.env.API_URL ?? "http://localhost:8080";
  try {
    const response = await fetch(`${base}/api/admin/seed-demo?token=${SEED_TOKEN}`);
    if (!response.ok) {
      return false;
    }
    const body = await response.json();
    console.log("Admin demo seed:", body);
    return true;
  } catch {
    return false;
  }
}

async function seedDirect() {
  const { seedLeanixInitiatives, seedJiraInitiatives } = await import("./seeds/run-seeds.ts");
  const { seedArcData } = await import("./seed-arc.ts");

  await seedLeanixInitiatives();
  await seedJiraInitiatives();
  await seedArcData();

  const base = process.env.API_URL ?? "http://localhost:8080";
  try {
    const response = await fetch(`${base}/api/kpis`);
    if (response.ok) {
      const kpis = await response.json();
      console.log(`kpi_metrics: ${Array.isArray(kpis) ? kpis.length : 0} row(s) via API`);
    }
  } catch {
    console.log("kpi_metrics: start API and open /kpis page to auto-seed, or run pnpm dev:api");
  }
}

async function main() {
  console.log(`Using DATABASE_URL=${process.env.DATABASE_URL?.replace(/:[^:@/]+@/, ":****@") ?? "(not set)"}`);
  console.log("Loading demo data...\n");

  if (await tryAdminSeed()) {
    console.log("\nFull demo data loaded (initiatives, requests, KPIs, patterns).");
    return;
  }

  console.log("API admin seed unavailable. Seeding core demo data directly...\n");
  await seedDirect();
  console.log("\nCore demo data loaded (initiatives, JIRA, architecture requests, sessions, outcomes).");
  console.log("For KPIs and architecture patterns, run: pnpm dev:api");
  console.log("Then visit http://localhost:5173/admin or call the admin seed URL.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
