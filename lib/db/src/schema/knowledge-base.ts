import { pgTable, serial, text, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const knowledgeBaseArticlesTable = pgTable("knowledge_base_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull().default("best_practice"),
  tags: text("tags").notNull().default("[]"),
  content: text("content").notNull().default(""),
  externalUrl: text("external_url"),
  owner: text("owner").notNull(),
  technologies: text("technologies").notNull().default("[]"),
  status: text("status").notNull().default("published"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const requestKbArticlesTable = pgTable("request_kb_articles", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  articleId: integer("article_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  unique("request_kb_articles_unique").on(t.requestId, t.articleId),
]);

export const insertKbArticleSchema = createInsertSchema(knowledgeBaseArticlesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertKbArticle = z.infer<typeof insertKbArticleSchema>;
export type KbArticle = typeof knowledgeBaseArticlesTable.$inferSelect;
export type RequestKbArticle = typeof requestKbArticlesTable.$inferSelect;
