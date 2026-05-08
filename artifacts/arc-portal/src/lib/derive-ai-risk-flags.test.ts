import { describe, it, expect } from "vitest";
import { deriveAiRiskFlags } from "./derive-ai-risk-flags";

// Exact option values from the 37-question Excel set (EA Portal Intake Questionnaire 8 May 2026)
// q2 = Q27 sourcing, q3 = Q28 inference data, q4 = Q29 decision automation, q8 = Q33 monitoring
const HIGH_RISK_ANSWERS = JSON.stringify({
  q2: "Open-source model deployed internally",
  q3: "Customer personal data/PII",
  q4: "Automated actions with limited oversight",
  q8: "No monitoring plan",
});

describe("deriveAiRiskFlags — answers-based path", () => {
  it("returns all four flags for high-risk answers at 'high' level", () => {
    const flags = deriveAiRiskFlags("high", null, HIGH_RISK_ANSWERS);
    expect(flags.map((f) => f.label)).toEqual([
      "Custom/open-source model detected",
      "Personal data used in AI",
      "Automated decisions — limited human oversight",
      "No monitoring plan",
    ]);
  });

  it("returns all four flags for high-risk answers at 'medium' level", () => {
    const flags = deriveAiRiskFlags("medium", null, HIGH_RISK_ANSWERS);
    expect(flags).toHaveLength(4);
  });

  it("returns no flags when level is 'low' even with high-risk answers", () => {
    expect(deriveAiRiskFlags("low", null, HIGH_RISK_ANSWERS)).toEqual([]);
  });

  it("returns no flags when level is absent", () => {
    expect(deriveAiRiskFlags(null, null, HIGH_RISK_ANSWERS)).toEqual([]);
    expect(deriveAiRiskFlags(undefined, null, HIGH_RISK_ANSWERS)).toEqual([]);
  });

  it("returns custom model flag for 'Custom-built/trained internally' q2 answer", () => {
    const answers = JSON.stringify({ q2: "Custom-built/trained internally" });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(1);
    expect(flags[0].label).toBe("Custom/open-source model detected");
  });

  it("returns the custom model flag for 'Hybrid' q2 answer", () => {
    const answers = JSON.stringify({ q2: "Hybrid" });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(1);
    expect(flags[0].label).toBe("Custom/open-source model detected");
  });

  it("returns no flags when q2 is a vendor/SaaS answer", () => {
    const answers = JSON.stringify({ q2: "Vendor managed (SaaS/API)" });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(0);
  });

  it("returns PII flag when q3 is 'Customer personal data/PII'", () => {
    const answers = JSON.stringify({ q3: "Customer personal data/PII" });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(1);
    expect(flags[0].label).toBe("Personal data used in AI");
  });

  it("does not return PII flag for anonymised data answer", () => {
    const answers = JSON.stringify({ q3: "Anonymized/aggregated internal data" });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(0);
  });

  it("returns automated decisions flag when q4 is 'Automated actions with limited oversight'", () => {
    const answers = JSON.stringify({ q4: "Automated actions with limited oversight" });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(1);
    expect(flags[0].label).toBe("Automated decisions — limited human oversight");
  });

  it("does not return automated decisions flag for decision-support answer", () => {
    const answers = JSON.stringify({ q4: "Decision support (human reviews)" });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(0);
  });

  it("returns no monitoring flag when q8 is 'No monitoring plan'", () => {
    const answers = JSON.stringify({ q8: "No monitoring plan" });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(1);
    expect(flags[0].label).toBe("No monitoring plan");
  });

  it("does not return monitoring flag when q8 indicates monitoring exists", () => {
    const answers = JSON.stringify({ q8: "Formal MLOps (drift detection, retraining, approvals)" });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(0);
  });

  it("does not return monitoring flag for 'Basic monitoring' answer", () => {
    const answers = JSON.stringify({ q8: "Basic monitoring" });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(0);
  });

  it("returns no flags when all answers are low-risk", () => {
    const answers = JSON.stringify({
      q2: "Vendor managed (SaaS/API)",
      q3: "Public/synthetic only",
      q4: "Informational only",
      q8: "Formal MLOps (drift detection, retraining, approvals)",
    });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(0);
  });

  it("correctly reads q2/q3/q4/q8 from a full domain-answer object (q1–q8 + remarks)", () => {
    const fullAnswers = JSON.stringify({
      q1: "No",
      q2: "Open-source model deployed internally",
      q3: "Customer personal data/PII",
      q4: "Automated actions with limited oversight",
      q5: "High (financial/regulatory/safety/reputation)",
      q6: "No (fully automated)",
      q7: "Not explainable (black box)",
      q8: "No monitoring plan",
      remarks: "High risk AI initiative",
    });
    const flags = deriveAiRiskFlags("high", null, fullAnswers);
    expect(flags).toHaveLength(4);
    expect(flags.map((f) => f.label)).toContain("Custom/open-source model detected");
    expect(flags.map((f) => f.label)).toContain("Personal data used in AI");
    expect(flags.map((f) => f.label)).toContain("Automated decisions — limited human oversight");
    expect(flags.map((f) => f.label)).toContain("No monitoring plan");
  });

  it("falls back to text matching when answersJson is invalid JSON", () => {
    const flags = deriveAiRiskFlags(
      "high",
      "Uses custom-built ML model with no monitoring",
      "not-valid-json{",
    );
    expect(flags.map((f) => f.label)).toContain("Custom/open-source model detected");
    expect(flags.map((f) => f.label)).toContain("No monitoring plan");
  });
});

describe("deriveAiRiskFlags — text-fallback path (no stored answers)", () => {
  it("detects custom model from 'open-source' keyword in details", () => {
    const flags = deriveAiRiskFlags("high", "Uses an open-source model", null);
    expect(flags[0].label).toBe("Custom/open-source model detected");
  });

  it("detects custom model from 'internally trained' in details", () => {
    const flags = deriveAiRiskFlags("high", "Internally trained on proprietary data", null);
    expect(flags[0].label).toBe("Custom/open-source model detected");
  });

  it("detects no monitoring from 'no monitoring' in details", () => {
    const flags = deriveAiRiskFlags("medium", "No monitoring plan is in place", null);
    expect(flags.some((f) => f.label === "No monitoring plan")).toBe(true);
  });

  it("detects PII in training from rationale text", () => {
    const flags = deriveAiRiskFlags(
      "high",
      "Model will be trained on customer PII and personal data",
      null,
    );
    expect(flags.some((f) => f.label === "Personal data used in AI")).toBe(true);
  });

  it("detects automated decisions from rationale text", () => {
    const flags = deriveAiRiskFlags(
      "high",
      "Automated decisions made with limited human review",
      null,
    );
    expect(flags.some((f) => f.label === "Automated decisions — limited human oversight")).toBe(true);
  });

  it("returns no flags when details are benign and no answers stored", () => {
    const flags = deriveAiRiskFlags("high", "Standard vendor-hosted API integration", null);
    expect(flags).toHaveLength(0);
  });

  it("returns no flags when details is null and no answers stored", () => {
    expect(deriveAiRiskFlags("high", null, null)).toEqual([]);
  });
});
