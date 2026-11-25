// The tables that hold a user's own rows, children before parents. Pure data: no Deno APIs.
//
// Every one of these has `user_id ... references auth.users on delete cascade` in the
// migrations, so deleting the auth user would remove them anyway. They are deleted explicitly
// first so that a table created outside the migrations cannot leave rows behind, and so a
// failure stops the process before the account itself is gone.
//
// Adding a table that stores user data? Add it here and to EXPORT_TABLES in
// src/services/AccountDataService.ts (principle P9).
export const USER_TABLES = [
  "daily_queue_events",
  "application_resumes", // their files are removed from the resumes bucket first
  "follow_up_events",
  "follow_ups",
  "followup_settings",
  "telegram_links",
  "mail_accounts", // a trigger removes the inbox's refresh token from Vault
  "engagements",
  "dream_company_reminders",
  "interview_feedback",
  "interview_practices",
  "meetings",
  "availability_preferences",
  "calendar_accounts",
  "content_queue",
  "integration_tokens",
  "profile_growth_settings",
  "job_search_queries",
  "contacts",
  "dream_companies",
  "jobs",
  "resumes",
  "priorities",
  "career_goals",
  "work_styles",
  "profiles",
] as const;

/** Postgres / PostgREST codes meaning "this table or its user_id column does not exist here". */
const ABSENT = new Set(["42P01", "42703", "PGRST204", "PGRST205"]);

export function isAbsentTable(error: { code?: string } | null): boolean {
  return !!error?.code && ABSENT.has(error.code);
}

export function confirmed(body: unknown): boolean {
  return typeof body === "object" && body !== null && (body as { confirm?: unknown }).confirm === "DELETE";
}

/** The private storage bucket that holds resume files, laid out as <user_id>/<job_id>/<file>. */
export const RESUME_BUCKET = "resumes";

/** Only paths inside the caller's own folder may be removed, whatever the table says. */
export function ownResumePaths(userId: string, paths: (string | null | undefined)[]): string[] {
  const prefix = `${userId}/`;
  return paths.filter((p): p is string => typeof p === "string" && p.startsWith(prefix) && !p.includes(".."));
}
