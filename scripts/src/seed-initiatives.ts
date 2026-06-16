/**
 * Seeds demo LeanIX initiatives and simulated JIRA initiatives for local testing.
 * Run: pnpm seed:initiatives
 */
const apiUrl = process.env.API_URL ?? "http://localhost:8080";

async function post(path: string) {
  const response = await fetch(`${apiUrl}${path}`, { method: "POST" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body.error === "string" ? body.error : `POST ${path} failed (${response.status})`);
  }
  return body;
}

async function main() {
  console.log(`Seeding initiatives via ${apiUrl} ...`);

  const leanix = await post("/api/leanix/seed-demo");
  console.log(`LeanIX: ${leanix.added} added, ${leanix.updated} updated (${leanix.total} total)`);

  const jira = await post("/api/jira/sync");
  console.log(`JIRA: ${jira.synced} synced (${jira.added} added, ${jira.updated} updated)`);

  const initiatives = await fetch(`${apiUrl}/api/leanix/initiatives`).then((r) => r.json());
  console.log(`Initiatives tab now has ${initiatives.length} LeanIX initiative(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
