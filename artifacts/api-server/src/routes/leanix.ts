import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { leanixInitiativesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// ─── TypeScript interfaces ────────────────────────────────────────────────────

interface LeanixTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface LeanixTag {
  name: string;
}

interface LeanixFactSheetNode {
  id: string;
  name: string;
  displayName: string | null;
  type: string;
  status?: string | null;
  description?: string | null;
  tags?: LeanixTag[];
}

interface LeanixGraphQLEdge {
  node: LeanixFactSheetNode;
}

interface LeanixGraphQLResponse {
  data?: {
    allFactSheets?: {
      totalCount: number;
      edges: LeanixGraphQLEdge[];
    };
  };
  errors?: Array<{ message: string; locations?: unknown; path?: unknown }>;
}

// ─── Distinct error types ─────────────────────────────────────────────────────

class LeanixAuthError extends Error {
  constructor(detail?: string) {
    super(
      detail
        ? `LeanIX authentication failed: ${detail}`
        : "LeanIX authentication failed — the API token is invalid or has expired. Please check the LEANIX_API_TOKEN secret."
    );
    this.name = "LeanixAuthError";
  }
}

class LeanixAccessError extends Error {
  constructor(detail?: string) {
    super(
      detail
        ? `LeanIX access denied: ${detail}`
        : "LeanIX access denied — the API token does not have permission to read Initiatives. Check workspace permissions in LeanIX."
    );
    this.name = "LeanixAccessError";
  }
}

class LeanixNotFoundError extends Error {
  constructor(workspace: string) {
    super(
      `LeanIX workspace "${workspace}" not found — verify the LEANIX_WORKSPACE secret is correct (it should be your workspace subdomain, e.g. "mycompany").`
    );
    this.name = "LeanixNotFoundError";
  }
}

class LeanixConnectionError extends Error {
  constructor(detail?: string) {
    super(
      detail
        ? `Cannot reach LeanIX: ${detail}`
        : "Cannot reach LeanIX — check your network connection and that the workspace URL is reachable."
    );
    this.name = "LeanixConnectionError";
  }
}

class LeanixGraphQLError extends Error {
  constructor(messages: string[]) {
    super(`LeanIX GraphQL error: ${messages.join("; ")}`);
    this.name = "LeanixGraphQLError";
  }
}

// ─── Helper: categorise fetch errors ─────────────────────────────────────────

function classifyFetchError(err: unknown): Error {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("econnrefused") || msg.includes("enotfound") || msg.includes("network") || msg.includes("timeout") || msg.includes("socket")) {
      return new LeanixConnectionError(err.message);
    }
  }
  return err instanceof Error ? err : new Error(String(err));
}

// ─── OAuth2 token exchange ────────────────────────────────────────────────────

async function getLeanixAccessToken(workspace: string, apiToken: string): Promise<string> {
  const tokenUrl = `https://${workspace}.leanix.net/services/mtm/v1/oauth2/token`;

  let response: Response;
  try {
    response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`apitoken:${apiToken}`).toString("base64")}`,
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    });
  } catch (err) {
    throw classifyFetchError(err);
  }

  if (response.status === 401) {
    const body = await response.text().catch(() => "");
    throw new LeanixAuthError(body || undefined);
  }
  if (response.status === 403) {
    const body = await response.text().catch(() => "");
    throw new LeanixAccessError(body || undefined);
  }
  if (response.status === 404) {
    throw new LeanixNotFoundError(workspace);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`LeanIX token request failed (HTTP ${response.status}): ${body}`);
  }

  const data = await response.json() as LeanixTokenResponse;
  if (!data.access_token) {
    throw new LeanixAuthError("Token response did not include an access_token.");
  }
  return data.access_token;
}

// ─── GraphQL: fetch Initiatives ───────────────────────────────────────────────

async function fetchLeanixInitiatives(
  accessToken: string,
  workspace: string
): Promise<LeanixFactSheetNode[]> {
  const graphqlUrl = `https://${workspace}.leanix.net/services/pathfinder/v1/graphql`;

  // Only request fields confirmed on the BaseFactSheet interface.
  // lifecycle and subscription user-info require workspace-specific
  // inline fragments and are fetched separately if needed.
  const query = `
    {
      allFactSheets(filter: {
        facetFilters: [{ facetKey: "FactSheetTypes", keys: ["Project"] }]
      }) {
        totalCount
        edges {
          node {
            id
            name
            displayName
            type
            status
            description
            tags {
              name
            }
          }
        }
      }
    }
  `;

  let response: Response;
  try {
    response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query }),
    });
  } catch (err) {
    throw classifyFetchError(err);
  }

  if (response.status === 401) {
    throw new LeanixAuthError("Access token was rejected by the GraphQL API.");
  }
  if (response.status === 403) {
    throw new LeanixAccessError("The token does not have permission to query fact sheets.");
  }
  if (response.status === 404) {
    throw new LeanixNotFoundError(workspace);
  }

  // Check we got JSON back (HTML means wrong URL or auth redirect)
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const body = await response.text().catch(() => "");
    if (body.trimStart().startsWith("<")) {
      throw new LeanixAuthError(
        "LeanIX returned an HTML page instead of JSON — the Bearer token was likely rejected. Verify the API token and workspace."
      );
    }
    throw new Error(`LeanIX GraphQL returned unexpected content-type (${contentType})`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`LeanIX GraphQL request failed (HTTP ${response.status}): ${body}`);
  }

  const result = await response.json() as LeanixGraphQLResponse;

  // Surface GraphQL-level errors
  if (result.errors && result.errors.length > 0) {
    throw new LeanixGraphQLError(result.errors.map(e => e.message));
  }

  return result.data?.allFactSheets?.edges?.map(e => e.node) ?? [];
}

