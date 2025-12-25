-- Dynamic block to find and drop ANY trigger on dream_companies that is NOT the standard 'updated_at' trigger
DO $$
DECLARE
    trg_record RECORD;
BEGIN
    FOR trg_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'dream_companies' 
        AND event_object_schema = 'public'
    LOOP
        -- If it's not the standard updated_at trigger, drop it
        IF trg_record.trigger_name != 'update_dream_companies_updated_at' THEN
            EXECUTE 'DROP TRIGGER IF EXISTS "' || trg_record.trigger_name || '" ON public.dream_companies CASCADE';
            RAISE NOTICE 'Dropped trigger: %', trg_record.trigger_name;
        END IF;
    END LOOP;
END $$;

-- Drop function if it exists (cascade might handle it, but being safe)
DROP FUNCTION IF EXISTS handle_new_company_size() CASCADE;
DROP FUNCTION IF EXISTS map_employee_count_to_enum(integer) CASCADE;
DROP FUNCTION IF EXISTS map_employee_count_to_enum() CASCADE;
