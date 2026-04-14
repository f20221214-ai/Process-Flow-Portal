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
