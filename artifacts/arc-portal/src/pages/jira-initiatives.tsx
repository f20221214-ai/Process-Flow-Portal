import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { Card, CardContent, Button, Badge } from "@/components/ui-primitives";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Layers, ExternalLink, Plus } from "lucide-react";
import { format } from "date-fns";
import type { JiraInitiative, JiraSyncResult } from "@workspace/api-client-react";

export default function JiraInitiatives() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastSyncResult, setLastSyncResult] = useState<JiraSyncResult | null>(null);

  const { data: initiatives, isLoading, refetch } = useQuery<JiraInitiative[]>({
    queryKey: ['/api/jira/initiatives'],
    queryFn: () => fetch('/api/jira/initiatives').then(res => res.json())
  });

  const syncMutation = useMutation<JiraSyncResult, Error>({
    mutationFn: () => fetch('/api/jira/sync', { method: 'POST' }).then(res => res.json()),
    onSuccess: (data) => {
      setLastSyncResult(data);
      toast({
        title: "Sync Complete",
        description: `Synced ${data.synced} initiatives (${data.added} added, ${data.updated} updated).`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jira/initiatives'] });
      refetch();
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Could not sync with JIRA.",
        variant: "destructive"
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'in progress': return 'primary';
      case 'done': return 'success';
      case 'to do': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority.toLowerCase()) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
        
        {/* Connection Banner */}
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm py-2 px-4 rounded-xl flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-medium">Connected to JIRA Cloud</span>
          <span className="text-emerald-600/60 mx-1">·</span>
          <span className="font-mono text-xs">company.atlassian.net</span>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#0052CC] text-white p-2.5 rounded-xl shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">JIRA Initiatives</h1>
              <p className="text-muted-foreground text-sm mt-1">Track and map enterprise epics to architecture reviews.</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Button 
              onClick={() => syncMutation.mutate()} 
              disabled={syncMutation.isPending}
              className="bg-[#0052CC] hover:bg-[#0047b3] text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Syncing...' : 'Sync from JIRA'}
            </Button>
            {lastSyncResult && (
              <span className="text-xs text-muted-foreground">
                Last synced: {format(new Date(lastSyncResult.lastSyncedAt), 'p')}
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 mt-8">
            {[1,2,3].map(i => (
              <Card key={i} className="h-32 animate-pulse bg-secondary/20" />
            ))}
          </div>
        ) : initiatives?.length === 0 ? (
          <Card className="mt-8 border-dashed border-2 py-16 flex flex-col items-center justify-center text-center">
            <div className="bg-secondary p-4 rounded-full mb-4">
              <Layers className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">No initiatives found</h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
              There are no JIRA initiatives mapped to your portal yet. Sync with your JIRA instance to populate this list.
            </p>
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 mt-6">
            {initiatives?.map(init => (
              <Card key={init.id} className="hover:border-indigo-200 transition-colors overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#0052CC] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row gap-6 md:items-center">
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="primary" className="font-mono bg-blue-50 text-[#0052CC] border-blue-200">
                          {init.jiraKey}
                        </Badge>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {init.projectName}
                        </span>
                        <Badge variant={getStatusColor(init.status)}>{init.status}</Badge>
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">
                        {init.summary}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                            {init.assignee ? init.assignee.substring(0,2).toUpperCase() : '??'}
                          </div>
                          <span className="font-medium text-slate-600">{init.assignee || 'Unassigned'}</span>
                        </div>
                        <Badge variant={getPriorityColor(init.priority)}>{init.priority}</Badge>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{init.issueType}</span>
                        {init.labels && init.labels.length > 0 && (
                          <div className="flex gap-1">
                            {init.labels.map(l => (
                              <span key={l} className="px-2 py-0.5 bg-slate-100 rounded text-xs">{l}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 shrink-0 md:w-48 justify-end">
                      <Button variant="primary" className="w-full justify-center" href={`/requests/new?jiraId=${init.id}`}>
                        <Plus className="w-4 h-4 mr-2" />
                        Submit ARR
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-center text-[#0052CC] border-blue-200 hover:bg-blue-50"
                        onClick={() => window.open(init.jiraUrl || `https://company.atlassian.net/browse/${init.jiraKey}`, '_blank')}
                      >
                        View in JIRA <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                    </div>

                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </Layout>
  );
}