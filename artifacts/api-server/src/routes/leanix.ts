import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { leanixInitiativesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

interface LeanixTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface LeanixFactSheetNode {
  id: string;
  name: string;
  type: string;
}

interface LeanixGraphQLEdge {
  node: LeanixFactSheetNode;
}

interface LeanixGraphQLResponse {
  data: {
    allFactSheets: {
      totalCount: number;
      edges: LeanixGraphQLEdge[];
    };
  };
}

async function getLeanixAccessToken(): Promise<string> {
  const workspace = process.env["LEANIX_WORKSPACE"];
  const apiToken = process.env["LEANIX_API_TOKEN"];

  if (!workspace || !apiToken) {
    throw new Error("LEANIX_WORKSPACE and LEANIX_API_TOKEN environment variables are required");
  }

  const tokenUrl = `https://${workspace}.leanix.net/services/mtm/v1/oauth2/token`;

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", "apitoken");
  params.append("client_secret", apiToken);

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${Buffer.from(`apitoken:${apiToken}`).toString("base64")}`,
    },
    body: params,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LeanIX OAuth2 token request failed: ${response.status} ${text}`);
  }

  const data = await response.json() as LeanixTokenResponse;
  return data.access_token;
}

async function fetchLeanixInitiatives(accessToken: string, workspace: string): Promise<LeanixFactSheetNode[]> {
  const graphqlUrl = `https://${workspace}.leanix.net/services/pathfinder/v1/graphql`;

  const query = `
    query ($filter: FilterInput!) {
      allFactSheets(filter: $filter) {
        totalCount
        edges {
          node {
            id
            name
            type
          }
        }
      }
    }
  `;

  const variables = {
    filter: {
      facetFilters: [
        {
          facetKey: "FactSheetTypes",
          keys: ["Project"],
        },
        {
          facetKey: "Subscriptions",
          keys: ["b671a3be-17ed-4d62-b2cd-f2edc316cf56"],
        },
      ],
    },
  };

  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LeanIX GraphQL request failed: ${response.status} ${text}`);
  }

  const result = await response.json() as LeanixGraphQLResponse;
  return result.data?.allFactSheets?.edges?.map((edge) => edge.node) ?? [];
}

router.get("/leanix/initiatives", async (req, res) => {
  try {
    const initiatives = await db.select().from(leanixInitiativesTable).orderBy(leanixInitiativesTable.name);
    res.json(initiatives.map(i => ({
      ...i,
      tags: JSON.parse(i.tags || "[]"),
      syncedAt: i.syncedAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list LeanIX initiatives");
    res.status(500).json({ error: "Failed to list LeanIX initiatives" });
  }
});

router.post("/leanix/sync", async (req, res) => {
  try {
    const workspace = process.env["LEANIX_WORKSPACE"];
    if (!workspace) {
      res.status(400).json({ error: "LEANIX_WORKSPACE environment variable is not configured" });
      return;
    }

    const accessToken = await getLeanixAccessToken();
    const factSheets = await fetchLeanixInitiatives(accessToken, workspace);

    const now = new Date();
    let added = 0;
    let updated = 0;

    for (const fs of factSheets) {
      const leanixUrl = `https://${workspace}.leanix.net/pathfinder/factsheet/Project/${fs.id}`;

      const record = {
        leanixId: fs.id,
        name: fs.name ?? "Untitled",
        description: null,
        lifecycle: null,
        status: "Active",
        responsible: null,
        tags: JSON.stringify([]),
        leanixUrl,
        syncedAt: now,
      };

      const existing = await db
        .select()
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
    req.log.error({ err }, "Failed to sync LeanIX initiatives");
    res.status(500).json({ error: "Failed to sync LeanIX initiatives" });
  }
});

export default router;
