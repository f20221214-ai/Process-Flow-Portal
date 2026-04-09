import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui-primitives";
import {
  BookOpen, ChevronDown, ChevronUp, CheckCircle2, Clock, Users,
  FileText, Search, Calendar, ShieldCheck, ArrowRight, Layers,
  AlertTriangle, Zap, Info, BarChart3, HelpCircle, Sparkles
} from "lucide-react";

type TrackKey = "lightweight" | "standard" | "deep-dive";

const TRACKS: { key: TrackKey; label: string; activeClass: string; inactiveClass: string; badge: string; session: string; leadTime: string; icon: React.ElementType; when: string }[] = [
  {
    key: "lightweight",
    label: "Lightweight",
    icon: Zap,
    activeClass: "bg-emerald-600 text-white border-emerald-600 shadow-md",
    inactiveClass: "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
    session: "Async or 30-min",
    leadTime: "~5 business days",
    when: "Low overall risk. No new patterns, limited integration, and no regulatory or AI impact.",
  },
  {
    key: "standard",
    label: "Standard",
    icon: CheckCircle2,
    activeClass: "bg-blue-600 text-white border-blue-600 shadow-md",
    inactiveClass: "bg-white text-blue-700 border-blue-300 hover:bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    session: "60-min session",
    leadTime: "~10 business days",
    when: "Medium risk or business-critical. Some new patterns, moderate integration, or limited regulatory scope.",
  },
  {
    key: "deep-dive",
    label: "Deep Dive",
    icon: AlertTriangle,
    activeClass: "bg-rose-600 text-white border-rose-600 shadow-md",
    inactiveClass: "bg-white text-rose-700 border-rose-300 hover:bg-rose-50",
    badge: "bg-rose-100 text-rose-700",
    session: "90-min session",
    leadTime: "~15 business days",
    when: "High risk or mission-critical. New architecture pattern, high integration/security/regulatory/AI impact.",
  },
];

interface PhaseTrackData {
  sla: string;
  steps: string[];
  tips: string[];
}

interface PhaseDefinition {
  number: string;
  title: string;
  owner: string;
  ownerColor: string;
  headerColor: string;
  lightColor: string;
  icon: React.ElementType;
  tracks: Record<TrackKey, PhaseTrackData>;
}

