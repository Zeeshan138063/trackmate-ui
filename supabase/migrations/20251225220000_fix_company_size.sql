-- Remove the check constraint that restricts company_size values
ALTER TABLE public.dream_companies DROP CONSTRAINT IF EXISTS dream_companies_company_size_check;

-- Drop potential triggers that might be enforcing categorization (based on user snippet)
DROP TRIGGER IF EXISTS auto_categorize_company_size ON public.dream_companies;
DROP TRIGGER IF EXISTS company_size_trigger ON public.dream_companies;
DROP FUNCTION IF EXISTS map_employee_count_to_enum;
