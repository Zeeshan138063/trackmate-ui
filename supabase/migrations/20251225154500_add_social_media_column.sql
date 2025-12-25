-- Add social_media column to dream_companies table to store various social links (LinkedIn, Twitter, etc.)
ALTER TABLE public.dream_companies 
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}'::jsonb;
