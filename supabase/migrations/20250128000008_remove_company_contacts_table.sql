-- Remove the company_contacts table as we're using the unified contacts table with dream_company_id
-- This migration removes the old company_contacts system in favor of the unified contacts approach

-- Drop the company_contacts table and all its related objects
DROP TABLE IF EXISTS company_contacts CASCADE;

-- Remove any indexes that were specific to company_contacts
-- (These will be automatically dropped with CASCADE, but listing for clarity)
-- DROP INDEX IF EXISTS idx_company_contacts_company_id;
-- DROP INDEX IF EXISTS idx_company_contacts_user_id;

-- The unified contacts table with dream_company_id is already created in migration 20250128000007
-- No additional changes needed - all contact functionality now uses the main contacts table
