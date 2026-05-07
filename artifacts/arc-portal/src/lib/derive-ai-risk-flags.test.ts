import { describe, it, expect } from "vitest";
import { deriveAiRiskFlags } from "./derive-ai-risk-flags";

const HIGH_RISK_ANSWERS = JSON.stringify({
  q2: "Open-source model integrated and deployed internally",
  q7: "No — no monitoring or model maintenance plan",
  q8: "Specific AI legislation applies (e.g. EU AI Act, algorithmic accountability laws)",
});

describe("deriveAiRiskFlags — answers-based path", () => {
  it("returns all three flags for high-risk answers at 'high' level", () => {
    const flags = deriveAiRiskFlags("high", null, HIGH_RISK_ANSWERS);
    expect(flags.map((f) => f.label)).toEqual([
      "Custom/open-source model detected",
      "No monitoring plan",
      "AI legislation applies",
    ]);
  });

  it("returns all three flags for high-risk answers at 'medium' level", () => {
    const flags = deriveAiRiskFlags("medium", null, HIGH_RISK_ANSWERS);
    expect(flags).toHaveLength(3);
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

  it("returns only the custom model flag for 'Hybrid combination' q2 answer", () => {
    const answers = JSON.stringify({ q2: "Hybrid combination" });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(1);
    expect(flags[0].label).toBe("Custom/open-source model detected");
  });

  it("returns no flags when q2 is a vendor/SaaS answer", () => {
    const answers = JSON.stringify({ q2: "Vendor-managed or SaaS AI service" });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(0);
  });

  it("returns no flags when all answers are low-risk", () => {
    const answers = JSON.stringify({
      q2: "Vendor-managed or SaaS AI service",
      q7: "Yes — a monitoring and maintenance plan is documented",
      q8: "No specific AI legislation applies",
    });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags).toHaveLength(0);
  });

  it("skips monitoring flag when q7 answer indicates a plan exists", () => {
    const answers = JSON.stringify({
      q2: "Open-source model integrated and deployed internally",
      q7: "Yes — a monitoring and maintenance plan is documented",
      q8: "Specific AI legislation applies (e.g. EU AI Act, algorithmic accountability laws)",
    });
    const flags = deriveAiRiskFlags("high", null, answers);
    expect(flags.map((f) => f.label)).not.toContain("No monitoring plan");
    expect(flags).toHaveLength(2);
  });

  it("falls back to text matching when answersJson is invalid JSON", () => {
    const flags = deriveAiRiskFlags("high", "Uses custom-built ML model with no monitoring", "not-valid-json{");
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

  it("detects AI legislation from 'eu ai act' in details", () => {
    const flags = deriveAiRiskFlags("high", "Must comply with the EU AI Act", null);
    expect(flags.some((f) => f.label === "AI legislation applies")).toBe(true);
  });

  it("returns no flags when details are benign and no answers stored", () => {
    const flags = deriveAiRiskFlags("high", "Standard vendor-hosted API integration", null);
    expect(flags).toHaveLength(0);
  });

  it("returns no flags when details is null and no answers stored", () => {
    expect(deriveAiRiskFlags("high", null, null)).toEqual([]);
  });
});
