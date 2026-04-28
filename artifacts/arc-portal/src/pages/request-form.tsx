import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Select, Label, Badge } from "@/components/ui-primitives";
import { useCreateRequest } from "@workspace/api-client-react";
import type { CreateArchitectureRequest } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, X, Search, Sparkles, Shield, Database, GitBranch, Scale, Bot, CheckCircle2, AlertCircle, ChevronRight, RotateCcw, MessageSquare, ExternalLink } from "lucide-react";
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
        question: "Who will access this system, and by what means?",
        options: [
          "Internal employees only, through the existing corporate identity provider",
          "Internal employees plus a controlled set of external partners or contractors",
          "Customers or members of the public via the internet",
          "A broad mix of internal staff and external users across multiple channels",
          "Not sure"
        ]
      },
      {
        question: "Will the system store, transmit, or process sensitive, personal, or regulated data?",
        options: [
          "No — publicly available or non-sensitive information only",
          "General internal business data (non-sensitive operational records)",
          "Sensitive internal data such as employee records or commercially confidential information",
          "Highly sensitive or regulated data (PII, payment card data, health records, or credentials)",
          "Not sure"
        ]
      },
      {
        question: "Does the solution introduce new authentication mechanisms, identity providers, or connections to external networks or third-party systems?",
        showPatternsLink: true,
        options: [
          "No — no changes to existing authentication or external connectivity",
          "A minor change using existing approved patterns",
          "A new identity provider, SSO integration, or authentication mechanism",
          "A new external network connection or integration with a third-party system outside the corporate perimeter",
          "Not sure"
        ]
      },
      {
        question: "What is the expected network exposure of this system?",
        options: [
          "Fully internal — accessible only within the corporate network",
          "Partially restricted — accessible to specific external parties via VPN or IP allowlisting",
          "Partially internet-facing — some public-facing endpoints alongside internal components",
          "Fully public-facing — accessible from the open internet without network-level restrictions",
          "Not sure"
        ]
      },
      {
        question: "How will data be protected at rest and in transit?",
        options: [
          "No sensitive data stored or transmitted — encryption not required",
          "Data in transit is encrypted using standard TLS; no sensitive data stored at rest",
          "Encryption in transit (TLS) and at rest using platform-managed keys",
          "Encryption in transit and at rest using customer-managed or bring-your-own keys (BYOK/CMK)",
          "Not sure"
        ]
      },
      {
        question: "Does this system require privileged or elevated access beyond standard user permissions?",
        options: [
          "No — all users operate with standard business application permissions",
          "Minor elevation required for a small number of administrators using existing controls",
          "Privileged access required for system administrators or service accounts, managed through existing PAM tooling",
          "Significant privileged access with no current privileged access management (PAM) controls in place",
          "Not sure"
        ]
      },
      {
        question: "What is the approach to security monitoring, event logging, and alerting for this system?",
        options: [
          "No specific monitoring required — low-risk internal system",
          "Standard application and infrastructure logging through existing enterprise tooling",
          "Enhanced security event logging integrated into the SIEM, with defined alert thresholds",
          "Real-time threat detection, automated alerting, and SOC integration required",
          "Not sure"
        ]
      },
      {
        question: "Does this system rely on third-party software packages, open-source components, or vendor-managed services?",
        showPatternsLink: true,
        options: [
          "No third-party or open-source dependencies",
          "Standard commercial software or SaaS with a current enterprise agreement",
          "Open-source components or third-party packages included in the software supply chain",
          "Significant reliance on third-party or open-source components with no existing supply chain risk assessment",
          "Not sure"
        ]
      },
      {
        question: "How are secrets, credentials, and cryptographic keys managed for this system?",
        options: [
          "No secrets or credentials required — system does not authenticate to other services",
          "Secrets managed through the existing approved secret management platform (e.g. Vault, Key Vault, Secrets Manager)",
          "Secrets stored in application configuration or environment variables without a centralised secret manager",
          "Hardcoded or manually distributed credentials with no automated rotation",
          "Not sure"
        ]
      },
      {
        question: "What is the planned security testing and review posture for this system before go-live?",
        options: [
          "No formal security testing required — low-risk internal system with no sensitive data or external exposure",
          "Standard SDLC security practices (e.g. SAST, dependency scanning) as part of the CI/CD pipeline",
          "Structured security review by the internal security team, including threat modelling",
          "Independent penetration test or third-party security assessment required before go-live",
          "Not sure"
        ]
      }
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
        question: "What is the highest classification of data this system will store or process?",
        options: [
          "Public — no restrictions on access or disclosure",
          "Internal — suitable for internal use but not for public release",
          "Confidential — restricted access within the organisation (e.g. employee records, strategic plans)",
          "Regulated or highly sensitive — subject to legal obligations (e.g. PII, health records, payment data)",
          "Not sure"
        ]
      },
      {
        question: "Are there data residency, sovereignty, or legal jurisdiction constraints on where this data can be stored or processed?",
        showPatternsLink: true,
        options: [
          "No constraints — data can be stored or processed anywhere",
          "Soft preference for local storage but no legal or contractual requirement",
          "Regulatory or contractual requirement to keep data within specific countries or regions",
          "Strict government or legal mandate with enforcement consequences for non-compliance",
          "Not sure"
        ]
      },
      {
        question: "Will data be shared or integrated across multiple business units, or used in enterprise-wide reporting or analytics?",
        showPatternsLink: true,
        options: [
          "No — the system operates within a single team or business function",
          "Limited sharing within one business unit only",
          "Data is shared across departments or integrated into cross-functional reporting",
          "The system is a major data platform or enterprise analytics capability",
          "Not sure"
        ]
      },
      {
        question: "What is the expected data volume and how long must data be retained?",
        options: [
          "Small volume with short-term retention (less than 1 year)",
          "Moderate volume with standard retention (1–5 years)",
          "Large volume or extended retention (5+ years)",
          "Very large volume with mandatory long-term or regulatory retention requirements",
          "Not sure"
        ]
      },
      {
        question: "Will data be shared with or accessible by parties outside the organisation?",
        options: [
          "No — data remains entirely within the organisation",
          "Shared only with pre-approved internal teams or subsidiaries",
          "Shared with trusted external partners under a formal data-sharing agreement",
          "Accessible by or shared with government bodies, regulators, or public entities",
          "Not sure"
        ]
      }
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
        question: "How many other systems will this solution connect to, and are any of them outside the organisation?",
        options: [
          "None — the solution operates in complete isolation",
          "One or two internal systems using existing approved methods",
          "Three or more internal systems, or a single external connection",
          "Multiple systems including external parties such as suppliers, customers, or government agencies",
          "Not sure"
        ]
      },
      {
        question: "How will data flow between this system and the systems it connects to?",
        showPatternsLink: true,
        options: [
          "No data movement — the system does not exchange data with other systems",
          "Scheduled batch transfers (e.g. nightly file drops or periodic extracts)",
          "Near real-time or event-triggered data flows",
          "Continuous high-frequency event streaming",
          "Not sure"
        ]
      },
      {
        question: "Does this solution introduce integration patterns that are new to the organisation or deviate from approved standards?",
        showPatternsLink: true,
        options: [
          "No — it uses only existing approved integration patterns and middleware",
          "A minor variation of an existing approved pattern",
          "A new approach aligned with industry standards but not yet used here",
          "A bespoke or non-standard integration approach with no existing precedent",
          "Not sure"
        ]
      },
      {
        question: "What is the business impact if an integration between this system and a connected system fails?",
        options: [
          "Negligible — the system functions independently if connections are unavailable",
          "Minor inconvenience — users can retry or manually work around the issue",
          "Significant disruption — a key business process is delayed or degraded",
          "Critical failure — a core business process stops and cannot continue",
          "Not sure"
        ]
      },
      {
        question: "Does this solution need to connect to legacy systems, operational technology (OT), plant equipment, or industrial control systems?",
        options: [
          "No — all connected systems are modern and cloud- or network-compatible",
          "Mostly modern systems with one or two legacy components",
          "Significant involvement of legacy or on-premises systems requiring special technical handling",
          "Direct integration with OT systems, plant equipment, or industrial control systems",
          "Not sure"
        ]
      }
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
        question: "Which category of regulation most closely applies to this system?",
        showPatternsLink: true,
        options: [
          "None — no external regulatory obligations apply to this system",
          "Internal governance only — must comply with company policies and standards",
          "Industry standards or certification frameworks (e.g. ISO, SOC 2, food safety standards)",
          "Government legislation or regulatory requirements (e.g. Privacy Act, GDPR, financial regulations)",
          "Not sure"
        ]
      },
      {
        question: "Will this system give rise to new compliance obligations — such as mandatory notifications, auditable controls, certifications, or reporting to regulators or auditors?",
        options: [
          "No new obligations — existing controls and reporting are sufficient",
          "Some additional internal controls or documentation will be required",
          "New external reporting, certification, or audit obligations will be introduced",
          "Formal regulatory approval or licence required before the system can go live",
          "Not sure"
        ]
      },
      {
        question: "Does this initiative operate across multiple countries or jurisdictions with differing regulatory requirements?",
        options: [
          "No — single country and jurisdiction only",
          "Multiple regions within the same country",
          "Multiple countries with broadly comparable regulatory requirements",
          "Multiple countries with significantly different or conflicting regulatory requirements",
          "Not sure"
        ]
      },
      {
        question: "What would be the consequence if this system were found to be non-compliant?",
        options: [
          "Low — an internal governance matter handled through normal processes",
          "Moderate — reputational damage or breach of contract with a partner or customer",
          "High — regulatory fines, financial penalties, or loss of certification",
          "Severe — legal action, inability to operate, or direct harm to individuals",
          "Not sure"
        ]
      },
      {
        question: "How mature is the organisation's current compliance capability in the area this system touches?",
        options: [
          "Well established — robust controls, processes, and expertise already in place",
          "Partially established — some capability exists but gaps remain",
          "Limited — significant uplift to controls and processes will be required",
          "Not established — this is a new compliance domain with no existing capability",
          "Not sure"
        ]
      }
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
        question: "Will this system incorporate artificial intelligence or machine learning functionality?",
        showPatternsLink: true,
        options: [
          "No AI",
          "Vendor off-the-shelf feature",
          "Custom-built or internally trained model",
          "AI is the primary function",
          "Not sure"
        ]
      },
      {
        question: "How is the AI capability being sourced or developed?",
        options: [
          "Not applicable — no AI",
          "Vendor-provided AI used off the shelf (embedded feature, API or SaaS)",
          "Open-source model integrated and deployed internally",
          "Custom-built or internally trained model",
          "Hybrid combination",
          "Not sure"
        ]
      },
      {
        question: "What data will the AI use for training or inference, and does it include personal or sensitive company data?",
        options: [
          "Not applicable — no AI",
          "Public or fully synthetic data only",
          "Anonymised or aggregated internal data",
          "Identifiable internal business data",
          "Customer personal data or PII",
          "Not sure"
        ]
      },
      {
        question: "Will AI-generated outputs directly trigger automated actions or decisions without human review?",
        options: [
          "Not applicable — no AI",
          "No — outputs are informational only",
          "Partially — humans review significant decisions",
          "Yes — limited or no human oversight",
          "Not sure"
        ]
      },
      {
        question: "How serious would the consequences be if the AI produced an incorrect or biased output?",
        options: [
          "Minimal",
          "Moderate — operational disruption",
          "Significant — financial, reputational or customer harm",
          "Severe — legal liability, safety risk or regulatory breach",
          "Not sure"
        ]
      },
      {
        question: "Is the AI system's decision-making process explainable and subject to audit?",
        showPatternsLink: true,
        options: [
          "Not applicable — no AI",
          "Yes — full audit trail and explainability built in",
          "Partial — some logging but limited explainability",
          "No — black box with no explainability",
          "Not sure"
        ]
      },
      {
        question: "Is there a plan for monitoring model performance, detecting drift, and managing retraining or updates?",
        options: [
          "Not applicable — no AI",
          "Yes — formal MLOps or model governance process in place or planned",
          "Partial — some monitoring exists but no formal drift detection or retraining",
          "No — no monitoring or model maintenance plan",
          "Not sure"
        ]
      },
      {
        question: "Are there specific AI-related regulations or policies that apply to this use case?",
        options: [
          "Not applicable — no AI",
          "No known AI-specific regulations (standard data and privacy rules apply)",
          "Sector-specific AI guidance applies (e.g. financial services, healthcare)",
          "Specific AI legislation applies (e.g. EU AI Act, algorithmic accountability laws)",
          "Uncertain — legal or compliance review needed",
          "Not sure"
        ]
      }
    ]
  }
];

