// Daily queue (REQ-004, spec docs/specs/2026-11-26-daily-queue-design.md).
//
// Pure: gathers what is due from the features that exist into one ordered, capped list. It
// never invents an item (DEC-005) and JobOS performs none of them (P1, P2).

import { addDays, dayOf, daysBetween, type NextAction } from "./contact-next-action";

export const QUEUE_GROUPS = ["applications", "followups", "people"] as const;
export type QueueGroup = (typeof QUEUE_GROUPS)[number];

export const GROUP_LABELS: Record<QueueGroup, string> = {
  applications: "Applications",
  followups: "Follow-ups and replies",
  people: "People",
};

export const DEFAULT_LIMIT = 10;
export const MIN_LIMIT = 3;
export const MAX_LIMIT = 30;
/** A bookmarked job joins the queue when its deadline is this close. */
export const DEADLINE_WINDOW_DAYS = 3;

export type QueueEventAction = "done" | "snoozed" | "skipped";

export interface QueueItem {
  /** Stable identity, for example `contact:<id>:reply` or `job:<id>:deadline`. */
  key: string;
  group: QueueGroup;
  title: string;
  reason: string;
  /** YYYY-MM-DD. Items are ordered by this within their group. */
  dueDate: string;
  /** `found` is a posting from job discovery that is not on the tracker yet; `url` is the posting. */
  target: { type: "job" | "contact" | "found"; id: string; url?: string | null };
  source: "job" | "agent" | "contact" | "found";
  /** Shown before the dated items of its group (REQ-008: fresh high-fit jobs lead the list). */
  pinned?: boolean;
}

/** A fresh, high-fit posting (REQ-008), already filtered by `freshHighFit()` in job-fit.ts. */
export interface QueueFreshJob {
  id: string;
  title: string;
  company: string;
  jobUrl?: string | null;
  /** Whole hours since it was posted or first seen. */
  ageHours: number;
  /** True when the source stated the posting date. */
  datePosted: boolean;
}

export interface QueueJob {
  id: string;
  position: string;
  company: string;
  status: string;
  deadline?: string | null;
  followUp?: string | null;
  /** REQ-007: someone the user is already talking to at this company, if any. */
  referralName?: string | null;
}

export interface QueueAgentFollowUp {
  id: string;
  jobId: string;
  state: string;
  dueDate?: string | null;
  contactName?: string | null;
}

export interface QueueContactAction {
  contactId: string;
  name: string;
  company?: string | null;
  action: NextAction;
}

export interface QueueEvent {
  itemKey: string;
  action: QueueEventAction;
  /** YYYY-MM-DD: the item stays hidden through this date. */
  effectiveUntil: string;
}

export interface QueueInput {
  jobs: QueueJob[];
  agentFollowUps: QueueAgentFollowUp[];
  contactActions: QueueContactAction[];
  events: QueueEvent[];
  freshJobs?: QueueFreshJob[];
}

/** At most this many fresh jobs join the queue, so they cannot crowd out work already started. */
export const MAX_FRESH = 3;

export interface DailyQueue {
  items: QueueItem[];
  /** Due items the limit cut off. */
  hiddenCount: number;
  /** Everything due before the limit, per group. */
  totals: Record<QueueGroup, number>;
}

const FOLLOW_UP_KINDS = new Set(["reply", "thank_you", "reminder", "follow_up"]);
const CLOSED_STATUSES = new Set(["Accepted", "Rejected"]);

export function clampLimit(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, n));
}

/** The date an event hides its item through. Snoozing N days brings the item back on day N. */
export function effectiveUntil(action: QueueEventAction, today: string, snoozeDays = 1): string {
  return action === "snoozed" ? addDays(today, Math.max(1, snoozeDays) - 1) : today;
}

const jobLabel = (j: QueueJob) => `${j.position} at ${j.company}`;

/** Adds the referral-first note (REQ-007) to an application's reason. */
const withReferral = (reason: string, j: QueueJob) =>
  j.referralName ? `${reason} · ${j.referralName} at ${j.company} could refer you` : reason;

function deadlineReason(deadline: string, today: string): string {
  const days = daysBetween(dayOf(deadline), today) * -1;
  if (days < 0) return `Deadline passed on ${dayOf(deadline)}`;
  if (days === 0) return "Deadline is today";
  return `Deadline in ${days} day${days === 1 ? "" : "s"}`;
}

