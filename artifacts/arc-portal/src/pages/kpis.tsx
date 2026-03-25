import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui-primitives";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, TrendingUp, AlertTriangle, XCircle, Clock, CheckCircle2, Edit3, Save, X } from "lucide-react";

type KpiMetric = {
  id: number;
  outcomeNumber: number;
  outcomeName: string;
  kpiCategory: string;
  kpiName: string;
  whatToMeasure: string;
  howToMeasure: string;
  currentValue: string | null;
  targetValue: string | null;
  unit: string | null;
  status: string;
  notes: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

const STATUS_CONFIG = {
  on_track:    { label: "On Track",    icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  at_risk:     { label: "At Risk",     icon: AlertTriangle, color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  off_track:   { label: "Off Track",   icon: XCircle,       color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  not_started: { label: "Not Started", icon: Clock,         color: "text-slate-500",  bg: "bg-slate-50 border-slate-200" },
};

const OUTCOME_COLORS = [
  "from-blue-600 to-indigo-600",
  "from-violet-600 to-purple-600",
  "from-emerald-600 to-teal-600",
  "from-orange-500 to-amber-500",
  "from-rose-600 to-pink-600",
];

const OUTCOME_LIGHT = [
  "bg-blue-50 border-blue-100",
  "bg-violet-50 border-violet-100",
  "bg-emerald-50 border-emerald-100",
  "bg-amber-50 border-amber-100",
  "bg-rose-50 border-rose-100",
];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.not_started;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function KpiRow({ kpi, onSave }: { kpi: KpiMetric; onSave: (id: number, data: Partial<KpiMetric>) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    currentValue: kpi.currentValue ?? "",
    targetValue: kpi.targetValue ?? "",
    unit: kpi.unit ?? "",
    status: kpi.status,
    notes: kpi.notes ?? "",
    updatedBy: kpi.updatedBy ?? "",
  });

  const handleSave = () => {
    onSave(kpi.id, {
      currentValue: draft.currentValue || null,
      targetValue: draft.targetValue || null,
      unit: draft.unit || null,
      status: draft.status,
      notes: draft.notes || null,
      updatedBy: draft.updatedBy || null,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft({
      currentValue: kpi.currentValue ?? "",
      targetValue: kpi.targetValue ?? "",
      unit: kpi.unit ?? "",
      status: kpi.status,
      notes: kpi.notes ?? "",
      updatedBy: kpi.updatedBy ?? "",
    });
    setEditing(false);
  };

  return (
    <div className="border border-border/40 rounded-xl p-4 bg-card hover:bg-card/80 transition-colors">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-foreground">{kpi.kpiName}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{kpi.whatToMeasure}</div>
            <div className="text-xs text-muted-foreground/70 mt-1 italic">How: {kpi.howToMeasure}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={editing ? draft.status : kpi.status} />
            <button
              onClick={() => editing ? handleCancel() : setEditing(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              {editing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {!editing ? (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Current:</span>
              <span className="font-semibold">{kpi.currentValue ? `${kpi.currentValue}${kpi.unit ? ` ${kpi.unit}` : ""}` : <span className="text-muted-foreground/50 italic">not set</span>}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Target:</span>
              <span className="font-semibold">{kpi.targetValue ? `${kpi.targetValue}${kpi.unit ? ` ${kpi.unit}` : ""}` : <span className="text-muted-foreground/50 italic">not set</span>}</span>
            </div>
            {kpi.notes && <div className="text-muted-foreground/70 italic">"{kpi.notes}"</div>}
            {kpi.updatedAt && kpi.status !== "not_started" && (
              <div className="text-muted-foreground/50 ml-auto">
                Updated {format(new Date(kpi.updatedAt), "MMM d, yyyy")}
                {kpi.updatedBy && ` · ${kpi.updatedBy}`}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 pt-2 border-t border-border/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Current Value</label>
                <input
                  type="text"
                  value={draft.currentValue}
                  onChange={e => setDraft(d => ({ ...d, currentValue: e.target.value }))}
                  placeholder="e.g. 65"
                  className="w-full text-sm border border-border rounded-lg px-2.5 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Target Value</label>
                <input
                  type="text"
                  value={draft.targetValue}
                  onChange={e => setDraft(d => ({ ...d, targetValue: e.target.value }))}
                  placeholder="e.g. 80"
                  className="w-full text-sm border border-border rounded-lg px-2.5 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Unit</label>
                <input
                  type="text"
                  value={draft.unit}
                  onChange={e => setDraft(d => ({ ...d, unit: e.target.value }))}
                  placeholder="e.g. %"
                  className="w-full text-sm border border-border rounded-lg px-2.5 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Status</label>
                <select
                  value={draft.status}
                  onChange={e => setDraft(d => ({ ...d, status: e.target.value }))}
                  className="w-full text-sm border border-border rounded-lg px-2.5 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="not_started">Not Started</option>
                  <option value="on_track">On Track</option>
                  <option value="at_risk">At Risk</option>
                  <option value="off_track">Off Track</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Notes</label>
                <input
                  type="text"
                  value={draft.notes}
                  onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                  placeholder="Optional context..."
                  className="w-full text-sm border border-border rounded-lg px-2.5 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Updated By</label>
                <input
                  type="text"
                  value={draft.updatedBy}
                  onChange={e => setDraft(d => ({ ...d, updatedBy: e.target.value }))}
                  placeholder="Your name"
                  className="w-full text-sm border border-border rounded-lg px-2.5 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={handleCancel} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors">Cancel</button>
              <button onClick={handleSave} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                <Save className="w-3 h-3" /> Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KpisPage() {
  const queryClient = useQueryClient();
  const [expandedOutcomes, setExpandedOutcomes] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));

  const { data: kpis = [], isLoading } = useQuery<KpiMetric[]>({
    queryKey: ["/api/kpis"],
    queryFn: () => fetch("/api/kpis").then(r => r.json()),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<KpiMetric> }) =>
      fetch(`/api/kpis/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/kpis"] }),
  });

  const grouped = useMemo(() => {
    const byOutcome: Record<number, { outcomeName: string; categories: Record<string, KpiMetric[]> }> = {};
    for (const kpi of kpis) {
      if (!byOutcome[kpi.outcomeNumber]) byOutcome[kpi.outcomeNumber] = { outcomeName: kpi.outcomeName, categories: {} };
      if (!byOutcome[kpi.outcomeNumber].categories[kpi.kpiCategory]) byOutcome[kpi.outcomeNumber].categories[kpi.kpiCategory] = [];
      byOutcome[kpi.outcomeNumber].categories[kpi.kpiCategory].push(kpi);
    }
    return byOutcome;
  }, [kpis]);

  const summary = useMemo(() => ({
    total: kpis.length,
    onTrack: kpis.filter(k => k.status === "on_track").length,
    atRisk: kpis.filter(k => k.status === "at_risk").length,
    offTrack: kpis.filter(k => k.status === "off_track").length,
    notStarted: kpis.filter(k => k.status === "not_started").length,
  }), [kpis]);

  const toggleOutcome = (n: number) => {
    setExpandedOutcomes(prev => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />)}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-display font-bold">KPI Dashboard</h1>
          <p className="text-muted-foreground mt-2">Track architecture governance outcomes and metrics across all five strategic goals.</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total KPIs", value: summary.total, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
            { label: "On Track", value: summary.onTrack, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "At Risk", value: summary.atRisk, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Off Track", value: summary.offTrack, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
            { label: "Not Started", value: summary.notStarted, icon: Clock, color: "text-slate-500", bg: "bg-slate-50" },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${stat.bg}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Outcome Sections */}
        {Object.entries(grouped).map(([numStr, { outcomeName, categories }]) => {
          const num = parseInt(numStr);
          const isExpanded = expandedOutcomes.has(num);
          const outcomeKpis = Object.values(categories).flat();
          const onTrack = outcomeKpis.filter(k => k.status === "on_track").length;
          const atRisk = outcomeKpis.filter(k => k.status === "at_risk").length;
          const offTrack = outcomeKpis.filter(k => k.status === "off_track").length;

          return (
            <Card key={num} className="overflow-hidden shadow-sm">
              <CardHeader
                className={`cursor-pointer select-none bg-gradient-to-r ${OUTCOME_COLORS[(num - 1) % OUTCOME_COLORS.length]} text-white`}
                onClick={() => toggleOutcome(num)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">
                      {num}
                    </div>
                    <div>
                      <div className="text-sm font-semibold leading-snug">{outcomeName}</div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/70">
                        <span>{outcomeKpis.length} KPIs</span>
                        {onTrack > 0 && <span className="text-emerald-200">● {onTrack} on track</span>}
                        {atRisk > 0 && <span className="text-amber-200">● {atRisk} at risk</span>}
                        {offTrack > 0 && <span className="text-red-200">● {offTrack} off track</span>}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-white/80 shrink-0" /> : <ChevronDown className="w-5 h-5 text-white/80 shrink-0" />}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="p-6 space-y-6">
                  {Object.entries(categories).map(([category, categoryKpis]) => (
                    <div key={category}>
                      <div className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border mb-3 ${OUTCOME_LIGHT[(num - 1) % OUTCOME_LIGHT.length]}`}>
                        {category}
                      </div>
                      <div className="space-y-3">
                        {categoryKpis.map(kpi => (
                          <KpiRow
                            key={kpi.id}
                            kpi={kpi}
                            onSave={(id, data) => updateMutation.mutate({ id, data })}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </motion.div>
    </Layout>
  );
}
