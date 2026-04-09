import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

type ImpactLevel = "none" | "low" | "medium" | "high";

interface ImpactAnswers {
  security: { q1: string; q2: string; q3: string };
  data: { q1: string; q2: string; q3: string };
  integration: { q1: string; q2: string; q3: string };
  regulatory: { q1: string; q2: string; q3: string };
  ai: { q1: string; q2: string; q3: string };
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

Given answers to scoping questions for a technology initiative, you must assess the impact level for each of five categories and provide a brief rationale for each.

Impact Level Definitions:
- SECURITY: none=internal only, standard login, no sensitive data; low=internal, some partner access, standard controls; medium=new auth methods or sensitive internal data (employee records, confidential business data); high=internet-accessible OR handles PII/passwords/payment/health data OR connects to external networks
- DATA: none=publicly available info only; low=everyday non-sensitive internal data; medium=cross-department business data or new analytics; high=PII/financial records/data with residency requirements
- INTEGRATION: none=no connections to other systems; low=1-2 existing internal systems, standard methods; medium=several systems or real-time feeds; high=external party connections (suppliers/customers/government) or new integration methods
- REGULATORY: none=no compliance obligations; low=internal policies only; medium=external audits, financial reporting, certifications; high=legal obligations (privacy laws, food safety, financial regulations) with legal consequences for non-compliance
- AI: none=no AI/ML; low=vendor built-in AI feature, human always reviews; medium=AI for routing/recommendations influencing operations; high=AI making/influencing high-consequence decisions (financial approvals, medical, legal, regulated)

You MUST respond with valid JSON only — no markdown, no explanation outside the JSON. Use this exact structure:
{
  "securityImpactLevel": "none|low|medium|high",
  "securityImpactDetails": "1-2 sentence rationale",
  "dataImpactLevel": "none|low|medium|high",
  "dataImpactDetails": "1-2 sentence rationale",
  "integrationImpactLevel": "none|low|medium|high",
  "integrationImpactDetails": "1-2 sentence rationale",
  "regulatoryImpactLevel": "none|low|medium|high",
  "regulatoryImpactDetails": "1-2 sentence rationale",
  "aiImpactLevel": "none|low|medium|high",
  "aiImpactDetails": "1-2 sentence rationale"
}`;

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

    const userPrompt = `
Initiative: ${requestTitle || "Unnamed initiative"}
Description: ${requestDescription || "No description provided"}

SECURITY QUESTIONS:
Q: Will this system be accessible from the internet, or only used internally by employees?
A: ${answers.security?.q1 || "Not answered"}

Q: Will it store or process sensitive information such as passwords, personal details (names, addresses, health records), or payment data?
A: ${answers.security?.q2 || "Not answered"}

Q: Does it introduce any new ways to log in, or connect company systems to external networks or partners?
A: ${answers.security?.q3 || "Not answered"}

DATA QUESTIONS:
Q: What type of data will this system store or process? (e.g. public info, internal business data, employee records, customer details, financial records)
A: ${answers.data?.q1 || "Not answered"}

Q: Will it handle personal information (PII) such as names, addresses, health data, or financial records?
A: ${answers.data?.q2 || "Not answered"}

Q: Does any data need to stay within a specific country or region (data residency requirements)?
A: ${answers.data?.q3 || "Not answered"}

INTEGRATION QUESTIONS:
Q: How many other systems will this connect to, and are any of them external to the company (e.g. suppliers, customers, government portals)?
A: ${answers.integration?.q1 || "Not answered"}

Q: Will it use real-time or event-driven data feeds rather than scheduled batch transfers?
A: ${answers.integration?.q2 || "Not answered"}

Q: Does it introduce any brand-new or non-standard methods for linking systems together?
A: ${answers.integration?.q3 || "Not answered"}

REGULATORY QUESTIONS:
Q: Are there specific laws, industry regulations, or standards this system must comply with? (e.g. Australian Privacy Act, GDPR, food safety, financial regulations)
A: ${answers.regulatory?.q1 || "Not answered"}

Q: Will it affect financial reporting, external audits, or require compliance certifications?
A: ${answers.regulatory?.q2 || "Not answered"}

Q: If this system failed to comply, would the consequence be an internal policy issue, or could it result in fines, legal action, or regulatory sanction?
A: ${answers.regulatory?.q3 || "Not answered"}

AI/ML QUESTIONS:
Q: Will this system use any artificial intelligence or machine learning features?
A: ${answers.ai?.q1 || "Not answered"}

Q: If yes — will the AI make or influence decisions that affect customers, employees, or finances? Can a human review and override those decisions?
A: ${answers.ai?.q2 || "Not answered"}

Q: How serious would the consequences be if the AI made an error? (e.g. minor inconvenience vs. financial losses, medical harm, regulatory breach)
A: ${answers.ai?.q3 || "Not answered"}
`.trim();

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1024,
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