type ImpactLevel = "none" | "low" | "medium" | "high";
type AreaAnswers = { q1: string; q2: string; q3: string; q4: string; q5: string; q6: string; q7: string; q8: string; q9: string; q10: string; remarks: string };
type ImpactAnswers = { [area: string]: AreaAnswers };

const EMPTY_AREA: AreaAnswers = { q1: UNSELECTED, q2: UNSELECTED, q3: UNSELECTED, q4: UNSELECTED, q5: UNSELECTED, q6: UNSELECTED, q7: UNSELECTED, q8: UNSELECTED, q9: UNSELECTED, q10: UNSELECTED, remarks: "" };

function ImpactQuestionCard({
  area,
  answers,
  onAnswer,
  onRemarks
}: {
  area: typeof IMPACT_AREA_CONFIG[0];
  answers: AreaAnswers;
  onAnswer: (q: "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7" | "q8" | "q9" | "q10", value: string) => void;
  onRemarks: (value: string) => void;
}) {
  const Icon = area.icon;
  const qKeys = (["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"] as const).slice(0, area.questions.length);
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

function DerivedImpactCard({
  area,
  level,
  details,
  onLevelChange,
  onDetailsChange
}: {
  area: typeof IMPACT_AREA_CONFIG[0];
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

export default function RequestForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createMutation = useCreateRequest();

  const [formData, setFormData] = useState<CreateArchitectureRequest>({
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

    submittedBy: "Jane Doe",
    priority: "medium",
  });

  const [regionInput, setRegionInput] = useState("");

  const [impactAnswers, setImpactAnswers] = useState<ImpactAnswers>({
    security: { ...EMPTY_AREA },
    data: { ...EMPTY_AREA },
    integration: { ...EMPTY_AREA },
    regulatory: { ...EMPTY_AREA },
    ai: { ...EMPTY_AREA }
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

  const handleAnswer = (area: string, q: "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7" | "q8" | "q9" | "q10", value: string) => {
    setImpactAnswers(prev => ({ ...prev, [area]: { ...prev[area], [q]: value } }));
    if (analysisComplete) setAnalysisComplete(false);
  };

  const handleRemarks = (area: string, value: string) => {
    setImpactAnswers(prev => ({ ...prev, [area]: { ...prev[area], remarks: value } }));
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
          answers: impactAnswers
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
        aiImpactDetails: data.aiImpactDetails
      }));
      setAnalysisComplete(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setAnalysisError(msg);
    } finally {
      setIsAnalysing(false);
    }
  };

  const ALL_Q_KEYS = ["q1","q2","q3","q4","q5","q6","q7","q8","q9","q10"] as const;
  const totalAnswered = IMPACT_AREA_CONFIG.reduce((sum, a) => {
    const ans = impactAnswers[a.key];
    const qKeys = ALL_Q_KEYS.slice(0, a.questions.length);
    return sum + qKeys.filter(k => ans[k]).length;
  }, 0);
  const totalQuestions = IMPACT_AREA_CONFIG.reduce((sum, a) => sum + a.questions.length, 0);
  const hasAnswers = totalAnswered > 0;
  const hasBlockingRemarks = IMPACT_AREA_CONFIG.some(a => {
    const ans = impactAnswers[a.key];
    const qKeys = ALL_Q_KEYS.slice(0, a.questions.length);
    const hasNotSure = qKeys.some(k => ans[k] === "Not sure");
    return hasNotSure && !ans.remarks.trim();
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: formData }, {
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
          {/* LEANIX LINKED BANNER — shown when form opened via Submit ARR from Initiatives page */}
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
                    Select an option for each question across the five impact areas. Add any additional remarks where helpful. When ready, click <strong>Analyse with AI</strong> — impact levels will be automatically derived and populated into the EA Triage section for review.
                  </p>
                </div>
                {totalAnswered > 0 && (
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-muted-foreground">{totalAnswered}/{totalQuestions}</div>
                    <div className="text-xs font-medium text-primary">answered</div>
                  </div>
                )}
              </div>

              {/* Question cards */}
              <div className="space-y-5">
                {IMPACT_AREA_CONFIG.map(area => (
                  <ImpactQuestionCard
                    key={area.key}
                    area={area}
                    answers={impactAnswers[area.key] as AreaAnswers}
                    onAnswer={(q, value) => handleAnswer(area.key, q, value)}
                    onRemarks={(value) => handleRemarks(area.key, value)}
                  />
                ))}
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
                          level={formData[`${area.key}ImpactLevel` as keyof CreateArchitectureRequest] as ImpactLevel}
                          details={formData[`${area.key}ImpactDetails` as keyof CreateArchitectureRequest] as string}
                          onLevelChange={(level) => setImpactLevel(area.key, level)}
                          onDetailsChange={(value) => setFormData(prev => ({ ...prev, [`${area.key}ImpactDetails`]: value }))}
                        />
                      ))}
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

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="px-8">
              {createMutation.isPending ? "Submitting..." : "Submit ARR"}
            </Button>
          </div>
        </form>
      </motion.div>
    </Layout>
  );
}
