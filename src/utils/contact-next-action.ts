// Next-action engine for contacts (REQ-003, spec docs/specs/2026-11-26-contact-stages-next-actions-design.md).
//
// Pure: no clock, no network, no storage. `today` is passed in. Days are calendar dates as
// "YYYY-MM-DD" strings; timestamps are reduced to their UTC date, which is close enough for
// rules measured in days.
//
// JobOS never performs these actions (principles P1, P2). Each one is a prompt for the user,
// who does it by hand and logs it.

export const WARMTH_STAGES = ["identified", "following", "engaged", "connected", "in_conversation", "advocate"] as const;
export type WarmthStage = (typeof WARMTH_STAGES)[number];

export const ROLE_TYPES = ["recruiter", "hiring_manager", "peer", "alumni", "other"] as const;
export type RoleType = (typeof ROLE_TYPES)[number];

export const STAGE_LABELS: Record<WarmthStage, string> = {
  identified: "Identified",
  following: "Following",
  engaged: "Engaged",
  connected: "Connected",
  in_conversation: "In conversation",
  advocate: "Advocate",
};

export const ROLE_LABELS: Record<RoleType, string> = {
  recruiter: "Recruiter",
  hiring_manager: "Hiring manager",
  peer: "Peer",
  alumni: "Alumni",
  other: "Other",
};

/**
 * Timings, in days. Defaults from the strategy spec section 5E (DEC-003): "at most two
 * follow-ups, 5-7 days apart, then the contact rests for 30 days". Editable cadences per role
 * type are a later feature; until then, change them here and in the tests.
 */
export const RULES = {
  engageEveryDays: 2,
  interactionsToEngaged: 2,
  connectAfterEngagedDays: 1,
  askAfterConnectedDays: 2,
  followUpAfterDays: 6,
  maxFollowUps: 2,
  restDays: 30,
  checkInDays: 14,
  invitationPendingDays: 14,
  keepInTouchDays: 30,
  thankYouWindowDays: 2,
} as const;

export type ActionKind =
  | "reminder"
  | "reply"
  | "thank_you"
  | "follow"
  | "engage"
  | "connect"
  | "ask_advice"
  | "follow_up"
  | "check_in"
  | "keep_in_touch";

export type NextAction =
  | { kind: "none"; reason: string }
  | { kind: ActionKind; label: string; reason: string; dueDate: string; reminderId?: string };

export interface ContactForAction {
  warmthStage: WarmthStage;
  /** ISO timestamp of the last stage change. */
  warmthStageChangedAt: string;
  doNotContact: boolean;
  /** "YYYY-MM-DD" or null. */
  snoozedUntil?: string | null;
  /** Set by the follow-up agent when it moves a contact to its keep-in-touch track. */
  nurtureNextTouchAt?: string | null;
  /** REQ-009: when the user marked a connection invitation as sent. */
  invitationSentAt?: string | null;
}

/** REQ-009: the user's invitation usage this week, as far as the engine needs it. */
export interface InvitationLimit {
  state: "ok" | "warn" | "stop";
  nextSlotOn: string | null;
}

export interface InteractionForAction {
  type: "email" | "call" | "linkedin" | "meeting" | "other";
  direction: "inbound" | "outbound";
  /** ISO timestamp. */
  date: string;
}

export interface ReminderForAction {
  id: string;
  /** ISO timestamp. */
  dueDate: string;
  status: "pending" | "completed" | "missed";
  type?: string;
  notes?: string | null;
}

// ------------------------------------------------------------------ dates ---

const DAY_MS = 86_400_000;

/** The UTC calendar date of an ISO timestamp or date string. */
export function dayOf(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : new Date(iso).toISOString().slice(0, 10);
}

export function addDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

const laterDay = (a: string, b: string) => (a >= b ? a : b);

// ----------------------------------------------------------------- engine ---

function latest(list: InteractionForAction[]): InteractionForAction | null {
  return list.reduce<InteractionForAction | null>((best, i) => (!best || i.date > best.date ? i : best), null);
}

