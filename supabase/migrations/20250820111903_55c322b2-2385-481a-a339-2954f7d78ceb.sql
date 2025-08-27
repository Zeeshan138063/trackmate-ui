-- Add minSalary and datePosted columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN min_salary INTEGER,
ADD COLUMN date_posted DATE;