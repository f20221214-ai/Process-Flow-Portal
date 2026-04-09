import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-primitives";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  FileCheck, Timer, Activity, BarChart2,
} from "lucide-react";

type KpiMetric = {
  id: number;
  outcomeNumber: number;
  outcomeName: string;
  kpiCategory: string;
  kpiName: string;
  currentValue: string | null;
  targetValue: string | null;
  unit: string | null;
  status: string;
  notes: string | null;
  updatedAt: string;
};

type ArchRequest = {
  id: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  on_track: "#10b981",
  at_risk: "#f59e0b",
  off_track: "#ef4444",
  not_started: "#94a3b8",
};

const APPROVED_STATUSES = ["approved", "approved_with_conditions"];
const CLOSED_STATUSES = ["approved", "approved_with_conditions", "rejected"];
const STATUS_PRIORITY: Record<string, number> = { off_track: 0, at_risk: 1, on_track: 2, not_started: 3 };

type KpiStatus = "on_track" | "at_risk" | "off_track" | "not_started";
type OutcomeRow = { name: string; on_track: number; at_risk: number; off_track: number; not_started: number };

const VALID_KPI_STATUSES: KpiStatus[] = ["on_track", "at_risk", "off_track", "not_started"];
function isKpiStatus(s: string): s is KpiStatus {
  return (VALID_KPI_STATUSES as string[]).includes(s);
}

function HeadlineCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-4xl font-display font-bold text-foreground leading-none mt-2">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-2xl ${iconBg} shrink-0`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getMonthlyData(requests: ArchRequest[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}` };
  });

  return months.map(({ year, month, label }) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    const submitted = requests.filter(r => {
      const d = parseISO(r.createdAt);
      return d >= start && d <= end;
    }).length;
    const closed = requests.filter(r => {
      if (!CLOSED_STATUSES.includes(r.status)) return false;
      const d = parseISO(r.updatedAt);
      return d >= start && d <= end;
    }).length;
    return { month: label, submitted, closed };
  });
}