// lifecycle is not available on BaseFactSheet without type-specific inline
// fragments — always return null; can be extended once workspace types are known.
function resolveLifecycle(_node: LeanixFactSheetNode): string | null {
  return null;
}

// ─── Resolve the "responsible" person (RESPONSIBLE or ACCOUNTABLE subscription) ──

function resolveResponsible(_node: LeanixFactSheetNode): string | null {
  // Responsible user resolution requires the UserSubscription inline fragment
  // which is workspace-type-specific. Returning null for now — can be extended
  // once the workspace's custom GraphQL type names are known.
  return null;
}

// ─── Route: list cached initiatives ──────────────────────────────────────────

router.get("/leanix/initiatives", async (req, res) => {
  try {
    const initiatives = await db
      .select()
      .from(leanixInitiativesTable)
      .orderBy(leanixInitiativesTable.name);

    res.json(
      initiatives.map(i => ({
        ...i,
        tags: (() => { try { return JSON.parse(i.tags || "[]"); } catch { return []; } })(),
        syncedAt: i.syncedAt.toISOString(),
        createdAt: i.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list LeanIX initiatives");
    res.status(500).json({ error: "Failed to retrieve initiatives from database." });
  }
});

// ─── Route: sync from LeanIX ─────────────────────────────────────────────────

router.post("/leanix/sync", async (req, res) => {
  const workspace = process.env["LEANIX_WORKSPACE"];
  const apiToken = process.env["LEANIX_API_TOKEN"];

  if (!workspace || !apiToken) {
    res.status(400).json({
      error: "LeanIX is not configured — the LEANIX_WORKSPACE and LEANIX_API_TOKEN secrets are required. Add them in the portal's secrets settings.",
    });
    return;
  }

  try {
    const accessToken = await getLeanixAccessToken(workspace, apiToken);
    const factSheets = await fetchLeanixInitiatives(accessToken, workspace);

    const now = new Date();
    let added = 0;
    let updated = 0;

    for (const fs of factSheets) {
      const leanixUrl = `https://${workspace}.leanix.net/pathfinder/factsheet/Project/${fs.id}`;
      const tags = (fs.tags ?? []).map(t => t.name);

      const record = {
        leanixId: fs.id,
        name: fs.displayName ?? fs.name ?? "Untitled",
        description: fs.description ?? null,
        lifecycle: resolveLifecycle(fs),
        status: fs.status ?? "Active",
        responsible: resolveResponsible(fs),
        tags: JSON.stringify(tags),
        leanixUrl,
        syncedAt: now,
      };

      const existing = await db
        .select({ id: leanixInitiativesTable.id })
        .from(leanixInitiativesTable)
        .where(eq(leanixInitiativesTable.leanixId, fs.id));

      if (existing.length === 0) {
        await db.insert(leanixInitiativesTable).values(record);
        added++;
      } else {
        await db
          .update(leanixInitiativesTable)
          .set(record)
          .where(eq(leanixInitiativesTable.leanixId, fs.id));
        updated++;
      }
    }

    res.json({
      synced: factSheets.length,
      added,
      updated,
      lastSyncedAt: now.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "LeanIX sync failed");

    if (err instanceof LeanixAuthError) {
      res.status(401).json({ error: err.message });
      return;
    }
    if (err instanceof LeanixAccessError) {
      res.status(403).json({ error: err.message });
      return;
    }
    if (err instanceof LeanixNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err instanceof LeanixConnectionError) {
      res.status(503).json({ error: err.message });
      return;
    }
    if (err instanceof LeanixGraphQLError) {
      res.status(422).json({ error: err.message });
      return;
    }

    const message = err instanceof Error ? err.message : "An unexpected error occurred during LeanIX sync.";
    res.status(500).json({ error: message });
  }
});

export default router;
