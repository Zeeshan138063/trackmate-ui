-- Comprehensive repair script to ensure ALL required columns exist
-- This also forces Supabase to refresh its schema cache

-- 1. Priority
ALTER TABLE public.dream_companies 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium';

-- 2. Status
ALTER TABLE public.dream_companies 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Researching';

-- 3. Industry
ALTER TABLE public.dream_companies 
ADD COLUMN IF NOT EXISTS industry text;

-- 4. Location
ALTER TABLE public.dream_companies 
ADD COLUMN IF NOT EXISTS location text;

-- 5. Company Size
ALTER TABLE public.dream_companies 
ADD COLUMN IF NOT EXISTS company_size text;

-- 6. URLs
ALTER TABLE public.dream_companies 
ADD COLUMN IF NOT EXISTS website_url text;

ALTER TABLE public.dream_companies 
ADD COLUMN IF NOT EXISTS careers_page_url text;

ALTER TABLE public.dream_companies 
ADD COLUMN IF NOT EXISTS logo_url text;

-- 7. Metadata
ALTER TABLE public.dream_companies 
ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.dream_companies 
ADD COLUMN IF NOT EXISTS social_media jsonb;

-- 8. Arrays (Missing in previous version)
ALTER TABLE public.dream_companies
ADD COLUMN IF NOT EXISTS tags text[];

ALTER TABLE public.dream_companies
ADD COLUMN IF NOT EXISTS target_roles text[];

-- Force a comment update (schema cache buster for some systems)
COMMENT ON TABLE public.dream_companies IS 'Dream companies for job search tracking';
