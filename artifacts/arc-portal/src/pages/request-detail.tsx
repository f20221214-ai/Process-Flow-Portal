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
import { Calendar, User, AlignLeft, ShieldAlert, Layers, ExternalLink, ChevronDown, ChevronUp, Activity, Sparkles } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import type { JiraInitiative } from "@workspace/api-client-react";

/** Mirror of the server-side deriveEaBaseline — used as client-side fallback for older requests. */
function deriveEaBaseline(req: { securityImpactLevel?: string; dataImpactLevel?: string; integrationImpactLevel?: string; regulatoryImpactLevel?: string; aiImpactLevel?: string; }) {
  const toRating = (l?: string) => l === "high" ? "high" : l === "medium" ? "medium" : "low";
  const levels = [req.securityImpactLevel, req.dataImpactLevel, req.integrationImpactLevel, req.regulatoryImpactLevel, req.aiImpactLevel];
  return {
    eaSecurityRiskRating:          toRating(req.securityImpactLevel),
    eaDataComplexityRating:        toRating(req.dataImpactLevel),
    eaIntegrationComplexityRating: toRating(req.integrationImpactLevel),
    eaRegulatoryRiskRating:        toRating(req.regulatoryImpactLevel),
    eaAiRiskRating:                toRating(req.aiImpactLevel),
    eaOverallRiskLevel:            levels.includes("high") ? "high" : levels.includes("medium") ? "medium" : "low",
  };
}

