-- Enable the pg_cron extension (if not already enabled)
create extension if not exists pg_cron;

-- Schedule the job to run every hour (at minute 0)
select cron.schedule(
  'fetch-linkedin-jobs-hourly', -- name of the cron job
  '0 * * * *',                  -- cron schedule (every hour)
  $$
  select
    net.http_post(
        url:='https://jdplobgtxzncwxhord.supabase.co/functions/v1/fetch-linkedin-jobs',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer oxo"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- NOTE: You need to replace 'Bearer oxo' with your actual Anon Key or Service Role Key.
-- SECURITY TIP: Ideally, use a secure way to manage the key, or use Vault if available.
-- For a quick setup, pasting the ANON key is common for public functions, or SERVICE_ROLE if RLS bypass is needed.
