import { eq } from "drizzle-orm";
import { JIRA_SEED, LEANIX_SEED } from "./demo-data.ts";

export async function seedLeanixInitiatives() {
  const { db } = await import("@workspace/db");
  const { leanixInitiativesTable } = await import("@workspace/db");
  const now = new Date();
  let added = 0;
  let updated = 0;

  for (const item of LEANIX_SEED) {
    const existing = await db
      .select({ id: leanixInitiativesTable.id })
      .from(leanixInitiativesTable)
      .where(eq(leanixInitiativesTable.leanixId, item.leanixId));

    if (existing.length === 0) {
      await db.insert(leanixInitiativesTable).values({ ...item, syncedAt: now });
      added++;
    } else {
      await db
        .update(leanixInitiativesTable)
        .set({ ...item, syncedAt: now })
        .where(eq(leanixInitiativesTable.leanixId, item.leanixId));
      updated++;
    }
  }

  console.log(`leanix_initiatives: ${LEANIX_SEED.length} total (${added} added, ${updated} updated)`);
}

export async function seedJiraInitiatives() {
  const { db } = await import("@workspace/db");
  const { jiraInitiativesTable } = await import("@workspace/db");
  const now = new Date();
  let added = 0;
  let updated = 0;

  for (const item of JIRA_SEED) {
    const existing = await db
      .select({ id: jiraInitiativesTable.id })
      .from(jiraInitiativesTable)
      .where(eq(jiraInitiativesTable.jiraKey, item.jiraKey));

    if (existing.length === 0) {
      await db.insert(jiraInitiativesTable).values({ ...item, syncedAt: now });
      added++;
    } else {
      await db
        .update(jiraInitiativesTable)
        .set({ ...item, syncedAt: now })
        .where(eq(jiraInitiativesTable.jiraKey, item.jiraKey));
      updated++;
    }
  }

  console.log(`jira_initiatives: ${JIRA_SEED.length} total (${added} added, ${updated} updated)`);
}

export async function seedKpiMetrics() {
  const { db } = await import("@workspace/db");
  const { kpiMetricsTable } = await import("@workspace/db");

  const existing = await db.select({ id: kpiMetricsTable.id }).from(kpiMetricsTable).limit(1);
  if (existing.length > 0) {
    const count = await db.select({ id: kpiMetricsTable.id }).from(kpiMetricsTable);
    console.log(`kpi_metrics: ${count.length} row(s) already present (skipped)`);
    return;
  }

  console.log("kpi_metrics: no rows yet (seeded when API /kpis endpoint is called)");
}
