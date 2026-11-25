-- The tailored resume a user attaches to a job used to be uploaded to S3 straight from the
-- browser with AWS keys in the bundle (P4), and the key was never saved, so the attachment was
-- lost on reload. It now lives on the job row, behind the existing RLS policies on jobs.
alter table public.jobs add column if not exists attached_resume jsonb;

comment on column public.jobs.attached_resume is
  'Snapshot of the tailored resume used for this application. Written by the app; null when none.';
