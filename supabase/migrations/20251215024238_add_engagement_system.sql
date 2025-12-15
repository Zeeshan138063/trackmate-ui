-- Create engagements table
CREATE TABLE IF NOT EXISTS public.engagements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL, -- Optional link to a job
    type VARCHAR(50) NOT NULL, -- 'email', 'call', 'linkedin', 'meeting', 'other'
    direction VARCHAR(20) NOT NULL DEFAULT 'outbound', -- 'inbound', 'outbound'
    date TIMESTAMPTZ DEFAULT now() NOT NULL,
    notes TEXT,
    sentiment VARCHAR(20) DEFAULT 'neutral', -- 'positive', 'neutral', 'negative'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create follow_ups table
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    due_date TIMESTAMPTZ NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'general_checkin', 'birthday', 'job_update', 'health_check', 'other'
    status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- 'pending', 'completed', 'missed'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add RLS policies
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own engagements" ON public.engagements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own engagements" ON public.engagements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own engagements" ON public.engagements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own engagements" ON public.engagements
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own follow_ups" ON public.follow_ups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own follow_ups" ON public.follow_ups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own follow_ups" ON public.follow_ups
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follow_ups" ON public.follow_ups
    FOR DELETE USING (auth.uid() = user_id);
