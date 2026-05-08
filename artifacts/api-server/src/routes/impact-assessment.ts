import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

type ImpactLevel = "none" | "low" | "medium" | "high";

interface AreaAnswers {
  q1: string; q2: string; q3: string; q4: string; q5: string;
  q6?: string; q7?: string; q8?: string;
  remarks: string;
}

interface ContextAnswers {
  q1: string; q2: string; q3: string; q4: string;
}

interface OperationalAnswer {
  value: "Yes" | "No" | "";
  details: string;
}

interface OperationalReadinessAnswers {
  q1: OperationalAnswer;
  q2: OperationalAnswer;
  q3: OperationalAnswer;
  q4: OperationalAnswer;
}

interface ImpactAnswers {
  security: AreaAnswers;
  data: AreaAnswers;
  integration: AreaAnswers;
  regulatory: AreaAnswers;
  ai: AreaAnswers;
}

interface AnalysisResult {
  securityImpactLevel: ImpactLevel;
  securityImpactDetails: string;
  dataImpactLevel: ImpactLevel;
  dataImpactDetails: string;
  integrationImpactLevel: ImpactLevel;
  integrationImpactDetails: string;
  regulatoryImpactLevel: ImpactLevel;
  regulatoryImpactDetails: string;
  aiImpactLevel: ImpactLevel;
  aiImpactDetails: string;
  operationalImpactLevel: ImpactLevel;
  operationalImpactDetails: string;
}

const SYSTEM_PROMPT = `You are an Enterprise Architecture analyst helping to assess architecture review requests for a large enterprise.

Given answers to scoping questions for a technology initiative, you must assess the impact level for each of six categories and provide a concise rationale for each.

SOLUTION CONTEXT (Q1–Q4) — not scored, used to calibrate scoring accuracy:
The initiative stage, solution type, user type, and user count inform risk calibration. A custom-build at scale for external users warrants higher scrutiny than a small internal SaaS pilot.

Impact Level Definitions:

- SECURITY (Q5–Q9: sign-in method, network exposure, privileged access, secrets management, third-party dependencies):
  none = existing corporate SSO only, fully internal network, no elevated access, approved secrets platform, no supply-chain risk;
  low = minor auth change within existing patterns, VPN/allowlist-only external access, limited admin elevation with approved controls, config-level secrets (low risk), standard commercial software only;
  medium = new/separate auth mechanism OR third-party IdP OR partial internet-facing exposure OR no centralised secrets management (config/env vars) OR open-source components in supply chain;
  high = fully public-facing internet access OR mixed/unmanaged authentication OR unmanaged privileged access (no PAM) OR hardcoded/manually distributed credentials OR significant third-party dependency with no supply-chain risk assessment

- DATA (Q10–Q16: data classification, sensitive/regulated personal data, master data, lineage, residency, retention, external sharing):
  none = public or internal-only data, no personal data, no master data, no lineage needed, no residency constraints, <1yr retention, no external sharing;
  low = internal non-sensitive data, basic contact data only, reads master data, informal lineage, no residency constraint, 1–5yr standard retention, sharing with internal subsidiaries;
  medium = confidential internal data OR anonymised/aggregated data OR automated lineage within system OR soft residency preference OR 5–10yr extended retention OR sharing with external partners under formal agreement;
  high = regulated/PII/health/financial/credential data OR formal privacy controls required (GDPR, Privacy Act, HIPAA) OR master data write authority OR end-to-end cross-system lineage required OR strict data sovereignty mandate OR long-term/permanent archival OR government/regulator data access

- INTEGRATION (Q17–Q20: number of integrations, integration style, legacy/OT involvement, API exposure):
  none = fully standalone, no connections;
  low = 1–2 internal systems only, batch/file transfer, no legacy or OT, internal-only APIs consumed by known teams;
  medium = 3+ internal systems or one external, API/event-driven integration, minor legacy or on-premises components, APIs registered internally with the organisation;
  high = multiple external systems (partners/government/cloud platforms) OR continuous high-volume event streaming OR significant legacy/on-premises involvement OR direct OT/industrial control system integration OR external-facing or public-facing APIs

- REGULATORY (Q21–Q25: applicable regulation category, jurisdictions, cross-border data transfers, non-compliance consequences, new audit obligations):
  none = no external obligations, single jurisdiction, no cross-border transfers, negligible consequences, no new audit/certification obligations;
  low = internal policies only, single country, multi-region within same country, adequacy-covered cross-border transfers, moderate internal consequences only, no new external obligations;
  medium = industry standards/certifications (ISO, SOC 2, food safety) OR multiple jurisdictions with comparable requirements OR SCC/BCR-covered cross-border transfers OR moderate external consequences (reputational/contractual) OR minor new external reporting or audit obligations;
  high = government legislation (Privacy Act, GDPR, HIPAA, FDA, financial regulations) OR multiple jurisdictions with conflicting requirements OR cross-border transfers with no established legal mechanism OR regulatory fines/penalties/loss of certification/legal action OR formal regulatory approval or licence required before go-live

- AI (Q26–Q33: AI inclusion, sourcing, training/inference data, decision automation, impact of errors, human oversight, explainability, monitoring):
  none = no AI/ML involved;
  low = minor vendor off-the-shelf AI feature only, public/synthetic data only, all outputs reviewed by humans, minimal consequence if wrong, full explainability, formal monitoring in place;
  medium = AI is a significant component using anonymised or internal business data, partial human oversight on significant decisions, partial explainability or monitoring;
  high = AI is primary function OR custom-built or open-source model OR customer PII or identifiable data used for training/inference OR automated decisions with limited or no human review OR significant financial/safety/regulatory harm if AI errors OR black-box with no explainability OR no model monitoring or maintenance plan

- OPERATIONAL READINESS (Q34–Q37: logging/monitoring/audit strategy, transaction volumes assessed, availability/DR RTO/RPO defined, support ownership established):
  none = all four answered "Yes" with documented specifics (tool names, RTO/RPO values, owner names);
  low = mostly "Yes" with supporting detail, minor gaps in one area;
  medium = some "No" answers OR "Yes" answers without supporting detail provided;
  high = most or all answered "No" OR no operational readiness defined at all

Use ALL answers and the solution context to derive the most accurate level. When answers conflict, weight the highest-risk answer.

You MUST respond with valid JSON only — no markdown, no explanation outside the JSON. Use this exact structure:
{
  "securityImpactLevel": "none|low|medium|high",
  "securityImpactDetails": "2-3 sentence rationale referencing specific answers",
  "dataImpactLevel": "none|low|medium|high",
  "dataImpactDetails": "2-3 sentence rationale referencing specific answers",
  "integrationImpactLevel": "none|low|medium|high",
  "integrationImpactDetails": "2-3 sentence rationale referencing specific answers",
  "regulatoryImpactLevel": "none|low|medium|high",
  "regulatoryImpactDetails": "2-3 sentence rationale referencing specific answers",
  "aiImpactLevel": "none|low|medium|high",
  "aiImpactDetails": "2-3 sentence rationale referencing specific answers",
  "operationalImpactLevel": "none|low|medium|high",
  "operationalImpactDetails": "2-3 sentence rationale referencing specific answers"
}`;

