import { describe, it, expect } from "vitest";
import { deriveAiRiskFlags } from "./derive-ai-risk-flags";

// New 37-question set: q2=sourcing(Q27), q3=inference data(Q28), q4=automation(Q29), q8=monitoring(Q33)
const HIGH_RISK_ANSWERS = JSON.stringify({
  q2: "Open-source model integrated and deployed internally",
  q3: "Customer personal data or PII",
  q4: "Yes — automated decisions with limited or no human review",
  q8: "No — no model monitoring or maintenance plan defined",
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

  it("returns only the custom model flag when q2 is 'Custom-built or internally trained model'", () => {
    const answers = JSON.stringify({ q2: "Custom-built or internally trained model" });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(1);
    expect(flags[0].label).toBe("Custom/open-source model detected");
  });

  it("returns the custom model flag for 'Hybrid combination of the above' q2 answer", () => {
    const answers = JSON.stringify({ q2: "Hybrid combination of the above" });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(1);
    expect(flags[0].label).toBe("Custom/open-source model detected");
  });

  it("returns no flags when q2 is a vendor/SaaS answer", () => {
    const answers = JSON.stringify({
      q2: "Vendor-provided, off-the-shelf AI (embedded feature, API, or SaaS)",
    });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(0);
  });

  it("returns PII flag when q3 is 'Customer personal data or PII'", () => {
    const answers = JSON.stringify({ q3: "Customer personal data or PII" });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(1);
    expect(flags[0].label).toBe("Personal data used in AI");
  });

  it("does not return PII flag for anonymised data answer", () => {
    const answers = JSON.stringify({ q3: "Anonymised or aggregated internal data" });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(0);
  });

  it("returns automated decisions flag when q4 is the automated-decisions answer", () => {
    const answers = JSON.stringify({
      q4: "Yes — automated decisions with limited or no human review",
    });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(1);
    expect(flags[0].label).toBe("Automated decisions — limited human oversight");
  });

  it("does not return automated decisions flag for partial-automation answer", () => {
    const answers = JSON.stringify({
      q4: "Partial automation — humans review significant or high-risk decisions",
    });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(0);
  });

  it("returns no monitoring flag when q8 is the no-plan answer", () => {
    const answers = JSON.stringify({
      q8: "No — no model monitoring or maintenance plan defined",
    });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(1);
    expect(flags[0].label).toBe("No monitoring plan");
  });

  it("does not return monitoring flag when q8 indicates a plan exists", () => {
    const answers = JSON.stringify({
      q8: "Yes — a formal MLOps or model governance process is in place or planned",
    });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(0);
  });

  it("returns no flags when all answers are low-risk", () => {
    const answers = JSON.stringify({
      q2: "Vendor-provided, off-the-shelf AI (embedded feature, API, or SaaS)",
      q3: "Public or fully synthetic data only",
      q4: "No — outputs are informational and reviewed by humans before any action",
      q8: "Yes — a formal MLOps or model governance process is in place or planned",
    });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(0);
  });

  it("correctly reads q2/q3/q4/q8 from a full domain-answer object (q1–q8 + remarks)", () => {
    const fullAnswers = JSON.stringify({
      q1: "No — no AI/ML involved",
      q2: "Open-source model integrated and deployed internally",
      q3: "Customer personal data or PII",
      q4: "Yes — automated decisions with limited or no human review",
      q5: "Significant — financial loss, regulatory breach, safety risk, or reputational harm",
      q6: "No — outputs are acted upon directly with no human intervention",
      q7: "Black box — outputs cannot be explained or attributed to specific inputs",
      q8: "No — no model monitoring or maintenance plan defined",
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
