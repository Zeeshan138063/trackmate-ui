-- Link Contacts to Dream Companies
-- This migration adds a dream_company_id column to the contacts table
-- to enable linking contacts to specific dream companies

-- Add dream_company_id column to contacts table
ALTER TABLE contacts 
ADD COLUMN dream_company_id UUID REFERENCES dream_companies(id) ON DELETE SET NULL;

-- Add index for better performance when querying contacts by dream company
CREATE INDEX IF NOT EXISTS idx_contacts_dream_company_id ON contacts(dream_company_id);

-- Add a check to ensure either dream_company_id is set OR company name is provided
-- This maintains backward compatibility while enabling the new linking feature
ALTER TABLE contacts 
ADD CONSTRAINT check_company_reference 
CHECK (dream_company_id IS NOT NULL OR (company IS NOT NULL AND company != ''));

-- Update RLS policy to include dream company access
-- This allows users to see contacts linked to their dream companies
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
CREATE POLICY "Users can view their own contacts"
    ON contacts FOR SELECT
    USING (
        auth.uid() = user_id OR 
        (dream_company_id IS NOT NULL AND 
         EXISTS (SELECT 1 FROM dream_companies WHERE id = dream_company_id AND user_id = auth.uid()))
    );

-- Create a view for contacts with dream company information
CREATE OR REPLACE VIEW contacts_with_dream_companies AS
SELECT 
    c.*,
    dc.name as dream_company_name,
    dc.logo_url as dream_company_logo,
    dc.website_url as dream_company_website,
    dc.status as dream_company_status,
    dc.priority as dream_company_priority
FROM contacts c
LEFT JOIN dream_companies dc ON c.dream_company_id = dc.id;

-- Grant access to the view
GRANT SELECT ON contacts_with_dream_companies TO authenticated;

-- Add RLS to the view
ALTER VIEW contacts_with_dream_companies SET (security_invoker = true);
