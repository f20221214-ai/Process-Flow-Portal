import React from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui-primitives";
import { BookOpen, ExternalLink, ArrowLeft, Edit, Trash2, Calendar, User, Tag, Cpu } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { KbArticle } from "@/types/knowledge-base";

const CATEGORY_COLORS: Record<string, string> = {
  pattern: "bg-blue-100 text-blue-800 border-blue-200",
  reference_architecture: "bg-purple-100 text-purple-800 border-purple-200",
  best_practice: "bg-green-100 text-green-800 border-green-200",
  external_link: "bg-amber-100 text-amber-800 border-amber-200",
};

const CATEGORY_LABELS: Record<string, string> = {
  pattern: "Pattern",
  reference_architecture: "Reference Architecture",
  best_practice: "Best Practice",
  external_link: "External Link",
};

export default function KnowledgeBaseDetail() {
  const [, params] = useRoute("/knowledge-base/:id");
  const id = parseInt(params?.id || "0");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: article, isLoading, error } = useQuery<KbArticle, Error>({
    queryKey: ["/api/knowledge-base", id],
    queryFn: async () => {
      const r = await fetch(`/api/knowledge-base/${id}`);
      if (!r.ok) throw new Error(`Failed to fetch article: ${r.status}`);
      return r.json() as Promise<KbArticle>;
    },
    enabled: !!id,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/knowledge-base/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(`Failed to delete: ${r.status}`);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      toast({ title: "Deleted", description: "Pattern has been deleted." });
      navigate("/knowledge-base");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete article.", variant: "destructive" });
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this pattern?")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-card rounded-2xl" />
          <div className="h-64 bg-card rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (error || !article) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Pattern not found</h2>
          <p className="text-muted-foreground mb-6">This pattern may have been deleted or does not exist.</p>
          <Link href="/knowledge-base">
            <Button>Back to Architecture Patterns</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const categoryColor = CATEGORY_COLORS[article.category] ?? "bg-secondary text-foreground border-border";
  const categoryLabel = CATEGORY_LABELS[article.category] ?? article.category;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12 max-w-4xl mx-auto">

        <div className="flex items-center justify-between gap-4">
          <Link href="/knowledge-base">
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to Architecture Patterns
            </Button>
          </Link>
          <div className="flex gap-2">
            <Link href={`/knowledge-base/${id}/edit`}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Edit className="w-4 h-4" /> Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3 mb-3 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${categoryColor}`}>
                {categoryLabel}
              </span>
              {article.externalUrl && (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> External Link
                </span>
              )}
            </div>
            <CardTitle className="text-2xl font-display">{article.title}</CardTitle>

            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {article.owner}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Updated {format(new Date(article.updatedAt), "PP")}</span>
            </div>

            {article.technologies.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                {article.technologies.map(t => (
                  <span key={t} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}

            {article.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Tag className="w-4 h-4 text-muted-foreground" />
                {article.tags.map(tag => (
                  <span key={tag} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">#{tag}</span>
                ))}
              </div>
            )}

            {article.externalUrl && (
              <div className="mt-4">
                <a
                  href={article.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in External System
                </a>
              </div>
            )}
          </CardHeader>

          {article.content && (
            <CardContent className="border-t border-border/40 pt-6">
              <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <BookOpen className="w-4 h-4" /> Content
              </div>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground bg-secondary/20 p-6 rounded-xl border border-border/40">
                  {article.content}
                </pre>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </Layout>
  );
}