type PieLabelProps = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelProps) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function ExecutiveDashboardPage() {
  const { data: kpis = [], isLoading: kpisLoading } = useQuery<KpiMetric[]>({
    queryKey: ["/api/kpis"],
    queryFn: () => fetch("/api/kpis").then(r => r.json()),
  });

  const { data: requests = [], isLoading: reqLoading } = useQuery<ArchRequest[]>({
    queryKey: ["/api/requests"],
    queryFn: () => fetch("/api/requests").then(r => r.json()),
  });

  const kpiLastUpdated = useMemo(() => {
    if (!kpis.length) return null;
    const dates = kpis.map(k => new Date(k.updatedAt)).filter(d => !isNaN(d.getTime()));
    if (!dates.length) return null;
    return new Date(Math.max(...dates.map(d => d.getTime())));
  }, [kpis]);

  const requestLastUpdated = useMemo(() => {
    if (!requests.length) return null;
    const dates = requests.map(r => parseISO(r.updatedAt)).filter(d => !isNaN(d.getTime()));
    if (!dates.length) return null;
    return new Date(Math.max(...dates.map(d => d.getTime())));
  }, [requests]);

  const stats = useMemo(() => {
    const total = requests.length;
    const approved = requests.filter(r => APPROVED_STATUSES.includes(r.status)).length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    const closedWithBothDates = requests.filter(r => CLOSED_STATUSES.includes(r.status));
    const cycleTimes = closedWithBothDates.map(r => {
      const created = parseISO(r.createdAt);
      const updated = parseISO(r.updatedAt);
      return differenceInDays(updated, created);
    }).filter(d => d >= 0);
    const avgCycleTime = cycleTimes.length > 0 ? Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length) : 0;

    const onTrack = kpis.filter(k => k.status === "on_track").length;
    const atRisk = kpis.filter(k => k.status === "at_risk").length;
    const offTrack = kpis.filter(k => k.status === "off_track").length;
    const measured = kpis.filter(k => k.status !== "not_started").length;
    const healthScore = measured > 0 ? Math.round((onTrack / measured) * 100) : 0;

    return { total, approvalRate, avgCycleTime, healthScore, onTrack, atRisk, offTrack, notStarted: kpis.length - measured };
  }, [requests, kpis]);

  const donutData = useMemo(() => {
    return [
      { name: "On Track", value: stats.onTrack, color: STATUS_COLORS.on_track },
      { name: "At Risk", value: stats.atRisk, color: STATUS_COLORS.at_risk },
      { name: "Off Track", value: stats.offTrack, color: STATUS_COLORS.off_track },
      { name: "Not Started", value: stats.notStarted, color: STATUS_COLORS.not_started },
    ].filter(d => d.value > 0);
  }, [stats]);

  const groupedByOutcome = useMemo(() => {
    const outcomeMap: Record<number, OutcomeRow> = {};
    for (const kpi of kpis) {
      if (!outcomeMap[kpi.outcomeNumber]) {
        outcomeMap[kpi.outcomeNumber] = { name: `Outcome ${kpi.outcomeNumber}`, on_track: 0, at_risk: 0, off_track: 0, not_started: 0 };
      }
      if (isKpiStatus(kpi.status)) {
        outcomeMap[kpi.outcomeNumber][kpi.status]++;
      }
    }
    return Object.entries(outcomeMap)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([, v]) => v);
  }, [kpis]);

  const topKpis = useMemo(() => {
    return kpis
      .filter(k => k.currentValue !== null && k.targetValue !== null)
      .sort((a, b) => (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99))
      .slice(0, 8);
  }, [kpis]);

  const monthlyData = useMemo(() => getMonthlyData(requests), [requests]);

  const isLoading = kpisLoading || reqLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-card rounded-2xl animate-pulse" />)}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-16 print:space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 print:hidden">
          <div>
            <h1 className="text-3xl font-display font-bold">Executive Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">Architecture governance health — read-only stakeholder view.</p>
          </div>
          <div className="text-xs text-muted-foreground border border-border/40 rounded-xl px-4 py-2 bg-card">
            <span className="font-medium">Report date:</span> {format(new Date(), "MMMM d, yyyy")}
          </div>
        </div>

        {/* Print header (hidden on screen) */}
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold">Executive Dashboard — Architecture Governance</h1>
          <p className="text-sm text-gray-500">Report date: {format(new Date(), "MMMM d, yyyy")}</p>
        </div>

        {/* Headline Stats */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Headline Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <HeadlineCard
              title="Total Requests"
              value={stats.total}
              subtitle="All time submissions"
              icon={Activity}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
            />
            <HeadlineCard
              title="Approval Rate"
              value={`${stats.approvalRate}%`}
              subtitle="Approved or cond. approved"
              icon={FileCheck}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <HeadlineCard
              title="Avg. Cycle Time"
              value={`${stats.avgCycleTime}d`}
              subtitle="Submit to decision (closed ARRs)"
              icon={Timer}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
            <HeadlineCard
              title="KPI Health Score"
              value={`${stats.healthScore}%`}
              subtitle="On-track / measured KPIs"
              icon={BarChart2}
              iconBg="bg-violet-50"
              iconColor="text-violet-600"
            />
          </div>
        </section>

        {/* KPI Status Charts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">KPI Status Breakdown</h2>
            {kpiLastUpdated && (
              <span className="text-xs text-muted-foreground/60">
                Last updated {format(kpiLastUpdated, "MMM d, yyyy")}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Overall KPI Status</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {donutData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No KPI data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                        label={CustomPieLabel}
                      >
                        {donutData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        formatter={(val: number, name: string) => [`${val} KPI${val !== 1 ? "s" : ""}`, name]}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "13px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Grouped Bar Chart — Status by Outcome */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">KPI Status by Outcome</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {groupedByOutcome.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No KPI data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupedByOutcome} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="on_track" name="On Track" fill={STATUS_COLORS.on_track} radius={[4, 4, 0, 0]} maxBarSize={18} />
                      <Bar dataKey="at_risk" name="At Risk" fill={STATUS_COLORS.at_risk} radius={[4, 4, 0, 0]} maxBarSize={18} />
                      <Bar dataKey="off_track" name="Off Track" fill={STATUS_COLORS.off_track} radius={[4, 4, 0, 0]} maxBarSize={18} />
                      <Bar dataKey="not_started" name="Not Started" fill={STATUS_COLORS.not_started} radius={[4, 4, 0, 0]} maxBarSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* KPI Progress List */}
        {topKpis.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">KPI Current vs. Target</h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
                <span>Showing most critical KPIs with reported values</span>
                {kpiLastUpdated && <span>· Last updated {format(kpiLastUpdated, "MMM d, yyyy")}</span>}
              </div>
            </div>
            <Card className="shadow-sm">
              <CardContent className="p-6 space-y-4">
                {topKpis.map(kpi => {
                  const current = parseFloat(kpi.currentValue ?? "0");
                  const target = parseFloat(kpi.targetValue ?? "0");
                  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                  const statusCfg = {
                    on_track: { color: "bg-emerald-500", text: "text-emerald-700", label: "On Track" },
                    at_risk: { color: "bg-amber-400", text: "text-amber-700", label: "At Risk" },
                    off_track: { color: "bg-red-500", text: "text-red-700", label: "Off Track" },
                    not_started: { color: "bg-slate-300", text: "text-slate-500", label: "Not Started" },
                  }[kpi.status] ?? { color: "bg-slate-300", text: "text-slate-500", label: "—" };

                  return (
                    <div key={kpi.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground truncate block">{kpi.kpiName}</span>
                          <span className="text-xs text-muted-foreground">Outcome {kpi.outcomeNumber}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-right">
                          <span className="text-xs text-muted-foreground">
                            {kpi.currentValue}{kpi.unit ? ` ${kpi.unit}` : ""} / {kpi.targetValue}{kpi.unit ? ` ${kpi.unit}` : ""}
                          </span>
                          <span className={`text-xs font-semibold ${statusCfg.text}`}>{statusCfg.label}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${statusCfg.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Request Volume Chart */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request Activity (Last 6 Months)</h2>
            {requestLastUpdated && (
              <span className="text-xs text-muted-foreground/60">
                Last updated {format(requestLastUpdated, "MMM d, yyyy")}
              </span>
            )}
          </div>
          <Card className="shadow-sm">
            <CardContent className="h-72 pt-6">
              {monthlyData.every(d => d.submitted === 0 && d.closed === 0) ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No request activity data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "13px" }} />
                    <Bar dataKey="submitted" name="Submitted" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="closed" name="Closed" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </section>

      </motion.div>
    </Layout>
  );
}
