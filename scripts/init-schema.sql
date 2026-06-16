CREATE TABLE IF NOT EXISTS "architecture_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "business_unit" text NOT NULL,
  "submitted_by" text NOT NULL,
  "sponsor_product_owner" text,
  "solution_architect" text,
  "request_type" text NOT NULL,
  "status" text NOT NULL DEFAULT 'submitted',
  "priority" text NOT NULL DEFAULT 'medium',
  "business_context" text,
  "business_value_hypothesis" text DEFAULT '[]',
  "business_capability" text DEFAULT '[]',
  "business_criticality" text,
  "cost_estimate" text,
  "in_scope_regions" text DEFAULT '[]',
  "expected_user_base" text,
  "deployment_model" text,
  "target_go_live_date" text,
  "security_impact_level" text DEFAULT 'none',
  "security_impact_details" text,
  "security_impact_answers" text,
  "data_impact_level" text DEFAULT 'none',
  "data_impact_details" text,
  "data_impact_answers" text,
  "integration_impact_level" text DEFAULT 'none',
  "integration_impact_details" text,
  "integration_impact_answers" text,
  "regulatory_impact_level" text DEFAULT 'none',
  "regulatory_impact_details" text,
  "regulatory_impact_answers" text,
  "ai_impact_level" text DEFAULT 'none',
  "ai_impact_details" text,
  "ai_impact_answers" text,
  "operational_impact_level" text DEFAULT 'none',
  "operational_impact_details" text,
  "operational_impact_answers" text,
  "context_answers" text,
  "architecture_specifications" text,
  "ea_assignee" text,
  "scope_notes" text,
  "ea_security_risk_rating" text,
  "ea_data_complexity_rating" text,
  "ea_integration_complexity_rating" text,
  "ea_regulatory_risk_rating" text,
  "ea_ai_risk_rating" text,
  "ea_operational_risk_rating" text,
  "ea_overall_complexity" text,
  "ea_overall_risk_level" text,
  "ea_review_type" text,
  "ea_required_architecture_views" text,
  "ea_required_smes" text,
  "ea_arc_schedule" text,
  "jira_initiative_id" integer,
  "jira_key" text,
  "phase" text DEFAULT 'ph1',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "arc_sessions" (
  "id" serial PRIMARY KEY NOT NULL,
  "request_id" integer NOT NULL,
  "scheduled_date" timestamp NOT NULL,
  "duration" integer NOT NULL DEFAULT 75,
  "status" text NOT NULL DEFAULT 'scheduled',
  "attendees" text NOT NULL DEFAULT '[]',
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "review_outcomes" (
  "id" serial PRIMARY KEY NOT NULL,
  "request_id" integer NOT NULL,
  "session_id" integer,
  "decision" text NOT NULL,
  "outcome_type" text NOT NULL,
  "adr_reference" text,
  "exception_owner" text,
  "remediation_plan" text,
  "risk_owner" text,
  "escalation_reason" text,
  "next_steps" text,
  "notes" text,
  "created_by" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "jira_initiatives" (
  "id" serial PRIMARY KEY NOT NULL,
  "jira_key" text NOT NULL UNIQUE,
  "summary" text NOT NULL,
  "description" text,
  "project_key" text NOT NULL,
  "project_name" text NOT NULL,
  "status" text NOT NULL DEFAULT 'To Do',
  "priority" text NOT NULL DEFAULT 'Medium',
  "assignee" text,
  "issue_type" text NOT NULL DEFAULT 'Epic',
  "labels" text NOT NULL DEFAULT '[]',
  "jira_url" text,
  "synced_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "leanix_initiatives" (
  "id" serial PRIMARY KEY NOT NULL,
  "leanix_id" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text,
  "lifecycle" text,
  "status" text NOT NULL DEFAULT 'Active',
  "responsible" text,
  "tags" text NOT NULL DEFAULT '[]',
  "leanix_url" text,
  "synced_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "kpi_metrics" (
  "id" serial PRIMARY KEY NOT NULL,
  "outcome_number" integer NOT NULL,
  "outcome_name" text NOT NULL,
  "kpi_category" text NOT NULL,
  "kpi_name" text NOT NULL,
  "what_to_measure" text NOT NULL,
  "how_to_measure" text NOT NULL,
  "current_value" text,
  "target_value" text,
  "unit" text,
  "status" text NOT NULL DEFAULT 'not_started',
  "notes" text,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "updated_by" text
);

CREATE TABLE IF NOT EXISTS "knowledge_base_articles" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "category" text NOT NULL DEFAULT 'best_practice',
  "tags" text NOT NULL DEFAULT '[]',
  "content" text NOT NULL DEFAULT '',
  "external_url" text,
  "owner" text NOT NULL,
  "technologies" text NOT NULL DEFAULT '[]',
  "status" text NOT NULL DEFAULT 'published',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "request_kb_articles" (
  "id" serial PRIMARY KEY NOT NULL,
  "request_id" integer NOT NULL,
  "article_id" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "request_kb_articles_unique" UNIQUE("request_id", "article_id")
);
