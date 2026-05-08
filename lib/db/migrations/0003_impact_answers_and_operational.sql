ALTER TABLE "architecture_requests"
  ADD COLUMN IF NOT EXISTS "security_impact_answers" text,
  ADD COLUMN IF NOT EXISTS "data_impact_answers" text,
  ADD COLUMN IF NOT EXISTS "integration_impact_answers" text,
  ADD COLUMN IF NOT EXISTS "regulatory_impact_answers" text,
  ADD COLUMN IF NOT EXISTS "operational_impact_level" text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS "operational_impact_details" text,
  ADD COLUMN IF NOT EXISTS "operational_impact_answers" text,
  ADD COLUMN IF NOT EXISTS "ea_operational_risk_rating" text,
  ADD COLUMN IF NOT EXISTS "context_answers" text;
