import { outcomeLine } from "../cards.ts";
import { CHASER_WINDOW, nextSlot } from "../sendWindow.ts";
import {
  type EmailAttachment,
  type FollowUpRow,
  type FollowUpView,
  type MailAccount,
  MailAuthError,
  TransientMailError,
} from "../ports.ts";
import { escapeHtml, isEmail } from "../security.ts";
import { type Deps, errorMessage, providerFor } from "./deps.ts";

const MAX_SEND_RETRIES = 3;
const HOUR = 3_600_000;

async function pickAccount(deps: Deps, v: FollowUpView): Promise<MailAccount | null> {
  const id = v.mailAccountId ?? v.job.mailAccountId;
  if (id) return await deps.repo.mailAccount(id);
  // No inbox recorded for this application: only safe if the user has exactly one.
  const accounts = (await deps.repo.mailAccountsForUser(v.userId)).filter((a) => a.status === "active");
  return accounts.length === 1 ? accounts[0] : null;
}

async function notify(deps: Deps, userId: string, html: string, messageId?: number | null) {
  if (!deps.notifier) return;
  const link = await deps.repo.telegramLink(userId);
  if (!link) return;
  try {
    if (messageId) await deps.notifier.updateCard(link.chatId, messageId, html);
    else await deps.notifier.sendText(link.chatId, html);
  } catch (e) {
    deps.log.warn("telegram notify failed", { error: errorMessage(e) });
  }
}

/** Put a claimed (`sending`) follow-up back in the queue for later. */
async function requeue(deps: Deps, v: FollowUpView, at: Date, patch: Record<string, unknown> = {}, reason = "") {
  await deps.repo.transition(v.id, null, {
    to: "approved",
    actor: "system",
    expect: ["sending"],
    patch: { send_at: at.toISOString(), ...patch },
    detail: reason ? { requeued: reason } : {},
  });
}

async function fail(deps: Deps, v: FollowUpView, reason: string) {
  await deps.repo.transition(v.id, null, {
    to: "failed",
    actor: "system",
    expect: ["sending"],
    patch: { last_error: reason.slice(0, 500) },
  });
  await notify(deps, v.userId, outcomeLine(v, `Not sent: ${reason}. Tap Retry in JobOS once fixed.`), v.telegramMessageId);
}

/** Has the contact written to us since this follow-up was planned? Checks our log and, for email, the live thread. */
async function theyReplied(deps: Deps, v: FollowUpView, acct: MailAccount | null): Promise<boolean> {
  if (await deps.repo.inboundSince(v.contactId, v.createdAt) > 0) return true;
  if (!acct || !v.replyTarget || !v.contact.email) return false;
  try {
    const msgs = await providerFor(deps, acct).thread(acct, v.replyTarget.threadId, 10);
    return msgs.some((m) => m.from === v.contact.email!.toLowerCase() && m.date > v.createdAt);
  } catch {
    return false; // the log check above already ran; don't block sending on a read failure
  }
}

