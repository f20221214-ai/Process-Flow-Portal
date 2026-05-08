import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Select, Label, Badge } from "@/components/ui-primitives";
import { useCreateRequest } from "@workspace/api-client-react";
import type { CreateArchitectureRequest } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, X, Sparkles, Shield, Database, GitBranch, Scale, Bot,
  CheckCircle2, AlertCircle, ChevronRight, RotateCcw, MessageSquare,
  ExternalLink, Activity, Info
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface LeanixInitiative {
  id: number;
  leanixId: string;
  name: string;
  description: string | null;
  status: string;
  tags: string[];
}

const IMPACT_LEVELS = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" }
];

const IMPACT_COLORS: Record<string, string> = {
  none: "bg-slate-100 text-slate-600 border-slate-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-red-100 text-red-700 border-red-200"
};

const UNSELECTED = "";

// ---------------------------------------------------------------------------
// Solution Context — Q1–Q4 (non-scored, provides AI model context)
// ---------------------------------------------------------------------------
const SOLUTION_CONTEXT_QUESTIONS = [
  {
    question: "What is the initiative stage?",
    options: [
      "Early idea / exploration",
      "Vendor/technology evaluation/PoC",
      "Solution architecture/design in progress",
      "Build/implementation underway",
      "Not sure",
    ]
  },
  {
    question: "What is the solution type?",
    options: [
      "Build custom",
      "Buy SaaS/PaaS",
      "Configure COTS",
      "Integrate existing systems",
      "Not sure",
    ]
  },
  {
    question: "Who are the users of the solution?",
    options: [
      "Internal employees only",
      "Internal + selected partners/contractors",
      "Customers/public users",
      "Mixed users across multiple channels",
      "Not sure",
    ]
  },
  {
    question: "How many users are expected?",
    options: [
      "<10",
      "10 -30",
      "30-50",
      "50-100",
      ">100",
    ]
  },
];

