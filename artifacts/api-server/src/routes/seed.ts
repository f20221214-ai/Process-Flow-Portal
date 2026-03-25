import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { jiraInitiativesTable, architectureRequestsTable, kpiMetricsTable } from "@workspace/db";

const router: IRouter = Router();

const SEED_TOKEN = "arc-demo-seed-2026";

const JIRA_SEED = [
  { jiraKey: "DAG-101", summary: "Digital Agriculture Platform", description: "End-to-end IoT-enabled platform for smart farming: sensor telemetry ingestion, agronomic analytics, and mobile advisory services for growers.", projectKey: "DAG", projectName: "Digital Agriculture", status: "In Progress", priority: "High", assignee: "sarah.chen@company.com", issueType: "Epic", labels: '["IoT","Cloud","Analytics"]', jiraUrl: "https://jira.company.com/browse/DAG-101" },
  { jiraKey: "MES-001", summary: "MES Modernisation – OT/IT Integration", description: "Replace legacy SCADA-linked MES with a cloud-connected Manufacturing Execution System integrating real-time production data with ERP and quality systems.", projectKey: "MES", projectName: "Manufacturing Execution System", status: "In Progress", priority: "Critical", assignee: "james.walker@company.com", issueType: "Epic", labels: '["OT","Manufacturing","ERP","Integration"]', jiraUrl: "https://jira.company.com/browse/MES-001" },
  { jiraKey: "EINV-001", summary: "E-Invoicing Regulatory Compliance", description: "Implement e-invoicing capability to meet government-mandated electronic invoicing requirements across all operating regions by the statutory deadline.", projectKey: "EINV", projectName: "E-Invoicing", status: "To Do", priority: "High", assignee: "priya.nair@company.com", issueType: "Epic", labels: '["Regulatory","Finance","Compliance"]', jiraUrl: "https://jira.company.com/browse/EINV-001" },
  { jiraKey: "AIM-001", summary: "AI Pilot – Marketing Personalisation Engine", description: "Proof-of-concept AI/ML personalisation engine to generate customer-segment-specific content recommendations, discount offers, and campaign targeting at scale.", projectKey: "AIM", projectName: "AI Pilot for Marketing", status: "To Do", priority: "Medium", assignee: "tom.reilly@company.com", issueType: "Epic", labels: '["AI","ML","Marketing","Pilot"]', jiraUrl: "https://jira.company.com/browse/AIM-001" },
];

