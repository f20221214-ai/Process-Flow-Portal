import { eq } from "drizzle-orm";
import { loadProjectEnv } from "./load-project-env.ts";

loadProjectEnv();

const DEMO_LEANIX_INITIATIVES = [
  {
    leanixId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Digital Agriculture Platform",
    description:
      "Enterprise initiative to build an IoT-enabled smart farming platform with sensor telemetry, agronomic analytics, and mobile grower advisory services.",
    lifecycle: "active",
    status: "Active",
    responsible: "Sarah Chen",
    tags: '["IoT","Cloud","Agriculture","Analytics"]',
    leanixUrl:
      "https://demo.leanix.net/pathfinder/factsheet/Project/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  },
  {
    leanixId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    name: "MES Modernisation Programme",
    description:
      "Replace legacy SCADA-linked MES with a cloud-connected Manufacturing Execution System integrating OT/IT boundaries, SAP ERP, and quality management.",
    lifecycle: "plan",
    status: "Active",
    responsible: "James Walker",
    tags: '["Manufacturing","OT/IT","ERP","Integration"]',
    leanixUrl:
      "https://demo.leanix.net/pathfinder/factsheet/Project/b2c3d4e5-f6a7-8901-bcde-f12345678901",
  },
  {
    leanixId: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    name: "E-Invoicing Regulatory Compliance",
    description:
      "Implement government-mandated electronic invoicing across all operating regions to meet statutory compliance deadlines.",
    lifecycle: "plan",
    status: "Active",
    responsible: "Priya Nair",
    tags: '["Regulatory","Finance","Compliance"]',
    leanixUrl:
      "https://demo.leanix.net/pathfinder/factsheet/Project/c3d4e5f6-a7b8-9012-cdef-123456789012",
  },
  {
    leanixId: "d4e5f6a7-b8c9-0123-def0-234567890123",
    name: "AI Marketing Personalisation Pilot",
    description:
      "Proof-of-concept AI/ML engine for customer-segment personalisation, content recommendations, and campaign targeting at scale.",
    lifecycle: "plan",
    status: "Active",
    responsible: "Tom Reilly",
    tags: '["AI","ML","Marketing","Pilot"]',
    leanixUrl:
      "https://demo.leanix.net/pathfinder/factsheet/Project/d4e5f6a7-b8c9-0123-def0-234567890123",
  },
  {
    leanixId: "e5f6a7b8-c9d0-1234-ef01-345678901234",
    name: "Zero Trust Network Access Rollout",
    description:
      "Replace VPN-based remote access with identity-aware zero trust network access across the enterprise perimeter.",
    lifecycle: "active",
    status: "Active",
    responsible: "Mehak Singh",
    tags: '["Security","Zero Trust","Identity","Network"]',
    leanixUrl:
      "https://demo.leanix.net/pathfinder/factsheet/Project/e5f6a7b8-c9d0-1234-ef01-345678901234",
  },
] as const;

async function main() {
  const { db } = await import("@workspace/db");
  const { leanixInitiativesTable } = await import("@workspace/db");

  const now = new Date();
  let added = 0;
  let updated = 0;

  for (const item of DEMO_LEANIX_INITIATIVES) {
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

  console.log(`Seeded leanix_initiatives: ${DEMO_LEANIX_INITIATIVES.length} total (${added} added, ${updated} updated)`);
  console.log("Refresh pgAdmin and run: SELECT * FROM leanix_initiatives;");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
