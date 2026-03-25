import React, { useState } from "react";
import { useRoute } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, StatusBadge, PriorityBadge, Input, Textarea, Select, Label, Badge } from "@/components/ui-primitives";
import { WorkflowTimeline } from "@/components/workflow-timeline";
import { useGetRequest, useUpdateRequest, useListSessions, useListOutcomes } from "@workspace/api-client-react";
import { format } from "date-fns";
import { formatLabel } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Calendar, User, AlignLeft, ShieldAlert } from "lucide-react";

export default function RequestDetail() {
  const [, params] = useRoute("/requests/:id");
  const id = parseInt(params?.id || "0");
  const { toast } = useToast();

  const { data: request, isLoading, refetch } = useGetRequest(id);
  const { data: sessions } = useListSessions();
  const { data: outcomes } = useListOutcomes();
  const updateMutation = useUpdateRequest();

  // EA Triage Form State
  const [triageData, setTriageData] = useState({
    eaAssignee: "",
    scopeNotes: "",
    status: "",
  });

  const requestSessions = sessions?.filter(s => s.requestId === id) || [];
  const requestOutcomes = outcomes?.filter(o => o.requestId === id) || [];

  // Initialize Triage form when request loads
  React.useEffect(() => {
    if (request) {
      setTriageData({
        eaAssignee: request.eaAssignee || "",
        scopeNotes: request.scopeNotes || "",
        status: request.status,
      });
    }
  }, [request]);

  const handleTriageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      { id, data: triageData as any },
      {
        onSuccess: () => {
          toast({ title: "Updated", description: "Request has been updated successfully." });
          refetch();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update request.", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading || !request) {
    return (
      <Layout>
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-card rounded-2xl"></div>
          <div className="h-64 bg-card rounded-2xl"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        
        {/* Header Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">ARR-{request.id}</span>
              <PriorityBadge priority={request.priority} />
              <StatusBadge status={request.status} />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">{request.title}</h1>
            <p className="text-muted-foreground mt-2 text-sm flex items-center gap-4">
              <span className="flex items-center gap-1"><User className="w-4 h-4"/> {request.submittedBy}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {format(new Date(request.createdAt), 'PP')}</span>
            </p>
          </div>
        </div>

        {/* Timeline Visualizer */}
        <Card className="p-6 bg-gradient-to-br from-white to-blue-50/30 border-blue-100">
          <WorkflowTimeline currentStatus={request.status} />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlignLeft className="w-5 h-5 text-primary"/> Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{request.description}</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-secondary/30 p-4 rounded-xl">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Type</div>
                    <div className="font-medium text-sm">{formatLabel(request.requestType)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Phase</div>
                    <div className="font-medium text-sm">{formatLabel(request.phase)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Business Unit</div>
                    <div className="font-medium text-sm">{request.businessUnit}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">EA Assignee</div>
                    <div className="font-medium text-sm">{request.eaAssignee || "Unassigned"}</div>
                  </div>
                </div>

                {(request.architectureSpecifications || request.scopeNotes) && (
                  <div className="border-t border-border/50 pt-6 mt-6">
                    {request.architectureSpecifications && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Architecture Specifications</h4>
                        <div className="bg-slate-50 p-4 rounded-xl text-sm font-mono text-slate-800 whitespace-pre-wrap border border-slate-200">
                          {request.architectureSpecifications}
                        </div>
                      </div>
                    )}
                    {request.scopeNotes && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">EA Scope Notes</h4>
                        <div className="bg-amber-50 p-4 rounded-xl text-sm text-amber-900 border border-amber-200">
                          {request.scopeNotes}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Outcomes Section */}
            {requestOutcomes.length > 0 && (
              <Card className="border-primary/20 shadow-md shadow-primary/5">
                <CardHeader className="bg-primary/5 border-primary/10">
                  <CardTitle className="flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-primary"/> Review Outcomes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/40">
                    {requestOutcomes.map((outcome) => (
                      <div key={outcome.id} className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant={
                            outcome.decision === 'approved' ? 'success' : 
                            outcome.decision === 'rejected' ? 'danger' : 'warning'
                          }>
                            {formatLabel(outcome.decision)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{format(new Date(outcome.createdAt), 'PP p')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{formatLabel(outcome.outcomeType)}</span></div>
                          <div><span className="text-muted-foreground">Recorded By:</span> <span className="font-medium">{outcome.createdBy}</span></div>
                        </div>
                        {outcome.notes && <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border">{outcome.notes}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* EA Triage Panel */}
            <Card className="border-indigo-100 bg-indigo-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-indigo-900 text-base">EA Workspace</CardTitle>
                <p className="text-xs text-indigo-700/70 mt-1">Update triage details and status</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTriageSubmit} className="space-y-4">
                  <div>
                    <Label className="text-xs text-indigo-900">Advance Status</Label>
                    <Select 
                      value={triageData.status} 
                      onChange={e => setTriageData({...triageData, status: e.target.value})}
                      className="border-indigo-200 focus-visible:ring-indigo-200"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="ea_triage">EA Triage</option>
                      <option value="specifications_required">Need Specifications</option>
                      <option value="arc_scheduled">Ready for ARC (Scheduled)</option>
                      <option value="arc_review">In ARC Review</option>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-indigo-900">EA Assignee</Label>
                    <Input 
                      value={triageData.eaAssignee} 
                      onChange={e => setTriageData({...triageData, eaAssignee: e.target.value})}
                      placeholder="e.g. John Architect"
                      className="border-indigo-200"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-indigo-900">Scope Notes</Label>
                    <Textarea 
                      value={triageData.scopeNotes} 
                      onChange={e => setTriageData({...triageData, scopeNotes: e.target.value})}
                      placeholder="Add triage notes here..."
                      className="min-h-[80px] border-indigo-200"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Triage Updates"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Sessions Panel */}
            <Card>
              <CardHeader className="pb-4 flex flex-row justify-between items-center">
                <CardTitle className="text-base">ARC Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {requestSessions.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4 bg-secondary/50 rounded-xl">
                    No sessions scheduled yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requestSessions.map(session => (
                      <div key={session.id} className="p-3 border rounded-xl bg-card text-sm">
                        <div className="font-semibold mb-1">{format(new Date(session.scheduledDate), 'MMM d, yyyy')}</div>
                        <div className="text-muted-foreground text-xs flex justify-between">
                          <span>{session.duration} mins</span>
                          <span className="capitalize">{formatLabel(session.status)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                   <Button variant="outline" className="w-full text-xs" href="/sessions">Manage Sessions</Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </motion.div>
    </Layout>
  );
}
