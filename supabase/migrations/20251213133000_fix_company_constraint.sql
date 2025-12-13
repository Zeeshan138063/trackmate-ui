-- Drop the constraint that prevents adding contacts without companies
ALTER TABLE "public"."contacts" 
DROP CONSTRAINT IF EXISTS "check_company_reference";

-- Also drop any not null constraint on company if it exists (though schema says it should be nullable)
ALTER TABLE "public"."contacts"
ALTER COLUMN "company" DROP NOT NULL;

-- Reload schema cache
NOTIFY pgrst, 'reload config';
