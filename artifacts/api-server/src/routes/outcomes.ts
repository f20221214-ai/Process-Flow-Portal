import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reviewOutcomesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/outcomes", async (req, res) => {
  try {
    const outcomes = await db.select().from(reviewOutcomesTable).orderBy(reviewOutcomesTable.createdAt);
    res.json(outcomes.map(o => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list outcomes");
    res.status(500).json({ error: "Failed to list outcomes" });
  }
});

router.post("/outcomes", async (req, res) => {
  try {
    const body = req.body;
    const [created] = await db.insert(reviewOutcomesTable).values({
      requestId: body.requestId,
      sessionId: body.sessionId ?? null,
      decision: body.decision,
      outcomeType: body.outcomeType,
      adrReference: body.adrReference ?? null,
      exceptionOwner: body.exceptionOwner ?? null,
      remediationPlan: body.remediationPlan ?? null,
      riskOwner: body.riskOwner ?? null,
      escalationReason: body.escalationReason ?? null,
      nextSteps: body.nextSteps ?? null,
      notes: body.notes ?? null,
      createdBy: body.createdBy,
    }).returning();

    res.status(201).json({
      ...created,
      createdAt: created.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create outcome");
    res.status(500).json({ error: "Failed to create outcome" });
  }
});

export default router;
