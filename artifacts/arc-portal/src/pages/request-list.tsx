import React, { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, Button, StatusBadge, PriorityBadge, Input } from "@/components/ui-primitives";
import { useListRequests } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Search, Filter, Plus, ArrowRight } from "lucide-react";
import { formatLabel } from "@/lib/utils";
import { Link } from "wouter";

export default function RequestList() {
  const { data: requests, isLoading } = useListRequests();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRequests = requests?.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.businessUnit.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Architecture Requests</h1>
            <p className="text-muted-foreground mt-1">Manage and track all enterprise architecture reviews.</p>
          </div>
          <Button href="/requests/new" className="shrink-0 gap-2">
            <Plus className="w-4 h-4" /> New Request
          </Button>
        </div>

        <Card className="p-4 flex flex-col md:flex-row gap-4 bg-card/50 backdrop-blur-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by title or business unit..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative md:w-64">
            <Filter className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <select 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-border bg-card text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="ea_triage">EA Triage</option>
              <option value="specifications_required">Specs Required</option>
              <option value="arc_scheduled">ARC Scheduled</option>
              <option value="arc_review">ARC Review</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <Card key={i} className="p-6 h-24 animate-pulse bg-secondary/50" />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">No requests found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search or filters.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map(req => (
              <Link key={req.id} href={`/requests/${req.id}`}>
                <Card className="p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer group flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{req.title}</h3>
                      <PriorityBadge priority={req.priority} />
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                        {req.businessUnit}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                        {formatLabel(req.requestType)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                        Submitted {format(new Date(req.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 md:flex-col md:items-end">
                    <StatusBadge status={req.status} />
                    <div className="hidden md:flex items-center text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
                      View Details <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