const KPI_SEED = [
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Standardization & Pattern Adoption", kpiName: "Reference Architecture Adoption Rate", whatToMeasure: "% of solutions using approved reference architectures", howToMeasure: "Solutions aligned with approved patterns / Total solutions reviewed", status: "not_started" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Standardization & Pattern Adoption", kpiName: "Architecture Exception Rate", whatToMeasure: "Architecture Exception Rate", howToMeasure: "# of approved deviations / Total solutions reviewed", status: "not_started" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Risk & Security Exposure Reduction", kpiName: "Security Findings Reduction", whatToMeasure: "Security Findings Reduction", howToMeasure: "Security Assessment results (Cyber Risk Team)", status: "not_started" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Risk & Security Exposure Reduction", kpiName: "Compliance Audit Findings Reduction", whatToMeasure: "Compliance Audit Findings Reduction", howToMeasure: "Audit reports (Internal Audit Team)", status: "not_started" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Delivery Efficiency & Cost Avoidance", kpiName: "Delivery Cycle Time Improvement", whatToMeasure: "Delivery Cycle time improvement", howToMeasure: "Delivery time for projects using standard patterns vs without", status: "not_started" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Delivery Efficiency & Cost Avoidance", kpiName: "Post-Go-Live Change Volume", whatToMeasure: "Post-Go-Live Change Volume", howToMeasure: "No. of change requests and incidents recorded", status: "not_started" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Delivery Efficiency & Cost Avoidance", kpiName: "Technology Sprawl Reduction", whatToMeasure: "Technology Sprawl Reduction", howToMeasure: "# of technologies reduced or consolidated", status: "not_started" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Architectural Knowledge Capture", kpiName: "ADR Coverage", whatToMeasure: "Architecture Decision Records (ADR) coverage", howToMeasure: "% of significant architectural decisions captured as ADRs", status: "not_started" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Architectural Knowledge Capture", kpiName: "Architecture Drift Detection", whatToMeasure: "Architecture Drift Detection", howToMeasure: "# of undocumented architecture changes discovered post-implementation", status: "not_started" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Decision Traceability & Speed", kpiName: "Decision Reuse Rate", whatToMeasure: "Decision Reuse Rate", howToMeasure: "% of architecture reviews referencing existing ADRs", status: "not_started" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Decision Traceability & Speed", kpiName: "Fast-Track Approval Rate", whatToMeasure: "Fast-Track Approval Rate", howToMeasure: "% of solutions approved with light or no review due to existing pattern", status: "not_started" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Decision Traceability & Speed", kpiName: "Re-decision Avoidance", whatToMeasure: "Re-decision Avoidance", howToMeasure: "# of decisions not re-litigated because rationale is already documented", status: "not_started" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Organizational Dependency Risk", kpiName: "Onboarding Time for New Architects", whatToMeasure: "Onboarding Time for New Architects", howToMeasure: "Time for new architect to confidently review existing solution", status: "not_started" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Organizational Dependency Risk", kpiName: "Architecture Question Recurrence", whatToMeasure: "Architecture Question Recurrence", howToMeasure: "Frequency of repeated questions about the same architectural decisions", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Delivery Flexibility", kpiName: "Exception Approval Lead Time", whatToMeasure: "Exception Approval Lead Time", howToMeasure: "Average time to approve or reject architecture exception", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Delivery Flexibility", kpiName: "Lightweight Review Approval Rate", whatToMeasure: "Fast-Track Approval Rate", howToMeasure: "% of initiatives approved via lightweight review", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Delivery Flexibility", kpiName: "Delivery Block Rate", whatToMeasure: "Delivery Block Rate", howToMeasure: "% of initiatives delayed due to architecture indecision", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Deviation Visibility", kpiName: "Exception Registration Coverage", whatToMeasure: "Exception Registration Coverage", howToMeasure: "% of architecture deviations formally logged", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Deviation Visibility", kpiName: "Exception Traceability Completeness", whatToMeasure: "Exception Traceability Completeness", howToMeasure: "% of exceptions with complete metadata", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Deviation Ownership & Governance", kpiName: "Exception Ownership Assignment Rate", whatToMeasure: "Exception Ownership Assignment Rate", howToMeasure: "% of deviations with named business or technical owner", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Deviation Ownership & Governance", kpiName: "Remediation Compliance Rate", whatToMeasure: "Remediation Compliance Rate", howToMeasure: "% of deviations retired or remediated within agreed timeframe", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Technical Debt Containment", kpiName: "Technical Debt Growth Rate", whatToMeasure: "Technical Debt Growth Rate", howToMeasure: "New deviations created vs resolved deviations", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Technical Debt Containment", kpiName: "Incident Cost Impact from Deviations", whatToMeasure: "Incident or Cost Impact Linked to Deviations", howToMeasure: "% incidents traced to known architecture deviations", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Technical Debt Containment", kpiName: "Debt Remediation Completion Rate", whatToMeasure: "Debt Remediation Completion Rate", howToMeasure: "% of planned architecture remediation actions completed", status: "not_started" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Explicit Risk Ownership", kpiName: "Risk Ownership Assignment Rate", whatToMeasure: "Risk Ownership Assignment Rate", howToMeasure: "% of identified architecture risks with formally assigned owner", status: "not_started" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Explicit Risk Ownership", kpiName: "Risk Acceptance Documentation Coverage", whatToMeasure: "Risk Acceptance Documentation Coverage", howToMeasure: "% of accepted risks with documented rationale and approval", status: "not_started" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Risk Visibility", kpiName: "Risk Register Capture Rate", whatToMeasure: "Risk Register Capture Rate", howToMeasure: "% of architecture risks logged in central risk register", status: "not_started" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Risk Visibility", kpiName: "Unregistered Risk Discovery Rate", whatToMeasure: "Unregistered Risk Discovery Rate", howToMeasure: "# risks discovered post-deployment that were never recorded", status: "not_started" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Risk Visibility", kpiName: "Risk Identification Effectiveness", whatToMeasure: "Architecture Review Risk Identification Effectiveness", howToMeasure: "Average number of risks identified during design vs discovered later", status: "not_started" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Active Risk Governance", kpiName: "Risk Mitigation Progress Rate", whatToMeasure: "Risk Mitigation Progress Rate", howToMeasure: "% of risks with active mitigation plans tracked", status: "not_started" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Active Risk Governance", kpiName: "Expired Risk Acceptance Detection", whatToMeasure: "Expired Risk Acceptance Detection", howToMeasure: "# risks exceeding review or acceptance expiry", status: "not_started" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Incident & Audit Prevention", kpiName: "Audit Finding Traceability", whatToMeasure: "Audit Finding Traceability", howToMeasure: "% audit findings caused by unacknowledged architecture risk", status: "not_started" },
  { outcomeNumber: 5, outcomeName: "Ensure high-impact architectural decisions are taken at the right level with full transparency of trade-offs and consequences.", kpiCategory: "Decision Governance", kpiName: "Decision Classification Coverage", whatToMeasure: "% of architecture submissions that include decision impact classification", howToMeasure: "ARR submissions with impact classification / Total ARR submissions", status: "not_started" },
  { outcomeNumber: 5, outcomeName: "Ensure high-impact architectural decisions are taken at the right level with full transparency of trade-offs and consequences.", kpiCategory: "Decision Governance", kpiName: "Post-Implementation Escalation Rate", whatToMeasure: "Post-Implementation Escalation Rate", howToMeasure: "% of incidents or audit findings caused by decisions NOT reviewed by architecture governance", status: "not_started" },
  { outcomeNumber: 5, outcomeName: "Ensure high-impact architectural decisions are taken at the right level with full transparency of trade-offs and consequences.", kpiCategory: "Decision Governance", kpiName: "Re-Architecture Rate", whatToMeasure: "Re-Architecture Rate", howToMeasure: "Number of major rework efforts due to poor early design decisions", status: "not_started" },
];

