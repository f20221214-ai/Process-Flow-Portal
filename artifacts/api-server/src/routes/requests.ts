import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { architectureRequestsTable, jiraInitiativesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function serializeRequest(r: typeof architectureRequestsTable.$inferSelect) {
  return {
    ...r,
    businessValueHypothesis: JSON.parse(r.businessValueHypothesis || "[]"),
    businessCapability: JSON.parse(r.businessCapability || "[]"),
    inScopeRegions: JSON.parse(r.inScopeRegions || "[]"),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

router.get("/requests", async (req, res) => {
  try {
    const requests = await db.select().from(architectureRequestsTable).orderBy(architectureRequestsTable.createdAt);
    res.json(requests.map(serializeRequest));
  } catch (err) {
    req.log.error({ err }, "Failed to list requests");
    res.status(500).json({ error: "Failed to list requests" });
  }
});

router.post("/requests", async (req, res) => {
  try {
    const body = req.body;

    let jiraKey: string | null = null;
    if (body.jiraInitiativeId) {
      const [initiative] = await db.select().from(jiraInitiativesTable).where(eq(jiraInitiativesTable.id, body.jiraInitiativeId));
      if (initiative) jiraKey = initiative.jiraKey;
    }

    const [created] = await db.insert(architectureRequestsTable).values({
      title: body.title,
      description: body.description,
      businessUnit: body.businessUnit,
      submittedBy: body.submittedBy,
      sponsorProductOwner: body.sponsorProductOwner ?? null,
      solutionArchitect: body.solutionArchitect ?? null,
      requestType: body.requestType,
      status: "submitted",
      priority: body.priority ?? "medium",
      phase: body.phase ?? "ph1",
      businessContext: body.businessContext ?? null,
      businessValueHypothesis: JSON.stringify(body.businessValueHypothesis ?? []),
      businessCapability: JSON.stringify(body.businessCapability ?? []),
      businessCriticality: body.businessCriticality ?? null,
      costEstimate: body.costEstimate ?? null,
      inScopeRegions: JSON.stringify(body.inScopeRegions ?? []),
      expectedUserBase: body.expectedUserBase ?? null,
      deploymentModel: body.deploymentModel ?? null,
      targetGoLiveDate: body.targetGoLiveDate ?? null,
      securityImpactLevel: body.securityImpactLevel ?? "none",
      securityImpactDetails: body.securityImpactDetails ?? null,
      dataImpactLevel: body.dataImpactLevel ?? "none",
      dataImpactDetails: body.dataImpactDetails ?? null,
      integrationImpactLevel: body.integrationImpactLevel ?? "none",
      integrationImpactDetails: body.integrationImpactDetails ?? null,
      regulatoryImpactLevel: body.regulatoryImpactLevel ?? "none",
      regulatoryImpactDetails: body.regulatoryImpactDetails ?? null,
      aiImpactLevel: body.aiImpactLevel ?? "none",
      aiImpactDetails: body.aiImpactDetails ?? null,
      architectureSpecifications: body.architectureSpecifications ?? null,
      jiraInitiativeId: body.jiraInitiativeId ?? null,
      jiraKey,
    }).returning();

    res.status(201).json(serializeRequest(created));
  } catch (err) {
    req.log.error({ err }, "Failed to create request");
    res.status(500).json({ error: "Failed to create request" });
  }
});

router.get("/requests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [request] = await db.select().from(architectureRequestsTable).where(eq(architectureRequestsTable.id, id));
    if (!request) { res.status(404).json({ error: "Request not found" }); return; }
    res.json(serializeRequest(request));
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

    const simpleFields = [
      "status", "priority", "eaAssignee", "scopeNotes", "architectureSpecifications",
      "sponsorProductOwner", "solutionArchitect", "businessContext", "businessCriticality",
      "costEstimate", "expectedUserBase", "deploymentModel", "targetGoLiveDate",
      "securityImpactLevel", "securityImpactDetails", "dataImpactLevel", "dataImpactDetails",
      "integrationImpactLevel", "integrationImpactDetails", "regulatoryImpactLevel", "regulatoryImpactDetails",
      "aiImpactLevel", "aiImpactDetails",
      "eaSecurityRiskRating", "eaDataComplexityRating", "eaIntegrationComplexityRating",
      "eaRegulatoryRiskRating", "eaAiRiskRating", "eaOverallComplexity", "eaOverallRiskLevel",
      "eaReviewType", "eaRequiredArchitectureViews", "eaRequiredSmes", "eaArcSchedule",
    ];
    for (const field of simpleFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    // JSON array fields
    if (body.businessValueHypothesis !== undefined) updateData.businessValueHypothesis = JSON.stringify(body.businessValueHypothesis);
    if (body.businessCapability !== undefined) updateData.businessCapability = JSON.stringify(body.businessCapability);
    if (body.inScopeRegions !== undefined) updateData.inScopeRegions = JSON.stringify(body.inScopeRegions);

    // JIRA link
    if (body.jiraInitiativeId !== undefined) {
      updateData.jiraInitiativeId = body.jiraInitiativeId;
      if (body.jiraInitiativeId) {
        const [initiative] = await db.select().from(jiraInitiativesTable).where(eq(jiraInitiativesTable.id, body.jiraInitiativeId));
        updateData.jiraKey = initiative?.jiraKey ?? null;
      } else {
        updateData.jiraKey = null;
      }
    }

    const [updated] = await db.update(architectureRequestsTable).set(updateData).where(eq(architectureRequestsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Request not found" }); return; }
    res.json(serializeRequest(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update request");
    res.status(500).json({ error: "Failed to update request" });
  }
});

export default router;
