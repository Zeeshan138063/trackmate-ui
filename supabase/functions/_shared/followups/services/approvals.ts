// The four decisions you make on a card, plus LinkedIn "mark sent" and "retry".
// Telegram and the web modal both call these, so both stay in sync.

import { linkedInHandoff, outcomeLine } from "../cards.ts";
import type { FollowUpRow, Transition } from "../ports.ts";
import type { FollowUpState } from "../state.ts";
import { type Deps } from "./deps.ts";
import { draftOne } from "./draft.ts";

export type Via = "telegram" | "web";
export class ApprovalError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "ApprovalError";
  }
}

const MAX_EDIT_ROUNDS = 5;
const MAX_BODY_CHARS = 5000;
const DAY = 86_400_000;

async function load(deps: Deps, userId: string, id: string): Promise<FollowUpRow> {
  const f = await deps.repo.followUp(id);
  if (!f || f.userId !== userId) throw new ApprovalError("follow-up not found", 404);
  return f;
}

async function move(deps: Deps, userId: string, id: string, via: Via, t: Omit<Transition, "actor">) {
  return await deps.repo.transition(id, userId, { ...t, actor: via });
}

/** Reflect a decision made on the web in the Telegram card, so it can't be acted on twice. */
async function syncCard(deps: Deps, f: FollowUpRow, outcome: string) {
  if (!deps.notifier || !f.telegramMessageId) return;
  const link = await deps.repo.telegramLink(f.userId);
  const v = await deps.repo.view(f.id);
  if (link && v) await deps.notifier.updateCard(link.chatId, f.telegramMessageId, outcomeLine(v, outcome));
}

export async function approve(deps: Deps, userId: string, id: string, via: Via, editedBody?: string) {
  const f = await load(deps, userId, id);
  const patch: Record<string, unknown> = { approved_via: via };
  if (editedBody !== undefined) {
    const body = editedBody.trim();
    if (!body || body.length > MAX_BODY_CHARS) throw new ApprovalError("edited message is empty or too long");
    patch.draft_body = body;
  }
  if (f.channel === "email" && (!f.sendAt || f.sendAt < deps.now())) patch.send_at = deps.now().toISOString();

  const to: FollowUpState = f.channel === "linkedin" ? "awaiting_manual_send" : "approved";
  const row = await move(deps, userId, id, via, { to, expect: ["awaiting_approval"], patch });

  if (to === "awaiting_manual_send" && deps.notifier) {
    const link = await deps.repo.telegramLink(userId);
    const v = await deps.repo.view(id);
    if (link && v) {
      const buttons: { text: string; url?: string; data?: string }[][] = [[{ text: "Mark sent", data: `fu:marksent:${id}` }]];
      if (v.contact.linkedinUrl?.startsWith("https://")) buttons.unshift([{ text: "Open profile", url: v.contact.linkedinUrl }]);
      await deps.notifier.sendText(link.chatId, linkedInHandoff(v), buttons);
    }
  }
  if (via === "web") await syncCard(deps, f, to === "approved" ? "Approved in JobOS." : "Approved in JobOS, send it on LinkedIn.");
  return row;
}

export async function redraft(deps: Deps, userId: string, id: string, via: Via, instruction: string) {
  const f = await load(deps, userId, id);
  const note = instruction.trim().replace(/\s+/g, " ");
  if (!note || note.length > 500) throw new ApprovalError("instruction must be 1 to 500 characters");
  if (f.editNotes.length >= MAX_EDIT_ROUNDS) throw new ApprovalError(`edit limit of ${MAX_EDIT_ROUNDS} reached; edit the text directly`);

  const row = await move(deps, userId, id, via, { to: "drafting", expect: ["awaiting_approval"], patch: { edit_note: note } });
  await draftOne(deps, row);
  return await deps.repo.followUp(id);
}

export async function snooze(deps: Deps, userId: string, id: string, via: Via, until: Date) {
  await load(deps, userId, id);
  const now = deps.now();
  if (!(until instanceof Date) || isNaN(until.getTime()) || until <= now || until.getTime() - now.getTime() > 90 * DAY) {
    throw new ApprovalError("snooze must be between now and 90 days from now");
  }
  const f = await deps.repo.followUp(id);
  const row = await move(deps, userId, id, via, {
    to: "planned",
    expect: ["awaiting_approval", "awaiting_manual_send"],
    patch: { due_date: until.toISOString(), send_at: until.toISOString() },
  });
  if (via === "web" && f) await syncCard(deps, f, `Snoozed until ${until.toISOString().slice(0, 10)}.`);
  return row;
}

export async function skip(deps: Deps, userId: string, id: string, via: Via) {
  const f = await load(deps, userId, id);
  const row = await move(deps, userId, id, via, {
    to: "skipped",
    expect: ["planned", "drafting", "awaiting_approval", "approved", "awaiting_manual_send", "failed"],
  });
  if (via === "web") await syncCard(deps, f, "Skipped.");
  return row;
}

export async function markSent(deps: Deps, userId: string, id: string, via: Via) {
  const f = await load(deps, userId, id);
  const row = await move(deps, userId, id, via, { to: "sent", expect: ["awaiting_manual_send"] });
  await deps.repo.recordEngagement({
    userId,
    contactId: f.contactId,
    jobId: f.jobId,
    type: "linkedin",
    direction: "outbound",
    kind: f.kind === "thank_you" ? "thank_you" : "followup",
    date: deps.now(),
    notes: f.draftBody,
  });
  return row;
}

/** Turn "attach resume" on or off. A waiting draft is rewritten so its wording matches. */
export async function setAttachResume(deps: Deps, userId: string, id: string, via: Via, on: boolean) {
  const f = await load(deps, userId, id);
  if (f.channel !== "email") throw new ApprovalError("files can only be attached to email follow-ups");
  if (f.attachResume === on) return f;
  if (on) {
    const v = await deps.repo.view(id);
    if (!v?.resume) throw new ApprovalError("attach a resume to this application first (Resume tab)");
  }
  if (f.state === "planned" || f.state === "failed") {
    return await move(deps, userId, id, via, { to: null, expect: [f.state], patch: { attach_resume: on } });
  }
  if (f.state === "awaiting_approval") {
    const row = await move(deps, userId, id, via, { to: "drafting", expect: ["awaiting_approval"], patch: { attach_resume: on } });
    await draftOne(deps, row);
    return await deps.repo.followUp(id);
  }
  throw new ApprovalError("this follow-up can no longer be changed");
}

export async function retry(deps: Deps, userId: string, id: string, via: Via) {
  await load(deps, userId, id);
  return await move(deps, userId, id, via, {
    to: "approved",
    expect: ["failed"],
    patch: { retry_count: 0, last_error: null, send_at: deps.now().toISOString() },
  });
}