const PHASES: PhaseDefinition[] = [
  {
    number: "01",
    title: "Request Submission",
    owner: "Project Leader",
    ownerColor: "bg-blue-100 text-blue-700",
    headerColor: "from-blue-600 to-indigo-600",
    lightColor: "bg-blue-50 border-blue-200",
    icon: FileText,
    tracks: {
      lightweight: {
        sla: "Day 0",
        steps: [
          "Navigate to JIRA Initiatives and locate the relevant epic.",
          "Click Submit ARR to open the Architecture Review Request form.",
          "Complete Section 0: link the JIRA initiative and confirm the project name.",
          "Complete Section 1: request classification, business context, cost estimate, deployment model, target go-live, and expected user base.",
          "Complete Section 2: assess impact — mark all relevant areas and provide brief descriptions.",
          "Complete Section 3: confirm submitter details and sponsor/product owner.",
          "Submit the form — the system auto-calculates an EA triage baseline.",
        ],
        tips: [
          "For Lightweight tracks, concise impact descriptions are usually sufficient.",
          "If unsure of an impact area, select the next level up — over-disclosure is always safer.",
          "Attach any existing solution sketches in the business context field.",
        ],
      },
      standard: {
        sla: "Day 0",
        steps: [
          "Navigate to JIRA Initiatives and locate the relevant epic.",
          "Click Submit ARR to open the Architecture Review Request form.",
          "Complete Section 0: link the JIRA initiative and confirm the project name.",
          "Complete Section 1: request classification, business context, cost estimate, deployment model, target go-live, and expected user base.",
          "Complete Section 2: assess impact across Security, Data, Integration, Regulatory, and AI dimensions. Toggle each area and describe the specific impact.",
          "Complete Section 3: confirm submitter details and sponsor/product owner.",
          "Submit the form. The system auto-calculates an EA triage baseline (risk ratings, review type, required views and SMEs).",
        ],
        tips: [
          "The more detail you provide in impact descriptions, the faster the EA triage.",
          "If you are unsure of an impact area, select the next level up — over-disclosure is always safer.",
          "Attach any existing solution sketches or vendor shortlists in the business context field.",
        ],
      },
      "deep-dive": {
        sla: "Day 0",
        steps: [
          "Navigate to JIRA Initiatives and locate the relevant epic.",
          "Click Submit ARR to open the Architecture Review Request form.",
          "Complete Section 0: link the JIRA initiative and confirm the project name.",
          "Complete all four sections fully and with maximum detail — the committee will read every field.",
          "Complete Section 2: provide comprehensive impact assessments across all domains (Security, Data, Integration, Regulatory, AI, OT/IT).",
          "Attach preliminary architecture diagrams, vendor assessments, and any existing ADRs.",
          "Submit the form. Alert the EA Lead directly after submission to begin pre-triage engagement.",
        ],
        tips: [
          "Deep Dive reviews benefit greatly from early EA engagement — reach out before submitting if possible.",
          "Provide detailed impact descriptions with evidence; the committee will scrutinise every area.",
          "Attach a high-level solution sketch and any existing vendor shortlists to help accelerate triage.",
        ],
      },
    },
  },
  {
    number: "02",
    title: "EA Triage",
    owner: "EA Team",
    ownerColor: "bg-violet-100 text-violet-700",
    headerColor: "from-violet-600 to-purple-600",
    lightColor: "bg-violet-50 border-violet-200",
    icon: Search,
    tracks: {
      lightweight: {
        sla: "1–2 days",
        steps: [
          "EA receives notification and opens the request in the ARC Portal.",
          "Reviews the auto-calculated baseline and confirms the Lightweight track designation.",
          "Validates risk ratings and confirms no overlooked high-risk dimensions.",
          "Assigns an EA lead (often the same person who triages).",
          "Schedules a brief async review or 30-min session slot.",
          "Sets status to 'ARC Scheduled'.",
        ],
        tips: [
          "Lightweight triage is typically completed in 1–2 business days.",
          "If any high-risk dimensions emerge during triage, the track may be escalated to Standard or Deep Dive.",
          "Async reviews can start before the triage is formally closed for very low-risk items.",
        ],
      },
      standard: {
        sla: "2–5 days",
        steps: [
          "EA receives notification and opens the request in the ARC Portal.",
          "Reviews the auto-calculated baseline (risk ratings, review type, required architecture views and SMEs).",
          "Validates or adjusts the baseline — overrides any field to reflect domain knowledge.",
          "Assigns an EA lead and any required SMEs.",
          "Confirms the Standard track and schedules a 60-min ARC session.",
          "If information is insufficient, sets status to 'Specs Required' and notifies the submitter.",
          "Once satisfied, sets the status to 'ARC Scheduled'.",
        ],
        tips: [
          "Standard triage aims for completion within 3 business days.",
          "Lightweight reviews can often be completed asynchronously without a full committee session.",
          "For business-critical requests, ensure the relevant domain SME is identified early.",
        ],
      },
      "deep-dive": {
        sla: "3–5 days",
        steps: [
          "EA receives notification and opens the request in the ARC Portal.",
          "Reviews the auto-calculated baseline and immediately engages the relevant domain leads.",
          "Validates risk ratings, architecture views required, and SME assignments across all domains.",
          "Confirms the Deep Dive track; assembles the full committee including CISO and Head of Infrastructure where applicable.",
          "Ensures a minimum 2-week lead time is scheduled before the ARC session.",
          "If information is insufficient, sets status to 'Specs Required' with detailed requirements listed.",
          "Conducts a pre-session call with the Project Leader to align on agenda and expectations.",
        ],
        tips: [
          "Deep Dive reviews require a minimum of 2 weeks lead time for committee preparation.",
          "Loop in the CISO and Head of Infrastructure during triage for mission-critical requests.",
          "A pre-session briefing with the EA Lead is strongly recommended before the committee session.",
        ],
      },
    },
  },
  {
    number: "03",
    title: "Architecture Review",
    owner: "EA Team + ARC Committee",
    ownerColor: "bg-rose-100 text-rose-700",
    headerColor: "from-rose-600 to-pink-600",
    lightColor: "bg-rose-50 border-rose-200",
    icon: Users,
    tracks: {
      lightweight: {
        sla: "Days 3–5",
        steps: [
          "Project Leader shares a concise Architecture Design Document or summary with the EA Lead.",
          "EA Lead reviews the submission asynchronously or conducts a 30-min focused call.",
          "Review covers solution approach, key integration points, and any flagged risk areas.",
          "Questions and any conditions are captured in the ARC Portal session record.",
          "Status is updated to 'ARC Review' at session start.",
        ],
        tips: [
          "For async Lightweight reviews, a one-page architecture summary is usually sufficient.",
          "Respond to EA queries promptly — delays extend the overall SLA.",
          "Reference any approved patterns from the architecture catalogue to accelerate sign-off.",
        ],
      },
      standard: {
        sla: "Days 6–14",
        steps: [
          "Project Leader prepares and distributes the Architecture Design Document (ADD) to the committee at least 5 business days before the session.",
          "EA Team circulates agenda, required architecture views, and SME assignments.",
          "ARC session convenes (60 minutes).",
          "Committee reviews: solution architecture, integration patterns, security posture, data design, and regulatory controls.",
          "Questions, risks, and conditions are captured in real time in the ARC Portal session record.",
          "Status is updated to 'ARC Review' at session start.",
        ],
        tips: [
          "Bring a decision log for any major technology choices already made.",
          "Reference architecture diagrams accelerate review — use the required views list from EA triage.",
          "Have a named risk owner ready for each identified risk.",
        ],
      },
      "deep-dive": {
        sla: "Days 6–20",
        steps: [
          "Project Leader prepares a comprehensive Architecture Design Document (ADD) and distributes it at least 10 business days before the session.",
          "EA Team circulates detailed agenda, all required architecture views, and full SME assignments.",
          "ARC session convenes (90 minutes) with full committee attendance required.",
          "Committee reviews in depth: solution architecture, integration patterns, security posture, data design, regulatory controls, AI/ML governance, and OT/IT boundary considerations.",
          "All questions, risks, conditions, and open items are captured in real time in the ARC Portal.",
          "A follow-up session may be scheduled if significant open items remain.",
          "Status is updated to 'ARC Review' at session start.",
        ],
        tips: [
          "Bring a decision log for every major technology choice — the committee reviews rationale, not just outcomes.",
          "Prepare all required architecture views (C4, data flow, security, deployment) as a minimum.",
          "Have named risk owners ready for every risk — the committee will ask for accountability.",
        ],
      },
    },
  },
  {
    number: "04",
    title: "Decision & Outcome",
    owner: "ARC Committee",
    ownerColor: "bg-emerald-100 text-emerald-700",
    headerColor: "from-emerald-600 to-teal-600",
    lightColor: "bg-emerald-50 border-emerald-200",
    icon: ShieldCheck,
    tracks: {
      lightweight: {
        sla: "~Day 7",
        steps: [
          "EA Lead issues a decision: Approved, Approved with Conditions, or Escalated.",
          "Decision is recorded in the Review Outcomes register.",
          "If Approved with Conditions: conditions and owners are documented and linked to the request.",
          "If Escalated: the review track is upgraded to Standard or Deep Dive with a new schedule.",
          "Decision notification is issued to the Project Leader and Sponsor.",
        ],
        tips: [
          "Lightweight decisions are typically issued within 1 business day of the review.",
          "Conditions on Lightweight reviews are usually minor — expect quick resolution.",
          "Document the decision as an ADR regardless of outcome.",
        ],
      },
      standard: {
        sla: "~Day 14",
        steps: [
          "Committee chair calls for a decision: Approved, Approved with Conditions, Deferred, or Rejected.",
          "Decision and all conditions are recorded in the Review Outcomes register.",
          "If Approved with Conditions: conditions, owners, and due dates are formally documented.",
          "If Deferred: a re-review date is set and outstanding information requirements are listed.",
          "If Rejected: the committee provides documented rationale and recommended alternatives.",
          "Decision notification is issued to the Project Leader, Sponsor, and EA Lead.",
          "The architecture decision record (ADR) is published to the enterprise knowledge base.",
        ],
        tips: [
          "Conditions are binding — delivery cannot proceed to production until all conditions are signed off.",
          "If rejected, request a debrief with the EA Lead before re-submitting.",
          "Document all decisions as ADRs regardless of outcome.",
        ],
      },
      "deep-dive": {
        sla: "~Day 22",
        steps: [
          "Committee chair calls for a formal decision: Approved, Approved with Conditions, Deferred, or Rejected.",
          "Decision rationale is fully documented with reference to each reviewed architecture dimension.",
          "All conditions are formally recorded with owners, acceptance criteria, and due dates.",
          "If Deferred: specific blockers are listed; a re-review date is set with pre-conditions for re-submission.",
          "If Rejected: detailed rationale and mandatory recommended alternatives are provided.",
          "Decision notification is issued to the Project Leader, Sponsor, EA Lead, and relevant domain leads.",
          "The architecture decision record (ADR) is published to the enterprise knowledge base with full detail.",
        ],
        tips: [
          "Conditions are binding — no production deployment until every condition is EA-signed-off.",
          "Deep Dive rejections are rare; if rejected, engage the EA Lead for a structured debrief before re-submitting.",
          "All ADRs from Deep Dive reviews are considered enterprise reference — write them accordingly.",
        ],
      },
    },
  },
  {
    number: "05",
    title: "Post-Decision Governance",
    owner: "Project Leader + EA Team",
    ownerColor: "bg-amber-100 text-amber-700",
    headerColor: "from-amber-500 to-orange-500",
    lightColor: "bg-amber-50 border-amber-200",
    icon: BarChart3,
    tracks: {
      lightweight: {
        sla: "Ongoing (minimal)",
        steps: [
          "Project Leader tracks and closes any Approved-with-Conditions items before go-live.",
          "EA Lead signs off on condition closures and updates the portal.",
          "Any material scope or technology changes post-approval trigger a change notification to the EA Team.",
        ],
        tips: [
          "Lightweight reviews rarely have post-decision conditions — governance is minimal.",
          "Notify the EA Team of scope changes early; a delta review may still be required.",
          "Architecture exceptions should still be logged even on Lightweight reviews.",
        ],
      },
      standard: {
        sla: "Ongoing",
        steps: [
          "Project Leader tracks and closes all Approved-with-Conditions items before go-live.",
          "EA Lead signs off on each condition closure and updates the portal.",
          "Any material scope or technology changes post-approval trigger a change notification to the EA Team.",
          "Significant changes may require a delta review or a new ARR — the EA Lead determines which.",
          "KPIs are updated in the KPI Dashboard at each quarterly EA governance cycle.",
        ],
        tips: [
          "Notify the EA Team of scope changes early — a delta review is far lighter than a full re-submission.",
          "Architecture exceptions are not failures: logging them explicitly is the correct governance behaviour.",
          "Post-go-live incident reviews should check whether the incident was linked to a known architecture risk.",
        ],
      },
      "deep-dive": {
        sla: "Ongoing (structured)",
        steps: [
          "Project Leader tracks and closes all Approved-with-Conditions items before go-live.",
          "EA Lead conducts formal sign-off on each condition closure with evidence review.",
          "Any material scope or technology changes post-approval trigger a mandatory EA assessment.",
          "Significant changes require a delta review or a new ARR; the EA Lead determines which with committee sign-off.",
          "KPIs are updated in the KPI Dashboard at each quarterly EA governance cycle.",
          "Architecture drift (deviations discovered post-implementation) is logged as an exception and assigned an owner.",
          "A post-implementation review is scheduled 3–6 months after go-live for Deep Dive decisions.",
        ],
        tips: [
          "Deep Dive approvals carry a formal post-implementation review obligation — plan for it.",
          "Architecture drift exceptions on Deep Dive solutions must be escalated to the EA Lead immediately.",
          "Quarterly KPI tracking is mandatory; ensure condition closure evidence is archived in the portal.",
        ],
      },
    },
  },
];

