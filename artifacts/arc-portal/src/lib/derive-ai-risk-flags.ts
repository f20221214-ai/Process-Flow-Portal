export interface AiRiskFlag {
  label: string;
  description: string;
}

const CUSTOM_MODEL_ANSWERS = [
  "Open-source model integrated and deployed internally",
  "Custom-built or internally trained model",
  "Hybrid combination of the above",
];

/**
 * Derive structured AI risk flags deterministically from stored questionnaire answers.
 *
 * New question mapping (37-question set):
 *   q2 = sourcing (Q27)  → custom/open-source model flag
 *   q3 = inference data (Q28) → PII in training/inference flag
 *   q4 = decision automation (Q29) → automated decisions flag
 *   q8 = monitoring (Q33) → no monitoring plan flag
 *
 * Falls back to rationale text keyword matching for requests without stored answers
 * (including legacy records that used the old q2/q7/q8 format).
 */
export function deriveAiRiskFlags(
  level: string | undefined | null,
  details: string | undefined | null,
  answersJson: string | undefined | null,
): AiRiskFlag[] {
  if (!level || !["medium", "high"].includes(level)) return [];
  const flags: AiRiskFlag[] = [];

  if (answersJson) {
    try {
      const a = JSON.parse(answersJson) as {
        q2?: string;
        q3?: string;
        q4?: string;
        q8?: string;
      };

      // Custom / open-source model (q2 = sourcing)
      if (a.q2 && CUSTOM_MODEL_ANSWERS.includes(a.q2)) {
        flags.push({
          label: "Custom/open-source model detected",
          description:
            "Sourcing or building a custom or open-source AI model introduces governance, supply-chain, and reproducibility risk.",
        });
      }

      // PII or personal data in training / inference (q3 = inference data)
      if (a.q3 === "Customer personal data or PII") {
        flags.push({
          label: "Personal data used in AI",
          description:
            "Training or inference on customer personal data (PII) requires formal privacy controls, consent mechanisms, and data minimisation.",
        });
      }

      // Automated decisions with limited human review (q4 = decision automation)
      if (a.q4 === "Yes — automated decisions with limited or no human review") {
        flags.push({
          label: "Automated decisions — limited human oversight",
          description:
            "AI outputs trigger automated decisions with little or no human review, increasing the risk of unchallenged errors or bias.",
        });
      }

      // No model monitoring plan (q8 = monitoring)
      if (a.q8 === "No — no model monitoring or maintenance plan defined") {
        flags.push({
          label: "No monitoring plan",
          description:
            "Absence of model monitoring or drift detection increases the risk of silent performance degradation over time.",
        });
      }

      return flags;
    } catch {
      /* fall through to text matching */
    }
  }

  // Text-based fallback for legacy records or when no structured answers are stored
  if (!details) return flags;
  const t = details.toLowerCase();

  if (
    /custom[\s-]built|open[\s-]source|internally trained|custom model|in-house model|proprietary model|models trained|model trained|ml model|internally developed|self[\s-]trained/.test(t)
  ) {
    flags.push({
      label: "Custom/open-source model detected",
      description:
        "Sourcing or building a custom or open-source AI model introduces governance, supply-chain, and reproducibility risk.",
    });
  }

  if (
    /customer pii|personal data.*train|training.*pii|inference.*pii|pii.*inference|personal.*data.*model|model.*personal.*data/.test(t)
  ) {
    flags.push({
      label: "Personal data used in AI",
      description:
        "Training or inference on customer personal data (PII) requires formal privacy controls, consent mechanisms, and data minimisation.",
    });
  }

  if (
    /automated decision|limited.*human.*review|no human.*review|without human.*oversight|limited.*oversight|automated.*action/.test(t)
  ) {
    flags.push({
      label: "Automated decisions — limited human oversight",
      description:
        "AI outputs trigger automated decisions with little or no human review, increasing the risk of unchallenged errors or bias.",
    });
  }

  if (
    /no monitoring|no model governance|no governance plan|without a monitoring|without monitoring|monitoring.*absent|no drift|no retraining plan|lack.*monitoring|monitoring not in place/.test(t)
  ) {
    flags.push({
      label: "No monitoring plan",
      description:
        "Absence of model monitoring or drift detection increases the risk of silent performance degradation over time.",
    });
  }

  return flags;
}
