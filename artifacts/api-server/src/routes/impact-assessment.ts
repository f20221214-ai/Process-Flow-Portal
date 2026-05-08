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
The initiative stage, solution type, user type, and user count inform risk calibration. A custom build ("Build custom") at scale for external users ("Customers/public users", ">100") warrants higher scrutiny than a small internal SaaS pilot ("Buy SaaS/PaaS", "<10", "Internal employees only").

Impact Level Definitions:

- SECURITY (Q5–Q9: sign-in, network exposure, privileged access, secrets management, third-party dependencies):
  none = "Existing corporate SSO (Entra ID)", "Internal only", "No" privileged access, "No secrets required", "No" third-party dependencies;
  low = "SSO + MFA enforced", "Private access for externals (ZTNA/VPN)", "Limited admins with existing controls", "Enterprise secret manager (e.g., Key Vault)", "Approved vendor/SaaS";
  medium = "New identity provider/SSO integration", "Internet-facing components", "Privileged access via PAM tooling", "App config/env vars without central manager", "Open-source/third-party packages";
  high = "Local accounts / custom auth", "Fully public internet-facing", "Privileged access without PAM controls", "Hardcoded/manual credentials", "Significant dependencies without supply-chain assessment"

- DATA (Q10–Q16: data classification, sensitive/regulated data, master data, lineage, residency, retention, external sharing):
  none = "Public" or "Internal" classification, "No" sensitive data, no master data dependency, "No" lineage required, "No" residency requirement, "< 1 year" retention, "No" external sharing;
  low = "Internal" classification, "Internal business data only", reads master data only ("Reads from master data but does not update or contribute to it"), "Documented manually", "Preference only" residency, "1–5 years" retention, "Internal only" sharing;
  medium = "Confidential" classification, "Confidential internal data", "Both reads and writes to one or more master data domains", "Automated lineage within this solution", "Contractual/regulatory requirement" residency, "5+ years" retention, "Trusted partners under agreement";
  high = "Regulated/Highly sensitive" classification, "Regulated/highly sensitive data", golden-record platform ("This solution is itself a master data management or golden-record platform"), "Cross-system lineage required", "Strict mandate with enforcement" residency, "Regulatory/long-term retention", "Regulators/public entities"

- INTEGRATION (Q17–Q20: number of integrations, integration style, legacy/OT, API exposure):
  none = "None" integrations, "No integration" style, "No" legacy/OT, "No" APIs exposed;
  low = "1–2 internal systems", "Batch/file transfer", "No" legacy/OT, "Internal only (informal)" APIs;
  medium = "3+ internal systems", "API / near real-time", "Minor legacy involvement", "Formal APIs with versioning/deprecation";
  high = "Includes external parties", "Event streaming / high frequency", "Significant legacy/on-prem complexity" or "Direct OT/ICS integration", "APIs for partners/public via API management"

- REGULATORY (Q21–Q25: applicable regulations, jurisdictions, cross-border transfers, non-compliance consequences, audit controls):
  none = "No" regulations, "Single country", "No" cross-border transfers, "Low" non-compliance consequence, "No" audit controls required;
  low = "Internal policy only", "Multiple regions in one country", "Yes (adequacy decision)", "Moderate" consequence, "Some controls needed";
  medium = "Industry standards/certifications", "Multiple countries (similar rules)", "Yes (SCC/BCR or approved mechanism)", "High (fines/penalties)", "Full audit trail required";
  high = "Government legislation/regulation", "Multiple countries (conflicting rules)", "Transfer mechanism unclear", "Severe (unable to operate/legal action)", "Regulatory approval/license required before go-live"

- AI (Q26–Q33: AI inclusion [4 options: No/Embedded vendor feature/Custom model or fine-tuning/AI is a core function], sourcing, inference data, decision automation, impact of errors, human oversight, explainability, monitoring):
  none = "No" AI included (Q26);
  low = "Embedded vendor feature", "Vendor managed (SaaS/API)" sourcing, "Public/synthetic only" data, "Informational only" decisions, "Low (easy to correct)" impact, "Yes for all high-impact decisions" oversight, "Fully explainable + auditable", "Formal MLOps (drift detection, retraining, approvals)" monitoring;
  medium = "Custom model or fine-tuning" OR "Anonymized/aggregated internal data" OR "Identifiable internal business data" OR "Decision support (human reviews)" OR "Medium (rework / inconvenience)" OR "Yes for exceptions only" oversight OR "Partially explainable" OR "Basic monitoring";
  high = "AI is a core function" OR "Open-source model deployed internally" OR "Custom-built/trained internally" OR "Hybrid" sourcing OR "Customer personal data/PII" OR "Automated actions with limited oversight" OR "High (financial/regulatory/safety/reputation)" OR "No (fully automated)" oversight OR "Not explainable (black box)" OR "No monitoring plan"

- OPERATIONAL READINESS (Q34–Q37: logging/monitoring/audit, transaction volumes, availability/DR RTO/RPO, support ownership):
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
  "How will users sign in?",
  "What is the expected network exposure?",
  "Is privileged/admin access required?",
  "How will access keys/secrets be managed?",
  "Does the solution depend on third-party software/services or open-source packages?",
];

// Q10–Q16
const DATA_QUESTIONS = [
  "What is the highest data classification involved?",
  "Will the solution handle sensitive or regulated data (e.g., personal data, credentials, payment data)?",
  "Does this solution depend on or contribute to master data domains (e.g. customer, product, employee, or supplier records)?",
  "Is end-to-end data lineage required (source → transformation → consumers)?",
  "Are there data residency/sovereignty requirements?",
  "What are retention and deletion expectations?",
  "Will data be shared outside the organization?",
];

// Q17–Q20
const INTEGRATION_QUESTIONS = [
  "How many systems will this solution integrate with?",
  "What integration style is required?",
  "Are any integrations with legacy systems, OT/plant equipment, or industrial control systems required?",
  "Will any APIs be exposed for other teams/partners to consume?",
];

// Q21–Q25
const REGULATORY_QUESTIONS = [
  "Are there external regulations or certifications applicable (privacy, food safety, SOX, etc.)?",
  "Does this initiative span multiple countries/jurisdictions?",
  "Will personal data be transferred across borders?",
  "What is the consequence if the solution is non-compliant?",
  "Does the solution require auditable controls (logs, approvals, evidence) for audits?",
];

// Q26–Q33
const AI_QUESTIONS = [
  "Does the solution include AI/ML or Generative AI?",
  "How is the AI capability sourced?",
  "What data will the AI use for inference (and training/fine-tuning if applicable)?",
  "Will AI outputs be used to make or trigger decisions/actions?",
  "What is the impact if the AI output is wrong, biased, or unsafe?",
  "Is there human oversight (human-in-the-loop) and an override path?",
  "Can the AI output be explained and audited (inputs, prompts, model/version, rationale)?",
  "Is there a plan to monitor model quality and drift in production?",
];

// Q34–Q37
const OPERATIONAL_QUESTIONS = [
  "Are logging, monitoring and audit capabilities defined?",
  "Are expected transaction volumes, throughput, and latency requirements documented?",
  "Are Availability and DR (RTO/RPO) metrics been defined?",
  "Have support and operational ownership models been defined?",
];

// Q1–Q4
const CONTEXT_QUESTIONS = [
  "What is the initiative stage?",
  "What is the solution type?",
  "Who are the users of the solution?",
  "How many users are expected?",
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
