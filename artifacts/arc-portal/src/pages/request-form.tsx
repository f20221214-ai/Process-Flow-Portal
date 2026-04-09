import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Select, Label, Badge } from "@/components/ui-primitives";
import { useCreateRequest } from "@workspace/api-client-react";
import type { CreateArchitectureRequest } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, X, Layers, ChevronDown, Search, Sparkles, Shield, Database, GitBranch, Scale, Bot, CheckCircle2, AlertCircle, ChevronRight, RotateCcw, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { JiraInitiative } from "@workspace/api-client-react";

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
        question: "Who will use this system?",
        options: [
          "Internal employees only (via existing corporate login)",
          "Internal employees + small number of external partners (controlled access)",
          "Customers or members of the public (internet-accessible)",
          "Mixed internal and broad external user base"
        ]
      },
      {
        question: "Will it store or handle sensitive data (passwords, PII, health records, payment card data)?",
        options: [
          "No — public or non-sensitive information only",
          "Internal business data only (no PII or financial data)",
          "Sensitive internal data (e.g. employee records, confidential documents)",
          "Highly sensitive data (PII, payment cards, health records, passwords)"
        ]
      },
      {
        question: "Does it introduce new login methods or connect company systems to external networks?",
        options: [
          "No new authentication methods or external connections",
          "Minor change to existing access or login approach",
          "New authentication method or identity provider",
          "New connection to external network or third-party system"
        ]
      },
      {
        question: "Will the system be accessible from the internet (public-facing)?",
        options: [
          "No — internal corporate network only",
          "Limited — accessible to specific external parties via VPN or whitelist",
          "Partially internet-accessible (some public endpoints)",
          "Fully public-facing application"
        ]
      },
      {
        question: "Does this system require security testing or certification before go-live?",
        options: [
          "No security testing or certification required",
          "Internal security review only",
          "Penetration testing or vulnerability assessment required",
          "External security audit or compliance certification (e.g. ISO 27001, SOC 2)"
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
        question: "What type of data will this system store or process?",
        options: [
          "Publicly available information only",
          "Non-sensitive internal operational data (e.g. product lists, reports)",
          "Sensitive internal data (e.g. employee records, confidential business data)",
          "Customer PII, financial records, or regulated health data"
        ]
      },
      {
        question: "Will it handle personal information (PII), financial records, or data with legal residency requirements?",
        options: [
          "No — no PII, financial data, or residency obligations",
          "Some internal staff data only",
          "Customer or supplier personal data",
          "Regulated financial data, health records, or strict data residency requirements"
        ]
      },
      {
        question: "Will data be shared or analysed across multiple business departments?",
        options: [
          "No cross-department data sharing",
          "Limited sharing within one business unit",
          "Cross-department data integration or reporting",
          "Enterprise-wide analytics platform or major new data capability"
        ]
      },
      {
        question: "What is the expected data volume and how long must data be retained?",
        options: [
          "Small volume, short-term retention (less than 1 year)",
          "Moderate volume, standard retention (1–5 years)",
          "Large volume or long-term retention (5+ years)",
          "Very large volume with regulatory retention requirements"
        ]
      },
      {
        question: "Will data be shared with or accessible by third parties (vendors, partners, government)?",
        options: [
          "No third-party data sharing",
          "Shared with approved internal teams only",
          "Shared with trusted external partners under data-sharing agreement",
          "Shared with or accessible by government or public entities"
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
        question: "How many systems will this connect to, and are any external to the company?",
        options: [
          "None — the system operates completely independently",
          "1–2 internal systems only, using existing approved methods",
          "3–5 internal systems, or one external connection",
          "Multiple systems including external parties (suppliers, customers, or government)"
        ]
      },
      {
        question: "How will data move between systems?",
        options: [
          "No data movement between systems",
          "Scheduled batch transfers only (e.g. nightly file drops)",
          "Near real-time or event-triggered data flows",
          "Fully real-time, high-frequency event streaming"
        ]
      },
      {
        question: "Does this introduce new or non-standard integration methods?",
        options: [
          "No — uses existing approved integration patterns only",
          "Minor variation on existing patterns",
          "New approach but based on industry standards",
          "Entirely new or bespoke integration method"
        ]
      },
      {
        question: "What happens to the business if an integration connection fails?",
        options: [
          "No impact — the system works independently",
          "Minor inconvenience — users can retry or wait",
          "Significant delay to business operations",
          "Critical business process stops immediately"
        ]
      },
      {
        question: "Do any of the systems being integrated involve older or legacy technology?",
        options: [
          "All systems are modern or cloud-based",
          "Mostly modern, with one or two legacy components",
          "Significant legacy system involvement",
          "Primarily legacy systems requiring special technical handling"
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
        question: "Which laws, regulations, or industry standards must this system comply with?",
        options: [
          "None — no regulatory obligations apply",
          "Internal company policies and guidelines only",
          "Industry standards or certifications (e.g. ISO, SOC 2, quality management)",
          "Government legislation (e.g. Privacy Act, GDPR, food safety laws, financial regulations)"
        ]
      },
      {
        question: "Will this affect financial reporting, external audits, or require compliance certifications?",
        options: [
          "No financial reporting or audit impact",
          "Affects internal financial tracking or management reporting only",
          "Affects external audit or regulatory reporting",
          "Requires regulatory certification or formal approval before go-live"
        ]
      },
      {
        question: "What would happen if the system were non-compliant?",
        options: [
          "Internal policy issue — handled through normal governance",
          "Reputational or contractual risk with partners",
          "Financial penalties or regulatory fines are possible",
          "Legal action, government sanctions, or inability to operate the business"
        ]
      },
      {
        question: "Does this initiative operate across multiple countries with different regulatory requirements?",
        options: [
          "Single country, single jurisdiction",
          "Multiple regions within one country",
          "Multiple countries with broadly similar regulations",
          "Multiple countries with significantly different regulatory requirements"
        ]
      },
      {
        question: "How established is the organisation's current compliance capability in this area?",
        options: [
          "Well established — controls, processes, and expertise already in place",
          "Partially established — some gaps exist but foundation is there",
          "Limited — significant capability uplift needed",
          "Not established — starting from scratch with no existing capability"
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
        question: "Will this system use any artificial intelligence or machine learning?",
        options: [
          "No AI or ML features whatsoever",
          "Vendor-provided AI feature (e.g. smart search, autocomplete) — off the shelf",
          "Custom ML models, generative AI, or AI-driven recommendations",
          "AI is the core function — the system primarily operates through AI/ML"
        ]
      },
      {
        question: "How are AI-generated outputs used?",
        options: [
          "Not applicable — no AI",
          "AI outputs are informational only; humans always decide and approve",
          "AI outputs inform automated processes but significant human oversight exists",
          "AI outputs trigger automated actions with limited or no human review"
        ]
      },
      {
        question: "How serious would the consequences be if the AI made an error?",
        options: [
          "Minimal — minor inconvenience with easy correction",
          "Moderate — operational disruption or efficiency loss",
          "Significant — financial loss, reputational damage, or customer harm",
          "Severe — legal liability, health/safety risk, or regulatory breach"
        ]
      },
      {
        question: "Will the AI system use or be trained on company or customer data?",
        options: [
          "No — no company or customer data is used",
          "Uses anonymised or aggregated internal data only",
          "Uses identifiable internal business data",
          "Uses customer PII or sensitive regulated data for training or inference"
        ]
      },
      {
        question: "Is the AI's decision-making process explainable and auditable?",
        options: [
          "Not applicable — no AI",
          "Yes — full audit trail and explainability is built in",
          "Partial — some logging exists but explainability is limited",
          "No — black-box model with no explainability or audit mechanism"
        ]
      }
    ]
  }
];

type ImpactLevel = "none" | "low" | "medium" | "high";
type AreaAnswers = { q1: string; q2: string; q3: string; q4: string; q5: string; remarks: string };
type ImpactAnswers = { [area: string]: AreaAnswers };

const EMPTY_AREA: AreaAnswers = { q1: UNSELECTED, q2: UNSELECTED, q3: UNSELECTED, q4: UNSELECTED, q5: UNSELECTED, remarks: "" };

function ImpactQuestionCard({
  area,
  answers,
  onAnswer,
  onRemarks
}: {
  area: typeof IMPACT_AREA_CONFIG[0];
  answers: AreaAnswers;
  onAnswer: (q: "q1" | "q2" | "q3" | "q4" | "q5", value: string) => void;
  onRemarks: (value: string) => void;
}) {
  const Icon = area.icon;
  const qKeys: ("q1" | "q2" | "q3" | "q4" | "q5")[] = ["q1", "q2", "q3", "q4", "q5"];

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
        {qKeys.map((qKey, i) => (
          <div key={qKey}>
            <Label className="text-xs font-medium mb-1.5 leading-snug block text-foreground/80">
              {i + 1}. {area.questions[i].question}
            </Label>
            <select
              value={answers[qKey]}
              onChange={e => onAnswer(qKey, e.target.value)}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 ${
                answers[qKey]
                  ? "border-border text-foreground"
                  : "border-border/60 text-muted-foreground"
              }`}
            >
              <option value="">— Select an option —</option>
              {area.questions[i].options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ))}

        <div className="pt-1 border-t border-border/40">
          <div className="flex items-center gap-1.5 mb-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
            <Label className="text-xs font-medium text-muted-foreground">Additional comments or remarks (optional)</Label>
          </div>
          <Textarea
            value={answers.remarks}
            onChange={e => onRemarks(e.target.value)}
            placeholder="Any additional context, constraints, or details that should be considered when assessing this impact area…"
            className="min-h-[72px] text-sm"
          />
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
    jiraInitiativeId: null
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

  const { data: initiatives, isLoading: isLoadingJira } = useQuery<JiraInitiative[]>({
    queryKey: ['/api/jira/initiatives'],
    queryFn: () => fetch('/api/jira/initiatives').then(res => res.json())
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jiraIdStr = params.get('jiraId');
    if (jiraIdStr && initiatives) {
      const jiraId = parseInt(jiraIdStr, 10);
      const initiative = initiatives.find(i => i.id === jiraId);
      if (initiative) {
        setFormData(prev => ({
          ...prev,
          jiraInitiativeId: jiraId,
          title: prev.title || initiative.summary
        }));
      }
    }
  }, [initiatives]);

  const selectedInitiative = initiatives?.find(i => i.id === formData.jiraInitiativeId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleJiraSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const jiraId = value ? parseInt(value, 10) : null;
    setFormData(prev => {
      const newData = { ...prev, jiraInitiativeId: jiraId };
      if (jiraId && initiatives) {
        const initiative = initiatives.find(i => i.id === jiraId);
        if (initiative && !prev.title) {
          newData.title = initiative.summary;
        }
      }
      return newData;
    });
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

  const handleAnswer = (area: string, q: "q1" | "q2" | "q3" | "q4" | "q5", value: string) => {
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

  const totalAnswered = IMPACT_AREA_CONFIG.reduce((sum, a) => {
    const ans = impactAnswers[a.key];
    return sum + (["q1","q2","q3","q4","q5"] as const).filter(k => ans[k]).length;
  }, 0);
  const totalQuestions = IMPACT_AREA_CONFIG.length * 5;
  const hasAnswers = totalAnswered > 0;

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

  const InitiativeCombobox = ({ initiatives, jiraId, isLoading, onSelect }: {
    initiatives?: JiraInitiative[];
    jiraId: number | null | undefined;
    isLoading: boolean;
    onSelect: (initiative: JiraInitiative | null) => void;
  }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const filtered = initiatives?.filter(i =>
      `${i.jiraKey} ${i.summary} ${i.projectName}`.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

    const selected = initiatives?.find(i => i.id === jiraId) ?? null;

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div className="relative" ref={containerRef}>
        <div
          role="combobox"
          aria-expanded={open}
          className="flex items-center border border-border rounded-xl px-3 py-2.5 cursor-pointer bg-background hover:border-primary/50 transition-colors min-h-[42px]"
          onClick={() => setOpen(!open)}
        >
          <div className="flex-1 min-w-0">
            {selected ? (
              <div className="flex items-center gap-2">
                <Badge variant="primary" className="font-mono text-xs bg-blue-100 text-blue-800 border-blue-200 shrink-0">
                  {selected.jiraKey}
                </Badge>
                <span className="text-sm truncate">{selected.summary}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                {isLoading ? "Loading initiatives…" : "Select a JIRA initiative…"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {selected && (
              <button
                type="button"
                aria-label="Clear selection"
                onClick={(e) => { e.stopPropagation(); onSelect(null); setSearch(""); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </div>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-2 px-2">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by key, name, or project…"
                  className="flex-1 text-sm outline-none bg-transparent py-1"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-sm text-muted-foreground text-center">Loading initiatives…</div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">No initiatives match your search.</div>
              ) : (
                filtered.map(init => (
                  <button
                    key={init.id}
                    type="button"
                    onClick={() => { onSelect(init); setOpen(false); setSearch(""); }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-secondary transition-colors flex items-start gap-3 ${jiraId === init.id ? "bg-primary/5" : ""}`}
                  >
                    <Badge variant="primary" className="font-mono text-xs bg-blue-100 text-blue-800 border-blue-200 shrink-0 mt-0.5">
                      {init.jiraKey}
                    </Badge>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{init.summary}</div>
                      <div className="text-xs text-muted-foreground">{init.projectName} · {init.status}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
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
          {/* SECTION 0: JIRA INITIATIVE */}
          <Card className="mb-8 border-indigo-100 shadow-sm">
            <CardHeader className="bg-indigo-50/50 flex flex-row items-center gap-2">
              <div className="bg-blue-600 text-white p-1 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
              <CardTitle className="text-indigo-900">0. Linked JIRA Initiative</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Link to JIRA Initiative (Optional)</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select the JIRA epic or initiative this ARR relates to. This helps track architecture reviews alongside project delivery.
                </p>
                {isLoadingJira ? (
                  <div className="h-10 bg-secondary/50 rounded-xl animate-pulse"></div>
                ) : (
                  <Select value={formData.jiraInitiativeId?.toString() || ""} onChange={handleJiraSelect}>
                    <option value="">-- Select an initiative --</option>
                    {initiatives?.map(init => (
                      <option key={init.id} value={init.id}>
                        {init.jiraKey} - {init.summary} ({init.projectName})
                      </option>
                    ))}
                  </Select>
                )}
              </div>
              {selectedInitiative && (
                <div className="mt-4 p-4 border border-indigo-100 bg-indigo-50/30 rounded-xl relative">
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, jiraInitiativeId: null }))} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="primary" className="font-mono bg-blue-100 text-blue-800 border-blue-200">{selectedInitiative.jiraKey}</Badge>
                    <span className="text-sm font-semibold">{selectedInitiative.summary}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Project: {selectedInitiative.projectName}</span>
                    <span>Status: {selectedInitiative.status}</span>
                    {selectedInitiative.assignee && <span>Assignee: {selectedInitiative.assignee}</span>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 1: REQUEST INFORMATION */}
          <Card className="mb-8 shadow-sm">
            <CardHeader>
              <CardTitle>1. Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label>Project/Initiative Name</Label>
                  <p className="text-xs text-muted-foreground mb-1.5">Pick from a synced JIRA initiative below, or clear to enter a custom name.</p>
                  <InitiativeCombobox
                    initiatives={initiatives}
                    jiraId={formData.jiraInitiativeId}
                    isLoading={isLoadingJira}
                    onSelect={(initiative) => {
                      setFormData(prev => ({
                        ...prev,
                        jiraInitiativeId: initiative?.id ?? null,
                        title: initiative?.summary ?? ""
                      }));
                    }}
                  />
                  {!formData.jiraInitiativeId && (
                    <Input required name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Migration to AWS Cloud" className="mt-2" />
                  )}
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
                    disabled={isAnalysing || !hasAnswers}
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
