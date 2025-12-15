-- Drop the table if it exists to ensure a clean slate
DROP TABLE IF EXISTS public.integration_tokens;

-- Re-create the table with the correct columns matching the code
CREATE TABLE public.integration_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'linkedin'
    
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    
    metadata JSONB DEFAULT '{}'::jsonb, -- Stores author_urn etc
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;

-- Re-create Policy
CREATE POLICY "Users can manage their own tokens" ON public.integration_tokens
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
