// Cadence engine: turns facts (touchpoints) into intentions (follow-ups to plan).
// Pure function, no I/O. Called after every touchpoint insert and on every tick.

import { addBusinessDays, businessDaysBetween, weekendDays } from "./calendar.ts";
import { type FollowUpState, isOpen } from "./state.ts";

export type FollowUpKind = "chaser" | "thank_you" | "deadline_checkin" | "nurture";
export type JobStatus =
  | "Bookmarked" | "Applying" | "Applied" | "Interviewing" | "Negotiating" | "Accepted" | "Rejected";
export type TouchKind =
  | "application" | "followup" | "thank_you" | "reply" | "interview" | "nurture" | "note";

export interface Touchpoint {
  at: Date;
  direction: "inbound" | "outbound";
  kind?: TouchKind | null;
  channel: "email" | "call" | "linkedin" | "meeting" | "other";
}

export interface ExistingFollowUp {
  kind: FollowUpKind;
  attemptNo: number;
  state: FollowUpState;
  dueAt: Date;
  sentAt?: Date | null;
}

export interface CadenceInput {
  now: Date;
  job: {
    status: JobStatus;
    dateApplied?: Date | null;
    appliedVia?: "job_board" | "email" | "linkedin" | null;
    doNotFollowup: boolean;
    followupsPaused: boolean;
    responsePromisedBy?: Date | null;
  };
  contact: {
    relationshipStage: "active" | "nurture" | "dormant" | "do_not_contact";
    timeZone: string;
    country?: string | null;
    hasEmail: boolean;
    hasLinkedIn: boolean;
  };
  /** Touchpoints between this user and this contact (any job). */
  touchpoints: Touchpoint[];
  /** Agent follow-ups for this job + contact. */
  followUps: ExistingFollowUp[];
}

export type CadenceDecision =
  | {
    type: "plan";
    kind: FollowUpKind;
    attemptNo: number;
    channel: "email" | "linkedin";
    dueAt: Date;
    reason: string;
  }
  | { type: "move_to_nurture"; nextTouchAt: Date; reason: string }
  | { type: "none"; reason: string };

