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

/** Map a submitter impact level to an EA risk/complexity rating baseline. */
function impactToRating(level: string | undefined | null): string {
  switch (level) {
    case "high":   return "high";
    case "medium": return "medium";
    default:       return "low";   // covers "low", "none", undefined
  }
}

/** Derive full EA baseline from the submitter's impact assessment and request metadata. */
function deriveEaBaseline(body: {
  securityImpactLevel?: string;
  dataImpactLevel?: string;
  integrationImpactLevel?: string;
  regulatoryImpactLevel?: string;
  aiImpactLevel?: string;
  operationalImpactLevel?: string;
  requestType?: string;
  businessCriticality?: string;
  deploymentModel?: string;
}) {
  const levels = [
    body.securityImpactLevel,
    body.dataImpactLevel,
    body.integrationImpactLevel,
    body.regulatoryImpactLevel,
    body.aiImpactLevel,
    body.operationalImpactLevel,
  ];
  const overallRisk = levels.includes("high")
    ? "high"
    : levels.includes("medium")
    ? "medium"
    : "low";

  // --- Review Type ---
  const highComplexityTypes = ["cloud_migration", "new_application", "application_replacement", "technology_selection"];
  const isMissionCritical = body.businessCriticality === "mission_critical";
  const isBusinessCritical = body.businessCriticality === "business_critical";
  const isHighComplexityType = highComplexityTypes.includes(body.requestType ?? "");

  let eaReviewType: string;
  if (overallRisk === "high" || isMissionCritical) {
    eaReviewType = "deep_dive";
  } else if (overallRisk === "medium" || isBusinessCritical || isHighComplexityType) {
    eaReviewType = "standard";
  } else {
    eaReviewType = "lightweight";
  }

  // --- Required Architecture Views ---
  const isCloud = ["cloud_vendor", "cloud_mccain", "hybrid"].includes(body.deploymentModel ?? "")
    || body.requestType === "cloud_migration";
  const present = (l?: string) => !!l && l !== "none";

  const views: string[] = ["Solution Architecture"];
  if (present(body.securityImpactLevel))     views.push("Security Architecture");
  if (present(body.dataImpactLevel))         views.push("Data Architecture");
  if (present(body.integrationImpactLevel))  views.push("Integration Architecture");
  if (present(body.regulatoryImpactLevel))   views.push("Compliance & Regulatory");
  if (present(body.aiImpactLevel))           views.push("AI/ML Architecture");
  if (present(body.operationalImpactLevel))  views.push("Operational Architecture");
  if (isCloud)                               views.push("Infrastructure / Cloud Architecture");

  // --- Required SMEs ---
  const significant = (l?: string) => l === "medium" || l === "high";

  const smes: string[] = [];
  if (significant(body.securityImpactLevel))    smes.push("Security Architect");
  if (significant(body.dataImpactLevel))        smes.push("Data Architect");
  if (significant(body.integrationImpactLevel)) smes.push("Integration Architect");
  if (significant(body.regulatoryImpactLevel))  smes.push("Compliance / Legal");
  if (significant(body.aiImpactLevel))          smes.push("AI/ML Specialist");
  if (significant(body.operationalImpactLevel)) smes.push("Platform / Operations Engineer");
  if (isCloud)                                  smes.push("Cloud Platform Engineer");

  return {
    eaSecurityRiskRating:          impactToRating(body.securityImpactLevel),
    eaDataComplexityRating:        impactToRating(body.dataImpactLevel),
    eaIntegrationComplexityRating: impactToRating(body.integrationImpactLevel),
    eaRegulatoryRiskRating:        impactToRating(body.regulatoryImpactLevel),
    eaAiRiskRating:                impactToRating(body.aiImpactLevel),
    eaOperationalRiskRating:       impactToRating(body.operationalImpactLevel),
    eaOverallRiskLevel:            overallRisk,
    eaReviewType,
    eaRequiredArchitectureViews:   views.join(", "),
    eaRequiredSmes:                smes.length > 0 ? smes.join(", ") : "Enterprise Architect",
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

    const eaBaseline = deriveEaBaseline(body);

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
      securityImpactAnswers: body.securityImpactAnswers ?? null,
      dataImpactLevel: body.dataImpactLevel ?? "none",
      dataImpactDetails: body.dataImpactDetails ?? null,
      dataImpactAnswers: body.dataImpactAnswers ?? null,
      integrationImpactLevel: body.integrationImpactLevel ?? "none",
      integrationImpactDetails: body.integrationImpactDetails ?? null,
      integrationImpactAnswers: body.integrationImpactAnswers ?? null,
      regulatoryImpactLevel: body.regulatoryImpactLevel ?? "none",
      regulatoryImpactDetails: body.regulatoryImpactDetails ?? null,
      regulatoryImpactAnswers: body.regulatoryImpactAnswers ?? null,
      aiImpactLevel: body.aiImpactLevel ?? "none",
      aiImpactDetails: body.aiImpactDetails ?? null,
      aiImpactAnswers: body.aiImpactAnswers ?? null,
      operationalImpactLevel: body.operationalImpactLevel ?? "none",
      operationalImpactDetails: body.operationalImpactDetails ?? null,
      operationalImpactAnswers: body.operationalImpactAnswers ?? null,
      architectureSpecifications: body.architectureSpecifications ?? null,
      jiraInitiativeId: body.jiraInitiativeId ?? null,
      jiraKey,
      // EA baseline — pre-calculated from submitter's impact assessment
      eaSecurityRiskRating:          eaBaseline.eaSecurityRiskRating,
      eaDataComplexityRating:        eaBaseline.eaDataComplexityRating,
      eaIntegrationComplexityRating: eaBaseline.eaIntegrationComplexityRating,
      eaRegulatoryRiskRating:        eaBaseline.eaRegulatoryRiskRating,
      eaAiRiskRating:                eaBaseline.eaAiRiskRating,
      eaOperationalRiskRating:       eaBaseline.eaOperationalRiskRating,
      eaOverallRiskLevel:            eaBaseline.eaOverallRiskLevel,
      eaReviewType:                  eaBaseline.eaReviewType,
      eaRequiredArchitectureViews:   eaBaseline.eaRequiredArchitectureViews,
      eaRequiredSmes:                eaBaseline.eaRequiredSmes,
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
      "securityImpactLevel", "securityImpactDetails", "securityImpactAnswers",
      "dataImpactLevel", "dataImpactDetails", "dataImpactAnswers",
      "integrationImpactLevel", "integrationImpactDetails", "integrationImpactAnswers",
      "regulatoryImpactLevel", "regulatoryImpactDetails", "regulatoryImpactAnswers",
      "aiImpactLevel", "aiImpactDetails", "aiImpactAnswers",
      "operationalImpactLevel", "operationalImpactDetails", "operationalImpactAnswers",
      "eaSecurityRiskRating", "eaDataComplexityRating", "eaIntegrationComplexityRating",
      "eaRegulatoryRiskRating", "eaAiRiskRating", "eaOperationalRiskRating",
      "eaOverallComplexity", "eaOverallRiskLevel",
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