const SLA_ROWS: [string, string, string, string, string][] = [
  ["Submission",         "Project Leader",       "Day 0",       "Day 0",       "Day 0"],
  ["EA Triage",          "EA Team",              "1–2 days",    "2–5 days",    "3–5 days"],
  ["ADD Preparation",    "Project Leader",       "2–3 days",    "5–7 days",    "7–10 days"],
  ["ARC Session",        "Committee",            "Async/30min", "60 min",      "90 min"],
  ["Decision Issued",    "ARC Committee",        "~Day 7",      "~Day 14",     "~Day 22"],
  ["Conditions Closed",  "Project Leader + EA",  "n/a",         "5–10 days",   "10–20 days"],
];

const SWIM_LANES = [
  {
    role: "Project Leader",
    color: "bg-blue-500",
    responsibilities: [
      "Initiate the ARR from the relevant JIRA initiative",
      "Complete the intake form accurately and in full",
      "Prepare and distribute the Architecture Design Document",
      "Present the solution to the ARC committee",
      "Own and close all post-approval conditions",
      "Notify the EA Team of any material scope changes",
    ],
  },
  {
    role: "EA Team",
    color: "bg-violet-500",
    responsibilities: [
      "Validate and refine the auto-calculated EA triage baseline",
      "Assign EA lead and SMEs to each review",
      "Determine review track (Lightweight / Standard / Deep Dive)",
      "Schedule and facilitate the ARC session",
      "Maintain the architecture decision record (ADR)",
      "Sign off on condition closures and architecture drift exceptions",
    ],
  },
  {
    role: "ARC Committee",
    color: "bg-rose-500",
    responsibilities: [
      "Review submitted architecture design documents",
      "Assess solution against enterprise standards and reference architectures",
      "Identify and record risks, conditions, and open questions",
      "Make the formal Approve / Approve with Conditions / Defer / Reject decision",
      "Ensure all decisions are documented with full rationale",
      "Review and ratify quarterly KPI and governance outcomes",
    ],
  },
];

