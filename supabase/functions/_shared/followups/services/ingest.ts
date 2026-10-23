import type { MailAccount, ReplyLabel } from "../ports.ts";
import { ConflictError } from "../ports.ts";
import { escapeHtml } from "../security.ts";
import { type Deps, errorMessage, providerFor } from "./deps.ts";

const LABEL_TEXT: Record<ReplyLabel, string> = {
  interview_invite: "Interview invite",
  rejection: "Rejection",
  still_reviewing: "Still reviewing",
  question_for_you: "Question for you",
  auto_reply_ooo: "Out of office",
  other: "Reply",
};
const DAY = 86_400_000;

/** Pull new inbox mail for one account, log replies from known contacts, and stop chasing them. */
export async function ingestAccount(deps: Deps, acct: MailAccount): Promise<number> {
  if (acct.status !== "active") return 0;
  const provider = providerFor(deps, acct);
  const { messages, cursor } = await provider.inboundSince(acct, acct.syncCursor);
  let handled = 0;

  for (const m of messages) {
    if (!m.from || m.from === acct.address.toLowerCase()) continue;
    const match = await deps.repo.matchInbound(acct.userId, m.from, m.threadId);
    if (!match) continue; // not someone we track: never read or store it

    let label: ReplyLabel = "other";
    try {
      label = await deps.classifier.classify({ subject: m.subject, text: m.snippet });
    } catch (e) {
      deps.log.warn("classification failed; using 'other'", { error: errorMessage(e) });
    }

    const inserted = await deps.repo.recordEngagement({
      userId: acct.userId,
      contactId: match.contactId,
      jobId: match.jobIds.length === 1 ? match.jobIds[0] : null,
      type: "email",
      direction: "inbound",
      kind: label === "interview_invite" ? "interview" : "reply",
      date: m.date,
      notes: m.snippet.slice(0, 500),
      provider: acct.provider,
      mailAccountId: acct.id,
      threadId: m.threadId,
      messageId: m.messageId,
      rfc822MessageId: m.rfc822MessageId,
      subject: m.subject.slice(0, 300),
      classification: label,
    });
    if (!inserted) continue; // already seen (push and poll both delivered it)
    handled++;

    const open = await deps.repo.openFollowUps(acct.userId, match.contactId, match.jobIds.length ? match.jobIds : null);
    for (const f of open) {
      if (f.state === "sending") continue; // the sender re-checks for replies itself
      try {
        if (label === "auto_reply_ooo") {
          // Keep the follow-up, just push it back a few days.
          const later = new Date(Math.max(f.dueAt.getTime(), deps.now().getTime()) + 3 * DAY).toISOString();
          await deps.repo.transition(f.id, null, {
            to: null, actor: "system", expect: [f.state],
            patch: { due_date: later, ...(f.sendAt ? { send_at: later } : {}) }, detail: { postponed: "out of office" },
          });
        } else {
          await deps.repo.transition(f.id, null, {
            to: "cancelled", actor: "system", expect: [f.state], detail: { reason: `reply: ${label}` },
          });
          if (f.telegramMessageId && deps.notifier) {
            const link = await deps.repo.telegramLink(acct.userId);
            if (link) await deps.notifier.updateCard(link.chatId, f.telegramMessageId, "<i>Cancelled: they replied.</i>");
          }
        }
      } catch (e) {
        if (!(e instanceof ConflictError)) throw e; // someone else moved it first: fine
      }
    }

    if (label !== "auto_reply_ooo" && deps.notifier) {
      const link = await deps.repo.telegramLink(acct.userId);
      if (link) {
        await deps.notifier.sendText(
          link.chatId,
          `<b>${LABEL_TEXT[label]}</b> from ${escapeHtml(m.fromName ?? m.from)}\n` +
            `<i>${escapeHtml(m.subject)}</i>\n\n${escapeHtml(m.snippet.slice(0, 300))}`,
        );
      }
    }
  }

  await deps.repo.updateMailAccount(acct.id, { syncCursor: cursor });
  return handled;
}
