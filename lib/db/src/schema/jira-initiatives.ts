import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jiraInitiativesTable = pgTable("jira_initiatives", {
  id: serial("id").primaryKey(),
  jiraKey: text("jira_key").notNull().unique(),
  summary: text("summary").notNull(),
  description: text("description"),
  projectKey: text("project_key").notNull(),
  projectName: text("project_name").notNull(),
  status: text("status").notNull().default("To Do"),
  priority: text("priority").notNull().default("Medium"),
  assignee: text("assignee"),
  issueType: text("issue_type").notNull().default("Epic"),
  labels: text("labels").notNull().default("[]"),
  jiraUrl: text("jira_url"),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertJiraInitiativeSchema = createInsertSchema(jiraInitiativesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertJiraInitiative = z.infer<typeof insertJiraInitiativeSchema>;
export type JiraInitiative = typeof jiraInitiativesTable.$inferSelect;
