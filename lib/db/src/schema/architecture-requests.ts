import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const architectureRequestsTable = pgTable("architecture_requests", {
  id: serial("id").primaryKey(),

  // Core identification
  title: text("title").notNull(),
  description: text("description").notNull(),
  businessUnit: text("business_unit").notNull(),
  submittedBy: text("submitted_by").notNull(),
  sponsorProductOwner: text("sponsor_product_owner"),
  solutionArchitect: text("solution_architect"),

  // Request classification
  requestType: text("request_type").notNull(),
  status: text("status").notNull().default("submitted"),
  priority: text("priority").notNull().default("medium"),

  // Business context
  businessContext: text("business_context"),
  businessValueHypothesis: text("business_value_hypothesis").default("[]"), // JSON array
  businessCapability: text("business_capability").default("[]"),            // JSON array
  businessCriticality: text("business_criticality"),
  costEstimate: text("cost_estimate"),
  inScopeRegions: text("in_scope_regions").default("[]"),                   // JSON array
  expectedUserBase: text("expected_user_base"),
  deploymentModel: text("deployment_model"),
  targetGoLiveDate: text("target_go_live_date"),

  // Impact levels & details
  securityImpactLevel: text("security_impact_level").default("none"),
  securityImpactDetails: text("security_impact_details"),
  securityImpactAnswers: text("security_impact_answers"),                   // JSON
  dataImpactLevel: text("data_impact_level").default("none"),
  dataImpactDetails: text("data_impact_details"),
  dataImpactAnswers: text("data_impact_answers"),                           // JSON
  integrationImpactLevel: text("integration_impact_level").default("none"),
  integrationImpactDetails: text("integration_impact_details"),
  integrationImpactAnswers: text("integration_impact_answers"),             // JSON
  regulatoryImpactLevel: text("regulatory_impact_level").default("none"),
  regulatoryImpactDetails: text("regulatory_impact_details"),
  regulatoryImpactAnswers: text("regulatory_impact_answers"),               // JSON
  aiImpactLevel: text("ai_impact_level").default("none"),
  aiImpactDetails: text("ai_impact_details"),
  aiImpactAnswers: text("ai_impact_answers"),                               // JSON q2/q3/q4/q8
  operationalImpactLevel: text("operational_impact_level").default("none"),
  operationalImpactDetails: text("operational_impact_details"),
  operationalImpactAnswers: text("operational_impact_answers"),             // JSON Yes/No + details
  contextAnswers: text("context_answers"),                                  // JSON Q1-Q4 non-scored

  // Architecture specifications (legacy / additional notes)
  architectureSpecifications: text("architecture_specifications"),

  // EA Triage fields (for EA use only)
  eaAssignee: text("ea_assignee"),
  scopeNotes: text("scope_notes"),
  eaSecurityRiskRating: text("ea_security_risk_rating"),
  eaDataComplexityRating: text("ea_data_complexity_rating"),
  eaIntegrationComplexityRating: text("ea_integration_complexity_rating"),
  eaRegulatoryRiskRating: text("ea_regulatory_risk_rating"),
  eaAiRiskRating: text("ea_ai_risk_rating"),
  eaOperationalRiskRating: text("ea_operational_risk_rating"),
  eaOverallComplexity: text("ea_overall_complexity"),
  eaOverallRiskLevel: text("ea_overall_risk_level"),
  eaReviewType: text("ea_review_type"),
  eaRequiredArchitectureViews: text("ea_required_architecture_views"),
  eaRequiredSmes: text("ea_required_smes"),
  eaArcSchedule: text("ea_arc_schedule"),

  // JIRA link
  jiraInitiativeId: integer("jira_initiative_id"),
  jiraKey: text("jira_key"),

  // Phase (kept for backward compat)
  phase: text("phase").default("ph1"),

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
