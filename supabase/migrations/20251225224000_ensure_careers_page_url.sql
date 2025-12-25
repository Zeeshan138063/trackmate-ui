-- Ensure 'careers_page_url' column exists
ALTER TABLE public.dream_companies 
ADD COLUMN IF NOT EXISTS careers_page_url text;

-- Ensure 'logo_url' column exists
ALTER TABLE public.dream_companies
ADD COLUMN IF NOT EXISTS logo_url text;

-- Ensure 'social_media' column exists (just in case)
ALTER TABLE public.dream_companies
ADD COLUMN IF NOT EXISTS social_media jsonb;
