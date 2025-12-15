-- Create profile_growth_settings table
CREATE TABLE IF NOT EXISTS public.profile_growth_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    primary_domains JSONB DEFAULT '[]'::jsonb, -- e.g. ["React", "AI", "Cloud"]
    secondary_domains JSONB DEFAULT '[]'::jsonb,
    content_pillars JSONB DEFAULT '[]'::jsonb, -- e.g. ["Engineering Leadership", "System Design"]
    tone_voice JSONB DEFAULT '{"professional": 0.8, "casual": 0.2}'::jsonb,
    posting_frequency VARCHAR(50) DEFAULT 'weekly', -- 'daily', 'weekly', 'adhoc'
    linkedin_keys JSONB DEFAULT '{}'::jsonb, -- { "clientId": "...", "clientSecret": "..." }
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create content_queue table (for drafts, scheduled, and history)
CREATE TABLE IF NOT EXISTS public.content_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    topic VARCHAR(255) NOT NULL,
    content_body TEXT, -- The actual post content
    media_urls JSONB DEFAULT '[]'::jsonb, -- For images/videos
    
    status VARCHAR(50) DEFAULT 'draft' NOT NULL, -- 'draft', 'scheduled', 'published', 'failed'
    generated_from_trend BOOLEAN DEFAULT false,
    
    scheduled_for TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    
    platform_post_id VARCHAR(255), -- LinkedIn URN (e.g. urn:li:share:123)
    platform_response JSONB, -- Store raw API response for debugging
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create integration_tokens table (Secure storage for OAuth)
-- Note: In a real prod env, use Vault. For MVP/Supabase, we use RLS and strict access.
CREATE TABLE IF NOT EXISTS public.integration_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'linkedin'
    
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    
    metadata JSONB DEFAULT '{}'::jsonb, -- Store scoped permissions, user_urn, etc.
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.profile_growth_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for growth settings
CREATE POLICY "Users can manage their own growth settings" ON public.profile_growth_settings
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policies for content queue
CREATE POLICY "Users can manage their own content queue" ON public.content_queue
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policies for tokens
CREATE POLICY "Users can manage their own tokens" ON public.integration_tokens
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
