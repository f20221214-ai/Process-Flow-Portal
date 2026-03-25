import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { kpiMetricsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const KPI_SEED = [
  // ── Outcome 1 ──────────────────────────────────────────────────────────────
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Standardization & Pattern Adoption", kpiName: "Reference Architecture Adoption Rate", whatToMeasure: "% of solutions using approved reference architectures", howToMeasure: "Solutions aligned with approved patterns / Total solutions reviewed" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Standardization & Pattern Adoption", kpiName: "Architecture Exception Rate", whatToMeasure: "Architecture Exception Rate", howToMeasure: "# of approved deviations / Total solutions reviewed" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Risk & Security Exposure Reduction", kpiName: "Security Findings Reduction", whatToMeasure: "Security Findings Reduction", howToMeasure: "Security Assessment results (Cyber Risk Team)" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Risk & Security Exposure Reduction", kpiName: "Compliance Audit Findings Reduction", whatToMeasure: "Compliance Audit Findings Reduction", howToMeasure: "Audit reports (Internal Audit Team)" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Delivery Efficiency & Cost Avoidance", kpiName: "Delivery Cycle Time Improvement", whatToMeasure: "Delivery Cycle time improvement", howToMeasure: "Delivery time for projects using standard patterns vs without approved patterns (Delivery Teams)" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Delivery Efficiency & Cost Avoidance", kpiName: "Post-Go-Live Change Volume", whatToMeasure: "Post-Go-Live Change Volume", howToMeasure: "No. of change requests and incidents recorded" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Delivery Efficiency & Cost Avoidance", kpiName: "Technology Sprawl Reduction", whatToMeasure: "Technology Sprawl Reduction", howToMeasure: "# of technologies reduced or consolidated" },

  // ── Outcome 2 ──────────────────────────────────────────────────────────────
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Architectural Knowledge Capture", kpiName: "ADR Coverage", whatToMeasure: "Architecture Decision Records (ADR) coverage", howToMeasure: "% of significant architectural decisions captured as ADRs" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Architectural Knowledge Capture", kpiName: "Architecture Drift Detection", whatToMeasure: "Architecture Drift Detection", howToMeasure: "# of undocumented architecture changes discovered post-implementation" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Decision Traceability & Speed", kpiName: "Decision Reuse Rate", whatToMeasure: "Decision Reuse Rate", howToMeasure: "% of architecture reviews referencing existing ADRs" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Decision Traceability & Speed", kpiName: "Fast-Track Approval Rate", whatToMeasure: "Fast-Track Approval Rate", howToMeasure: "% of solutions approved with light or no review due to existing pattern" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Decision Traceability & Speed", kpiName: "Re-decision Avoidance", whatToMeasure: "Re-decision Avoidance", howToMeasure: "# of decisions not re-litigated because rationale is already documented" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Organizational Dependency Risk", kpiName: "Onboarding Time for New Architects", whatToMeasure: "Onboarding Time for New Architects", howToMeasure: "Time (Days or # of sessions) for new architect to confidently review existing solution" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Organizational Dependency Risk", kpiName: "Architecture Question Recurrence", whatToMeasure: "Architecture Question Recurrence", howToMeasure: "Frequency of repeated questions about the same architectural decisions" },

  // ── Outcome 3 ──────────────────────────────────────────────────────────────
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Delivery Flexibility", kpiName: "Exception Approval Lead Time", whatToMeasure: "Exception Approval Lead Time", howToMeasure: "Average time to approve or reject architecture exception" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Delivery Flexibility", kpiName: "Lightweight Review Approval Rate", whatToMeasure: "Fast-Track Approval Rate", howToMeasure: "% of initiatives approved via lightweight review" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Delivery Flexibility", kpiName: "Delivery Block Rate", whatToMeasure: "Delivery Block Rate", howToMeasure: "% of initiatives delayed due to architecture indecision" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Deviation Visibility", kpiName: "Exception Registration Coverage", whatToMeasure: "Exception Registration Coverage", howToMeasure: "% of architecture deviations formally logged" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Deviation Visibility", kpiName: "Exception Traceability Completeness", whatToMeasure: "Exception Traceability Completeness", howToMeasure: "% of exceptions with complete metadata (Rationale, Owner, Remediation Plan)" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Deviation Ownership & Governance", kpiName: "Exception Ownership Assignment Rate", whatToMeasure: "Exception Ownership Assignment Rate", howToMeasure: "% of deviations with named business or technical owner" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Deviation Ownership & Governance", kpiName: "Remediation Compliance Rate", whatToMeasure: "Remediation Compliance Rate", howToMeasure: "% of deviations retired or remediated within agreed timeframe" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Technical Debt Containment", kpiName: "Technical Debt Growth Rate", whatToMeasure: "Technical Debt Growth Rate", howToMeasure: "New deviations created vs resolved deviations" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Technical Debt Containment", kpiName: "Incident Cost Impact from Deviations", whatToMeasure: "Incident or Cost Impact Linked to Deviations", howToMeasure: "% incidents traced to known architecture deviations" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Technical Debt Containment", kpiName: "Debt Remediation Completion Rate", whatToMeasure: "Debt Remediation Completion Rate", howToMeasure: "% of planned architecture remediation actions completed" },

  // ── Outcome 4 ──────────────────────────────────────────────────────────────
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Explicit Risk Ownership", kpiName: "Risk Ownership Assignment Rate", whatToMeasure: "Risk Ownership Assignment Rate", howToMeasure: "% of identified architecture risks with formally assigned owner" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Explicit Risk Ownership", kpiName: "Risk Acceptance Documentation Coverage", whatToMeasure: "Risk Acceptance Documentation Coverage", howToMeasure: "% of accepted risks with documented rationale and approval" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Risk Visibility", kpiName: "Risk Register Capture Rate", whatToMeasure: "Risk Register Capture Rate", howToMeasure: "% of architecture risks logged in central risk register" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Risk Visibility", kpiName: "Unregistered Risk Discovery Rate", whatToMeasure: "Unregistered Risk Discovery Rate", howToMeasure: "# risks discovered post-deployment that were never recorded" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Risk Visibility", kpiName: "Risk Identification Effectiveness", whatToMeasure: "Architecture Review Risk Identification Effectiveness", howToMeasure: "Average number of risks identified during design vs discovered later" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Active Risk Governance", kpiName: "Risk Mitigation Progress Rate", whatToMeasure: "Risk Mitigation Progress Rate", howToMeasure: "% of risks with active mitigation plans tracked" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Active Risk Governance", kpiName: "Expired Risk Acceptance Detection", whatToMeasure: "Expired Risk Acceptance Detection", howToMeasure: "# risks exceeding review or acceptance expiry" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Incident & Audit Prevention", kpiName: "Audit Finding Traceability", whatToMeasure: "Audit Finding Traceability", howToMeasure: "% audit findings caused by unacknowledged architecture risk" },

  // ── Outcome 5 ──────────────────────────────────────────────────────────────
  { outcomeNumber: 5, outcomeName: "Ensure high-impact architectural decisions are taken at the right level with full transparency of trade-offs and consequences.", kpiCategory: "Decision Governance", kpiName: "Decision Classification Coverage", whatToMeasure: "% of architecture submissions that include decision impact classification", howToMeasure: "ARR submissions with impact classification / Total ARR submissions" },
  { outcomeNumber: 5, outcomeName: "Ensure high-impact architectural decisions are taken at the right level with full transparency of trade-offs and consequences.", kpiCategory: "Decision Governance", kpiName: "Post-Implementation Escalation Rate", whatToMeasure: "Post-Implementation Escalation Rate", howToMeasure: "% of incidents or audit findings caused by decisions NOT reviewed by architecture governance" },
  { outcomeNumber: 5, outcomeName: "Ensure high-impact architectural decisions are taken at the right level with full transparency of trade-offs and consequences.", kpiCategory: "Decision Governance", kpiName: "Re-Architecture Rate", whatToMeasure: "Re-Architecture Rate", howToMeasure: "Number of major rework efforts due to poor early design decisions" },
];

async function seedKpis() {
  const existing = await db.select().from(kpiMetricsTable).limit(1);
  if (existing.length > 0) return;
  await db.insert(kpiMetricsTable).values(KPI_SEED.map(k => ({ ...k, status: "not_started" })));
}

router.get("/kpis", async (req, res) => {
  try {
    await seedKpis();
    const kpis = await db.select().from(kpiMetricsTable).orderBy(kpiMetricsTable.outcomeNumber, kpiMetricsTable.id);
    res.json(kpis);
  } catch (err) {
    req.log.error({ err }, "Failed to list KPIs");
    res.status(500).json({ error: "Failed to list KPIs" });
  }
});

router.patch("/kpis/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    for (const field of ["currentValue", "targetValue", "unit", "status", "notes", "updatedBy"]) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    const [updated] = await db.update(kpiMetricsTable).set(updateData).where(eq(kpiMetricsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "KPI not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update KPI");
    res.status(500).json({ error: "Failed to update KPI" });
  }
});

export default router;