type RiskLevel = "low" | "medium" | "high" | null;
type ChangeScope = "minor" | "moderate" | "major" | null;
type CostBand = "under100k" | "100k-500k" | "over500k" | null;

function recommendTrack(risk: RiskLevel, scope: ChangeScope, cost: CostBand): TrackKey | null {
  if (!risk || !scope || !cost) return null;
  if (risk === "high" || scope === "major" || cost === "over500k") return "deep-dive";
  if (risk === "medium" || scope === "moderate" || cost === "100k-500k") return "standard";
  return "lightweight";
}

function DecisionAid({ onSelectTrack }: { onSelectTrack: (t: TrackKey) => void }) {
  const [open, setOpen] = useState(false);
  const [risk, setRisk] = useState<RiskLevel>(null);
  const [scope, setScope] = useState<ChangeScope>(null);
  const [cost, setCost] = useState<CostBand>(null);

  const recommended = recommendTrack(risk, scope, cost);
  const recommendedTrack = recommended ? TRACKS.find(t => t.key === recommended) : null;

  const reset = () => { setRisk(null); setScope(null); setCost(null); };

  return (
    <Card className="shadow-sm border border-slate-200">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-display font-bold text-foreground">Which track applies to me?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Answer 3 quick questions to get a track recommendation</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
      </button>

      {open && (
        <CardContent className="px-6 pb-6 pt-0 space-y-5">
          <div className="h-px bg-border" />

          <div className="space-y-4">
            {/* Q1 */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                <span className="text-indigo-500 mr-1.5">Q1.</span> What is the overall risk level of this initiative?
              </p>
              <div className="flex flex-wrap gap-2">
                {([["low", "Low — minimal security, regulatory, or data exposure"], ["medium", "Medium — some regulated data or integration complexity"], ["high", "High — mission-critical, regulated, AI/ML, or OT/IT boundary"]] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setRisk(val)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                      risk === val
                        ? val === "low" ? "bg-emerald-600 text-white border-emerald-600"
                        : val === "medium" ? "bg-blue-600 text-white border-blue-600"
                        : "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2 */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                <span className="text-indigo-500 mr-1.5">Q2.</span> What is the scope of the change?
              </p>
              <div className="flex flex-wrap gap-2">
                {([["minor", "Minor — config, small enhancement, no new patterns"], ["moderate", "Moderate — new integration or moderate data model change"], ["major", "Major — new application, platform, or significant architecture change"]] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setScope(val)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                      scope === val
                        ? val === "minor" ? "bg-emerald-600 text-white border-emerald-600"
                        : val === "moderate" ? "bg-blue-600 text-white border-blue-600"
                        : "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3 */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                <span className="text-indigo-500 mr-1.5">Q3.</span> What is the estimated project cost?
              </p>
              <div className="flex flex-wrap gap-2">
                {([["under100k", "Under $100K"], ["100k-500k", "$100K – $500K"], ["over500k", "Over $500K"]] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setCost(val)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                      cost === val
                        ? val === "under100k" ? "bg-emerald-600 text-white border-emerald-600"
                        : val === "100k-500k" ? "bg-blue-600 text-white border-blue-600"
                        : "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {recommendedTrack && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-4 border flex items-center justify-between gap-4 ${
                recommended === "lightweight" ? "bg-emerald-50 border-emerald-200"
                : recommended === "standard" ? "bg-blue-50 border-blue-200"
                : "bg-rose-50 border-rose-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className={`w-5 h-5 ${
                  recommended === "lightweight" ? "text-emerald-600"
                  : recommended === "standard" ? "text-blue-600"
                  : "text-rose-600"
                }`} />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recommended Track</p>
                  <p className={`font-bold text-base ${
                    recommended === "lightweight" ? "text-emerald-700"
                    : recommended === "standard" ? "text-blue-700"
                    : "text-rose-700"
                  }`}>
                    {recommendedTrack.label}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">{recommendedTrack.when}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={reset}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => { onSelectTrack(recommended!); setOpen(false); }}
                  className={`text-xs px-4 py-1.5 rounded-lg font-semibold text-white transition-colors ${
                    recommended === "lightweight" ? "bg-emerald-600 hover:bg-emerald-700"
                    : recommended === "standard" ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  Use this track
                </button>
              </div>
            </motion.div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function TrackSelector({ activeTrack, onSelect }: { activeTrack: TrackKey; onSelect: (t: TrackKey) => void }) {
  return (
    <div>
      <h2 className="text-xl font-display font-bold mb-1 flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" /> Select Your Review Track
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        The process guide below adapts to show steps, SLAs, and tips for the selected track.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TRACKS.map(track => {
          const Icon = track.icon;
          const isActive = track.key === activeTrack;
          return (
            <button
              key={track.key}
              onClick={() => onSelect(track.key)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${isActive ? track.activeClass : track.inactiveClass}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : ""}`} />
                <span className="font-bold text-sm">{track.label}</span>
              </div>
              <p className={`text-xs leading-relaxed mb-3 ${isActive ? "text-white/80" : "text-slate-500"}`}>{track.when}</p>
              <div className={`flex flex-col gap-1 text-xs border-t pt-2 ${isActive ? "border-white/20" : "border-slate-200"}`}>
                <div className="flex justify-between">
                  <span className={isActive ? "text-white/60" : "text-slate-400"}>Session</span>
                  <span className={`font-semibold ${isActive ? "text-white" : "text-slate-700"}`}>{track.session}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isActive ? "text-white/60" : "text-slate-400"}>Lead time</span>
                  <span className={`font-semibold ${isActive ? "text-white" : "text-slate-700"}`}>{track.leadTime}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PhaseCard({ phase, index, activeTrack }: { phase: PhaseDefinition; index: number; activeTrack: TrackKey }) {
  const [open, setOpen] = useState(index === 0);
  const Icon = phase.icon;
  const trackData = phase.tracks[activeTrack];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Card className="overflow-hidden shadow-sm">
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-full text-left bg-gradient-to-r ${phase.headerColor} text-white px-6 py-4 flex items-center gap-4`}
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-xs font-mono font-semibold">PHASE {phase.number}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20">{phase.owner}</span>
            </div>
            <div className="font-display font-bold text-lg leading-tight mt-0.5">{phase.title}</div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-white/70 hidden sm:block">{trackData.sla}</span>
            {open ? <ChevronUp className="w-5 h-5 text-white/80" /> : <ChevronDown className="w-5 h-5 text-white/80" />}
          </div>
        </button>

        {open && (
          <CardContent className="p-6 space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-muted-foreground" /> Steps
              </h4>
              <ol className="space-y-2">
                {trackData.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border ${phase.lightColor}`}>
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className={`rounded-xl border p-4 ${phase.lightColor}`}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Practical Tips
              </h4>
              <ul className="space-y-1.5">
                {trackData.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-slate-600 flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

function getTrackFromSearch(): TrackKey {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("track");
  if (raw === "lightweight" || raw === "standard" || raw === "deep-dive") return raw;
  return "lightweight";
}

export default function ProcessGuidePage() {
  const [activeTrack, setActiveTrack] = useState<TrackKey>(getTrackFromSearch);
  const [showSwimLanes, setShowSwimLanes] = useState(false);

  const selectTrack = useCallback((track: TrackKey) => {
    setActiveTrack(track);
    const url = new URL(window.location.href);
    url.searchParams.set("track", track);
    window.history.replaceState({}, "", url.toString());
  }, []);

  useEffect(() => {
    const handler = () => setActiveTrack(getTrackFromSearch());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const activeTrackMeta = TRACKS.find(t => t.key === activeTrack)!;

  const slaHighlightClass: Record<TrackKey, string> = {
    lightweight: "bg-emerald-50 text-emerald-800",
    standard: "bg-blue-50 text-blue-800",
    "deep-dive": "bg-rose-50 text-rose-800",
  };
  const slaHeaderClass: Record<TrackKey, string> = {
    lightweight: "bg-emerald-100 text-emerald-800 font-bold",
    standard: "bg-blue-100 text-blue-800 font-bold",
    "deep-dive": "bg-rose-100 text-rose-800 font-bold",
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pb-16 max-w-4xl mx-auto">

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Architecture Review Process Guide</h1>
              <p className="text-indigo-200 mt-2 leading-relaxed">
                A concise reference for Project Leaders, EA Team members, and ARC Committee participants. Select your review track to see tailored steps, timelines, and tips.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full">5 phases</span>
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full">3 swim lanes</span>
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full">3 review tracks</span>
                <span className={`text-xs px-3 py-1 rounded-full ${activeTrackMeta.badge}`}>
                  {activeTrackMeta.label} · {activeTrackMeta.leadTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Decision Aid */}
        <DecisionAid onSelectTrack={selectTrack} />

        {/* Track Selector */}
        <TrackSelector activeTrack={activeTrack} onSelect={selectTrack} />

        {/* When to submit */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> When to Submit an ARR
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              An Architecture Review Request is required whenever a project or initiative meets <strong className="text-foreground">one or more</strong> of the following criteria:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "New application or platform being introduced to the enterprise landscape",
                "Major enhancement that changes the integration surface or data model of an existing system",
                "New cloud deployment or migration of an existing workload to cloud",
                "Introduction of a new technology, vendor, or open-source component not on the approved list",
                "Solution involving personal data, financial data, or sensitive regulatory data",
                "AI/ML model being trained on, or applied to, enterprise or customer data",
                "Solution touching OT/IT boundary or industrial control systems",
                "Project with estimated cost above $500K or with cross-BU impact",
                "Application decommission that has downstream integration dependencies",
              ].map((item, i) => (
                <div key={i} className="flex gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>If you are unsure whether your initiative requires an ARR, contact the EA Team before committing to a delivery timeline. Early engagement prevents re-work.</span>
            </div>
          </CardContent>
        </Card>

        {/* Process Phases */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" /> Process Phases
            </h2>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              activeTrack === "lightweight" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : activeTrack === "standard" ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
            }`}>
              {activeTrackMeta.label} view
            </span>
          </div>
          <div className="space-y-4">
            {PHASES.map((phase, i) => (
              <PhaseCard key={phase.number} phase={phase} index={i} activeTrack={activeTrack} />
            ))}
          </div>
        </div>

        {/* SLA Summary */}
        <Card className="shadow-sm bg-slate-50">
          <CardContent className="p-6">
            <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Indicative SLA Summary
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-semibold text-xs uppercase">Phase</th>
                    <th className="text-left py-2 pr-4 text-muted-foreground font-semibold text-xs uppercase">Owner</th>
                    {TRACKS.map((t, i) => (
                      <th
                        key={t.key}
                        className={`text-left py-2 px-3 text-xs uppercase rounded-t-lg ${
                          t.key === activeTrack ? slaHeaderClass[activeTrack] : "text-muted-foreground font-semibold"
                        }`}
                      >
                        {t.label}
                        {t.key === activeTrack && <span className="ml-1 text-xs normal-case font-normal opacity-70">(selected)</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {SLA_ROWS.map(([phase, owner, lw, std, dd]) => {
                    const cells = [lw, std, dd];
                    return (
                      <tr key={phase}>
                        <td className="py-2.5 pr-4 font-medium text-slate-800">{phase}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground text-xs">{owner}</td>
                        {cells.map((val, ci) => {
                          const trackKey = TRACKS[ci].key;
                          const isActive = trackKey === activeTrack;
                          return (
                            <td
                              key={ci}
                              className={`py-2.5 px-3 font-medium ${isActive ? slaHighlightClass[activeTrack] : "text-slate-600"}`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Swim Lanes */}
        <div>
          <button
            onClick={() => setShowSwimLanes(o => !o)}
            className="w-full flex items-center justify-between px-1 mb-4"
          >
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Roles & Responsibilities
            </h2>
            {showSwimLanes ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>
          {!showSwimLanes && (
            <p className="text-sm text-muted-foreground -mt-2 mb-2 px-1">Click to expand — Project Leader, EA Team, and ARC Committee swim lanes.</p>
          )}
          {showSwimLanes && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SWIM_LANES.map(lane => (
                <Card key={lane.role} className="shadow-sm overflow-hidden">
                  <div className={`${lane.color} px-5 py-3`}>
                    <span className="text-white font-bold text-sm">{lane.role}</span>
                  </div>
                  <CardContent className="p-4">
                    <ul className="space-y-2">
                      {lane.responsibilities.map((r, i) => (
                        <li key={i} className="flex gap-2 text-xs text-slate-700">
                          <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </motion.div>
    </Layout>
  );
}
