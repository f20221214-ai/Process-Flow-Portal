import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { arcSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/sessions", async (req, res) => {
  try {
    const sessions = await db.select().from(arcSessionsTable).orderBy(arcSessionsTable.scheduledDate);
    res.json(sessions.map(s => ({
      ...s,
      attendees: JSON.parse(s.attendees || "[]"),
      scheduledDate: s.scheduledDate.toISOString(),
      createdAt: s.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list sessions");
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

router.post("/sessions", async (req, res) => {
  try {
    const body = req.body;
    const [created] = await db.insert(arcSessionsTable).values({
      requestId: body.requestId,
      scheduledDate: new Date(body.scheduledDate),
      duration: body.duration ?? 75,
      status: "scheduled",
      attendees: JSON.stringify(body.attendees ?? []),
      notes: body.notes ?? null,
    }).returning();

    res.status(201).json({
      ...created,
      attendees: JSON.parse(created.attendees || "[]"),
      scheduledDate: created.scheduledDate.toISOString(),
      createdAt: created.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create session");
    res.status(500).json({ error: "Failed to create session" });
  }
});

router.patch("/sessions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;

    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.scheduledDate !== undefined) updateData.scheduledDate = new Date(body.scheduledDate);

    const [updated] = await db
      .update(arcSessionsTable)
      .set(updateData)
      .where(eq(arcSessionsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.json({
      ...updated,
      attendees: JSON.parse(updated.attendees || "[]"),
      scheduledDate: updated.scheduledDate.toISOString(),
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update session");
    res.status(500).json({ error: "Failed to update session" });
  }
});

export default router;
