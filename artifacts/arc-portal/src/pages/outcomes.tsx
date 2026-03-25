import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, Label, Textarea, Badge } from "@/components/ui-primitives";
import { useListOutcomes, useCreateOutcome, useListRequests } from "@workspace/api-client-react";
import type { CreateReviewOutcome } from "@workspace/api-client-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { formatLabel } from "@/lib/utils";
import { ShieldCheck, FileCheck2 } from "lucide-react";

export default function OutcomesPage() {
  const { data: outcomes, refetch } = useListOutcomes();
  const { data: requests } = useListRequests();
  const createMutation = useCreateOutcome();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<CreateReviewOutcome>>({
    decision: "approved",
    outcomeType: "standard",
    createdBy: "ARC Committee"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.requestId) return;

    createMutation.mutate({ data: formData as CreateReviewOutcome }, {
      onSuccess: () => {
        toast({ title: "Outcome Recorded", description: "The review decision has been saved." });
        setFormData({ decision: "approved", outcomeType: "standard", createdBy: "ARC Committee", requestId: undefined, notes: "" });
        refetch();
      }
    });
  };

  return (
    <Layout>
      <div className="mb-8 flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-display font-bold">Review Outcomes</h1>
          <p className="text-muted-foreground mt-1">Record and browse final decisions from ARC reviews.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {outcomes?.map(outcome => {
            const req = requests?.find(r => r.id === outcome.requestId);
            return (
              <Card key={outcome.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{req?.title || `Request #${outcome.requestId}`}</h3>
                    <div className="text-sm text-muted-foreground">{format(new Date(outcome.createdAt), 'PPP')} • Recorded by {outcome.createdBy}</div>
                  </div>
                  <Badge variant={
                    outcome.decision === 'approved' ? 'success' : 
                    outcome.decision === 'rejected' ? 'danger' : 
                    outcome.decision === 'escalated' ? 'primary' : 'warning'
                  } className="text-sm px-3 py-1">
                    {formatLabel(outcome.decision)}
                  </Badge>
                </div>
                <div className="bg-secondary/30 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div><span className="font-semibold text-muted-foreground block mb-1">Outcome Type</span> {formatLabel(outcome.outcomeType)}</div>
                    {outcome.adrReference && <div><span className="font-semibold text-muted-foreground block mb-1">ADR Ref</span> {outcome.adrReference}</div>}
                    {outcome.riskOwner && <div><span className="font-semibold text-muted-foreground block mb-1">Risk Owner</span> {outcome.riskOwner}</div>}
                  </div>
                  {outcome.notes && <p className="text-sm mt-3 pt-3 border-t border-border/50 text-slate-700">{outcome.notes}</p>}
                </div>
              </Card>
            )
          })}
          {outcomes?.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground">No outcomes recorded yet.</Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-emerald-100 shadow-lg shadow-emerald-900/5">
            <CardHeader className="bg-emerald-50/50">
              <CardTitle className="flex items-center gap-2"><FileCheck2 className="w-5 h-5 text-emerald-600"/> Record Decision</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Request</Label>
                  <Select required value={formData.requestId || ''} onChange={e => setFormData({...formData, requestId: parseInt(e.target.value)})}>
                    <option value="">Select a request...</option>
                    {requests?.filter(r => r.status === 'arc_review' || r.status === 'arc_scheduled').map(r => (
                      <option key={r.id} value={r.id}>ARR-{r.id}: {r.title}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Decision</Label>
                  <Select required value={formData.decision} onChange={e => setFormData({...formData, decision: e.target.value as any})}>
                    <option value="approved">Approved</option>
                    <option value="approved_with_conditions">Approved with Conditions</option>
                    <option value="deferred">Deferred</option>
                    <option value="rejected">Rejected</option>
                    <option value="escalated">Escalated</option>
                  </Select>
                </div>
                <div>
                  <Label>Outcome Type</Label>
                  <Select required value={formData.outcomeType} onChange={e => setFormData({...formData, outcomeType: e.target.value as any})}>
                    <option value="standard">Standard</option>
                    <option value="adr_update">ADR Update Required</option>
                    <option value="deviation">Policy Deviation</option>
                    <option value="risk_ownership">Risk Ownership Assigned</option>
                    <option value="lt_escalation">Leadership Escalation</option>
                  </Select>
                </div>
                
                {formData.outcomeType === 'deviation' && (
                  <div>
                    <Label>Exception Owner</Label>
                    <Input value={formData.exceptionOwner || ''} onChange={e => setFormData({...formData, exceptionOwner: e.target.value})} placeholder="Who owns the exception?" />
                  </div>
                )}
                
                {formData.outcomeType === 'adr_update' && (
                  <div>
                    <Label>ADR Reference / Link</Label>
                    <Input value={formData.adrReference || ''} onChange={e => setFormData({...formData, adrReference: e.target.value})} placeholder="ADR-102" />
                  </div>
                )}

                <div>
                  <Label>Notes & Next Steps</Label>
                  <Textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Official review comments..." />
                </div>
                
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4 shadow-emerald-600/20" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Record Official Outcome"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
