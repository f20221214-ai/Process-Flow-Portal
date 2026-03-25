import React from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent, Button, StatusBadge, PriorityBadge } from "@/components/ui-primitives";
import { useListRequests, useListSessions } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ArrowRight, Activity, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: requests, isLoading: reqLoading } = useListRequests();
  const { data: sessions, isLoading: sesLoading } = useListSessions();

  const activeRequests = requests?.filter(r => !['approved', 'approved_with_conditions', 'rejected'].includes(r.status)) || [];
  const triageRequests = requests?.filter(r => r.status === 'submitted' || r.status === 'ea_triage') || [];
  const upcomingSessions = sessions?.filter(s => s.status === 'scheduled') || [];
  const completedRequests = requests?.filter(r => ['approved', 'approved_with_conditions'].includes(r.status)) || [];

  const chartData = [
    { name: 'Intake', count: requests?.filter(r => r.status === 'submitted').length || 0, color: '#94a3b8' },
    { name: 'Triage', count: requests?.filter(r => r.status === 'ea_triage').length || 0, color: '#3b82f6' },
    { name: 'Specs Req', count: requests?.filter(r => r.status === 'specifications_required').length || 0, color: '#f59e0b' },
    { name: 'Review', count: requests?.filter(r => r.status === 'arc_review' || r.status === 'arc_scheduled').length || 0, color: '#8b5cf6' },
    { name: 'Approved', count: requests?.filter(r => r.status === 'approved' || r.status === 'approved_with_conditions').length || 0, color: '#10b981' },
  ];

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        
        {/* Hero Section with Image */}
        <div className="relative w-full h-48 md:h-56 rounded-2xl overflow-hidden mb-8 shadow-sm">
          <img
            src={`${import.meta.env.BASE_URL}images/dashboard-hero.png`}
            alt="Dashboard Hero"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-primary/80 to-transparent flex flex-col justify-center p-8 text-white">
            <h1 className="text-3xl md:text-4xl font-display font-bold">Architecture Review Portal</h1>
            <p className="mt-2 text-blue-50 max-w-xl text-sm md:text-base leading-relaxed">
              Streamline enterprise architecture requests, manage reviews, and track technical decisions across all business units.
            </p>
            <div className="mt-6">
              <Button variant="secondary" href="/requests/new" className="bg-white text-primary hover:bg-blue-50 border-none font-bold">
                Submit New Request
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Active Requests" value={activeRequests.length} icon={Activity} color="text-blue-500" loading={reqLoading} />
          <StatCard title="Pending EA Triage" value={triageRequests.length} icon={AlertCircle} color="text-amber-500" loading={reqLoading} />
          <StatCard title="Upcoming Sessions" value={upcomingSessions.length} icon={Calendar} color="text-purple-500" loading={sesLoading} />
          <StatCard title="Approved Designs" value={completedRequests.length} icon={CheckCircle2} color="text-emerald-500" loading={reqLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <Card className="lg:col-span-2">
            <div className="px-6 py-5 border-b border-border/50">
              <h3 className="font-display font-bold text-lg">Request Pipeline</h3>
            </div>
            <CardContent className="h-80 pt-6">
              {reqLoading ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">Loading chart...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="flex flex-col">
            <div className="px-6 py-5 border-b border-border/50 flex justify-between items-center">
              <h3 className="font-display font-bold text-lg">Recent ARRs</h3>
              <Button variant="ghost" size="sm" href="/requests" className="text-xs text-primary -mr-2">View All</Button>
            </div>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {reqLoading ? (
                <div className="p-6 text-center text-muted-foreground">Loading...</div>
              ) : requests?.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">No requests found</div>
              ) : (
                <div className="divide-y divide-border/40">
                  {requests?.slice(0, 5).map(req => (
                    <Link key={req.id} href={`/requests/${req.id}`} className="block p-4 hover:bg-secondary/50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm truncate pr-2 text-foreground">{req.title}</span>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                        <span>{req.businessUnit}</span>
                        <span>{format(new Date(req.createdAt), 'MMM d')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </Layout>
  );

  function Link({ href, children, className }: any) {
    return <a href={href} className={className} onClick={(e) => {
      e.preventDefault();
      window.location.href = href;
    }}>{children}</a>
  }
}

function StatCard({ title, value, icon: Icon, color, loading }: any) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            {loading ? (
              <div className="h-8 w-16 bg-secondary animate-pulse rounded"></div>
            ) : (
              <h4 className="text-3xl font-display font-bold text-foreground">{value}</h4>
            )}
          </div>
          <div className={`p-3 rounded-2xl bg-opacity-10 bg-current ${color}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