router.get("/admin/seed-demo", async (req, res) => {
  const token = req.query["token"] || req.headers["x-seed-token"];
  if (token !== SEED_TOKEN) {
    res.status(401).json({ error: "Unauthorized – add ?token=arc-demo-seed-2026 to the URL" });
    return;
  }

  try {
    const results: Record<string, number> = {};

    // 1. Seed JIRA initiatives
    const jiraInserted = await db.insert(jiraInitiativesTable)
      .values(JIRA_SEED)
      .onConflictDoNothing()
      .returning();
    results.jiraInitiatives = jiraInserted.length;

    // 2. Look up the IDs for our 4 target initiatives
    const allJira = await db.select().from(jiraInitiativesTable);
    const jiraMap = Object.fromEntries(allJira.map(j => [j.jiraKey, j.id]));

    // 3. Seed architecture requests
    const existingRequests = await db.select().from(architectureRequestsTable);
    const existingTitles = new Set(existingRequests.map(r => r.title));

    const requests = [
      {
        title: "Digital Agriculture Platform – Grower IoT & Advisory",
        description: "Build a cloud-native IoT data platform that ingests telemetry from soil moisture, weather, and drone sensors deployed across grower properties, applies agronomic models, and surfaces planting and irrigation recommendations via a mobile advisory app.",
        businessUnit: "Agri-Digital Business Unit",
        submittedBy: "sarah.chen@company.com",
        sponsorProductOwner: "Michael Tan (Head of Digital Agriculture)",
        solutionArchitect: "Liam Foster",
        requestType: "new_application", status: "approved", priority: "high",
        businessContext: "Our grower network lacks real-time agronomic insights, leading to suboptimal yield decisions and reactive field interventions.",
        businessValueHypothesis: '["Increase average crop yield recommendations effectiveness by 15%","Reduce agronomist manual field visit workload by 40%","Enable data-driven planting and irrigation advisory at scale"]',
        businessCapability: '["Precision Agriculture","IoT Data Management","Grower Advisory Services"]',
        businessCriticality: "business_critical", costEstimate: "$2.8M",
        inScopeRegions: '["ANZ","Southeast Asia"]',
        expectedUserBase: "500 growers, 50 agronomists", deploymentModel: "cloud_saas", targetGoLiveDate: "2026-09-30",
        securityImpactLevel: "medium", securityImpactDetails: "External-facing mobile API requires robust auth (OAuth 2.0 / API Gateway).",
        dataImpactLevel: "medium", dataImpactDetails: "Agronomic data classified as business-sensitive. Grower property data requires consent management.",
        integrationImpactLevel: "high", integrationImpactDetails: "Integrates with IoT device management (AWS IoT Core), ERP for grower data, external weather APIs, and mobile advisory app.",
        regulatoryImpactLevel: "none", aiImpactLevel: "none",
        eaAssignee: "Jane Mitchell",
        eaSecurityRiskRating: "medium", eaDataComplexityRating: "medium", eaIntegrationComplexityRating: "high",
        eaRegulatoryRiskRating: "low", eaAiRiskRating: "none",
        eaOverallComplexity: "medium", eaOverallRiskLevel: "high", eaReviewType: "deep_dive",
        eaRequiredArchitectureViews: '["Application Architecture","Integration Architecture","Infrastructure Architecture","Data Architecture","Security Architecture"]',
        eaRequiredSmes: '["Integration Architect","Cloud Infrastructure SME","Security Architect","Data Architect"]',
        eaArcSchedule: "2026-01-28 10:00:00",
        jiraInitiativeId: jiraMap["DAG-101"] || null, jiraKey: "DAG-101", phase: "ph1",
        createdAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        title: "MES Modernisation – OT/IT Integration & ERP Connectivity",
        description: "Replace the current legacy SCADA-linked MES with a modern cloud-connected Manufacturing Execution System that integrates real-time production data with SAP ERP, quality management systems, and the corporate data platform.",
        businessUnit: "Global Manufacturing Operations",
        submittedBy: "james.walker@company.com",
        sponsorProductOwner: "Angela Ross (VP Manufacturing Technology)",
        solutionArchitect: "Deepak Sharma",
        requestType: "application_replacement", status: "arc_scheduled", priority: "critical",
        businessContext: "The existing MES is end-of-vendor-support in Q3 2026. Unplanned downtime costs ~$1.2M/month and cannot be correlated to production events without significant manual investigation.",
        businessValueHypothesis: '["Reduce unplanned production downtime by 20%","Eliminate manual production data re-entry into SAP ERP","Enable real-time quality tracing from raw material to finished goods"]',
        businessCapability: '["Manufacturing Operations","Quality Management","OT/IT Integration","Supply Chain Visibility"]',
        businessCriticality: "mission_critical", costEstimate: "$5.4M",
        inScopeRegions: '["Europe","North America"]',
        expectedUserBase: "2,000 plant operators, 150 supervisors", deploymentModel: "hybrid", targetGoLiveDate: "2027-03-31",
        securityImpactLevel: "high", securityImpactDetails: "OT/IT convergence introduces significant attack surface. SCADA protocol bridging must be isolated via DMZ.",
        dataImpactLevel: "medium", dataImpactDetails: "Production batch records may fall under GMP regulatory retention requirements. Data sovereignty review needed for EU sites.",
        integrationImpactLevel: "high", integrationImpactDetails: "Integrates with SAP ERP, SCADA/OPC-UA bridge, quality management system, corporate Historian (OSIsoft PI).",
        regulatoryImpactLevel: "medium", regulatoryImpactDetails: "ISO 9001 quality data retention. US site may be subject to FDA 21 CFR Part 11.",
        aiImpactLevel: "none",
        eaAssignee: "Robert Brown",
        eaSecurityRiskRating: "high", eaDataComplexityRating: "medium", eaIntegrationComplexityRating: "high",
        eaRegulatoryRiskRating: "medium", eaAiRiskRating: "none",
        eaOverallComplexity: "high", eaOverallRiskLevel: "high", eaReviewType: "deep_dive",
        eaRequiredArchitectureViews: '["Application Architecture","Security Architecture","Integration Architecture","Infrastructure Architecture","Data Architecture"]',
        eaRequiredSmes: '["OT/IT Security SME","SAP Integration Architect","Industrial Networking SME","Regulatory/GMP SME"]',
        eaArcSchedule: "2026-04-08 09:00:00",
        jiraInitiativeId: jiraMap["MES-001"] || null, jiraKey: "MES-001", phase: "ph1",
        createdAt: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: "E-Invoicing Regulatory Compliance Implementation",
        description: "Implement a statutory e-invoicing capability to comply with government-mandated electronic invoicing regulations across Australia (ATO Peppol network) and selected European jurisdictions (EN 16931 standard).",
        businessUnit: "Finance & Corporate Technology",
        submittedBy: "priya.nair@company.com",
        sponsorProductOwner: "Karen Lewis (CFO Office)",
        solutionArchitect: null,
        requestType: "new_capability", status: "submitted", priority: "high",
        businessContext: "ATO and several EU member states have issued mandates requiring businesses to exchange invoices electronically. Non-compliance will result in penalties and potential loss of government contracts.",
        businessValueHypothesis: '["Achieve full compliance with ATO e-invoicing mandate by January 2027","Reduce invoice processing cost per document by 30%","Enable Straight-Through Processing (STP) for 80% of supplier invoices"]',
        businessCapability: '["Finance & Accounts Payable","Accounts Receivable","Regulatory Compliance"]',
        businessCriticality: "business_critical", costEstimate: "$1.2M",
        inScopeRegions: '["ANZ","Europe"]',
        expectedUserBase: "80 finance staff, 1,200 suppliers", deploymentModel: "cloud_saas", targetGoLiveDate: "2026-12-31",
        securityImpactLevel: "medium", securityImpactDetails: "Financial transaction data transmitted over public Peppol network. TLS 1.3 and message-level encryption required.",
        dataImpactLevel: "high", dataImpactDetails: "Invoice data contains financial PII (ABN/VAT numbers, bank account details). GDPR Art. 17 conflicts with tax record retention obligations.",
        integrationImpactLevel: "medium", integrationImpactDetails: "Integrates with SAP S/4HANA (FI module), Peppol Access Point provider, EU national e-invoicing platforms.",
        regulatoryImpactLevel: "high", regulatoryImpactDetails: "ATO Peppol accreditation required. EU: EN 16931 standard. Australia: RCTI rules, GST compliance. Privacy Act 2025 applies.",
        aiImpactLevel: "none",
        jiraInitiativeId: jiraMap["EINV-001"] || null, jiraKey: "EINV-001", phase: "ph1",
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        title: "AI Personalisation Engine – Marketing Pilot",
        description: "Design and deploy a proof-of-concept AI/ML personalisation engine that generates customer-segment-specific content recommendations, dynamic discount offers, and campaign targeting signals across ANZ and UK digital channels.",
        businessUnit: "Digital Marketing & Customer Experience",
        submittedBy: "tom.reilly@company.com",
        sponsorProductOwner: "Fiona Blake (CMO)",
        solutionArchitect: "Aisha Rahman",
        requestType: "technology_selection", status: "ea_triage", priority: "medium",
        businessContext: "Our current marketing campaigns are segment-based with no real-time personalisation. This pilot will validate the business case for a full personalisation platform investment.",
        businessValueHypothesis: '["Improve digital campaign conversion rate by 25% vs control group","Reduce manual marketing segmentation effort by 60%","Produce a board-ready business case for full platform investment"]',
        businessCapability: '["Customer Marketing","AI/ML Enablement","Digital Personalisation"]',
        businessCriticality: "business_valuable", costEstimate: "$450K",
        inScopeRegions: '["ANZ","UK"]',
        expectedUserBase: "15 marketing analysts, 3 data scientists, 2M+ customer profiles", deploymentModel: "cloud_managed", targetGoLiveDate: "2026-08-31",
        securityImpactLevel: "medium", securityImpactDetails: "AI Act (EU) preliminary scoping required. Model outputs must not reveal protected characteristics.",
        dataImpactLevel: "high", dataImpactDetails: "Processes customer PII. GDPR/Privacy Act consent required for behavioural profiling. Data minimisation controls required.",
        integrationImpactLevel: "low", integrationImpactDetails: "Reads from CDP via batch API. Writes recommendation signals to CRM and email platform.",
        regulatoryImpactLevel: "medium", regulatoryImpactDetails: "GDPR Art. 22 – personalised offers require explainability and opt-out. Privacy Act 2025 (AU).",
        aiImpactLevel: "high", aiImpactDetails: "ML models trained on customer behavioural data. Bias and fairness testing mandatory. Model card and AI risk register entry required.",
        eaAssignee: "Jane Mitchell",
        eaSecurityRiskRating: "medium", eaDataComplexityRating: "high", eaIntegrationComplexityRating: "low",
        eaRegulatoryRiskRating: "medium", eaAiRiskRating: "high",
        eaOverallComplexity: "high", eaOverallRiskLevel: "high", eaReviewType: "deep_dive",
        eaRequiredArchitectureViews: '["Application Architecture","Data Architecture","AI/ML Architecture","Security Architecture"]',
        eaRequiredSmes: '["AI/ML Architect","Data Privacy SME","Security Architect","Customer Data Platform SME"]',
        jiraInitiativeId: jiraMap["AIM-001"] || null, jiraKey: "AIM-001", phase: "ph1",
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ];

    let requestsInserted = 0;
    for (const req of requests) {
      if (!existingTitles.has(req.title)) {
        await db.insert(architectureRequestsTable).values(req as any);
        requestsInserted++;
      }
    }
    results.architectureRequests = requestsInserted;

    // 4. Seed KPIs if empty
    const existingKpis = await db.select().from(kpiMetricsTable).limit(1);
    if (existingKpis.length === 0) {
      await db.insert(kpiMetricsTable).values(KPI_SEED);
      results.kpiMetrics = KPI_SEED.length;
    } else {
      results.kpiMetrics = 0;
    }

    res.json({ success: true, seeded: results, message: "Demo data seeded successfully." });
  } catch (err: any) {
    res.status(500).json({ error: "Seed failed", detail: err.message });
  }
});

export default router;
