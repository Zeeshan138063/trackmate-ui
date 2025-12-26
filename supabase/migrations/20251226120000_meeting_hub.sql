-- Availability Preferences
CREATE TABLE IF NOT EXISTS public.availability_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL, -- 0-6 (Sunday to Saturday)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, day_of_week, start_time, end_time)
);

-- Scheduled Meetings
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT DEFAULT 30,
    location_platform TEXT, -- Zoom, Google Meet, etc.
    meeting_link TEXT,
    calendly_link TEXT, -- Reference to external scheduling link
    status TEXT DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, CANCELLED
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Calendar Accounts (Supporting multiple per provider)
CREATE TABLE IF NOT EXISTS public.calendar_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'google', 'outlook'
    account_email TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    sync_enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb, -- which sub-calendars to sync
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, provider, account_email)
);

-- Enable RLS
ALTER TABLE public.availability_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_accounts ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can manage their own availability') THEN
        CREATE POLICY "Users can manage their own availability" ON public.availability_preferences
            FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can manage their own meetings') THEN
        CREATE POLICY "Users can manage their own meetings" ON public.meetings
            FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can manage their own calendar accounts') THEN
        CREATE POLICY "Users can manage their own calendar accounts" ON public.calendar_accounts
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
