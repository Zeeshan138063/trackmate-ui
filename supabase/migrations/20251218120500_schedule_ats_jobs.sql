-- Schedule the ATS jobs fetcher to run every hour (at minute 0)
select cron.schedule(
  'fetch-ats-jobs-hourly', -- name of the cron job
  '0 * * * *',             -- cron schedule (every hour)
  $$
  select
    net.http_post(
        url:='https://jdplobgtxzncwxhordah.supabase.co/functions/v1/fetch-jobs',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcGxvYmd0eHpuY3d4aG9yZGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MzcwMzksImV4cCI6MjA3MTIxMzAzOX0.ior862XnLyAtFwo-h2Umhj8tADMlv1dZOUwLCZWOV-c"}'::jsonb,
        body:='{"name":"Functions"}'::jsonb
    ) as request_id;
  $$
);
