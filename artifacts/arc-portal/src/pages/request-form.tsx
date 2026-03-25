import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Select, Label, Badge } from "@/components/ui-primitives";
import { useCreateRequest } from "@workspace/api-client-react";
import type { CreateArchitectureRequest } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, X, Layers } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { JiraInitiative } from "@workspace/api-client-react";

export default function RequestForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createMutation = useCreateRequest();

  const [formData, setFormData] = useState<CreateArchitectureRequest>({
    title: "",
    description: "",
    requestType: "new_technology",
    phase: "ph1",
    submittedBy: "Jane Doe", // Mocking auth user
    businessUnit: "",
    priority: "medium",
    architectureSpecifications: "",
    jiraInitiativeId: null
  });

  const { data: initiatives, isLoading: isLoadingJira } = useQuery<JiraInitiative[]>({
    queryKey: ['/api/jira/initiatives'],
    queryFn: () => fetch('/api/jira/initiatives').then(res => res.json())
  });

  // Handle ?jiraId= in URL
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" href="/requests" className="mb-6 -ml-4 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Requests
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Submit Architecture Request</h1>
          <p className="text-muted-foreground mt-2">Provide initial details for the EA team to triage your request.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* JIRA INITIATIVE CARD */}
          <Card className="mb-8 border-indigo-100">
            <CardHeader className="bg-indigo-50/50 flex flex-row items-center gap-2">
              <div className="bg-blue-600 text-white p-1 rounded">
                <Layers className="w-4 h-4" />
              </div>
              <CardTitle className="text-indigo-900">Linked JIRA Initiative</CardTitle>
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
                  <Select 
                    value={formData.jiraInitiativeId?.toString() || ""} 
                    onChange={handleJiraSelect}
                  >
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
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, jiraInitiativeId: null}))}
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="primary" className="font-mono bg-blue-100 text-blue-800 border-blue-200">
                      {selectedInitiative.jiraKey}
                    </Badge>
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

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Project Title</Label>
                <Input required name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Migration to AWS Cloud" />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea required name="description" value={formData.description} onChange={handleChange} placeholder="Briefly describe the business problem and proposed solution..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Request Type</Label>
                  <Select name="requestType" value={formData.requestType} onChange={handleChange}>
                    <option value="new_technology">New Technology</option>
                    <option value="replacement_migration">Replacement / Migration</option>
                    <option value="new_capability">New Capability</option>
                    <option value="expansion">Expansion</option>
                    <option value="ma_assessment">M&A Assessment</option>
                  </Select>
                </div>
                <div>
                  <Label>Project Phase</Label>
                  <Select name="phase" value={formData.phase} onChange={handleChange}>
                    <option value="ph1">Phase 1 (Discovery/Concept)</option>
                    <option value="ph2">Phase 2 (Design/Architecture)</option>
                    <option value="ph3">Phase 3 (Implementation/Build)</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Business Unit</Label>
                  <Input required name="businessUnit" value={formData.businessUnit} onChange={handleChange} placeholder="e.g. Retail Banking" />
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

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Architecture Specifications (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">If you already have technical specifications, sequence diagrams links, or security context, provide them here. Otherwise, the EA team will request them during triage.</p>
              <Textarea name="architectureSpecifications" value={formData.architectureSpecifications || ''} onChange={handleChange} placeholder="Technical details, links to Confluence, etc." className="min-h-[150px]" />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </motion.div>
    </Layout>
  );
}