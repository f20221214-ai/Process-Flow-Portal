import React, { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, Input, Button, Badge } from "@/components/ui-primitives";
import { Search, Plus, ExternalLink, BookOpen, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { KbArticle } from "@/types/knowledge-base";
import { fetchJsonArray } from "@/lib/utils";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "pattern", label: "Pattern" },
  { value: "reference_architecture", label: "Reference Architecture" },
  { value: "best_practice", label: "Best Practice" },
  { value: "external_link", label: "External Link" },
];

const CATEGORY_COLORS: Record<string, string> = {
  pattern: "bg-blue-100 text-blue-800 border-blue-200",
  reference_architecture: "bg-purple-100 text-purple-800 border-purple-200",
  best_practice: "bg-green-100 text-green-800 border-green-200",
  external_link: "bg-amber-100 text-amber-800 border-amber-200",
};

function categoryLabel(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.label ?? cat;
}

export default function KnowledgeBaseIndex() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("");

  const { data: articles = [], isLoading } = useQuery<KbArticle[]>({
    queryKey: ["/api/knowledge-base"],
    queryFn: () => fetchJsonArray<KbArticle>("/api/knowledge-base"),
  });

  const allTags = Array.from(new Set(articles.flatMap(a => a.tags)));

  const filtered = articles.filter(a => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.owner.toLowerCase().includes(search.toLowerCase()) ||
      a.technologies.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = categoryFilter === "all" || a.category === categoryFilter;
    const matchTag = !tagFilter || a.tags.includes(tagFilter);
    return matchSearch && matchCat && matchTag;
  });

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Architecture Patterns</h1>
            <p className="text-muted-foreground mt-1">Approved patterns, reference architectures, and best practices.</p>
          </div>
          <Link href="/knowledge-base/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Pattern
            </Button>
          </Link>
        </div>

        <Card className="p-4 flex flex-col md:flex-row gap-4 bg-card/50 backdrop-blur-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, owner, technology..."
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative md:w-56">
            <select
              className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-card text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          {allTags.length > 0 && (
            <div className="relative md:w-48">
              <select
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-card text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer"
                value={tagFilter}
                onChange={e => setTagFilter(e.target.value)}
              >
                <option value="">All Tags</option>
                {allTags.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-6 h-24 animate-pulse bg-secondary/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">No patterns found</h3>
            <p className="text-muted-foreground mt-1">
              {articles.length === 0 ? "Create the first architecture pattern." : "Try adjusting your search or filters."}
            </p>
            {articles.length === 0 && (
              <Link href="/knowledge-base/new">
                <Button className="mt-4">Create Pattern</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map(article => (
              <Link key={article.id} href={`/knowledge-base/${article.id}`}>
                <Card className="p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer group flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{article.title}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[article.category] ?? "bg-secondary text-foreground border-border"}`}>
                        {categoryLabel(article.category)}
                      </span>
                      {article.externalUrl && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> External
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <span>Owner: <span className="font-medium text-foreground">{article.owner}</span></span>
                      {article.technologies.length > 0 && (
                        <span>Technologies: <span className="font-medium text-foreground">{article.technologies.join(", ")}</span></span>
                      )}
                    </div>
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {article.tags.map(tag => (
                          <span key={tag} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="hidden md:flex items-center text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
                    View <ArrowRight className="w-4 h-4 ml-1" />
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
