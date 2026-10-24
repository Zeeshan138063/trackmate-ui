import { weekendDays } from "../calendar.ts";
import { approvalCardText } from "../cards.ts";
import type { DraftContext, FollowUpRow, FollowUpView, MailMessage } from "../ports.ts";
import { CHASER_WINDOW, nextSlot, workdayWindow } from "../sendWindow.ts";
import { validateDraft } from "../validators.ts";
import { type Deps, errorMessage, isQuiet, providerFor } from "./deps.ts";

const MAX_DRAFT_FAILURES = 3;

export function firstName(name: string): string | null {
  const first = name.trim().split(/\s+/)[0];
  return first && /^[\p{L}'-]{2,}$/u.test(first) ? first : null;
}

async function threadContext(deps: Deps, v: FollowUpView): Promise<DraftContext["thread"]> {
  if (v.channel !== "email" || !v.replyTarget || !v.mailAccountId) return [];
  try {
    const acct = await deps.repo.mailAccount(v.mailAccountId);
    if (!acct || acct.status !== "active") return [];
    const msgs: MailMessage[] = await providerFor(deps, acct).thread(acct, v.replyTarget.threadId, 3);
    return msgs.map((m) => ({ from: m.fromName ?? m.from, date: m.date.toISOString().slice(0, 10), subject: m.subject, text: m.snippet }));
  } catch (e) {
    deps.log.warn("thread fetch failed; drafting without it", { followUpId: v.id, error: errorMessage(e) });
    return [];
  }
}

export function buildContext(v: FollowUpView, thread: DraftContext["thread"]): DraftContext {
  return {
    kind: v.kind,
    attemptNo: v.attemptNo,
    channel: v.channel,
    job: {
      position: v.job.position,
      company: v.job.company.trim(),
      appliedOn: v.job.dateApplied,
      jdSummary: v.job.description ? v.job.description.replace(/\s+/g, " ").slice(0, 600) : null,
    },
    contact: { name: v.contact.name, firstName: firstName(v.contact.name), role: v.contact.position },
    you: v.user,
    thread,
    previousValuePoints: v.previousValuePoints,
    editNotes: v.editNotes,
    hasAttachment: v.attachResume && v.channel === "email" && !!v.resume,
  };
}

export function sendSlot(v: FollowUpView, now: Date): Date {
  const after = v.dueAt > now ? v.dueAt : now;
  const window = v.kind === "thank_you" ? workdayWindow(weekendDays(v.contact.country)) : CHASER_WINDOW;
  return nextSlot(after, v.contact.timeZone, window, v.id);
}

/** Draft one follow-up that is already in `drafting`, then post the approval card. */
export async function draftOne(deps: Deps, row: FollowUpRow): Promise<void> {
  const v = await deps.repo.view(row.id);
  if (!v) return;

  try {
    const ctx = buildContext(v, await threadContext(deps, v));
    let draft = await deps.drafter.draft(ctx);
    let check = validateDraft(draft, ctx);
    if (!check.ok) {
      draft = await deps.drafter.draft(ctx, check.problems);
      check = validateDraft(draft, ctx);
    }

    const sendAt = sendSlot(v, deps.now());
    const updated = await deps.repo.transition(v.id, null, {
      to: "awaiting_approval",
      actor: "agent",
      expect: ["drafting"],
      patch: { draft_subject: draft.subject, draft_body: draft.body, send_at: sendAt.toISOString(), retry_count: 0, last_error: null },
      detail: { value_point: draft.valuePoint, warnings: check.problems, version: v.draftVersion + 1 },
    });
    await postCard(deps, { ...v, ...updated }, check.problems);
  } catch (e) {
    const failures = row.retryCount + 1;
    deps.log.error("drafting failed", { followUpId: v.id, failures, error: errorMessage(e) });
    await deps.repo.transition(v.id, null, {
      to: failures >= MAX_DRAFT_FAILURES ? "failed" : "planned",
      actor: "system",
      expect: ["drafting"],
      patch: { retry_count: failures, last_error: errorMessage(e).slice(0, 500) },
    });
  }
}

/** Post (or re-post) the approval card unless the user is in quiet hours. */
export async function postCard(deps: Deps, v: FollowUpView, warnings: string[] = [], force = false): Promise<boolean> {
  if (!deps.notifier) return false;
  const link = await deps.repo.telegramLink(v.userId);
  if (!link) return false;
  if (!force && isQuiet(link, deps.now())) return false;

  const messageId = await deps.notifier.sendCard(link.chatId, {
    followUpId: v.id,
    channel: v.channel,
    text: approvalCardText(v, warnings),
  });
  if (v.telegramMessageId && v.telegramMessageId !== messageId) {
    await deps.notifier.updateCard(link.chatId, v.telegramMessageId, "<i>Replaced by a newer draft below.</i>");
  }
  await deps.repo.transition(v.id, null, { to: null, actor: "system", patch: { telegram_message_id: messageId } });
  return true;
}
