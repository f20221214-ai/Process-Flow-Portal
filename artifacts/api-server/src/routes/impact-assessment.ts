import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

type ImpactLevel = "none" | "low" | "medium" | "high";

interface AreaAnswers {
  q1: string; q2: string; q3: string; q4: string; q5: string;
  q6?: string; q7?: string; q8?: string; q9?: string; q10?: string;
  remarks: string;
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
}

const SYSTEM_PROMPT = `You are an Enterprise Architecture analyst helping to assess architecture review requests for a large enterprise.

Given answers to scoping questions for a technology initiative, you must assess the impact level for each of five categories and provide a concise rationale for each.

Impact Level Definitions:
- SECURITY: none=internal only, standard corporate login, no sensitive data, internal network, standard TLS, no privileged access, existing monitoring, no third-party risk, secrets managed, no formal security test needed; low=limited partner access, general internal data, standard controls, managed TLS, minor admin elevation, basic logging; medium=new auth methods OR sensitive internal data (employee records, confidential) OR partial internet exposure OR no encryption at rest OR privileged access without PAM OR SIEM integration needed OR open-source/third-party supply chain risk OR secrets in config without rotation OR SAST only; high=internet-accessible OR PII/payment/health/credentials OR external network connections OR no encryption at rest for sensitive data OR unmanaged privileged access OR no security monitoring OR significant unassessed supply chain risk OR hardcoded/unmanaged secrets OR independent penetration test required
- DATA: none=publicly available info only; low=everyday non-sensitive internal data, short retention; medium=cross-department data, moderate volume/retention, or third-party sharing under agreement; high=PII/financial/health records OR data residency requirements OR sharing with government/public entities
- INTEGRATION: none=no connections to other systems; low=1–2 internal systems, standard approved methods; medium=several systems or real-time feeds or minor legacy involvement; high=external party connections (suppliers/customers/government) OR new integration methods OR critical business-stopping failure risk OR significant legacy complexity
- REGULATORY: none=no compliance obligations; low=internal policies only; medium=external audits, financial reporting, certifications, multiple countries with similar rules; high=government legislation (privacy laws, food safety, financial regulations) with legal/financial consequences OR multiple jurisdictions with differing requirements OR no existing compliance capability
- AI: none=no AI/ML; low=vendor off-the-shelf feature only, human always reviews all outputs, public/synthetic data only, minimal consequence if wrong, full explainability, formal monitoring in place, no AI-specific regulations; medium=AI informing operations with some oversight, uses anonymised or internal data, partial explainability or monitoring; high=custom-built or open-source model OR customer PII or identifiable data used for training/inference OR AI outputs trigger automated decisions with limited/no human review OR severe consequence if AI errors OR black-box with no explainability OR no monitoring or model governance plan OR specific AI legislation applies (e.g. EU AI Act, algorithmic accountability laws) OR any combination of custom/open-source model + no monitoring plan + PII training data or applicable AI legislation

Use ALL answers and additional remarks to derive the most accurate level. When answers conflict, weight the highest-risk answer.

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
  "aiImpactDetails": "2-3 sentence rationale referencing specific answers"
}`;

const SECURITY_QUESTIONS = [
  "Who will access this system, and by what means?",
  "Will the system store, transmit, or process sensitive, personal, or regulated data?",
  "Does the solution introduce new authentication mechanisms, identity providers, or connections to external networks or third-party systems?",
  "What is the expected network exposure of this system?",
  "How will data be protected at rest and in transit?",
  "Does this system require privileged or elevated access beyond standard user permissions?",
  "What is the approach to security monitoring, event logging, and alerting for this system?",
  "Does this system rely on third-party software packages, open-source components, or vendor-managed services?",
  "How are secrets, credentials, and cryptographic keys managed for this system?",
  "What is the planned security testing and review posture for this system before go-live?"
];

const DATA_QUESTIONS = [
  "What type of data will this system store or process?",
  "Will it handle personal information (PII), financial records, or data with residency requirements?",
  "Will data be shared or analysed across multiple departments?",
  "What is the expected data volume and how long must it be retained?",
  "Will data be shared with or accessible by third parties (vendors, partners, government)?"
];

const INTEGRATION_QUESTIONS = [
  "How many systems will this connect to, and are any external to the company?",
  "How will data move between systems?",
  "Does this introduce new or non-standard integration methods?",
  "What happens to the business if an integration connection fails?",
  "Do any of the systems being integrated involve older or legacy technology?"
];

const REGULATORY_QUESTIONS = [
  "Which laws, regulations, or standards must this system comply with?",
  "Will this affect financial reporting, audits, or require certifications?",
  "What would happen if the system were non-compliant?",
  "Does this initiative operate across multiple countries with different regulatory requirements?",
  "How established is the organisation's current compliance capability in this area?"
];

const AI_QUESTIONS = [
  "Will this system incorporate artificial intelligence or machine learning functionality?",
  "How is the AI capability being sourced or developed?",
  "What data will the AI use for training or inference, and does it include personal or sensitive company data?",
  "Will AI-generated outputs directly trigger automated actions or decisions without human review?",
  "How serious would the consequences be if the AI produced an incorrect or biased output?",
  "Is the AI system's decision-making process explainable and subject to audit?",
  "Is there a plan for monitoring model performance, detecting drift, and managing retraining or updates?",
  "Are there specific AI-related regulations or policies that apply to this use case?"
];

function buildSection(label: string, questions: string[], answers: AreaAnswers): string {
  const allKeys: (keyof AreaAnswers)[] = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"];
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

router.post("/impact-assessment/analyze", async (req, res) => {
  try {
    const { requestTitle, requestDescription, answers } = req.body as {
      requestTitle: string;
      requestDescription: string;
      answers: ImpactAnswers;
    };

    if (!answers) {
      return res.status(400).json({ error: "answers is required" });
    }

    const userPrompt = [
      `Initiative: ${requestTitle || "Unnamed initiative"}`,
      `Description: ${requestDescription || "No description provided"}`,
      "",
      buildSection("SECURITY", SECURITY_QUESTIONS, answers.security),
      buildSection("DATA", DATA_QUESTIONS, answers.data),
      buildSection("INTEGRATION", INTEGRATION_QUESTIONS, answers.integration),
      buildSection("REGULATORY", REGULATORY_QUESTIONS, answers.regulatory),
      buildSection("AI/ML", AI_QUESTIONS, answers.ai),
    ].join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1500,
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
      aiImpactDetails: result.aiImpactDetails || ""
    } as AnalysisResult);
  } catch (err) {
    console.error("Impact assessment error:", err);
    return res.status(500).json({ error: "Failed to analyse impact" });
  }
});

export default router;