/** Send one follow-up that is already in `sending`. */
export async function sendOne(deps: Deps, row: FollowUpRow): Promise<void> {
  const v = await deps.repo.view(row.id);
  if (!v) return;
  const now = deps.now();

  if (v.channel !== "email") return await fail(deps, v, "LinkedIn messages are sent by you");
  if (!v.contact.email || !isEmail(v.contact.email)) return await fail(deps, v, "the contact has no valid email address");
  if (!v.draftBody?.trim()) return await fail(deps, v, "the draft is empty");

  const acct = await pickAccount(deps, v);
  if (!acct) return await fail(deps, v, "no inbox chosen for this application (connect one, or set it on the application)");
  if (acct.status !== "active") {
    return await requeue(deps, v, new Date(now.getTime() + 6 * HOUR), {}, "inbox needs reconnecting");
  }

  if (await theyReplied(deps, v, acct)) {
    await deps.repo.transition(v.id, null, {
      to: "cancelled", actor: "system", expect: ["sending"], detail: { reason: "they replied before send" },
    });
    await notify(deps, v.userId, outcomeLine(v, "Cancelled: they replied before it went out."), v.telegramMessageId);
    return;
  }

  if (await deps.repo.sentToday(acct.id, now) >= acct.dailySendCap) {
    const tomorrow = nextSlot(new Date(now.getTime() + 12 * HOUR), v.contact.timeZone, CHASER_WINDOW, v.id);
    return await requeue(deps, v, tomorrow, {}, "daily send cap reached");
  }

  // The approved message may say "I've attached my resume", so never send it without the file.
  let attachment: EmailAttachment | null = null;
  if (v.attachResume) {
    if (!v.resume) return await fail(deps, v, "the resume was removed from this application; attach one or turn off 'Attach resume'");
    try {
      attachment = { fileName: v.resume.fileName, mimeType: v.resume.mimeType, content: await deps.files.download(v.resume.storagePath) };
    } catch (e) {
      return await fail(deps, v, `could not load the attached resume (${errorMessage(e)})`);
    }
  }

  try {
    const sent = await providerFor(deps, acct).send(acct, {
      to: v.contact.email,
      subject: v.draftSubject?.trim() || `${v.job.position} application`,
      bodyText: v.draftBody,
      followUpId: v.id,
      replyTo: v.replyTarget,
      attachment,
    });
    await deps.repo.transition(v.id, null, {
      to: "sent",
      actor: "system",
      expect: ["sending"],
      patch: { sent_message_id: sent.messageId, mail_account_id: acct.id },
    });
    await deps.repo.recordEngagement({
      userId: v.userId,
      contactId: v.contactId,
      jobId: v.jobId,
      type: "email",
      direction: "outbound",
      kind: v.kind === "thank_you" ? "thank_you" : "followup",
      date: now,
      notes: v.draftBody,
      provider: acct.provider,
      mailAccountId: acct.id,
      threadId: sent.threadId,
      messageId: sent.messageId,
      rfc822MessageId: sent.rfc822MessageId,
      subject: v.draftSubject,
      attachmentName: attachment?.fileName ?? null,
    });
    await notify(
      deps,
      v.userId,
      outcomeLine(v, `Sent from ${acct.address}${attachment ? ` with ${attachment.fileName}` : ""}.`),
      v.telegramMessageId,
    );
    deps.log.info("follow-up sent", { followUpId: v.id, provider: acct.provider });
  } catch (e) {
    if (e instanceof MailAuthError) {
      await deps.repo.updateMailAccount(acct.id, { status: "reauth_required" });
      await requeue(deps, v, new Date(now.getTime() + 6 * HOUR), {}, "inbox auth failed");
      await notify(
        deps,
        v.userId,
        `Your inbox <b>${escapeHtml(acct.address)}</b> needs reconnecting in JobOS Settings. Follow-ups to it are paused.`,
      );
      return;
    }
    const attempts = v.retryCount + 1;
    if (e instanceof TransientMailError && attempts < MAX_SEND_RETRIES) {
      const backoff = 5 * 60_000 * 2 ** attempts;
      return await requeue(deps, v, new Date(now.getTime() + backoff), {
        retry_count: attempts,
        last_error: errorMessage(e).slice(0, 500),
      }, "transient error");
    }
    await fail(deps, v, errorMessage(e));
  }
}

/** Crash recovery: a row stuck in `sending` past its lease either went out (mark sent) or did not (requeue). */
export async function sweepStuck(deps: Deps): Promise<void> {
  for (const row of await deps.repo.stuck("sending", deps.now())) {
    const v = await deps.repo.view(row.id);
    if (!v) continue;
    try {
      const acct = await pickAccount(deps, v);
      const found = acct && v.contact.email
        ? await providerFor(deps, acct).findSent(acct, {
          followUpId: v.id,
          to: v.contact.email,
          subject: v.draftSubject ?? "",
          since: new Date((row.lockedUntil ?? deps.now()).getTime() - 10 * 60_000),
        })
        : null;
      if (found) {
        await deps.repo.transition(v.id, null, {
          to: "sent", actor: "system", expect: ["sending"],
          patch: { sent_message_id: found, mail_account_id: acct!.id }, detail: { recovered: true },
        });
      } else {
        await requeue(deps, v, deps.now(), {}, "lease expired, not found in Sent");
      }
    } catch (e) {
      deps.log.warn("sweep failed; will retry next tick", { followUpId: row.id, error: errorMessage(e) });
    }
  }
}
