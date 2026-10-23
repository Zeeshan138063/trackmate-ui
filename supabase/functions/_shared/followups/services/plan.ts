import { type JobStatus, nextFollowUp, type TouchKind } from "../cadence.ts";
import type { PlanningCandidate } from "../ports.ts";
import { type Deps, errorMessage } from "./deps.ts";

const DAY = 86_400_000;

export function toCadenceInput(c: PlanningCandidate, now: Date) {
  return {
    now,
    job: {
      status: c.job.status as JobStatus,
      dateApplied: c.job.dateApplied ? new Date(`${c.job.dateApplied}T09:00:00Z`) : null,
      appliedVia: c.job.appliedVia,
      doNotFollowup: c.job.doNotFollowup,
      followupsPaused: c.job.followupsPaused,
      responsePromisedBy: c.job.responsePromisedBy ? new Date(`${c.job.responsePromisedBy}T17:00:00Z`) : null,
    },
    contact: c.contact,
    touchpoints: c.touchpoints.map((t) => ({
      at: new Date(t.at),
      direction: t.direction,
      kind: (t.kind as TouchKind | null) ?? null,
      channel: (["email", "call", "linkedin", "meeting"].includes(t.channel) ? t.channel : "other") as
        "email" | "call" | "linkedin" | "meeting" | "other",
    })),
    followUps: c.followUps.map((f) => ({
      kind: f.kind,
      attemptNo: f.attemptNo,
      state: f.state,
      dueAt: new Date(f.dueAt),
      sentAt: f.sentAt ? new Date(f.sentAt) : null,
    })),
  };
}

/** Run the cadence engine over every tracked (application, contact) pair. Idempotent. */
export async function planAll(deps: Deps): Promise<{ planned: number; nurtured: number }> {
  const now = deps.now();
  let planned = 0;
  let nurtured = 0;

  for (const c of await deps.repo.planningCandidates()) {
    try {
      const decision = nextFollowUp(toCadenceInput(c, now));
      if (decision.type === "plan") {
        // Only plan what is due within a month; later items are planned on a later tick.
        if (decision.dueAt.getTime() - now.getTime() > 30 * DAY) continue;
        const inserted = await deps.repo.insertPlanned({
          userId: c.userId,
          jobId: c.jobId,
          contactId: c.contactId,
          kind: decision.kind,
          attemptNo: decision.attemptNo,
          channel: decision.channel,
          dueAt: decision.dueAt,
          mailAccountId: c.job.mailAccountId,
        });
        if (inserted) planned++;
      } else if (decision.type === "move_to_nurture") {
        await deps.repo.moveToNurture({
          userId: c.userId,
          contactId: c.contactId,
          nextTouchAt: decision.nextTouchAt,
          reason: decision.reason,
        });
        nurtured++;
      }
    } catch (e) {
      deps.log.error("planning failed for pair", { jobId: c.jobId, contactId: c.contactId, error: errorMessage(e) });
    }
  }
  return { planned, nurtured };
}