// ---------------------------------------------------------------------------
// Impact Domains — Q5–Q33
// ---------------------------------------------------------------------------
const IMPACT_AREA_CONFIG = [
  {
    key: "security",
    title: "Security",
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    questions: [
      {
        question: "How will users sign in?",
        options: [
          "Existing corporate SSO (Entra ID)",
          "SSO + MFA enforced",
          "New identity provider/SSO integration",
          "Local accounts / custom auth",
          "Not sure",
        ]
      },
      {
        question: "What is the expected network exposure?",
        options: [
          "Internal only",
          "Private access for externals (ZTNA/VPN)",
          "Internet-facing components",
          "Fully public internet-facing",
          "Not sure",
        ]
      },
      {
        question: "Is privileged/admin access required?",
        options: [
          "No",
          "Limited admins with existing controls",
          "Privileged access via PAM tooling",
          "Privileged access without PAM controls",
          "Not sure",
        ]
      },
      {
        question: "How will access keys/secrets be managed?",
        options: [
          "No secrets required",
          "Enterprise secret manager (e.g., Key Vault)",
          "App config/env vars without central manager",
          "Hardcoded/manual credentials",
          "Not sure",
        ]
      },
      {
        question: "Does the solution depend on third-party software/services or open-source packages?",
        showPatternsLink: true,
        options: [
          "No",
          "Approved vendor/SaaS",
          "Open-source/third-party packages",
          "Significant dependencies without supply-chain assessment",
          "Not sure",
        ]
      },
    ]
  },
  {
    key: "data",
    title: "Data",
    icon: Database,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100",
    questions: [
      {
        question: "What is the highest data classification involved?",
        options: [
          "Public",
          "Internal",
          "Confidential",
          "Regulated/Highly sensitive",
          "Not sure",
        ]
      },
      {
        question: "Will the solution handle sensitive or regulated data (e.g., personal data, credentials, payment data)?",
        options: [
          "No",
          "Internal business data only",
          "Confidential internal data",
          "Regulated/highly sensitive data",
          "Not Sure",
        ]
      },
      {
        question: "Does this solution depend on or contribute to master data domains (e.g. customer, product, employee, or supplier records)?",
        showPatternsLink: true,
        options: [
          "No — the solution manages its own data independently with no master data dependencies",
          "Reads from master data but does not update or contribute to it",
          "Both reads and writes to one or more master data domains",
          "This solution is itself a master data management or golden-record platform",
          "Not sure",
        ]
      },
      {
        question: "Is end-to-end data lineage required (source → transformation → consumers)?",
        options: [
          "No",
          "Documented manually",
          "Automated lineage within this solution",
          "Cross-system lineage required",
          "Not sure",
        ]
      },
      {
        question: "Are there data residency/sovereignty requirements?",
        showPatternsLink: true,
        options: [
          "No",
          "Preference only",
          "Contractual/regulatory requirement",
          "Strict mandate with enforcement",
          "Not sure",
        ]
      },
      {
        question: "What are retention and deletion expectations?",
        options: [
          "< 1 year",
          "1–5 years",
          "5+ years",
          "Regulatory/long-term retention",
          "Not sure",
        ]
      },
      {
        question: "Will data be shared outside the organization?",
        options: [
          "No",
          "Internal only",
          "Trusted partners under agreement",
          "Regulators/public entities",
          "Not sure",
        ]
      },
    ]
  },
  {
    key: "integration",
    title: "Integration",
    icon: GitBranch,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-100",
    questions: [
      {
        question: "How many systems will this solution integrate with?",
        options: [
          "None",
          "1–2 internal systems",
          "3+ internal systems",
          "Includes external parties",
          "Not sure",
        ]
      },
      {
        question: "What integration style is required?",
        showPatternsLink: true,
        options: [
          "No integration",
          "Batch/file transfer",
          "API / near real-time",
          "Event streaming / high frequency",
          "Not sure",
        ]
      },
      {
        question: "Are any integrations with legacy systems, OT/plant equipment, or industrial control systems required?",
        options: [
          "No",
          "Minor legacy involvement",
          "Significant legacy/on-prem complexity",
          "Direct OT/ICS integration",
          "Not sure",
        ]
      },
      {
        question: "Will any APIs be exposed for other teams/partners to consume?",
        showPatternsLink: true,
        options: [
          "No",
          "Internal only (informal)",
          "Formal APIs with versioning/deprecation",
          "APIs for partners/public via API management",
          "Not sure",
        ]
      },
    ]
  },
  {
    key: "regulatory",
    title: "Regulatory",
    icon: Scale,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-100",
    questions: [
      {
        question: "Are there external regulations or certifications applicable (privacy, food safety, SOX, etc.)?",
        showPatternsLink: true,
        options: [
          "No",
          "Internal policy only",
          "Industry standards/certifications",
          "Government legislation/regulation",
          "Not sure",
        ]
      },
      {
        question: "Does this initiative span multiple countries/jurisdictions?",
        options: [
          "Single country",
          "Multiple regions in one country",
          "Multiple countries (similar rules)",
          "Multiple countries (conflicting rules)",
          "Not sure",
        ]
      },
      {
        question: "Will personal data be transferred across borders?",
        options: [
          "No",
          "Yes (adequacy decision)",
          "Yes (SCC/BCR or approved mechanism)",
          "Transfer mechanism unclear",
          "Not sure",
        ]
      },
      {
        question: "What is the consequence if the solution is non-compliant?",
        options: [
          "Low",
          "Moderate",
          "High (fines/penalties)",
          "Severe (unable to operate/legal action)",
          "Not sure",
        ]
      },
      {
        question: "Does the solution require auditable controls (logs, approvals, evidence) for audits?",
        options: [
          "No",
          "Some controls needed",
          "Full audit trail required",
          "Regulatory approval/license required before go-live",
          "Not sure",
        ]
      },
    ]
  },
  {
    key: "ai",
    title: "AI / ML",
    icon: Bot,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-100",
    questions: [
      {
        question: "Does the solution include AI/ML or Generative AI?",
        showPatternsLink: true,
        options: [
          "No",
          "Embedded vendor feature",
          "Custom model or fine-tuning",
          "AI is a core function",
        ]
      },
      {
        question: "How is the AI capability sourced?",
        options: [
          "Not applicable",
          "Vendor managed (SaaS/API)",
          "Open-source model deployed internally",
          "Custom-built/trained internally",
          "Hybrid",
          "Not sure",
        ]
      },
      {
        question: "What data will the AI use for inference (and training/fine-tuning if applicable)?",
        options: [
          "Not applicable",
          "Public/synthetic only",
          "Anonymized/aggregated internal data",
          "Identifiable internal business data",
          "Customer personal data/PII",
          "Not sure",
        ]
      },
      {
        question: "Will AI outputs be used to make or trigger decisions/actions?",
        options: [
          "Not applicable",
          "Informational only",
          "Decision support (human reviews)",
          "Automated actions with limited oversight",
          "Not sure",
        ]
      },
      {
        question: "What is the impact if the AI output is wrong, biased, or unsafe?",
        options: [
          "Not applicable",
          "Low (easy to correct)",
          "Medium (rework / inconvenience)",
          "High (financial/regulatory/safety/reputation)",
          "Not sure",
        ]
      },
      {
        question: "Is there human oversight (human-in-the-loop) and an override path?",
        options: [
          "Not applicable",
          "No (fully automated)",
          "Yes for exceptions only",
          "Yes for all high-impact decisions",
          "Not sure",
        ]
      },
      {
        question: "Can the AI output be explained and audited (inputs, prompts, model/version, rationale)?",
        showPatternsLink: true,
        options: [
          "Not applicable",
          "Fully explainable + auditable",
          "Partially explainable",
          "Not explainable (black box)",
          "Not sure",
        ]
      },
      {
        question: "Is there a plan to monitor model quality and drift in production?",
        options: [
          "Not applicable",
          "Basic monitoring",
          "Formal MLOps (drift detection, retraining, approvals)",
          "No monitoring plan",
          "Not sure",
        ]
      },
    ]
  },
];