export default function RequestDetail() {
  const [, params] = useRoute("/requests/:id");
  const id = parseInt(params?.id || "0");
  const { toast } = useToast();

  const { data: request, isLoading, refetch } = useGetRequest(id);
  const { data: sessions } = useListSessions();
  const { data: outcomes } = useListOutcomes();
  const updateMutation = useUpdateRequest();

  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const [ratingWasAutoCalc, setRatingWasAutoCalc] = useState(false);

  // Fetch JIRA Initiative if linked
  const { data: initiatives } = useQuery<JiraInitiative[]>({
    queryKey: ['/api/jira/initiatives'],
    queryFn: () => fetch('/api/jira/initiatives').then(res => res.json()),
    enabled: !!request?.jiraInitiativeId
  });

  const linkedJira = initiatives?.find(i => i.id === request?.jiraInitiativeId);

  // EA Triage Form State
  const [triageData, setTriageData] = useState({
    eaAssignee: "",
    scopeNotes: "",
    status: "",
    eaSecurityRiskRating: "",
    eaDataComplexityRating: "",
    eaIntegrationComplexityRating: "",
    eaRegulatoryRiskRating: "",
    eaAiRiskRating: "",
    eaOverallComplexity: "",
    eaOverallRiskLevel: "",
    eaReviewType: "",
    eaRequiredArchitectureViews: "",
    eaRequiredSmes: "",
    eaArcSchedule: "",
  });

  const requestSessions = sessions?.filter(s => s.requestId === id) || [];
  const requestOutcomes = outcomes?.filter(o => o.requestId === id) || [];

  // Initialize Triage form when request loads
  React.useEffect(() => {
    if (request) {
      // If the DB already has EA ratings saved (from server-side auto-calc or manual EA edits) use those.
      // For older requests that pre-date auto-calc, derive client-side as a baseline.
      const hasStoredRatings = !!(
        request.eaSecurityRiskRating ||
        request.eaDataComplexityRating ||
        request.eaOverallRiskLevel
      );
      const baseline = hasStoredRatings ? null : deriveEaBaseline(request as any);
      if (!hasStoredRatings) setRatingWasAutoCalc(true);

      setTriageData({
        eaAssignee: request.eaAssignee || "",
        scopeNotes: request.scopeNotes || "",
        status: request.status,
        eaSecurityRiskRating:          request.eaSecurityRiskRating          || baseline?.eaSecurityRiskRating          || "",
        eaDataComplexityRating:        request.eaDataComplexityRating        || baseline?.eaDataComplexityRating        || "",
        eaIntegrationComplexityRating: request.eaIntegrationComplexityRating || baseline?.eaIntegrationComplexityRating || "",
        eaRegulatoryRiskRating:        request.eaRegulatoryRiskRating        || baseline?.eaRegulatoryRiskRating        || "",
        eaAiRiskRating:                request.eaAiRiskRating                || baseline?.eaAiRiskRating                || "",
        eaOverallComplexity:           request.eaOverallComplexity           || "",
        eaOverallRiskLevel:            request.eaOverallRiskLevel            || baseline?.eaOverallRiskLevel            || "",
        eaReviewType:                  request.eaReviewType                  || "",
        eaRequiredArchitectureViews:   request.eaRequiredArchitectureViews   || "",
        eaRequiredSmes:                request.eaRequiredSmes                || "",
        eaArcSchedule:                 request.eaArcSchedule                 || "",
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

  const getImpactBadgeVariant = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'none': return 'default';
      case 'low': return 'primary';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      default: return 'default';
    }
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
        
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

            {/* Linked JIRA Section */}
            {(request.jiraKey || request.jiraInitiativeId) && (
              <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-white shadow-sm">
                <CardHeader className="py-4 bg-transparent border-b-0">
                  <CardTitle className="text-base text-indigo-900 flex items-center gap-2">
                    <div className="bg-blue-600 text-white p-1 rounded">
                      <Layers className="w-4 h-4" />
                    </div>
                    Linked JIRA Initiative
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-indigo-100">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary" className="font-mono bg-indigo-100 text-indigo-800 border-indigo-200">
                          {request.jiraKey || linkedJira?.jiraKey}
                        </Badge>
                        <span className="font-semibold text-slate-800">{linkedJira?.summary || "Loading..."}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Project: {linkedJira?.projectName || "Unknown"}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="shrink-0 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                      onClick={() => window.open(linkedJira?.jiraUrl || `https://company.atlassian.net/browse/${request.jiraKey || linkedJira?.jiraKey}`, '_blank')}
                    >
                      View in JIRA <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-card/80 transition-colors select-none" 
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><AlignLeft className="w-5 h-5 text-primary"/> ARR Details</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    {isDetailsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </Button>
                </div>
              </CardHeader>
              
              {isDetailsExpanded && (
                <CardContent className="space-y-8 pt-6 border-t border-border/40">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{request.description}</p>
                  </div>
                  
                  {request.businessContext && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Business Context</h4>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap bg-secondary/30 p-4 rounded-xl">{request.businessContext}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Business Unit</div>
                      <div className="font-medium text-sm">{request.businessUnit || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Request Type</div>
                      <div className="font-medium text-sm">{formatLabel(request.requestType)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Sponsor / Product Owner</div>
                      <div className="font-medium text-sm">{request.sponsorProductOwner || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Solution Architect</div>
                      <div className="font-medium text-sm">{request.solutionArchitect || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Business Criticality</div>
                      <div className="font-medium text-sm">{request.businessCriticality ? formatLabel(request.businessCriticality) : "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Cost Estimate</div>
                      <div className="font-medium text-sm">{request.costEstimate ? formatLabel(request.costEstimate) : "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Deployment Model</div>
                      <div className="font-medium text-sm">{request.deploymentModel ? formatLabel(request.deploymentModel) : "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Target Go-Live Date</div>
                      <div className="font-medium text-sm">{request.targetGoLiveDate ? format(new Date(request.targetGoLiveDate), 'PP') : "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Expected User Base</div>
                      <div className="font-medium text-sm">{request.expectedUserBase || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">In-Scope Regions</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {request.inScopeRegions && request.inScopeRegions.length > 0 ? (
                          request.inScopeRegions.map((region, i) => (
                            <Badge key={i} variant="default" className="text-[10px] font-normal px-2 py-0">{region}</Badge>
                          ))
                        ) : (
                          <span className="text-sm font-medium">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {request.businessValueHypothesis && request.businessValueHypothesis.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Business Value Hypothesis</h4>
                      <ul className="list-disc list-inside text-sm space-y-1 ml-4 text-foreground">
                        {request.businessValueHypothesis.map((item, i) => (
                          <li key={i}>{formatLabel(item)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-6 border-t border-border/40">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Impact Assessment
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-secondary/30 p-4 rounded-xl flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Security</span>
                        <Badge variant={getImpactBadgeVariant(request.securityImpactLevel)}>{request.securityImpactLevel}</Badge>
                      </div>
                      <div className="bg-secondary/30 p-4 rounded-xl flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Data</span>
                        <Badge variant={getImpactBadgeVariant(request.dataImpactLevel)}>{request.dataImpactLevel}</Badge>
                      </div>
                      <div className="bg-secondary/30 p-4 rounded-xl flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Integration</span>
                        <Badge variant={getImpactBadgeVariant(request.integrationImpactLevel)}>{request.integrationImpactLevel}</Badge>
                      </div>
                      <div className="bg-secondary/30 p-4 rounded-xl flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Regulatory</span>
                        <Badge variant={getImpactBadgeVariant(request.regulatoryImpactLevel)}>{request.regulatoryImpactLevel}</Badge>
                      </div>
                      <div className="bg-secondary/30 p-4 rounded-xl flex items-center justify-between md:col-span-2">
                        <span className="text-sm font-medium text-muted-foreground">AI</span>
                        <Badge variant={getImpactBadgeVariant(request.aiImpactLevel)}>{request.aiImpactLevel}</Badge>
                      </div>
                    </div>
                  </div>

                </CardContent>
              )}
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
                <CardTitle className="text-indigo-900 text-base">EA Triage & Assessment</CardTitle>
                <p className="text-xs text-indigo-700/70 mt-1">Update triage details, risk ratings, and status</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTriageSubmit} className="space-y-4">
                  <div>
                    <Label className="text-xs text-indigo-900">Advance Status</Label>
                    <Select 
                      value={triageData.status} 
                      onChange={e => setTriageData({...triageData, status: e.target.value})}
                      className="border-indigo-200 focus-visible:ring-indigo-200 h-9 text-sm"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="ea_triage">EA Triage</option>
                      <option value="specifications_required">Need Specifications</option>
                      <option value="arc_scheduled">Ready for ARC (Scheduled)</option>
                      <option value="arc_review">In ARC Review</option>
                      <option value="approved">Approved</option>
                      <option value="approved_with_conditions">Approved (Conditions)</option>
                      <option value="deferred">Deferred</option>
                      <option value="rejected">Rejected</option>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-indigo-900">EA Assignee</Label>
                    <Input 
                      value={triageData.eaAssignee} 
                      onChange={e => setTriageData({...triageData, eaAssignee: e.target.value})}
                      placeholder="e.g. John Architect"
                      className="border-indigo-200 h-9 text-sm"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-indigo-900 font-semibold">Risk & Complexity Ratings</Label>
                      {ratingWasAutoCalc ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3" /> auto-calculated baseline
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          EA reviewed
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-indigo-600/70 mb-3">
                      {ratingWasAutoCalc
                        ? "Pre-populated from the submitter's impact assessment. Review and adjust as needed before saving."
                        : "Ratings have been reviewed and saved by the EA team."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-indigo-900">Security Risk</Label>
                      <Select value={triageData.eaSecurityRiskRating} onChange={e => { setTriageData({...triageData, eaSecurityRiskRating: e.target.value}); setRatingWasAutoCalc(false); }} className="border-indigo-200 h-9 text-sm">
                        <option value="">-</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-indigo-900">Data Complexity</Label>
                      <Select value={triageData.eaDataComplexityRating} onChange={e => { setTriageData({...triageData, eaDataComplexityRating: e.target.value}); setRatingWasAutoCalc(false); }} className="border-indigo-200 h-9 text-sm">
                        <option value="">-</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-indigo-900">Integration Comp.</Label>
                      <Select value={triageData.eaIntegrationComplexityRating} onChange={e => { setTriageData({...triageData, eaIntegrationComplexityRating: e.target.value}); setRatingWasAutoCalc(false); }} className="border-indigo-200 h-9 text-sm">
                        <option value="">-</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-indigo-900">Regulatory Risk</Label>
                      <Select value={triageData.eaRegulatoryRiskRating} onChange={e => { setTriageData({...triageData, eaRegulatoryRiskRating: e.target.value}); setRatingWasAutoCalc(false); }} className="border-indigo-200 h-9 text-sm">
                        <option value="">-</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-indigo-900">AI Risk</Label>
                      <Select value={triageData.eaAiRiskRating} onChange={e => { setTriageData({...triageData, eaAiRiskRating: e.target.value}); setRatingWasAutoCalc(false); }} className="border-indigo-200 h-9 text-sm">
                        <option value="">-</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-indigo-900">Overall Risk</Label>
                      <Select value={triageData.eaOverallRiskLevel} onChange={e => { setTriageData({...triageData, eaOverallRiskLevel: e.target.value}); setRatingWasAutoCalc(false); }} className="border-indigo-200 h-9 text-sm">
                        <option value="">-</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Label className="text-xs text-indigo-900">Review Type</Label>
                    <Select value={triageData.eaReviewType} onChange={e => setTriageData({...triageData, eaReviewType: e.target.value})} className="border-indigo-200 h-9 text-sm">
                      <option value="">-- Select Review Type --</option>
                      <option value="lightweight">Lightweight</option>
                      <option value="standard">Standard</option>
                      <option value="deep_dive">Deep Dive</option>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-indigo-900">Required Architecture Views</Label>
                    <Input 
                      value={triageData.eaRequiredArchitectureViews} 
                      onChange={e => setTriageData({...triageData, eaRequiredArchitectureViews: e.target.value})}
                      placeholder="e.g. C4, Sequence, Data"
                      className="border-indigo-200 h-9 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-indigo-900">Required SMEs</Label>
                    <Input 
                      value={triageData.eaRequiredSmes} 
                      onChange={e => setTriageData({...triageData, eaRequiredSmes: e.target.value})}
                      placeholder="e.g. SecOps, Network"
                      className="border-indigo-200 h-9 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-indigo-900">ARC Schedule Target</Label>
                    <Input 
                      value={triageData.eaArcSchedule} 
                      onChange={e => setTriageData({...triageData, eaArcSchedule: e.target.value})}
                      placeholder="e.g. Q3 2023, TBD"
                      className="border-indigo-200 h-9 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-indigo-900">Scope Notes</Label>
                    <Textarea 
                      value={triageData.scopeNotes} 
                      onChange={e => setTriageData({...triageData, scopeNotes: e.target.value})}
                      placeholder="Add triage notes here..."
                      className="min-h-[80px] border-indigo-200 text-sm"
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
