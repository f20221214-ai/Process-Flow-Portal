import React, { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Label } from "@/components/ui-primitives";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { KbArticle } from "@/types/knowledge-base";

const CATEGORIES = [
  { value: "pattern", label: "Pattern" },
  { value: "reference_architecture", label: "Reference Architecture" },
  { value: "best_practice", label: "Best Practice" },
  { value: "external_link", label: "External Link" },
];

interface FormData {
  title: string;
  category: string;
  content: string;
  externalUrl: string;
  owner: string;
  status: string;
  tagsInput: string;
  technologiesInput: string;
  tags: string[];
  technologies: string[];
}

const DEFAULT_FORM: FormData = {
  title: "",
  category: "best_practice",
  content: "",
  externalUrl: "",
  owner: "",
  status: "published",
  tagsInput: "",
  technologiesInput: "",
  tags: [],
  technologies: [],
};

export default function KnowledgeBaseForm() {
  const [matchEdit, paramsEdit] = useRoute("/knowledge-base/:id/edit");
  const isEdit = matchEdit;
  const id = isEdit ? parseInt(paramsEdit?.id || "0") : null;

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);

  const { data: existing } = useQuery<KbArticle, Error>({
    queryKey: ["/api/knowledge-base", id],
    queryFn: async () => {
      const r = await fetch(`/api/knowledge-base/${id}`);
      if (!r.ok) throw new Error(`Failed to fetch article: ${r.status}`);
      return r.json() as Promise<KbArticle>;
    },
    enabled: !!id,
    retry: false,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        category: existing.category,
        content: existing.content,
        externalUrl: existing.externalUrl ?? "",
        owner: existing.owner,
        status: existing.status,
        tagsInput: "",
        technologiesInput: "",
        tags: existing.tags,
        technologies: existing.technologies,
      });
    }
  }, [existing]);

  const createMutation = useMutation({
    mutationFn: async (data: object) => {
      const r = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(`Failed to create: ${r.status}`);
      return r.json();
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      toast({ title: "Created", description: "Article has been created." });
      navigate(`/knowledge-base/${created.id}`);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create article.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: object) => {
      const r = await fetch(`/api/knowledge-base/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(`Failed to update: ${r.status}`);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base", id] });
      toast({ title: "Updated", description: "Article has been updated." });
      navigate(`/knowledge-base/${id}`);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update article.", variant: "destructive" });
    },
  });

  const handleAddTag = () => {
    const tag = form.tagsInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm(f => ({ ...f, tags: [...f.tags, tag], tagsInput: "" }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  };

  const handleAddTech = () => {
    const tech = form.technologiesInput.trim();
    if (tech && !form.technologies.includes(tech)) {
      setForm(f => ({ ...f, technologies: [...f.technologies, tech], technologiesInput: "" }));
    }
  };

  const handleRemoveTech = (tech: string) => {
    setForm(f => ({ ...f, technologies: f.technologies.filter(t => t !== tech) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.owner.trim()) {
      toast({ title: "Validation Error", description: "Title and Owner are required.", variant: "destructive" });
      return;
    }
    const payload = {
      title: form.title,
      category: form.category,
      content: form.content,
      externalUrl: form.externalUrl || null,
      owner: form.owner,
      status: form.status,
      tags: form.tags,
      technologies: form.technologies,
    };
    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href={isEdit ? `/knowledge-base/${id}` : "/knowledge-base"}>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <h1 className="text-2xl font-display font-bold">{isEdit ? "Edit Pattern" : "New Pattern"}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pattern Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Title <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. API Gateway Pattern"
                    required
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <select
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-card text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer mt-1"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Owner <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.owner}
                    onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                    placeholder="e.g. Platform Architecture Team"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>External URL</Label>
                  <Input
                    value={form.externalUrl}
                    onChange={e => setForm(f => ({ ...f, externalUrl: e.target.value }))}
                    placeholder="https://confluence.example.com/..."
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground mt-1">For external link entries, provide the URL to open in the external system.</p>
                </div>

                <div>
                  <Label>Status</Label>
                  <select
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-card text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer mt-1"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Technologies</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={form.technologiesInput}
                    onChange={e => setForm(f => ({ ...f, technologiesInput: e.target.value }))}
                    placeholder="e.g. Kubernetes"
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddTech(); } }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTech} size="sm" className="shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {form.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.technologies.map(tech => (
                      <span key={tech} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                        {tech}
                        <button type="button" onClick={() => handleRemoveTech(tech)} className="hover:text-destructive ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={form.tagsInput}
                    onChange={e => setForm(f => ({ ...f, tagsInput: e.target.value }))}
                    placeholder="e.g. cloud, security"
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag} size="sm" className="shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                        #{tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-destructive ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Content (Markdown)</Label>
                <Textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Describe the pattern, best practice, or reference architecture in detail..."
                  className="min-h-[240px] font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                <Link href={isEdit ? `/knowledge-base/${id}` : "/knowledge-base"}>
                  <Button variant="outline" type="button">Cancel</Button>
                </Link>
                <Button type="submit" disabled={isPending} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Pattern"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
}