// ---------------------------------------------------------------------------
// Operational Readiness — Q34–Q37 (Yes/No with conditional details)
// ---------------------------------------------------------------------------
const OPERATIONAL_READINESS_QUESTIONS = [
  "Are logging, monitoring and audit capabilities defined?",
  "Are expected transaction volumes, throughput, and latency requirements documented?",
  "Are Availability and DR (RTO/RPO) metrics been defined?",
  "Have support and operational ownership models been defined?",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ImpactLevel = "none" | "low" | "medium" | "high";
type AreaAnswers = {
  q1: string; q2: string; q3: string; q4: string; q5: string;
  q6: string; q7: string; q8: string;
  remarks: string;
};
type ImpactAnswers = { [area: string]: AreaAnswers };

type ContextAnswers = { q1: string; q2: string; q3: string; q4: string };

type OperationalAnswer = { value: "Yes" | "No" | ""; details: string };
type OperationalReadinessAnswers = {
  q1: OperationalAnswer; q2: OperationalAnswer; q3: OperationalAnswer; q4: OperationalAnswer;
};

const EMPTY_AREA: AreaAnswers = {
  q1: UNSELECTED, q2: UNSELECTED, q3: UNSELECTED, q4: UNSELECTED,
  q5: UNSELECTED, q6: UNSELECTED, q7: UNSELECTED, q8: UNSELECTED,
  remarks: ""
};
const EMPTY_OP: OperationalAnswer = { value: "", details: "" };

const ALL_Q_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;

// ---------------------------------------------------------------------------
// SolutionContextCard
// ---------------------------------------------------------------------------
function SolutionContextCard({
  answers,
  onAnswer
}: {
  answers: ContextAnswers;
  onAnswer: (q: keyof ContextAnswers, value: string) => void;
}) {
  const qKeys = (["q1", "q2", "q3", "q4"] as const);
  const answeredCount = qKeys.filter(k => answers[k]).length;
  return (
    <div className="border rounded-xl overflow-hidden border-slate-200">
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-slate-50/70 border-b border-slate-200">
        <div className="p-1.5 rounded-lg bg-slate-100">
          <Info className="w-4 h-4 text-slate-500" />
        </div>
        <div>
          <span className="font-semibold text-sm">Solution Context</span>
          <span className="text-xs text-muted-foreground ml-2">Helps the AI model score your initiative accurately</span>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{answeredCount}/4 answered</span>
      </div>
      <div className="p-5 space-y-4">
        {SOLUTION_CONTEXT_QUESTIONS.map((q, i) => {
          const qKey = qKeys[i];
          return (
            <div key={qKey}>
              <Label className="text-xs font-medium leading-snug text-foreground/80 mb-1.5 block">
                {i + 1}. {q.question}
              </Label>
              <select
                value={answers[qKey]}
                onChange={e => onAnswer(qKey, e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 ${
                  answers[qKey] ? "border-border text-foreground" : "border-border/60 text-muted-foreground"
                }`}
              >
                <option value="">— Select an option —</option>
                {q.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ImpactQuestionCard
// ---------------------------------------------------------------------------
function ImpactQuestionCard({
  area,
  answers,
  onAnswer,
  onRemarks
}: {
  area: typeof IMPACT_AREA_CONFIG[0];
  answers: AreaAnswers;
  onAnswer: (q: typeof ALL_Q_KEYS[number], value: string) => void;
  onRemarks: (value: string) => void;
}) {
  const Icon = area.icon;
  const qKeys = ALL_Q_KEYS.slice(0, area.questions.length);
  const hasNotSure = qKeys.some(k => answers[k] === "Not sure");
  const remarksRequired = hasNotSure;
  const remarksMissing = remarksRequired && !answers.remarks.trim();

  return (
    <div className={`border rounded-xl overflow-hidden ${area.borderColor}`}>
      <div className={`flex items-center gap-2.5 px-5 py-3.5 ${area.bgColor}/40 border-b ${area.borderColor}`}>
        <div className={`p-1.5 rounded-lg ${area.bgColor}`}>
          <Icon className={`w-4 h-4 ${area.color}`} />
        </div>
        <span className="font-semibold text-sm">{area.title} Impact</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {qKeys.filter(k => answers[k]).length}/{qKeys.length} answered
        </span>
      </div>

      <div className="p-5 space-y-4">
        {qKeys.map((qKey, i) => {
          const q = area.questions[i] as { question: string; options: string[]; showPatternsLink?: boolean };
          return (
            <div key={qKey}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <Label className="text-xs font-medium leading-snug text-foreground/80">
                  {i + 1}. {q.question}
                </Label>
                {q.showPatternsLink && (
                  <a
                    href="/patterns"
                    className="shrink-0 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors whitespace-nowrap font-medium"
                    title="Browse the Architecture Patterns library for guidance"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Architecture Patterns
                  </a>
                )}
              </div>
              <select
                value={answers[qKey]}
                onChange={e => onAnswer(qKey, e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 ${
                  answers[qKey] === "Not sure"
                    ? "border-amber-300 text-amber-700"
                    : answers[qKey]
                    ? "border-border text-foreground"
                    : "border-border/60 text-muted-foreground"
                }`}
              >
                <option value="">— Select an option —</option>
                {q.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );
        })}

        <div className={`pt-1 border-t ${remarksMissing ? "border-amber-200" : "border-border/40"}`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <MessageSquare className={`w-3.5 h-3.5 ${remarksMissing ? "text-amber-500" : "text-muted-foreground"}`} />
            <Label className={`text-xs font-medium ${remarksMissing ? "text-amber-600" : "text-muted-foreground"}`}>
              Additional comments or remarks
              {remarksRequired ? (
                <span className="ml-1 text-amber-600 font-semibold">* required when "Not sure" is selected</span>
              ) : (
                <span className="ml-1 font-normal opacity-60">(optional)</span>
              )}
            </Label>
          </div>
          <Textarea
            value={answers.remarks}
            onChange={e => onRemarks(e.target.value)}
            required={remarksRequired}
            placeholder={
              remarksRequired
                ? "Please describe what you're unsure about so the EA team can help clarify…"
                : "Any additional context, constraints, or details that should be considered when assessing this impact area…"
            }
            className={`min-h-[72px] text-sm transition-colors ${
              remarksMissing
                ? "border-amber-300 focus:border-amber-500 focus:ring-amber-200 bg-amber-50/30"
                : ""
            }`}
          />
          {remarksMissing && (
            <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              Please add context for your "Not sure" answer(s) before running the AI analysis.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OperationalReadinessCard
// ---------------------------------------------------------------------------
function OperationalReadinessCard({
  answers,
  onAnswer
}: {
  answers: OperationalReadinessAnswers;
  onAnswer: (q: keyof OperationalReadinessAnswers, field: "value" | "details", val: string) => void;
}) {
  const qKeys = (["q1", "q2", "q3", "q4"] as const);
  const answeredCount = qKeys.filter(k => answers[k].value !== "").length;

  return (
    <div className="border rounded-xl overflow-hidden border-emerald-100">
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-emerald-50/40 border-b border-emerald-100">
        <div className="p-1.5 rounded-lg bg-emerald-50">
          <Activity className="w-4 h-4 text-emerald-600" />
        </div>
        <span className="font-semibold text-sm">Operational Readiness</span>
        <span className="text-xs text-muted-foreground ml-auto">{answeredCount}/4 answered</span>
      </div>
      <div className="p-5 space-y-5">
        {OPERATIONAL_READINESS_QUESTIONS.map((question, i) => {
          const qKey = qKeys[i];
          const ans = answers[qKey];
          return (
            <div key={qKey} className="space-y-2">
              <Label className="text-xs font-medium leading-snug text-foreground/80 block">
                {i + 1}. {question}
              </Label>
              <div className="flex gap-3">
                {(["Yes", "No"] as const).map(opt => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg border cursor-pointer transition-colors text-sm font-medium ${
                      ans.value === opt
                        ? opt === "Yes"
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                          : "border-red-300 bg-red-50 text-red-700"
                        : "border-border hover:bg-secondary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${qKey}-or`}
                      value={opt}
                      checked={ans.value === opt}
                      onChange={() => onAnswer(qKey, "value", opt)}
                      className="sr-only"
                    />
                    {opt}
                  </label>
                ))}
              </div>
              <AnimatePresence>
                {ans.value === "Yes" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <Textarea
                      value={ans.details}
                      onChange={e => onAnswer(qKey, "details", e.target.value)}
                      placeholder="Provide details — e.g. tool names, RTO/RPO targets, owner names, or links to documentation…"
                      className="min-h-[60px] text-sm mt-1"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DerivedImpactCard
// ---------------------------------------------------------------------------
type AreaConfig = {
  key: string;
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
};

function DerivedImpactCard({
  area,
  level,
  details,
  onLevelChange,
  onDetailsChange
}: {
  area: AreaConfig;
  level: ImpactLevel;
  details: string;
  onLevelChange: (level: ImpactLevel) => void;
  onDetailsChange: (value: string) => void;
}) {
  const Icon = area.icon;
  const [editing, setEditing] = useState(false);
  return (
    <div className={`border rounded-xl p-4 space-y-3 ${area.borderColor} bg-card`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${area.bgColor}`}>
            <Icon className={`w-4 h-4 ${area.color}`} />
          </div>
          <span className="font-semibold text-sm">{area.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${IMPACT_COLORS[level]}`}>
            {level}
          </span>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
          >
            {editing ? "Done" : "Override"}
          </button>
        </div>
      </div>

      {editing && (
        <div className="flex gap-1.5 flex-wrap">
          {IMPACT_LEVELS.map(l => (
            <button
              key={l.value}
              type="button"
              onClick={() => onLevelChange(l.value as ImpactLevel)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                level === l.value
                  ? IMPACT_COLORS[l.value] + " shadow-sm"
                  : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground leading-relaxed">{details}</p>

      {editing && (
        <div>
          <Label className="text-xs mb-1.5">Edit rationale</Label>
          <Textarea
            value={details}
            onChange={e => onDetailsChange(e.target.value)}
            className="min-h-[70px] text-sm"
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const OPERATIONAL_AREA_CONFIG: AreaConfig = {
  key: "operational",
  title: "Operational Readiness",
  icon: Activity,
  color: "text-emerald-600",
  bgColor: "bg-emerald-50",
  borderColor: "border-emerald-100",
};

export default function RequestForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createMutation = useCreateRequest();

  const [formData, setFormData] = useState<CreateArchitectureRequest & {
    operationalImpactLevel?: string;
    operationalImpactDetails?: string;
  }>({
    title: "",
    description: "",
    businessUnit: "",
    sponsorProductOwner: "",
    solutionArchitect: "",
    requestType: "new_application",
    businessContext: "",
    businessValueHypothesis: [],
    businessCriticality: "business_operational",
    costEstimate: "small",
    inScopeRegions: [],
    expectedUserBase: "",
    deploymentModel: "tbd",
    targetGoLiveDate: "",

    securityImpactLevel: "none",
    securityImpactDetails: "",
    dataImpactLevel: "none",
    dataImpactDetails: "",
    integrationImpactLevel: "none",
    integrationImpactDetails: "",
    regulatoryImpactLevel: "none",
    regulatoryImpactDetails: "",
    aiImpactLevel: "none",
    aiImpactDetails: "",
    operationalImpactLevel: "none",
    operationalImpactDetails: "",

    submittedBy: "Jane Doe",
    priority: "medium",
  });

  const [regionInput, setRegionInput] = useState("");

  const [contextAnswers, setContextAnswers] = useState<ContextAnswers>({
    q1: "", q2: "", q3: "", q4: ""
  });

  const [impactAnswers, setImpactAnswers] = useState<ImpactAnswers>({
    security: { ...EMPTY_AREA },
    data: { ...EMPTY_AREA },
    integration: { ...EMPTY_AREA },
    regulatory: { ...EMPTY_AREA },
    ai: { ...EMPTY_AREA },
  });

  const [operationalAnswers, setOperationalAnswers] = useState<OperationalReadinessAnswers>({
    q1: { ...EMPTY_OP }, q2: { ...EMPTY_OP }, q3: { ...EMPTY_OP }, q4: { ...EMPTY_OP },
  });

  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const [linkedLeanix, setLinkedLeanix] = useState<LeanixInitiative | null>(null);

  const { data: leanixInitiatives } = useQuery<LeanixInitiative[]>({
    queryKey: ['/api/leanix/initiatives'],
    queryFn: () => fetch('/api/leanix/initiatives').then(res => res.json())
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const leanixIdStr = params.get('leanixId');
    if (leanixIdStr && leanixInitiatives) {
      const leanixId = parseInt(leanixIdStr, 10);
      const initiative = leanixInitiatives.find(i => i.id === leanixId);
      if (initiative) {
        setLinkedLeanix(initiative);
        setFormData(prev => ({
          ...prev,
          title: prev.title || initiative.name
        }));
      }
    }
  }, [leanixInitiatives]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = regionInput.trim();
      if (val && !formData.inScopeRegions?.includes(val)) {
        setFormData(prev => ({
          ...prev,
          inScopeRegions: [...(prev.inScopeRegions || []), val]
        }));
      }
      setRegionInput("");
    }
  };

  const removeRegion = (r: string) => {
    setFormData(prev => ({
      ...prev,
      inScopeRegions: prev.inScopeRegions?.filter(region => region !== r)
    }));
  };

  const handleBusinessValueHypothesisToggle = (value: string) => {
    setFormData(prev => {
      const current = prev.businessValueHypothesis || [];
      if (current.includes(value)) {
        return { ...prev, businessValueHypothesis: current.filter(v => v !== value) };
      } else {
        return { ...prev, businessValueHypothesis: [...current, value] };
      }
    });
  };

  const setImpactLevel = (area: string, level: string) => {
    setFormData(prev => ({ ...prev, [`${area}ImpactLevel`]: level }));
  };

  const handleAnswer = (area: string, q: typeof ALL_Q_KEYS[number], value: string) => {
    setImpactAnswers(prev => ({ ...prev, [area]: { ...prev[area], [q]: value } }));
    if (analysisComplete) setAnalysisComplete(false);
  };

  const handleRemarks = (area: string, value: string) => {
    setImpactAnswers(prev => ({ ...prev, [area]: { ...prev[area], remarks: value } }));
    if (analysisComplete) setAnalysisComplete(false);
  };

  const handleContextAnswer = (q: keyof ContextAnswers, value: string) => {
    setContextAnswers(prev => ({ ...prev, [q]: value }));
    if (analysisComplete) setAnalysisComplete(false);
  };

  const handleOperationalAnswer = (
    q: keyof OperationalReadinessAnswers,
    field: "value" | "details",
    val: string
  ) => {
    setOperationalAnswers(prev => ({ ...prev, [q]: { ...prev[q], [field]: val } }));
    if (analysisComplete) setAnalysisComplete(false);
  };

  const handleAnalyseImpact = async () => {
    setIsAnalysing(true);
    setAnalysisError(null);
    try {
      const res = await fetch("/api/impact-assessment/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestTitle: formData.title,
          requestDescription: formData.description,
          answers: impactAnswers,
          contextAnswers,
          operationalAnswers,
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Analysis failed");
      }
      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        securityImpactLevel: data.securityImpactLevel,
        securityImpactDetails: data.securityImpactDetails,
        dataImpactLevel: data.dataImpactLevel,
        dataImpactDetails: data.dataImpactDetails,
        integrationImpactLevel: data.integrationImpactLevel,
        integrationImpactDetails: data.integrationImpactDetails,
        regulatoryImpactLevel: data.regulatoryImpactLevel,
        regulatoryImpactDetails: data.regulatoryImpactDetails,
        aiImpactLevel: data.aiImpactLevel,
        aiImpactDetails: data.aiImpactDetails,
        operationalImpactLevel: data.operationalImpactLevel,
        operationalImpactDetails: data.operationalImpactDetails,
      }));
      setAnalysisComplete(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setAnalysisError(msg);
    } finally {
      setIsAnalysing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const totalAnswered = IMPACT_AREA_CONFIG.reduce((sum, a) => {
    const ans = impactAnswers[a.key];
    const qKeys = ALL_Q_KEYS.slice(0, a.questions.length);
    return sum + qKeys.filter(k => ans[k]).length;
  }, 0);
  const totalQuestions = IMPACT_AREA_CONFIG.reduce((sum, a) => sum + a.questions.length, 0);
  const hasAnswers = totalAnswered > 0;

  const allContextAnswered = (["q1", "q2", "q3", "q4"] as const).every(k => !!contextAnswers[k]);

  const allDomainQuestionsAnswered = IMPACT_AREA_CONFIG.every(a => {
    const ans = impactAnswers[a.key];
    return ALL_Q_KEYS.slice(0, a.questions.length).every(k => !!ans[k]);
  });

  const allOperationalAnswered = (["q1", "q2", "q3", "q4"] as const).every(
    k => operationalAnswers[k].value !== ""
  );

  const hasBlockingRemarks = IMPACT_AREA_CONFIG.some(a => {
    const ans = impactAnswers[a.key];
    const qKeys = ALL_Q_KEYS.slice(0, a.questions.length);
    const hasNotSure = qKeys.some(k => ans[k].toLowerCase() === "not sure");
    return hasNotSure && !ans.remarks.trim();
  });

  const canSubmit = allContextAnswered && allDomainQuestionsAnswered && allOperationalAnswered && !hasBlockingRemarks;

  const submitHint = !allContextAnswered
    ? "Please answer all 4 Solution Context questions."
    : !allDomainQuestionsAnswered
    ? "Please answer all impact domain questions across each section."
    : !allOperationalAnswered
    ? "Please answer all 4 Operational Readiness questions."
    : hasBlockingRemarks
    ? "Please add context for 'Not sure' answers before submitting."
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataWithAnswers = {
      ...formData,
      // All six domain answer objects stored in full for reviewer access
      securityImpactAnswers: JSON.stringify(impactAnswers.security),
      dataImpactAnswers: JSON.stringify(impactAnswers.data),
      integrationImpactAnswers: JSON.stringify(impactAnswers.integration),
      regulatoryImpactAnswers: JSON.stringify(impactAnswers.regulatory),
      // Full AI domain answers (q1–q8 + remarks); q2/q3/q4/q8 drive structured risk flags
      aiImpactAnswers: JSON.stringify(impactAnswers.ai),
      // Operational readiness Yes/No answers with details
      operationalImpactAnswers: JSON.stringify(operationalAnswers),
      // Solution Context (non-scored, stored for reviewer reference and AI calibration)
      contextAnswers: JSON.stringify(contextAnswers),
    };
    createMutation.mutate({ data: dataWithAnswers as CreateArchitectureRequest }, {
      onSuccess: (data) => {
        toast({ title: "Request Submitted", description: "Your architecture review request has been created." });
        setLocation(`/requests/${data.id}`);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to submit request.", variant: "destructive" });
      }
    });
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-12">
        <Button variant="ghost" size="sm" href="/requests" className="mb-6 -ml-4 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Requests
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Architecture Review Request (ARR)</h1>
          <p className="text-muted-foreground mt-2">Complete the intake form to initiate the Architecture Review Process.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* LEANIX LINKED BANNER */}
          {linkedLeanix && (
            <div className="mb-8 p-4 border border-orange-200 bg-orange-50/60 rounded-xl flex items-start gap-3">
              <div className="bg-[#FF6600] text-white p-1.5 rounded-lg shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">LeanIX Initiative Linked</span>
                  <span className="font-mono text-xs bg-orange-100 border border-orange-200 text-orange-800 px-2 py-0.5 rounded">
                    {linkedLeanix.leanixId.substring(0, 8)}…
                  </span>
                  <span className="text-xs bg-orange-100 border border-orange-200 text-orange-800 px-2 py-0.5 rounded">{linkedLeanix.status}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 leading-snug">{linkedLeanix.name}</p>
                {linkedLeanix.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{linkedLeanix.description}</p>
                )}
                {linkedLeanix.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {linkedLeanix.tags.slice(0, 5).map((t, i) => (
                      <span key={i} className="text-xs bg-white border border-orange-200 text-orange-700 px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLinkedLeanix(null)}
                className="text-orange-400 hover:text-orange-600 transition-colors shrink-0"
                aria-label="Remove LeanIX link"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* SECTION 1: REQUEST INFORMATION */}
          <Card className="mb-8 shadow-sm">
            <CardHeader>
              <CardTitle>1. Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label>Project/Initiative Name</Label>
                  <Input required name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Migration to AWS Cloud" />
                </div>

                <div className="md:col-span-2">
                  <Label>Project/Initiative Description</Label>
                  <Textarea required name="description" value={formData.description} onChange={handleChange} placeholder="Briefly describe the initiative..." />
                </div>

                <div>
                  <Label>Business Unit/Portfolio</Label>
                  <Select required name="businessUnit" value={formData.businessUnit} onChange={handleChange}>
                    <option value="">Select a business unit...</option>
                    <option value="Digital Agriculture">Digital Agriculture</option>
                    <option value="Digital Manufacturing">Digital Manufacturing</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="Legal">Legal</option>
                    <option value="Sustainability">Sustainability</option>
                    <option value="Supply Chain">Supply Chain</option>
                  </Select>
                </div>

                <div>
                  <Label>Request Type</Label>
                  <Select name="requestType" value={formData.requestType} onChange={handleChange}>
                    <option value="new_application">New Application</option>
                    <option value="major_enhancement">Major Enhancement</option>
                    <option value="new_capability">New Capability</option>
                    <option value="cloud_migration">Cloud Migration</option>
                    <option value="application_replacement">Application Replacement</option>
                    <option value="application_decommissioning">Application Decommissioning</option>
                    <option value="technology_selection">Technology Selection</option>
                  </Select>
                </div>

                <div>
                  <Label>Sponsor / Product Owner</Label>
                  <Input name="sponsorProductOwner" value={formData.sponsorProductOwner || ""} onChange={handleChange} placeholder="Name" />
                </div>

                <div>
                  <Label>Solution Architect</Label>
                  <Input name="solutionArchitect" value={formData.solutionArchitect || ""} onChange={handleChange} placeholder="Name (if assigned)" />
                </div>

                <div className="md:col-span-2">
                  <Label>Business Context</Label>
                  <Textarea name="businessContext" value={formData.businessContext || ""} onChange={handleChange} placeholder="Describe the problem statement and anticipated business value..." className="min-h-[120px]" />
                </div>

                <div className="md:col-span-2">
                  <Label className="mb-3">Business Value Hypothesis</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'increased_revenue', label: 'Increased Revenue' },
                      { id: 'reduced_costs', label: 'Reduced Costs' },
                      { id: 'reduced_risk', label: 'Reduced Risk' },
                      { id: 'improved_experience', label: 'Improved Experience' },
                    ].map((item) => (
                      <label key={item.id} className="flex items-center space-x-3 p-3 border border-border rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors">
                        <input type="checkbox" checked={formData.businessValueHypothesis?.includes(item.id)} onChange={() => handleBusinessValueHypothesisToggle(item.id)} className="w-4 h-4 rounded text-primary focus:ring-primary/20" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Business Criticality</Label>
                  <Select name="businessCriticality" value={formData.businessCriticality || ""} onChange={handleChange}>
                    <option value="mission_critical">Mission Critical</option>
                    <option value="business_critical">Business Critical</option>
                    <option value="business_operational">Business Operational</option>
                    <option value="administrative_service">Administrative Service</option>
                  </Select>
                </div>

                <div>
                  <Label>Cost T-Shirt Sizing</Label>
                  <Select name="costEstimate" value={formData.costEstimate || ""} onChange={handleChange}>
                    <option value="small">Small (&lt;100K CAD)</option>
                    <option value="medium">Medium (100K-500K CAD)</option>
                    <option value="large">Large (500K-1M CAD)</option>
                    <option value="xlarge">XLarge (&gt;1M CAD)</option>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>In-Scope Regions / Countries</Label>
                  <div className="space-y-3">
                    <Input placeholder="Type a region and press Enter or comma..." value={regionInput} onChange={(e) => setRegionInput(e.target.value)} onKeyDown={handleRegionKeyDown} />
                    {formData.inScopeRegions && formData.inScopeRegions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.inScopeRegions.map((region, i) => (
                          <div key={i} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                            {region}
                            <button type="button" onClick={() => removeRegion(region)} className="ml-1 text-muted-foreground hover:text-foreground transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Expected User Base</Label>
                  <Input name="expectedUserBase" value={formData.expectedUserBase || ""} onChange={handleChange} placeholder="e.g. 500 internal, 10,000 external" />
                </div>

                <div>
                  <Label>Target Go-Live Date</Label>
                  <Input type="date" name="targetGoLiveDate" value={formData.targetGoLiveDate || ""} onChange={handleChange} />
                </div>

                <div className="md:col-span-2">
                  <Label>Deployment Model</Label>
                  <Select name="deploymentModel" value={formData.deploymentModel || ""} onChange={handleChange}>
                    <option value="on_prem_datacenter">On-Prem (McCain Data Center)</option>
                    <option value="on_prem_plant">On-Prem (McCain Plant)</option>
                    <option value="saas">SaaS</option>
                    <option value="cloud_vendor">Cloud (Vendor Tenant)</option>
                    <option value="cloud_mccain">Cloud (McCain Tenant)</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="tbd">To be Defined</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: IMPACT ASSESSMENT */}
          <Card className="mb-8 shadow-sm">
            <CardHeader>
              <CardTitle>2. Impact Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/15 rounded-xl">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">AI-Assisted Impact Analysis</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Complete the Solution Context, all five impact domain sections, and the Operational Readiness questions.
                    When ready, click <strong>Analyse with AI</strong> — impact levels will be automatically derived for review.
                  </p>
                </div>
                {totalAnswered > 0 && (
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-muted-foreground">{totalAnswered}/{totalQuestions}</div>
                    <div className="text-xs font-medium text-primary">domain answered</div>
                  </div>
                )}
              </div>

              {/* Question cards */}
              <div className="space-y-5">
                {/* Solution Context (non-scored preamble) */}
                <SolutionContextCard
                  answers={contextAnswers}
                  onAnswer={handleContextAnswer}
                />

                {/* Five impact domains */}
                {IMPACT_AREA_CONFIG.map(area => (
                  <ImpactQuestionCard
                    key={area.key}
                    area={area}
                    answers={impactAnswers[area.key] as AreaAnswers}
                    onAnswer={(q, value) => handleAnswer(area.key, q, value)}
                    onRemarks={(value) => handleRemarks(area.key, value)}
                  />
                ))}

                {/* Operational Readiness */}
                <OperationalReadinessCard
                  answers={operationalAnswers}
                  onAnswer={handleOperationalAnswer}
                />
              </div>

              {/* Analyse button */}
              <div className="pt-2">
                {analysisError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Analysis failed: {analysisError}. Please try again.</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={handleAnalyseImpact}
                    disabled={isAnalysing || !hasAnswers || hasBlockingRemarks}
                    className="flex items-center gap-2 bg-primary text-primary-foreground"
                  >
                    {isAnalysing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Analysing…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyse with AI
                      </>
                    )}
                  </Button>
                  {analysisComplete && (
                    <button type="button" onClick={() => setAnalysisComplete(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Re-analyse
                    </button>
                  )}
                </div>
              </div>

              {/* Analysis results */}
              <AnimatePresence>
                {analysisComplete && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="flex items-center gap-2 pt-2">
                      <div className="flex-1 border-t border-border" />
                      <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-4 h-4" />
                        Impact levels derived — review below
                      </div>
                      <div className="flex-1 border-t border-border" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      The following impact levels have been derived from your answers and will be captured in the EA Triage section. Click <strong>Override</strong> on any card to adjust a level or edit the rationale.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {IMPACT_AREA_CONFIG.map(area => (
                        <DerivedImpactCard
                          key={area.key}
                          area={area}
                          level={formData[`${area.key}ImpactLevel` as keyof typeof formData] as ImpactLevel}
                          details={formData[`${area.key}ImpactDetails` as keyof typeof formData] as string}
                          onLevelChange={(level) => setImpactLevel(area.key, level)}
                          onDetailsChange={(value) => setFormData(prev => ({ ...prev, [`${area.key}ImpactDetails`]: value }))}
                        />
                      ))}
                      {/* Operational Readiness derived card */}
                      <DerivedImpactCard
                        area={OPERATIONAL_AREA_CONFIG}
                        level={(formData.operationalImpactLevel || "none") as ImpactLevel}
                        details={formData.operationalImpactDetails || ""}
                        onLevelChange={(level) => setFormData(prev => ({ ...prev, operationalImpactLevel: level }))}
                        onDetailsChange={(value) => setFormData(prev => ({ ...prev, operationalImpactDetails: value }))}
                      />
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                      <ChevronRight className="w-4 h-4 shrink-0" />
                      These levels are now saved and will be visible to the EA team in the Triage section once submitted.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* SECTION 3: SUBMITTED BY */}
          <Card className="mb-8 shadow-sm">
            <CardHeader>
              <CardTitle>3. Submitted By</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Submitter Name</Label>
                  <Input required name="submittedBy" value={formData.submittedBy} onChange={handleChange} />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select name="priority" value={formData.priority} onChange={handleChange}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col items-end gap-2">
            {submitHint && (
              <p className="text-sm text-amber-600 dark:text-amber-400">{submitHint}</p>
            )}
            <div className="flex gap-4">
              <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || !canSubmit} className="px-8">
                {createMutation.isPending ? "Submitting..." : "Submit ARR"}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </Layout>
  );
}
