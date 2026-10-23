// Follow-up state machine. The SQL trigger in
// supabase/migrations/20261024120000_followup_agent.sql enforces the same table;
// state_test.ts fails if the two ever drift.

export const STATES = [
  "planned",
  "drafting",
  "awaiting_approval",
  "approved",
  "sending",
  "awaiting_manual_send",
  "sent",
  "skipped",
  "cancelled",
  "failed",
] as const;

export type FollowUpState = typeof STATES[number];

export const TRANSITIONS: Readonly<Record<FollowUpState, readonly FollowUpState[]>> = {
  planned: ["drafting", "skipped", "cancelled"],
  drafting: ["awaiting_approval", "planned", "failed", "skipped", "cancelled"],
  awaiting_approval: ["approved", "awaiting_manual_send", "drafting", "planned", "skipped", "cancelled"],
  approved: ["sending", "skipped", "cancelled"],
  sending: ["sent", "failed", "approved", "cancelled"],
  awaiting_manual_send: ["sent", "planned", "skipped", "cancelled"],
  failed: ["approved", "skipped", "cancelled"],
  sent: [],
  skipped: [],
  cancelled: [],
};

export const TERMINAL_STATES: readonly FollowUpState[] = ["sent", "skipped", "cancelled"];

export function canTransition(from: FollowUpState, to: FollowUpState): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isTerminal(state: FollowUpState): boolean {
  return TERMINAL_STATES.includes(state);
}

/** Open = still has a future: the cadence engine must not plan another one beside it. */
export function isOpen(state: FollowUpState): boolean {
  return !isTerminal(state);
}

export class IllegalTransitionError extends Error {
  constructor(public readonly from: FollowUpState, public readonly to: FollowUpState) {
    super(`illegal follow-up transition ${from} -> ${to}`);
    this.name = "IllegalTransitionError";
  }
}

export function assertTransition(from: FollowUpState, to: FollowUpState): void {
  if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);
}

/** The legacy follow_ups.status the trigger derives for agent rows. */
export function legacyStatus(state: FollowUpState): "pending" | "completed" | "missed" {
  if (isTerminal(state)) return "completed";
  if (state === "failed") return "missed";
  return "pending";
}
