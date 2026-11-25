// Pure helpers for notify-reminder: validation and the reminder text. No Deno APIs here, so
// this file can be unit-tested anywhere.

export type ReminderKind = "deadline" | "follow_up";

export interface ReminderJob {
  id: string;
  position: string;
  company: string;
  location: string | null;
  job_url: string | null;
}

export function isReminderKind(v: unknown): v is ReminderKind {
  return v === "deadline" || v === "follow_up";
}

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export function buildReminder(kind: ReminderKind, job: ReminderJob) {
  const text = kind === "deadline"
    ? {
      title: `Application deadline: ${job.position}`,
      body: `Today is the last day to apply to ${job.company}.`,
    }
    : {
      title: `Follow-up reminder: ${job.position}`,
      body: `You planned to follow up with ${job.company} today.`,
    };
  return {
    ...text,
    jobId: job.id,
    position: job.position,
    company: job.company,
    location: job.location ?? "",
    jobUrl: job.job_url ?? "",
  };
}
