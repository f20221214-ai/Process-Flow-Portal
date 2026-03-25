import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const architectureRequestsTable = pgTable("architecture_requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requestType: text("request_type").notNull(),
  phase: text("phase").notNull(),
  submittedBy: text("submitted_by").notNull(),
  businessUnit: text("business_unit").notNull(),
  status: text("status").notNull().default("submitted"),
  priority: text("priority").notNull().default("medium"),
  eaAssignee: text("ea_assignee"),
  architectureSpecifications: text("architecture_specifications"),
  scopeNotes: text("scope_notes"),
  jiraInitiativeId: integer("jira_initiative_id"),
  jiraKey: text("jira_key"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertArchitectureRequestSchema = createInsertSchema(architectureRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertArchitectureRequest = z.infer<typeof insertArchitectureRequestSchema>;
export type ArchitectureRequest = typeof architectureRequestsTable.$inferSelect;