// Q5–Q9
const SECURITY_QUESTIONS = [
  "How will users authenticate to sign in to this system?",
  "What is the expected network exposure of this system?",
  "Does this system require privileged or elevated access beyond standard user permissions?",
  "How will secrets, credentials, and API keys be managed for this system?",
  "Does this system rely on third-party software packages, open-source components, or vendor-managed services?",
];

// Q10–Q16
const DATA_QUESTIONS = [
  "What is the highest classification of data this system will store or process?",
  "Does the system store or process sensitive or regulated personal data?",
  "Does this system depend on or contribute to master data domains (e.g. customer, product, supplier, employee)?",
  "Is data lineage tracking required — i.e. tracing where data originated, how it was transformed, and where it flows?",
  "Are there data residency or data sovereignty constraints on where data can be stored or processed?",
  "What is the expected data retention period for this system?",
  "Will data be shared with or accessible by parties outside the organisation?",
];

// Q17–Q20
const INTEGRATION_QUESTIONS = [
  "How many systems will this solution integrate with, and are any of them outside the organisation?",
  "What integration style best describes the data flows for this solution?",
  "Does this solution need to connect to legacy systems, on-premises infrastructure, or operational technology (OT)?",
  "Does this solution expose APIs that will be consumed by other teams or external parties?",
];

// Q21–Q25
const REGULATORY_QUESTIONS = [
  "Which category of regulation most closely applies to this initiative?",
  "In how many jurisdictions will this system operate or process data?",
  "Does this system involve cross-border transfers of personal data?",
  "What would be the consequence if this system were found to be non-compliant?",
  "Does this initiative introduce new audit controls, certifications, or regulatory reporting obligations?",
];

// Q26–Q33
const AI_QUESTIONS = [
  "Will this system incorporate artificial intelligence or machine learning?",
  "How will the AI capability be sourced or developed?",
  "What data will the AI use for training or inference?",
  "Will AI-generated outputs directly trigger automated decisions or actions without human review?",
  "How serious would the impact be if the AI produced an incorrect or biased output?",
  "Will humans be able to review, override, or contest AI-generated outputs?",
  "Is the AI model's decision-making process explainable and auditable?",
  "Is there a plan for monitoring model performance, detecting drift, and managing retraining?",
];

// Q34–Q37
const OPERATIONAL_QUESTIONS = [
  "Has a logging, monitoring, and audit strategy been defined for this system?",
  "Have expected transaction volumes and peak load scenarios been assessed?",
  "Have availability requirements and DR targets (RTO/RPO) been defined?",
  "Has a support ownership model and escalation path been established?",
];

