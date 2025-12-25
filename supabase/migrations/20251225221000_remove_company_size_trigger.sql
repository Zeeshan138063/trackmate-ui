-- Drop the trigger that is trying to call the missing function
DROP TRIGGER IF EXISTS company_size_trigger ON public.dream_companies;
DROP TRIGGER IF EXISTS auto_categorize_company_size ON public.dream_companies;

-- Drop the function that the trigger calls (which contains the code calling map_employee_count_to_enum)
DROP FUNCTION IF EXISTS handle_new_company_size();
DROP FUNCTION IF EXISTS public.handle_new_company_size();

-- Also drop the helper function just in case it exists (though error says it doesn't)
DROP FUNCTION IF EXISTS map_employee_count_to_enum;
