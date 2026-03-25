import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reviewOutcomesTable = pgTable("review_outcomes", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  sessionId: integer("session_id"),
  decision: text("decision").notNull(),
  outcomeType: text("outcome_type").notNull(),
  adrReference: text("adr_reference"),
  exceptionOwner: text("exception_owner"),
  remediationPlan: text("remediation_plan"),
  riskOwner: text("risk_owner"),
  escalationReason: text("escalation_reason"),
  nextSteps: text("next_steps"),
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReviewOutcomeSchema = createInsertSchema(reviewOutcomesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertReviewOutcome = z.infer<typeof insertReviewOutcomeSchema>;
export type ReviewOutcome = typeof reviewOutcomesTable.$inferSelect;