// Q1–Q4
const CONTEXT_QUESTIONS = [
  "What stage is this initiative currently at?",
  "What type of solution is being delivered?",
  "Who are the primary users of this system?",
  "Approximately how many users are expected?",
];

function buildSection(label: string, questions: string[], answers: AreaAnswers): string {
  const allKeys: (keyof AreaAnswers)[] = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"];
  const qKeys = allKeys.slice(0, questions.length);
  const lines = [`${label} QUESTIONS:`];
  qKeys.forEach((k, i) => {
    lines.push(`Q${i + 1}: ${questions[i]}`);
    lines.push(`A: ${answers[k] || "Not answered"}`);
    lines.push("");
  });
  if (answers.remarks?.trim()) {
    lines.push(`Additional remarks: ${answers.remarks}`);
    lines.push("");
  }
  return lines.join("\n");
}

function buildContextSection(answers: ContextAnswers): string {
  const lines = ["SOLUTION CONTEXT (Q1–Q4):"];
  const keys: (keyof ContextAnswers)[] = ["q1", "q2", "q3", "q4"];
  keys.forEach((k, i) => {
    lines.push(`Q${i + 1}: ${CONTEXT_QUESTIONS[i]}`);
    lines.push(`A: ${answers[k] || "Not provided"}`);
    lines.push("");
  });
  return lines.join("\n");
}

function buildOperationalSection(answers: OperationalReadinessAnswers): string {
  const lines = ["OPERATIONAL READINESS (Q34–Q37):"];
  const keys: (keyof OperationalReadinessAnswers)[] = ["q1", "q2", "q3", "q4"];
  keys.forEach((k, i) => {
    const ans = answers[k];
    lines.push(`Q${i + 1}: ${OPERATIONAL_QUESTIONS[i]}`);
    if (ans.value === "Yes" && ans.details.trim()) {
      lines.push(`A: Yes — ${ans.details.trim()}`);
    } else {
      lines.push(`A: ${ans.value || "Not answered"}`);
    }
    lines.push("");
  });
  return lines.join("\n");
}

router.post("/impact-assessment/analyze", async (req, res) => {
  try {
    const { requestTitle, requestDescription, answers, contextAnswers, operationalAnswers } = req.body as {
      requestTitle: string;
      requestDescription: string;
      answers: ImpactAnswers;
      contextAnswers?: ContextAnswers;
      operationalAnswers?: OperationalReadinessAnswers;
    };

    if (!answers) {
      return res.status(400).json({ error: "answers is required" });
    }

    const sections: string[] = [
      `Initiative: ${requestTitle || "Unnamed initiative"}`,
      `Description: ${requestDescription || "No description provided"}`,
      "",
    ];

    if (contextAnswers) {
      sections.push(buildContextSection(contextAnswers));
    }

    sections.push(
      buildSection("SECURITY", SECURITY_QUESTIONS, answers.security),
      buildSection("DATA", DATA_QUESTIONS, answers.data),
      buildSection("INTEGRATION", INTEGRATION_QUESTIONS, answers.integration),
      buildSection("REGULATORY", REGULATORY_QUESTIONS, answers.regulatory),
      buildSection("AI/ML", AI_QUESTIONS, answers.ai),
    );

    if (operationalAnswers) {
      sections.push(buildOperationalSection(operationalAnswers));
    }

    const userPrompt = sections.join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 2000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ]
    });

    const raw = response.choices[0]?.message?.content ?? "{}";

    let result: AnalysisResult;
    try {
      result = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON", raw });
    }

    const validLevels: ImpactLevel[] = ["none", "low", "medium", "high"];
    const safe = (v: unknown): ImpactLevel =>
      validLevels.includes(v as ImpactLevel) ? (v as ImpactLevel) : "none";

    return res.json({
      securityImpactLevel: safe(result.securityImpactLevel),
      securityImpactDetails: result.securityImpactDetails || "",
      dataImpactLevel: safe(result.dataImpactLevel),
      dataImpactDetails: result.dataImpactDetails || "",
      integrationImpactLevel: safe(result.integrationImpactLevel),
      integrationImpactDetails: result.integrationImpactDetails || "",
      regulatoryImpactLevel: safe(result.regulatoryImpactLevel),
      regulatoryImpactDetails: result.regulatoryImpactDetails || "",
      aiImpactLevel: safe(result.aiImpactLevel),
      aiImpactDetails: result.aiImpactDetails || "",
      operationalImpactLevel: safe(result.operationalImpactLevel),
      operationalImpactDetails: result.operationalImpactDetails || "",
    } as AnalysisResult);
  } catch (err) {
    console.error("Impact assessment error:", err);
    return res.status(500).json({ error: "Failed to analyse impact" });
  }
});

export default router;
