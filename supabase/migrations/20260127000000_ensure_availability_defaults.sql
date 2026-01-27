-- Ensure created_at and updated_at have default values
ALTER TABLE public.availability_preferences 
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET DEFAULT now();

-- Ensure id has default gen_random_uuid()
ALTER TABLE public.availability_preferences 
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
