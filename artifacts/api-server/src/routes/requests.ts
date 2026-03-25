import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { architectureRequestsTable, insertArchitectureRequestSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

router.get("/requests", async (req, res) => {
  try {
    const requests = await db.select().from(architectureRequestsTable).orderBy(architectureRequestsTable.createdAt);
    res.json(requests.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list requests");
    res.status(500).json({ error: "Failed to list requests" });
  }
});

router.post("/requests", async (req, res) => {
  try {
    const body = req.body;
    const parsed = insertArchitectureRequestSchema.safeParse({
      title: body.title,
      description: body.description,
      requestType: body.requestType,
      phase: body.phase,
      submittedBy: body.submittedBy,
      businessUnit: body.businessUnit,
      status: "submitted",
      priority: body.priority ?? "medium",
      eaAssignee: body.eaAssignee ?? null,
      architectureSpecifications: body.architectureSpecifications ?? null,
      scopeNotes: null,
    });

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error });
      return;
    }

    const [created] = await db.insert(architectureRequestsTable).values(parsed.data).returning();
    res.status(201).json({
      ...created,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create request");
    res.status(500).json({ error: "Failed to create request" });
  }
});

router.get("/requests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [request] = await db.select().from(architectureRequestsTable).where(eq(architectureRequestsTable.id, id));
    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    res.json({
      ...request,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get request");
    res.status(500).json({ error: "Failed to get request" });
  }
});

router.patch("/requests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.status !== undefined) updateData.status = body.status;
    if (body.eaAssignee !== undefined) updateData.eaAssignee = body.eaAssignee;
    if (body.architectureSpecifications !== undefined) updateData.architectureSpecifications = body.architectureSpecifications;
    if (body.scopeNotes !== undefined) updateData.scopeNotes = body.scopeNotes;
    if (body.priority !== undefined) updateData.priority = body.priority;

    const [updated] = await db
      .update(architectureRequestsTable)
      .set(updateData)
      .where(eq(architectureRequestsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    res.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update request");
    res.status(500).json({ error: "Failed to update request" });
  }
});

export default router;