export const RULES = {
  firstChaserAfterBusinessDays: 6,
  secondChaserAfterBusinessDays: 8,
  maxChasers: 2,
  deadlineGraceBusinessDays: 2,
  silenceBeforeNurtureBusinessDays: 15,
  /** Applications older than this with no chaser yet are not chased (role is likely filled). */
  staleAfterCalendarDays: 21,
  nurtureEveryDays: [60, 90] as const,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const CHASEABLE: JobStatus[] = ["Applied"];
const CLOSED: JobStatus[] = ["Accepted", "Rejected"];

const none = (reason: string): CadenceDecision => ({ type: "none", reason });

function laterOf(a: Date, b: Date): Date {
  return a > b ? a : b;
}

function pickChannel(input: CadenceInput): "email" | "linkedin" | null {
  const { contact, job } = input;
  if (job.appliedVia === "linkedin" && contact.hasLinkedIn) return "linkedin";
  if (contact.hasEmail) return "email";
  if (contact.hasLinkedIn) return "linkedin";
  return null;
}

function nurtureDate(from: Date, seed: number): Date {
  const [lo, hi] = RULES.nurtureEveryDays;
  const days = lo + (Math.abs(seed) % (hi - lo + 1));
  return new Date(from.getTime() + days * DAY_MS);
}

export function nextFollowUp(input: CadenceInput): CadenceDecision {
  const { now, job, contact, touchpoints, followUps } = input;
  const tz = contact.timeZone;
  const weekend = weekendDays(contact.country);

  // 1. Hard stops.
  if (contact.relationshipStage === "do_not_contact") return none("contact_do_not_contact");
  if (job.doNotFollowup) return none("job_do_not_followup");
  if (job.followupsPaused) return none("job_paused");

  // 2. Never plan beside an open follow-up.
  if (followUps.some((f) => isOpen(f.state))) return none("open_followup_exists");

  const sorted = [...touchpoints].sort((a, b) => a.at.getTime() - b.at.getTime());
  const lastOutbound = sorted.filter((t) => t.direction === "outbound").at(-1);
  const lastInbound = sorted.filter((t) => t.direction === "inbound").at(-1);
  const lastTouch = sorted.at(-1);

  // 3. Closed applications move the person to the slow relationship track.
  if (CLOSED.includes(job.status)) {
    if (contact.relationshipStage !== "active") return none("already_nurture");
    const from = lastTouch?.at ?? now;
    return {
      type: "move_to_nurture",
      nextTouchAt: nurtureDate(laterOf(from, now), from.getTime() / DAY_MS),
      reason: `job_${job.status.toLowerCase()}`,
    };
  }

  const channel = pickChannel(input);
  if (!channel) return none("no_channel_for_contact");

  // 4. Thank-you after an interview, same business day.
  const lastInterview = sorted.filter((t) => t.kind === "interview").at(-1);
  if (lastInterview) {
    const thanked = sorted.some((t) =>
      t.direction === "outbound" && t.kind === "thank_you" && t.at >= lastInterview.at
    );
    const thankYous = followUps.filter((f) => f.kind === "thank_you");
    const plannedForThisInterview = thankYous.some((f) => f.dueAt >= lastInterview.at);
    const ageMs = now.getTime() - lastInterview.at.getTime();
    if (!thanked && !plannedForThisInterview && ageMs <= 2 * DAY_MS) {
      return {
        type: "plan",
        kind: "thank_you",
        attemptNo: thankYous.length + 1,
        channel,
        dueAt: laterOf(lastInterview.at, now),
        reason: "interview_without_thank_you",
      };
    }
  }

  // 5. They replied after our last message: a human handles it, chasing stops.
  if (lastInbound && (!lastOutbound || lastInbound.at > lastOutbound.at)) {
    return none("they_replied");
  }

  // 6. They promised a date: check in two business days after it, once.
  if (job.responsePromisedBy) {
    const checkins = followUps.filter((f) => f.kind === "deadline_checkin");
    const due = addBusinessDays(job.responsePromisedBy, RULES.deadlineGraceBusinessDays, tz, weekend);
    const alreadyForThisDate = checkins.some((f) => f.dueAt >= job.responsePromisedBy!);
    if (!alreadyForThisDate) {
      return {
        type: "plan",
        kind: "deadline_checkin",
        attemptNo: checkins.length + 1,
        channel,
        dueAt: laterOf(due, now),
        reason: "promised_date_passed",
      };
    }
  }

  // 7. Chasers after applying.
  if (!CHASEABLE.includes(job.status)) return none(`status_${job.status.toLowerCase()}_not_chased`);

  const appliedTouch = sorted.find((t) => t.direction === "outbound" && t.kind === "application");
  const appliedAt = appliedTouch?.at ?? job.dateApplied ?? null;
  if (!appliedAt) return none("no_application_date");

  const chasers = followUps
    .filter((f) => f.kind === "chaser")
    .sort((a, b) => a.attemptNo - b.attemptNo);
  const attempts = chasers.length;

  if (attempts === 0) {
    if (now.getTime() - appliedAt.getTime() > RULES.staleAfterCalendarDays * DAY_MS) {
      return none("application_too_old_to_chase");
    }
    const due = addBusinessDays(appliedAt, RULES.firstChaserAfterBusinessDays, tz, weekend);
    return {
      type: "plan",
      kind: "chaser",
      attemptNo: 1,
      channel,
      dueAt: laterOf(due, now),
      reason: "first_chaser",
    };
  }

  const lastChaserAt = chasers.at(-1)?.sentAt ?? lastOutbound?.at ?? appliedAt;

  if (attempts < RULES.maxChasers) {
    const due = addBusinessDays(lastChaserAt, RULES.secondChaserAfterBusinessDays, tz, weekend);
    return {
      type: "plan",
      kind: "chaser",
      attemptNo: attempts + 1,
      channel,
      dueAt: laterOf(due, now),
      reason: "second_chaser",
    };
  }

  // 8. Two chasers and still silent: stop chasing, keep the relationship.
  const silence = businessDaysBetween(lastChaserAt, now, tz, weekend);
  if (silence >= RULES.silenceBeforeNurtureBusinessDays && contact.relationshipStage === "active") {
    return {
      type: "move_to_nurture",
      nextTouchAt: nurtureDate(now, lastChaserAt.getTime() / DAY_MS),
      reason: "silent_after_max_chasers",
    };
  }
  return none("max_chasers_reached");
}
