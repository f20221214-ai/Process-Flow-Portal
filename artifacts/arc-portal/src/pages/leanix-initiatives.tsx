import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { Card, CardContent, Button, Badge } from "@/components/ui-primitives";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, ExternalLink, LayoutGrid } from "lucide-react";
import { format } from "date-fns";

interface LeanixInitiative {
  id: number;
  leanixId: string;
  name: string;
  description: string | null;
  lifecycle: string | null;
  status: string;
  responsible: string | null;
  tags: string[];
  leanixUrl: string | null;
  syncedAt: string;
  createdAt: string;
}

interface LeanixSyncResult {
  synced: number;
  added: number;
  updated: number;
  lastSyncedAt: string;
}

export default function LeanixInitiatives() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastSyncResult, setLastSyncResult] = useState<LeanixSyncResult | null>(null);

  const { data: initiatives, isLoading, refetch } = useQuery<LeanixInitiative[]>({
    queryKey: ['/api/leanix/initiatives'],
    queryFn: () => fetch('/api/leanix/initiatives').then(res => res.json()),
  });

  const syncMutation = useMutation<LeanixSyncResult, Error>({
    mutationFn: () => fetch('/api/leanix/sync', { method: 'POST' }).then(res => {
      if (!res.ok) return res.json().then(d => Promise.reject(new Error(d.error || 'Sync failed')));
      return res.json();
    }),
    onSuccess: (data) => {
      setLastSyncResult(data);
      toast({
        title: "Sync Complete",
        description: `Synced ${data.synced} initiatives (${data.added} added, ${data.updated} updated).`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leanix/initiatives'] });
      refetch();
    },
    onError: (err) => {
      toast({
        title: "Sync Failed",
        description: err.message || "Could not sync with LeanIX.",
        variant: "destructive",
      });
    },
  });

  const getLifecycleColor = (lifecycle: string | null) => {
    if (!lifecycle) return 'default';
    const lc = lifecycle.toLowerCase();
    if (lc.includes('active') || lc.includes('plan')) return 'primary';
    if (lc.includes('phaseout') || lc.includes('end')) return 'warning';
    if (lc.includes('retire')) return 'danger';
    return 'default';
  };

  const LEANIX_BRAND = "#FF6600";

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">

        {/* Connection Banner */}
        <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm py-2 px-4 rounded-xl flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
          <span className="font-medium">Connected to LeanIX</span>
          <span className="text-orange-600/60 mx-1">·</span>
          <span className="font-mono text-xs">Enterprise Architecture Management</span>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-white p-2.5 rounded-xl shadow-sm" style={{ backgroundColor: LEANIX_BRAND }}>
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">LeanIX Initiatives</h1>
              <p className="text-muted-foreground text-sm mt-1">Sync and track enterprise initiatives from LeanIX.</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="text-white"
              style={{ backgroundColor: LEANIX_BRAND }}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Syncing...' : 'Sync from LeanIX'}
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
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-32 animate-pulse bg-secondary/20" />
            ))}
          </div>
        ) : initiatives?.length === 0 ? (
          <Card className="mt-8 border-dashed border-2 py-16 flex flex-col items-center justify-center text-center">
            <div className="bg-secondary p-4 rounded-full mb-4">
              <LayoutGrid className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">No initiatives found</h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
              There are no LeanIX initiatives synced yet. Connect your LeanIX workspace and sync to populate this list.
            </p>
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 mt-6">
            {initiatives?.map(init => (
              <Card key={init.id} className="hover:border-orange-200 transition-colors overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: LEANIX_BRAND }}></div>
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row gap-6 md:items-center">

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="primary" className="font-mono bg-orange-50 border-orange-200" style={{ color: LEANIX_BRAND }}>
                          {init.leanixId.substring(0, 8)}...
                        </Badge>
                        <Badge variant={getLifecycleColor(init.lifecycle)}>
                          {init.lifecycle ?? 'No Lifecycle'}
                        </Badge>
                        <Badge variant="default">{init.status}</Badge>
                      </div>

                      <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">
                        {init.name}
                      </h3>

                      {init.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{init.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {init.responsible && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-bold">
                              {init.responsible.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-600">{init.responsible}</span>
                          </div>
                        )}
                        {init.tags && init.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {init.tags.map(t => (
                              <span key={t} className="px-2 py-0.5 bg-slate-100 rounded text-xs">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 shrink-0 md:w-48 justify-end">
                      <Button
                        variant="outline"
                        className="w-full justify-center border-orange-200 hover:bg-orange-50"
                        style={{ color: LEANIX_BRAND }}
                        onClick={() => window.open(init.leanixUrl ?? `https://app.leanix.net`, '_blank')}
                      >
                        View in LeanIX <ExternalLink className="w-3 h-3 ml-2" />
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
