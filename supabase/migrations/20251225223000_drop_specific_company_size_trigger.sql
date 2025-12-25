-- Drop the specific trigger identified by the user
DROP TRIGGER IF EXISTS normalize_company_size_trigger ON public.dream_companies;

-- Drop related functions that were part of this logic
DROP FUNCTION IF EXISTS normalize_company_size();
DROP FUNCTION IF EXISTS map_employee_count_to_enum(integer);
DROP FUNCTION IF EXISTS parse_company_size_lower_bound(text);
