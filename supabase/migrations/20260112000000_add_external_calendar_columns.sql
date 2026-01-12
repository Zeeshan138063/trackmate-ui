-- Migration to support external calendar syncing
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS external_provider TEXT; -- 'google', 'outlook'
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Add unique constraint to prevent duplicate events
ALTER TABLE public.meetings 
ADD CONSTRAINT unique_external_meeting UNIQUE (user_id, external_provider, external_id);

-- Add index for faster lookups during sync
CREATE INDEX IF NOT EXISTS idx_meetings_external_id ON public.meetings(external_id);
CREATE INDEX IF NOT EXISTS idx_meetings_external_provider ON public.meetings(external_provider);
