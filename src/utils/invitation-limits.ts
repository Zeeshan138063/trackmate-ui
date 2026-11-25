// Invitation limits tracker (REQ-009, spec docs/specs/2026-11-26-invitation-limits-design.md).
//
// Pure. Counts only the connection invitations the user marked as sent in JobOS: it never
// reads or touches LinkedIn (P1), so invitations sent without marking them are not counted.

import { addDays, dayOf } from "./contact-next-action";

/** DEC-008. LinkedIn confirms weekly limits exist; "about 100" is widely observed, not published. */
export const INVITE_WINDOW_DAYS = 7;
export const INVITE_WARN_AT = 80;
export const INVITE_STOP_AT = 100;

export type InvitationState = "ok" | "warn" | "stop";

export interface InvitationUsage {
  /** Invitations marked sent in the rolling window ending today. */
  count: number;
  state: InvitationState;
  /** When at `stop`: the first day the count is back under the limit. Otherwise null. */
  nextSlotOn: string | null;
}

/** Usage over the seven days ending today (today and the six days before it). */
export function invitationUsage(sentDates: (string | null | undefined)[], today: string): InvitationUsage {
  const windowStart = addDays(today, -(INVITE_WINDOW_DAYS - 1));
  const counted = sentDates
    .filter((d): d is string => !!d)
    .map(dayOf)
    .filter((day) => day >= windowStart && day <= today)
    .sort();

  const count = counted.length;
  const state: InvitationState = count >= INVITE_STOP_AT ? "stop" : count >= INVITE_WARN_AT ? "warn" : "ok";
  // The count drops under the limit once the (count - limit + 1) oldest invitations have left
  // the window; an invitation leaves seven days after it was sent.
  const nextSlotOn = state === "stop" ? addDays(counted[count - INVITE_STOP_AT], INVITE_WINDOW_DAYS) : null;
  return { count, state, nextSlotOn };
}