/** Every due item from every source, before hiding and before the limit. */
export function collectItems(input: QueueInput, today: string): QueueItem[] {
  const items: QueueItem[] = [];

  for (const fresh of (input.freshJobs ?? []).slice(0, MAX_FRESH)) {
    const hours = Math.max(0, Math.round(fresh.ageHours));
    const age = hours < 1 ? "in the last hour" : `${hours} hour${hours === 1 ? "" : "s"} ago`;
    items.push({
      key: `found:${fresh.id}:fresh`,
      group: "applications",
      title: `New match: ${fresh.title} at ${fresh.company}`,
      reason: `${fresh.datePosted ? "Posted" : "First seen"} ${age} · matches your campaign, nothing in the posting rules you out`,
      dueDate: today,
      target: { type: "found", id: fresh.id, url: fresh.jobUrl ?? null },
      source: "found",
      pinned: true,
    });
  }

  for (const job of input.jobs) {
    const deadlineDay = job.deadline ? dayOf(job.deadline) : null;

    if (job.status === "Applying") {
      items.push({
        key: `job:${job.id}:apply`,
        group: "applications",
        title: `Finish your application: ${jobLabel(job)}`,
        reason: withReferral(deadlineDay ? deadlineReason(deadlineDay, today) : "You started this application", job),
        dueDate: deadlineDay ?? today,
        target: { type: "job", id: job.id },
        source: "job",
      });
    } else if (job.status === "Bookmarked" && deadlineDay) {
      const daysLeft = daysBetween(today, deadlineDay);
      if (daysLeft >= 0 && daysLeft <= DEADLINE_WINDOW_DAYS) {
        items.push({
          key: `job:${job.id}:deadline`,
          group: "applications",
          title: `Apply: ${jobLabel(job)}`,
          reason: withReferral(deadlineReason(deadlineDay, today), job),
          dueDate: deadlineDay,
          target: { type: "job", id: job.id },
          source: "job",
        });
      }
    }

    if (job.followUp && !CLOSED_STATUSES.has(job.status) && dayOf(job.followUp) <= today) {
      items.push({
        key: `job:${job.id}:followup`,
        group: "followups",
        title: `Follow up: ${jobLabel(job)}`,
        reason: `You set a follow-up for ${dayOf(job.followUp)}`,
        dueDate: dayOf(job.followUp),
        target: { type: "job", id: job.id },
        source: "job",
      });
    }
  }

  const jobsById = new Map(input.jobs.map((j) => [j.id, j]));
  for (const fu of input.agentFollowUps) {
    const manual = fu.state === "awaiting_manual_send";
    if (fu.state !== "awaiting_approval" && !manual) continue;
    const job = jobsById.get(fu.jobId);
    const about = job ? jobLabel(job) : "an application";
    const who = fu.contactName ? ` to ${fu.contactName}` : "";
    items.push({
      key: `agent:${fu.id}`,
      group: "followups",
      title: manual ? `Send your LinkedIn message${who}: ${about}` : `Review the drafted follow-up${who}: ${about}`,
      reason: manual ? "You approved it; LinkedIn messages are sent by you" : "Nothing is sent until you approve it",
      dueDate: fu.dueDate ? dayOf(fu.dueDate) : today,
      target: { type: "job", id: fu.jobId },
      source: "agent",
    });
  }

  for (const c of input.contactActions) {
    if (c.action.kind === "none" || c.action.dueDate > today) continue;
    items.push({
      key: `contact:${c.contactId}:${c.action.kind}`,
      group: FOLLOW_UP_KINDS.has(c.action.kind) ? "followups" : "people",
      title: `${c.action.label}: ${c.name}${c.company ? ` (${c.company})` : ""}`,
      reason: c.action.reason,
      dueDate: c.action.dueDate,
      target: { type: "contact", id: c.contactId },
      source: "contact",
    });
  }

  return items;
}

/**
 * Today's list (AC-1 to AC-5): due items, minus what was done, skipped or snoozed, most overdue
 * first within each group, capped at `limit` with at least one slot for every group that has
 * something.
 */
export function buildDailyQueue(input: QueueInput, today: string, limit: number = DEFAULT_LIMIT): DailyQueue {
  const cap = clampLimit(limit);
  const hidden = new Set(input.events.filter((e) => e.effectiveUntil >= today).map((e) => e.itemKey));

  const seen = new Set<string>();
  const byGroup: Record<QueueGroup, QueueItem[]> = { applications: [], followups: [], people: [] };
  for (const item of collectItems(input, today)) {
    if (hidden.has(item.key) || seen.has(item.key)) continue;
    seen.add(item.key);
    byGroup[item.group].push(item);
  }
  for (const group of QUEUE_GROUPS) {
    byGroup[group].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title));
  }

  const totals = { applications: byGroup.applications.length, followups: byGroup.followups.length, people: byGroup.people.length };
  const total = totals.applications + totals.followups + totals.people;

  // One guaranteed slot per non-empty group, then fill in group order.
  const take: Record<QueueGroup, number> = { applications: 0, followups: 0, people: 0 };
  let left = cap;
  for (const group of QUEUE_GROUPS) {
    if (left > 0 && byGroup[group].length > 0) {
      take[group] = 1;
      left--;
    }
  }
  for (const group of QUEUE_GROUPS) {
    const extra = Math.min(left, byGroup[group].length - take[group]);
    take[group] += extra;
    left -= extra;
  }

  const items = QUEUE_GROUPS.flatMap((group) => byGroup[group].slice(0, take[group]));
  return { items, hiddenCount: total - items.length, totals };
}
