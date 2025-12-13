-- Drop the table to ensure we start fresh with correct constraints
DROP TABLE IF EXISTS "public"."job_contacts";

-- Recreate the table with explicit Foreign Keys
CREATE TABLE "public"."job_contacts" (
  "id" uuid not null default gen_random_uuid(),
  "job_id" uuid not null references "public"."jobs"("id") on delete cascade,
  "contact_id" uuid not null references "public"."contacts"("id") on delete cascade,
  "interaction_type" text,
  "created_at" timestamp with time zone not null default now(),
  PRIMARY KEY ("id"),
  UNIQUE ("job_id", "contact_id")
);

-- Re-enable RLS
ALTER TABLE "public"."job_contacts" ENABLE ROW LEVEL SECURITY;

-- Re-create Policies
CREATE POLICY "Users can view job contacts for their jobs"
ON "public"."job_contacts" FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."jobs"
    WHERE "jobs"."id" = "job_contacts"."job_id"
    AND "jobs"."user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert job contacts for their jobs"
ON "public"."job_contacts" FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."jobs"
    WHERE "jobs"."id" = "job_contacts"."job_id"
    AND "jobs"."user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can delete job contacts for their jobs"
ON "public"."job_contacts" FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."jobs"
    WHERE "jobs"."id" = "job_contacts"."job_id"
    AND "jobs"."user_id" = (SELECT auth.uid())
  )
);

-- Force schema cache reload (this is usually automatic on DDL, but good to know)
NOTIFY pgrst, 'reload config';
