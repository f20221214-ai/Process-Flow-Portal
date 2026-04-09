import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { knowledgeBaseArticlesTable, requestKbArticlesTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";

const router: IRouter = Router();

function serializeArticle(a: typeof knowledgeBaseArticlesTable.$inferSelect) {
  return {
    ...a,
    tags: JSON.parse(a.tags || "[]"),
    technologies: JSON.parse(a.technologies || "[]"),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function parseId(raw: string): number | null {
  const n = parseInt(raw, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

router.get("/knowledge-base", async (req, res) => {
  try {
    const articles = await db.select().from(knowledgeBaseArticlesTable).orderBy(knowledgeBaseArticlesTable.createdAt);
    res.json(articles.map(serializeArticle));
  } catch (err) {
    req.log.error({ err }, "Failed to list KB articles");
    res.status(500).json({ error: "Failed to list KB articles" });
  }
});

router.post("/knowledge-base", async (req, res) => {
  try {
    const body = req.body;
    if (!body.title || !body.owner) {
      res.status(400).json({ error: "title and owner are required" });
      return;
    }
    const [created] = await db.insert(knowledgeBaseArticlesTable).values({
      title: body.title,
      category: body.category ?? "best_practice",
      tags: JSON.stringify(body.tags ?? []),
      content: body.content ?? "",
      externalUrl: body.externalUrl ?? null,
      owner: body.owner,
      technologies: JSON.stringify(body.technologies ?? []),
      status: body.status ?? "published",
    }).returning();
    res.status(201).json(serializeArticle(created));
  } catch (err) {
    req.log.error({ err }, "Failed to create KB article");
    res.status(500).json({ error: "Failed to create KB article" });
  }
});

router.get("/knowledge-base/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid article ID" }); return; }
    const [article] = await db.select().from(knowledgeBaseArticlesTable).where(eq(knowledgeBaseArticlesTable.id, id));
    if (!article) { res.status(404).json({ error: "Article not found" }); return; }
    res.json(serializeArticle(article));
  } catch (err) {
    req.log.error({ err }, "Failed to get KB article");
    res.status(500).json({ error: "Failed to get KB article" });
  }
});

router.patch("/knowledge-base/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid article ID" }); return; }
    const body = req.body;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    for (const field of ["title", "category", "content", "externalUrl", "owner", "status"]) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);
    if (body.technologies !== undefined) updateData.technologies = JSON.stringify(body.technologies);

    const [updated] = await db.update(knowledgeBaseArticlesTable).set(updateData).where(eq(knowledgeBaseArticlesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Article not found" }); return; }
    res.json(serializeArticle(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update KB article");
    res.status(500).json({ error: "Failed to update KB article" });
  }
});

router.delete("/knowledge-base/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid article ID" }); return; }
    await db.delete(requestKbArticlesTable).where(eq(requestKbArticlesTable.articleId, id));
    const [deleted] = await db.delete(knowledgeBaseArticlesTable).where(eq(knowledgeBaseArticlesTable.id, id)).returning();
    if (!deleted) { res.status(404).json({ error: "Article not found" }); return; }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete KB article");
    res.status(500).json({ error: "Failed to delete KB article" });
  }
});

router.get("/requests/:requestId/kb-articles", async (req, res) => {
  try {
    const requestId = parseId(req.params.requestId);
    if (!requestId) { res.status(400).json({ error: "Invalid request ID" }); return; }
    const links = await db.select({ articleId: requestKbArticlesTable.articleId })
      .from(requestKbArticlesTable)
      .where(eq(requestKbArticlesTable.requestId, requestId));
    const articleIds = links.map(l => l.articleId);
    if (articleIds.length === 0) { res.json([]); return; }

    const articles = await db.select().from(knowledgeBaseArticlesTable).where(inArray(knowledgeBaseArticlesTable.id, articleIds));
    res.json(articles.map(serializeArticle));
  } catch (err) {
    req.log.error({ err }, "Failed to list request KB articles");
    res.status(500).json({ error: "Failed to list request KB articles" });
  }
});

router.post("/requests/:requestId/kb-articles", async (req, res) => {
  try {
    const requestId = parseId(req.params.requestId);
    if (!requestId) { res.status(400).json({ error: "Invalid request ID" }); return; }
    const articleId = parseId(String(req.body.articleId));
    if (!articleId) { res.status(400).json({ error: "Invalid article ID" }); return; }

    const [created] = await db.insert(requestKbArticlesTable).values({ requestId, articleId })
      .onConflictDoNothing()
      .returning();
    if (!created) { res.status(409).json({ error: "Already linked" }); return; }
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to link KB article to request");
    res.status(500).json({ error: "Failed to link KB article to request" });
  }
});

router.delete("/requests/:requestId/kb-articles/:articleId", async (req, res) => {
  try {
    const requestId = parseId(req.params.requestId);
    const articleId = parseId(req.params.articleId);
    if (!requestId || !articleId) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.delete(requestKbArticlesTable).where(
      and(eq(requestKbArticlesTable.requestId, requestId), eq(requestKbArticlesTable.articleId, articleId))
    );
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to unlink KB article from request");
    res.status(500).json({ error: "Failed to unlink KB article from request" });
  }
});

export default router;
