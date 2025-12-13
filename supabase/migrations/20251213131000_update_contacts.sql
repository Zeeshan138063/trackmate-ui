-- Ensure contacts table has the correct schema
ALTER TABLE "public"."contacts" 
ADD COLUMN IF NOT EXISTS "name" text,
ADD COLUMN IF NOT EXISTS "position" text,
ADD COLUMN IF NOT EXISTS "address" text,
ADD COLUMN IF NOT EXISTS "country" text,
ADD COLUMN IF NOT EXISTS "relationship" text;

-- Attempt to migrate data if legacy columns exist
DO $$
BEGIN
    -- Migrate first_name/last_name to name if legacy columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'first_name') THEN
        UPDATE "public"."contacts" 
        SET "name" = TRIM(COALESCE("first_name", '') || ' ' || COALESCE("last_name", ''))
        WHERE "name" IS NULL OR "name" = '';
    END IF;

    -- Migrate role to position if role exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'role') THEN
        UPDATE "public"."contacts" 
        SET "position" = "role"
        WHERE "position" IS NULL OR "position" = '';
    END IF;
END $$;

-- Create job_contacts junction table if it doesn't exist
create table if not exists "public"."job_contacts" (
  "id" uuid not null default gen_random_uuid(),
  "job_id" uuid not null references "public"."jobs"("id") on delete cascade,
  "contact_id" uuid not null references "public"."contacts"("id") on delete cascade,
  "interaction_type" text, -- e.g., 'Recruiter', 'Interviewer'
  "created_at" timestamp with time zone not null default now(),
  primary key ("id"),
  unique ("job_id", "contact_id")
);

-- Enable RLS on job_contacts
alter table "public"."job_contacts" enable row level security;

-- Policies for job_contacts
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view job contacts for their jobs' and tablename = 'job_contacts') then
    create policy "Users can view job contacts for their jobs"
    on "public"."job_contacts" for select to authenticated
    using (
      exists (
        select 1 from "public"."jobs"
        where "jobs"."id" = "job_contacts"."job_id"
        and "jobs"."user_id" = (select auth.uid())
      )
    );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can insert job contacts for their jobs' and tablename = 'job_contacts') then
    create policy "Users can insert job contacts for their jobs"
    on "public"."job_contacts" for insert to authenticated
    with check (
      exists (
        select 1 from "public"."jobs"
        where "jobs"."id" = "job_contacts"."job_id"
        and "jobs"."user_id" = (select auth.uid())
      )
    );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can delete job contacts for their jobs' and tablename = 'job_contacts') then
    create policy "Users can delete job contacts for their jobs"
    on "public"."job_contacts" for delete to authenticated
    using (
      exists (
        select 1 from "public"."jobs"
        where "jobs"."id" = "job_contacts"."job_id"
        and "jobs"."user_id" = (select auth.uid())
      )
    );
  end if;
end
$$;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
