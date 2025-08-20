-- Add url and description columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN url TEXT,
ADD COLUMN description TEXT;