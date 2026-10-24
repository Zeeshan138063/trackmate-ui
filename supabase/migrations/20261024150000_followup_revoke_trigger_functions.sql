-- Trigger functions are never meant to be called through the API.
-- Supabase's security advisor flagged them as executable by anon/authenticated
-- (via /rest/v1/rpc). Revoking does not affect the triggers themselves.
revoke all on function public.follow_ups_log_event() from public, anon, authenticated;
revoke all on function public.mail_accounts_cleanup_secret() from public, anon, authenticated;
revoke all on function public.follow_ups_guard() from public, anon, authenticated;
