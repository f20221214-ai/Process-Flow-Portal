import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, Label, Badge } from "@/components/ui-primitives";
import { useListSessions, useCreateSession, useListRequests } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SessionsPage() {
  const { data: sessions, refetch } = useListSessions();
  const { data: requests } = useListRequests();
  const createMutation = useCreateSession();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    requestId: "",
    scheduledDate: "",
    duration: "60",
    attendees: "",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.requestId || !formData.scheduledDate) return;

    createMutation.mutate({
      data: {
        requestId: parseInt(formData.requestId),
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
        duration: parseInt(formData.duration),
        attendees: formData.attendees.split(",").map(s => s.trim()).filter(Boolean),
        notes: formData.notes
      }
    }, {
      onSuccess: () => {
        toast({ title: "Session Created" });
        setFormData({ requestId: "", scheduledDate: "", duration: "60", attendees: "", notes: "" });
        refetch();
      }
    });
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">ARC Sessions</h1>
        <p className="text-muted-foreground mt-2">Schedule and manage Architecture Review Committee meetings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {sessions?.map(session => {
            const req = requests?.find(r => r.id === session.requestId);
            return (
              <Card key={session.id} className="p-5 flex flex-col md:flex-row gap-6 hover:border-primary/30 transition-colors">
                <div className="flex-shrink-0 bg-primary/5 text-primary rounded-xl p-4 flex flex-col items-center justify-center w-28 h-28 border border-primary/10">
                  <span className="text-xs font-bold uppercase">{format(new Date(session.scheduledDate), 'MMM')}</span>
                  <span className="text-3xl font-display font-bold">{format(new Date(session.scheduledDate), 'd')}</span>
                  <span className="text-xs mt-1">{format(new Date(session.scheduledDate), 'p')}</span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{req ? req.title : `Request #${session.requestId}`}</h3>
                    <Badge variant={session.status === 'scheduled' ? 'primary' : session.status === 'completed' ? 'success' : 'default'}>
                      {session.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3 flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> {session.duration} min</span>
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4"/> {session.attendees.length} Attendees</span>
                  </div>
                  {session.notes && <p className="text-sm bg-secondary/50 p-2 rounded-lg truncate">{session.notes}</p>}
                </div>
              </Card>
            )
          })}
          {sessions?.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground">No sessions scheduled.</Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Schedule Session</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Link to Request</Label>
                  <Select required value={formData.requestId} onChange={e => setFormData({...formData, requestId: e.target.value})}>
                    <option value="">Select a request...</option>
                    {requests?.filter(r => r.status === 'arc_scheduled' || r.status === 'specifications_required').map(r => (
                      <option key={r.id} value={r.id}>ARR-{r.id}: {r.title}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Date & Time</Label>
                  <Input type="datetime-local" required value={formData.scheduledDate} onChange={e => setFormData({...formData, scheduledDate: e.target.value})} />
                </div>
                <div>
                  <Label>Duration (mins)</Label>
                  <Select value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})}>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </Select>
                </div>
                <div>
                  <Label>Attendees (comma separated)</Label>
                  <Input value={formData.attendees} onChange={e => setFormData({...formData, attendees: e.target.value})} placeholder="alice@corp.com, bob@corp.com" />
                </div>
                <Button type="submit" className="w-full mt-2" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Scheduling..." : "Schedule Session"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
