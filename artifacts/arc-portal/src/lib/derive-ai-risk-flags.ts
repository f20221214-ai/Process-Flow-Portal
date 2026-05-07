export interface AiRiskFlag {
  label: string;
  description: string;
}

const CUSTOM_MODEL_ANSWERS = [
  "Open-source model integrated and deployed internally",
  "Custom-built or internally trained model",
  "Hybrid combination",
];

/**
 * Derive structured AI risk flags deterministically from stored questionnaire answers
 * (q2: model sourcing, q7: monitoring plan, q8: AI legislation).
 * Falls back to rationale text keyword matching for requests without stored answers.
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
      const a = JSON.parse(answersJson) as { q2?: string; q7?: string; q8?: string };

      if (a.q2 && CUSTOM_MODEL_ANSWERS.includes(a.q2)) {
        flags.push({
          label: "Custom/open-source model detected",
          description:
            "Sourcing or building a custom or open-source AI model introduces governance, supply-chain, and reproducibility risk.",
        });
      }

      if (a.q7 === "No — no monitoring or model maintenance plan") {
        flags.push({
          label: "No monitoring plan",
          description:
            "Absence of model monitoring or drift detection increases the risk of silent performance degradation over time.",
        });
      }

      if (
        a.q8 ===
        "Specific AI legislation applies (e.g. EU AI Act, algorithmic accountability laws)"
      ) {
        flags.push({
          label: "AI legislation applies",
          description:
            "Applicable AI regulations (e.g. EU AI Act) require documented compliance controls and may impose legal obligations.",
        });
      }

      return flags;
    } catch {
      /* fall through to text matching */
    }
  }

  if (!details) return flags;
  const t = details.toLowerCase();

  if (
    /custom[\s-]built|open[\s-]source|internally trained|custom model|in-house model|proprietary model|models trained|model trained|ml model|internally developed|self[\s-]trained/.test(
      t,
    )
  ) {
    flags.push({
      label: "Custom/open-source model detected",
      description:
        "Sourcing or building a custom or open-source AI model introduces governance, supply-chain, and reproducibility risk.",
    });
  }

  if (
    /no monitoring|no model governance|no governance plan|without a monitoring|without monitoring|monitoring.*absent|no drift|no retraining plan|lack.*monitoring|monitoring not in place/.test(
      t,
    )
  ) {
    flags.push({
      label: "No monitoring plan",
      description:
        "Absence of model monitoring or drift detection increases the risk of silent performance degradation over time.",
    });
  }

  if (
    /ai act|eu ai|ai legislation|algorithmic accountability|ai-specific regulation|ai-related regulation|ai regulation|regulatory.*ai|ai.*regulat/.test(
      t,
    )
  ) {
    flags.push({
      label: "AI legislation applies",
      description:
        "Applicable AI regulations (e.g. EU AI Act) require documented compliance controls and may impose legal obligations.",
    });
  }

  return flags;
}