const isConversation = (i: InteractionForAction) => i.type === "call" || i.type === "meeting";

/** Interactions logged on or after the last stage change. */
function sinceStageChange(contact: ContactForAction, interactions: InteractionForAction[]) {
  return interactions.filter((i) => i.date >= contact.warmthStageChangedAt);
}

/**
 * The stage the history implies, or null. Never applied automatically: the user confirms
 * (DEC-002), because only they know whether an interaction was genuine.
 */
export function suggestedStage(contact: ContactForAction, interactions: InteractionForAction[]): WarmthStage | null {
  if (contact.doNotContact) return null;
  const recent = sinceStageChange(contact, interactions);
  if (contact.warmthStage === "following") {
    const outbound = recent.filter((i) => i.direction === "outbound").length;
    return outbound >= RULES.interactionsToEngaged ? "engaged" : null;
  }
  if (contact.warmthStage === "connected") {
    return recent.some((i) => i.direction === "inbound") ? "in_conversation" : null;
  }
  return null;
}

/** The one next action for a contact, or `none` with the reason. Rule order is the spec's AC-4. */
export function nextAction(
  contact: ContactForAction,
  interactions: InteractionForAction[],
  reminders: ReminderForAction[],
  today: string,
  invitations?: InvitationLimit,
): NextAction {
  // 1. Do-not-contact wins over everything.
  if (contact.doNotContact) return { kind: "none", reason: "Marked do not contact" };

  // 2. Snoozed.
  if (contact.snoozedUntil && contact.snoozedUntil > today) {
    return { kind: "none", reason: `Snoozed until ${contact.snoozedUntil}` };
  }

  // 3. A reminder the user set themselves.
  const pending = reminders
    .filter((r) => r.status === "pending")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  if (pending) {
    return {
      kind: "reminder",
      label: pending.notes?.trim() || "Your reminder",
      reason: "You set this reminder",
      dueDate: dayOf(pending.dueDate),
      reminderId: pending.id,
    };
  }

  const lastInbound = latest(interactions.filter((i) => i.direction === "inbound"));
  const lastOutbound = latest(interactions.filter((i) => i.direction === "outbound"));
  const lastAny = latest(interactions);

  // 4. They wrote last.
  if (lastInbound && (!lastOutbound || lastInbound.date > lastOutbound.date)) {
    return { kind: "reply", label: "Reply", reason: "They contacted you last", dueDate: dayOf(lastInbound.date) };
  }

  // 5. Thank-you after a call or meeting.
  const lastTalk = latest(interactions.filter(isConversation));
  if (lastTalk) {
    const talkDay = dayOf(lastTalk.date);
    const age = daysBetween(talkDay, today);
    const thanked = interactions.some((i) => i.direction === "outbound" && !isConversation(i) && i.date > lastTalk.date);
    if (age >= 0 && age <= RULES.thankYouWindowDays && !thanked) {
      return { kind: "thank_you", label: "Send a thank-you", reason: `You spoke on ${talkDay}`, dueDate: talkDay };
    }
  }

  // AC-5: the follow-up agent's keep-in-touch date replaces the stage rule.
  if (contact.nurtureNextTouchAt) {
    return {
      kind: "keep_in_touch",
      label: "Keep in touch",
      reason: "Keep-in-touch date set by the follow-up agent",
      dueDate: dayOf(contact.nurtureNextTouchAt),
    };
  }

  // 6. By stage.
  const stageDay = dayOf(contact.warmthStageChangedAt);
  const recent = sinceStageChange(contact, interactions);
  const lastTouchDay = lastAny ? laterDay(dayOf(lastAny.date), stageDay) : stageDay;

  switch (contact.warmthStage) {
    case "identified":
      return { kind: "follow", label: "Follow them", reason: "First step: see what they post", dueDate: stageDay };

    case "following": {
      const done = recent.filter((i) => i.direction === "outbound");
      const lastDone = latest(done);
      return {
        kind: "engage",
        label: "Engage with a recent post",
        reason: `${Math.min(done.length, RULES.interactionsToEngaged)} of ${RULES.interactionsToEngaged} interactions logged`,
        dueDate: addDays(lastDone ? dayOf(lastDone.date) : stageDay, RULES.engageEveryDays),
      };
    }

    case "engaged": {
      // REQ-009: an invitation already marked as sent waits for an answer.
      if (contact.invitationSentAt) {
        const sentDay = dayOf(contact.invitationSentAt);
        const checkOn = addDays(sentDay, RULES.invitationPendingDays);
        if (today < checkOn) {
          return { kind: "none", reason: `Invitation sent on ${sentDay}. Mark Connected when they accept` };
        }
        return { kind: "check_in", label: "Check on your invitation", reason: `Sent on ${sentDay}, not marked as accepted`, dueDate: checkOn };
      }
      // REQ-009: at the weekly limit, stop suggesting invitations.
      if (invitations?.state === "stop") {
        return { kind: "none", reason: `Weekly invitation limit reached${invitations.nextSlotOn ? `. Next slot on ${invitations.nextSlotOn}` : ""}` };
      }
      return {
        kind: "connect",
        label: "Send a connection request with a short note",
        reason: "You have engaged with their content",
        dueDate: addDays(stageDay, RULES.connectAfterEngagedDays),
      };
    }

    case "connected": {
      const sent = recent.filter((i) => i.direction === "outbound");
      const replied = recent.some((i) => i.direction === "inbound");
      const lastSent = latest(sent);
      if (replied) {
        return {
          kind: "check_in",
          label: "Check in",
          reason: "You have exchanged messages",
          dueDate: addDays(lastTouchDay, RULES.checkInDays),
        };
      }
      if (!lastSent) {
        return {
          kind: "ask_advice",
          label: "Ask for advice",
          reason: "You are connected and have not written yet",
          dueDate: addDays(stageDay, RULES.askAfterConnectedDays),
        };
      }
      const followUpsSent = sent.length - 1;
      if (followUpsSent < RULES.maxFollowUps) {
        return {
          kind: "follow_up",
          label: `Follow up (${followUpsSent + 1} of ${RULES.maxFollowUps})`,
          reason: `No reply since ${dayOf(lastSent.date)}`,
          dueDate: addDays(dayOf(lastSent.date), RULES.followUpAfterDays),
        };
      }
      const restEnds = addDays(dayOf(lastSent.date), RULES.restDays);
      if (today < restEnds) {
        return { kind: "none", reason: `Resting until ${restEnds} after ${RULES.maxFollowUps} follow-ups without a reply` };
      }
      return { kind: "check_in", label: "Try once more, or let it go", reason: `The ${RULES.restDays}-day rest is over`, dueDate: restEnds };
    }

    case "in_conversation":
      return {
        kind: "check_in",
        label: "Check in",
        reason: `Last contact ${lastTouchDay}`,
        dueDate: addDays(lastTouchDay, RULES.checkInDays),
      };

    case "advocate":
      return {
        kind: "keep_in_touch",
        label: "Keep in touch",
        reason: `Last contact ${lastTouchDay}`,
        dueDate: addDays(lastTouchDay, RULES.keepInTouchDays),
      };
  }
}

/** True when the action should be on today's list. */
export function isDue(action: NextAction, today: string): action is Exclude<NextAction, { kind: "none" }> {
  return action.kind !== "none" && action.dueDate <= today;
}

/** Orders today's list: most overdue first, then by name. Returns only due items. */
export function dueToday<T extends { name: string; action: NextAction }>(items: T[], today: string): T[] {
  return items
    .filter((item) => isDue(item.action, today))
    .sort((a, b) => {
      const da = (a.action as { dueDate: string }).dueDate;
      const db = (b.action as { dueDate: string }).dueDate;
      return da === db ? a.name.localeCompare(b.name) : da.localeCompare(db);
    });
}
