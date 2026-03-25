import React, { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui-primitives";
import {
  BookOpen, ChevronDown, ChevronUp, CheckCircle2, Clock, Users,
  FileText, Search, Calendar, ShieldCheck, ArrowRight, Layers,
  AlertTriangle, Zap, Info, BarChart3
} from "lucide-react";

const PHASES = [
  {
    number: "01",
    title: "Request Submission",
    owner: "Project Leader",
    ownerColor: "bg-blue-100 text-blue-700",
    headerColor: "from-blue-600 to-indigo-600",
    lightColor: "bg-blue-50 border-blue-200",
    icon: FileText,
    sla: "Day 0",
    steps: [
      "Navigate to JIRA Initiatives and locate the relevant epic.",
      "Click Submit ARR to open the Architecture Review Request form.",
      "Complete Section 0: link the JIRA initiative and confirm the project name.",
      "Complete Section 1: request classification, business context, cost estimate, deployment model, target go-live, and expected user base.",
      "Complete Section 2: assess impact across Security, Data, Integration, Regulatory, and AI dimensions. Toggle each area and describe the specific impact.",
      "Complete Section 3: confirm submitter details and sponsor/product owner.",
      "Submit the form. The system auto-calculates an EA triage baseline (risk ratings, review type, required views and SMEs) from your impact selections.",
    ],
    tips: [
      "The more detail you provide in impact descriptions, the faster the EA triage.",
      "If you are unsure of an impact area, select the next level up — over-disclosure is always safer.",
      "Attach any existing solution sketches or vendor shortlists in the business context field.",
    ],
  },
  {
    number: "02",
    title: "EA Triage",
    owner: "EA Team",
    ownerColor: "bg-violet-100 text-violet-700",
    headerColor: "from-violet-600 to-purple-600",
    lightColor: "bg-violet-50 border-violet-200",
    icon: Search,
    sla: "Days 1–5",
    steps: [
      "EA receives notification and opens the request in the ARC Portal.",
      "Reviews the auto-calculated baseline (risk ratings, review type, required architecture views and SMEs).",
      "Validates or adjusts the baseline: overrides any field to reflect domain knowledge — the badge changes from 'auto-calculated' (amber) to 'EA reviewed' (green).",
      "Assigns an EA lead and any required SMEs.",
      "Determines the review track: Deep Dive, Standard, or Lightweight.",
      "If information is insufficient, status is set to 'Specs Required' and the submitter is notified.",
      "Once satisfied, schedules the ARC session and sets the status to 'ARC Scheduled'.",
    ],
    tips: [
      "Deep Dive reviews require a minimum of 2 weeks lead time for committee preparation.",
      "Lightweight reviews can often be completed asynchronously without a full committee session.",
      "For mission-critical requests, loop in the CISO and Head of Infrastructure during triage.",
    ],
  },
  {
    number: "03",
    title: "Architecture Review",
    owner: "EA Team + ARC Committee",
    ownerColor: "bg-rose-100 text-rose-700",
    headerColor: "from-rose-600 to-pink-600",
    lightColor: "bg-rose-50 border-rose-200",
    icon: Users,
    sla: "Days 6–20",
    steps: [
      "Project Leader prepares and distributes the Architecture Design Document (ADD) to the committee at least 5 business days before the session.",
      "EA Team circulates agenda, required architecture views, and SME assignments.",
      "ARC session convenes (Deep Dive: 90 min; Standard: 60 min; Lightweight: async/30 min).",
      "Committee reviews: solution architecture, integration patterns, security posture, data design, regulatory controls, and AI/ML governance where applicable.",
      "Questions, risks, and conditions are captured in real time in the ARC Portal session record.",
      "Status is updated to 'ARC Review' at session start.",
    ],
    tips: [
      "Bring a decision log for any major technology choices already made — the committee reviews rationale, not just outcomes.",
      "Reference architecture diagrams accelerate review. Use the required architecture views list from the EA triage as your minimum set.",
      "Have a named risk owner ready for each risk identified — the committee will ask.",
    ],
  },
  {
    number: "04",
    title: "Decision & Outcome",
    owner: "ARC Committee",
    ownerColor: "bg-emerald-100 text-emerald-700",
    headerColor: "from-emerald-600 to-teal-600",
    lightColor: "bg-emerald-50 border-emerald-200",
    icon: ShieldCheck,
    sla: "Day 20–22",
    steps: [
      "Committee chair calls for a decision: Approved, Approved with Conditions, Deferred, or Rejected.",
      "Decision and all conditions are recorded in the Review Outcomes register.",
      "If Approved with Conditions: conditions, owners, and due dates are formally documented and linked to the request.",
      "If Deferred: a re-review date is set and outstanding information requirements are listed.",
      "If Rejected: the committee provides documented rationale and recommended alternatives.",
      "Decision notification is issued to the Project Leader, Sponsor, and EA Lead.",
      "The architecture decision record (ADR) is published to the enterprise knowledge base.",
    ],
    tips: [
      "Conditions are binding — delivery cannot proceed to production until all conditions are signed off by the EA Lead.",
      "If rejected, request a debrief with the EA Lead before re-submitting. Understand the blocking concerns first.",
      "Document all decisions as ADRs regardless of outcome — declined decisions are equally valuable to capture.",
    ],
  },
  {
    number: "05",
    title: "Post-Decision Governance",
    owner: "Project Leader + EA Team",
    ownerColor: "bg-amber-100 text-amber-700",
    headerColor: "from-amber-500 to-orange-500",
    lightColor: "bg-amber-50 border-amber-200",
    icon: BarChart3,
    sla: "Ongoing",
    steps: [
      "Project Leader tracks and closes all Approved-with-Conditions items before go-live.",
      "EA Lead signs off on each condition closure and updates the portal.",
      "Any material scope or technology changes post-approval trigger a change notification to the EA Team.",
      "Significant changes may require a delta review or a new ARR — the EA Lead determines which.",
      "KPIs are updated in the KPI Dashboard at each quarterly EA governance cycle.",
      "Architecture drift (deviations discovered post-implementation) is logged as an exception and assigned an owner.",
    ],
    tips: [
      "Notify the EA Team of scope changes early — a delta review is far lighter than a full re-submission.",
      "Architecture exceptions are not failures: logging them explicitly is the correct governance behaviour.",
      "Post-go-live incident reviews should always check whether the incident was linked to a known architecture risk.",
    ],
  },
];

const REVIEW_TYPES = [
  {
    type: "Lightweight",
    icon: Zap,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    when: "Low overall risk. No new patterns, limited integration, and no regulatory or AI impact.",
    howLong: "Async or 30-min session",
    leadTime: "5 business days",
  },
  {
    type: "Standard",
    icon: CheckCircle2,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    when: "Medium risk or business-critical. Some new patterns, moderate integration complexity, or limited regulatory scope.",
    howLong: "60-minute committee session",
    leadTime: "10 business days",
  },
  {
    type: "Deep Dive",
    icon: AlertTriangle,
    color: "text-rose-600",
    bg: "bg-rose-50 border-rose-200",
    when: "High risk or mission-critical. New architecture pattern, high integration/security/regulatory/AI impact, or significant cloud footprint.",
    howLong: "90-minute committee session",
    leadTime: "15 business days",
  },
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

function PhaseCard({ phase, index }: { phase: typeof PHASES[0]; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const Icon = phase.icon;
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
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20`}>{phase.owner}</span>
            </div>
            <div className="font-display font-bold text-lg leading-tight mt-0.5">{phase.title}</div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-white/70 hidden sm:block">{phase.sla}</span>
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
                {phase.steps.map((step, i) => (
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
                {phase.tips.map((tip, i) => (
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

export default function ProcessGuidePage() {
  const [showSwimLanes, setShowSwimLanes] = useState(false);
  const [showReviewTypes, setShowReviewTypes] = useState(false);

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
                A concise reference for Project Leaders, EA Team members, and ARC Committee participants. Covers how to initiate, prepare for, and govern architecture review requests end to end.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full">5 phases</span>
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full">3 swim lanes</span>
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full">3 review tracks</span>
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Typical SLA: 22 business days</span>
              </div>
            </div>
          </div>
        </div>

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

        {/* Review Tracks */}
        <div>
          <button
            onClick={() => setShowReviewTypes(o => !o)}
            className="w-full flex items-center justify-between px-1 mb-4"
          >
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Review Tracks
            </h2>
            {showReviewTypes ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>
          {!showReviewTypes && (
            <p className="text-sm text-muted-foreground -mt-2 mb-2 px-1">Click to expand — Lightweight, Standard, and Deep Dive tracks explained.</p>
          )}
          {showReviewTypes && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {REVIEW_TYPES.map(rt => {
                const Icon = rt.icon;
                return (
                  <Card key={rt.type} className={`shadow-sm border ${rt.bg}`}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${rt.color}`} />
                        <span className={`font-bold text-base ${rt.color}`}>{rt.type}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{rt.when}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Session</span>
                          <span className="font-semibold text-slate-700">{rt.howLong}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Lead time</span>
                          <span className="font-semibold text-slate-700">{rt.leadTime}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Process Phases */}
        <div>
          <h2 className="text-xl font-display font-bold mb-5 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" /> Process Phases
          </h2>
          <div className="space-y-4">
            {PHASES.map((phase, i) => (
              <PhaseCard key={phase.number} phase={phase} index={i} />
            ))}
          </div>
        </div>

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
                    <th className="text-left py-2 text-muted-foreground font-semibold text-xs uppercase">Lightweight</th>
                    <th className="text-left py-2 text-muted-foreground font-semibold text-xs uppercase">Standard</th>
                    <th className="text-left py-2 text-muted-foreground font-semibold text-xs uppercase">Deep Dive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    ["Submission",          "Project Leader",       "Day 0",      "Day 0",       "Day 0"],
                    ["EA Triage",           "EA Team",              "1–2 days",   "2–5 days",    "3–5 days"],
                    ["ADD Preparation",     "Project Leader",       "2–3 days",   "5–7 days",    "7–10 days"],
                    ["ARC Session",         "Committee",            "Async/30min","60 min",       "90 min"],
                    ["Decision Issued",     "ARC Committee",        "~Day 7",     "~Day 14",     "~Day 22"],
                    ["Conditions Closed",   "Project Leader + EA",  "n/a",        "5–10 days",   "10–20 days"],
                  ].map(([phase, owner, lw, std, dd]) => (
                    <tr key={phase}>
                      <td className="py-2.5 pr-4 font-medium text-slate-800">{phase}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground text-xs">{owner}</td>
                      <td className="py-2.5 pr-4 text-emerald-700 font-medium">{lw}</td>
                      <td className="py-2.5 pr-4 text-blue-700 font-medium">{std}</td>
                      <td className="py-2.5 text-rose-700 font-medium">{dd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </motion.div>
    </Layout>
  );
}
