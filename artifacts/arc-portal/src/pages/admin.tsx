import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Database, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function AdminPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<any>(null);

  async function seedData() {
    setStatus("loading");
    setResult(null);
    try {
      const res = await fetch("/api/admin/seed-demo?token=arc-demo-seed-2026");
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setResult(data.seeded);
      } else {
        setStatus("error");
        setResult(data);
      }
    } catch (err: any) {
      setStatus("error");
      setResult({ error: err.message });
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-12 px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Demo Setup</h1>
          <p className="text-muted-foreground">
            Load sample architecture review requests and JIRA initiatives into the database.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Database className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground mb-1">Seed Demo Data</h2>
              <p className="text-sm text-muted-foreground">
                This will add 4 JIRA initiatives, 4 architecture review requests (Digital Agriculture,
                MES Modernisation, E-Invoicing, AI Pilot for Marketing), and 35 KPI metrics.
                Existing records are not overwritten.
              </p>
            </div>
          </div>

          <button
            onClick={seedData}
            disabled={status === "loading"}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === "loading" ? "Seeding data…" : "Load Demo Data"}
          </button>

          {status === "success" && result && (
            <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Demo data loaded successfully
              </div>
              <ul className="text-sm text-green-600 dark:text-green-500 space-y-1 pl-6">
                <li>JIRA initiatives added: <strong>{result.jiraInitiatives}</strong></li>
                <li>Architecture requests added: <strong>{result.architectureRequests}</strong></li>
                <li>KPI metrics added: <strong>{result.kpiMetrics}</strong></li>
              </ul>
              {result.jiraInitiatives === 0 && result.architectureRequests === 0 && (
                <p className="text-xs text-green-600 dark:text-green-500 pt-1">
                  All records already exist — no duplicates were created.
                </p>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium mb-1">
                <AlertCircle className="w-4 h-4" />
                Something went wrong
              </div>
              <pre className="text-xs text-red-600 dark:text-red-500 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
