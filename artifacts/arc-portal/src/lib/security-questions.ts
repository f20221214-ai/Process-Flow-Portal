export const SECURITY_QUESTION_LABELS: Record<string, string> = {
  q1: "How will users sign in?",
  q2: "What is the expected network exposure?",
  q3: "Is privileged/admin access required?",
  q4: "How will access keys/secrets be managed?",
  q5: "Does the solution depend on third-party software/services or open-source packages?",
  q6: "Are data-at-rest and data-in-transit encrypted?",
  q7: "Is security monitoring and audit logging in place?",
  q8: "Has a security testing strategy been defined (SAST, DAST, pen-test)?",
  q9: "Are there known vulnerability management and patching processes?",
  q10: "Has a threat model or security risk assessment been completed?",
};

export const SECURITY_ANSWER_KEY_ORDER = [
  "q1", "q2", "q3", "q4", "q5",
  "q6", "q7", "q8", "q9", "q10",
] as const;

export type SecurityAnswerKey = typeof SECURITY_ANSWER_KEY_ORDER[number];

export function parseSecurityAnswers(raw: string | null | undefined): Record<string, string> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) return null;
    return parsed as Record<string, string>;
  } catch (err) {
    console.warn("[security-questions] Failed to parse securityImpactAnswers:", err);
    return null;
  }
}
