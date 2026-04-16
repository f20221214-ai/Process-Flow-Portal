import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { Card, CardContent, Button, Badge } from "@/components/ui-primitives";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, LayoutGrid, AlertTriangle, ShieldX, WifiOff, KeyRound, ServerCrash, AlertCircle, Plus } from "lucide-react";
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

interface SyncError {
  kind: "auth" | "access" | "not_found" | "connection" | "graphql" | "config" | "unknown";
  message: string;
  status: number;
}

function classifySyncError(status: number, message: string): SyncError {
  if (status === 400) return { kind: "config", message, status };
  if (status === 401) return { kind: "auth", message, status };
  if (status === 403) return { kind: "access", message, status };
  if (status === 404) return { kind: "not_found", message, status };
  if (status === 503) return { kind: "connection", message, status };
  if (status === 422) return { kind: "graphql", message, status };
  return { kind: "unknown", message, status };
}

function SyncErrorBanner({ error, onRetry }: { error: SyncError; onRetry: () => void }) {
  const iconMap: Record<SyncError["kind"], React.ReactNode> = {
    auth: <KeyRound className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />,
    access: <ShieldX className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
    not_found: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
    connection: <WifiOff className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />,
    graphql: <ServerCrash className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />,
    config: <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />,
    unknown: <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />,
  };

  const headingMap: Record<SyncError["kind"], string> = {
    auth: "Authentication Failed",
    access: "Access Denied",
    not_found: "Workspace Not Found",
    connection: "Cannot Reach LeanIX",
    graphql: "LeanIX Query Error",
    config: "Configuration Required",
    unknown: "Sync Failed",
  };

  const styleMap: Record<SyncError["kind"], string> = {
    auth: "bg-red-50 border-red-200",
    access: "bg-amber-50 border-amber-200",
    not_found: "bg-amber-50 border-amber-200",
    connection: "bg-slate-50 border-slate-200",
    graphql: "bg-purple-50 border-purple-200",
    config: "bg-orange-50 border-orange-200",
    unknown: "bg-red-50 border-red-200",
  };

  return (
    <div className={`border rounded-xl p-4 flex gap-3 items-start ${styleMap[error.kind]}`}>
      {iconMap[error.kind]}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-800 mb-1">{headingMap[error.kind]}</p>
        <p className="text-sm text-slate-600 leading-relaxed break-words">{error.message}</p>
      </div>
      <Button variant="outline" className="shrink-0 text-xs h-8" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export default function LeanixInitiatives() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastSyncResult, setLastSyncResult] = useState<LeanixSyncResult | null>(null);
  const [syncError, setSyncError] = useState<SyncError | null>(null);
  const [search, setSearch] = useState("");

  const { data: initiatives, isLoading } = useQuery<LeanixInitiative[]>({
    queryKey: ["/api/leanix/initiatives"],
    queryFn: () => fetch("/api/leanix/initiatives").then(res => res.json()),
  });

  const syncMutation = useMutation<LeanixSyncResult, SyncError>({
    mutationFn: async () => {
      const res = await fetch("/api/leanix/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw classifySyncError(res.status, data.error || "Sync failed — an unexpected error occurred.");
      }
      return data as LeanixSyncResult;
    },
    onSuccess: (data) => {
      setSyncError(null);
      setLastSyncResult(data);
      toast({
        title: "Sync Complete",
        description: `Synced ${data.synced} initiatives (${data.added} added, ${data.updated} updated).`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leanix/initiatives"] });
    },
    onError: (err) => {
      setSyncError(err);
      toast({
        title: err.kind === "auth" ? "Authentication Failed"
          : err.kind === "access" ? "Access Denied"
          : err.kind === "not_found" ? "Workspace Not Found"
          : err.kind === "connection" ? "Cannot Reach LeanIX"
          : err.kind === "config" ? "Configuration Required"
          : "Sync Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const filteredInitiatives = (initiatives ?? []).filter(init => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      init.name.toLowerCase().includes(q) ||
      (init.description ?? "").toLowerCase().includes(q) ||
      (init.status ?? "").toLowerCase().includes(q) ||
      (init.lifecycle ?? "").toLowerCase().includes(q) ||
      (init.responsible ?? "").toLowerCase().includes(q) ||
      init.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  const getLifecycleColor = (lifecycle: string | null) => {
    if (!lifecycle) return "default" as const;
    const lc = lifecycle.toLowerCase();
    if (lc.includes("active") || lc.includes("plan")) return "primary" as const;
    if (lc.includes("phaseout") || lc.includes("end")) return "warning" as const;
    if (lc.includes("retire")) return "danger" as const;
    return "default" as const;
  };

  const LEANIX_BRAND = "#FF6600";

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">

        {/* Connection Banner */}
        <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm py-2 px-4 rounded-xl flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
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
              <h1 className="text-3xl font-display font-bold">Initiatives</h1>
              <p className="text-muted-foreground text-sm mt-1">Sync and track enterprise initiatives from LeanIX.</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={() => { setSyncError(null); syncMutation.mutate(); }}
              disabled={syncMutation.isPending}
              className="text-white"
              style={{ backgroundColor: LEANIX_BRAND }}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              {syncMutation.isPending ? "Syncing..." : "Sync from LeanIX"}
            </Button>
            {lastSyncResult && !syncError && (
              <span className="text-xs text-muted-foreground">
                Last synced: {format(new Date(lastSyncResult.lastSyncedAt), "p")}
              </span>
            )}
          </div>
        </div>

        {/* Search bar */}
        {!isLoading && (initiatives?.length ?? 0) > 0 && (
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, description, status, or tag…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Search result count */}
        {search && !isLoading && (
          <p className="text-xs text-muted-foreground -mt-2">
            {filteredInitiatives.length === 0
              ? "No results"
              : `${filteredInitiatives.length} of ${initiatives?.length ?? 0} initiative${(initiatives?.length ?? 0) !== 1 ? "s" : ""}`}
          </p>
        )}

        {/* Error panel — shown persistently below header */}
        {syncError && (
          <SyncErrorBanner
            error={syncError}
            onRetry={() => { setSyncError(null); syncMutation.mutate(); }}
          />
        )}

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
            <h3 className="text-lg font-bold">No initiatives synced yet</h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
              Click "Sync from LeanIX" to pull your enterprise initiatives into the portal.
            </p>
            <Button
              onClick={() => { setSyncError(null); syncMutation.mutate(); }}
              disabled={syncMutation.isPending}
              style={{ backgroundColor: LEANIX_BRAND }}
              className="text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              {syncMutation.isPending ? "Syncing..." : "Sync Now"}
            </Button>
          </Card>
        ) : filteredInitiatives.length === 0 && search ? (
          <div className="text-center py-16 text-muted-foreground">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <p className="font-medium text-slate-700">No initiatives match "<span className="text-orange-600">{search}</span>"</p>
            <p className="text-sm mt-1">Try a different search term or <button className="underline text-orange-500 hover:text-orange-700" onClick={() => setSearch("")}>clear the search</button>.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 mt-6">
            {filteredInitiatives.map(init => (
              <Card key={init.id} className="hover:border-orange-200 transition-colors overflow-hidden group relative">
                <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: LEANIX_BRAND }} />
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row gap-6 md:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="primary" className="font-mono bg-orange-50 border-orange-200" style={{ color: LEANIX_BRAND }}>
                          {init.leanixId.substring(0, 8)}…
                        </Badge>
                        {init.lifecycle && (
                          <Badge variant={getLifecycleColor(init.lifecycle)}>
                            {init.lifecycle}
                          </Badge>
                        )}
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
                            {init.tags.map((t, ti) => (
                              <span key={`${t}-${ti}`} className="px-2 py-0.5 bg-slate-100 rounded text-xs">{t}</span>
                            ))}
                          </div>
                        )}
                        <span className="text-xs text-slate-400">
                          Synced {format(new Date(init.syncedAt), "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 shrink-0 md:w-44 justify-end">
                      <Button
                        variant="primary"
                        className="w-full justify-center"
                        href={`/requests/new?leanixId=${init.id}`}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Submit ARR
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
