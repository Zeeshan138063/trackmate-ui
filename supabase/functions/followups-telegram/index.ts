// Telegram bot webhook. Register with:
//   setWebhook url=<SUPABASE_URL>/functions/v1/followups-telegram secret_token=<TELEGRAM_WEBHOOK_SECRET>
//              allowed_updates=["message","callback_query"]
// Telegram sends the secret in X-Telegram-Bot-Api-Secret-Token; anything else is rejected.
// Only chats linked to a JobOS account (via a one-time code) can act on follow-ups.

import { outcomeLine } from "../_shared/followups/cards.ts";
import { parseCallback, TelegramNotifier } from "../_shared/followups/adapters/telegram.ts";
import type { TelegramLink } from "../_shared/followups/ports.ts";
import { escapeHtml } from "../_shared/followups/security.ts";
import { approve, markSent, redraft, skip, snooze } from "../_shared/followups/services/approvals.ts";
import type { Deps } from "../_shared/followups/services/deps.ts";
import { background, buildDeps, env, json, requireSecret } from "../_shared/followups/runtime.ts";

interface TgUpdate {
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    text?: string;
    reply_to_message?: { message_id: number };
  };
  callback_query?: {
    id: string;
    data?: string;
    message?: { message_id: number; chat: { id: number } };
  };
}

const DAY = 86_400_000;

function bot(): TelegramNotifier {
  return new TelegramNotifier(env("TELEGRAM_BOT_TOKEN"), Deno.env.get("APP_URL") ?? null);
}

async function onMessage(deps: Deps, tg: TelegramNotifier, m: NonNullable<TgUpdate["message"]>) {
  if (m.chat.type !== "private") return; // never operate in groups
  const text = (m.text ?? "").trim();

  const start = text.match(/^\/start(?:\s+([A-Za-z0-9_-]{16,64}))?$/);
  if (start) {
    if (!start[1]) {
      await tg.sendText(m.chat.id, "Open JobOS Settings and tap <b>Connect Telegram</b> to link this chat.");
      return;
    }
    const userId = await deps.repo.completeTelegramLink(start[1], m.chat.id);
    await tg.sendText(
      m.chat.id,
      userId
        ? "Linked. Follow-up drafts will arrive here for your approval."
        : "That link has expired or was already used. Create a new one in JobOS Settings.",
    );
    return;
  }

  const link = await deps.repo.telegramLinkByChat(m.chat.id);
  if (!link) return; // unknown chat: ignore silently

  if (link.pendingEditFollowUpId && m.reply_to_message?.message_id === link.pendingEditPromptMessageId) {
    const id = link.pendingEditFollowUpId;
    await deps.repo.setTelegramPendingEdit(link.userId, null, null);
    try {
      await redraft(deps, link.userId, id, "telegram", text.slice(0, 500));
    } catch (e) {
      await tg.sendText(m.chat.id, `Could not redraft: ${escapeHtml((e as Error).message)}`);
    }
    return;
  }
  await tg.sendText(m.chat.id, "Use the buttons on a follow-up card. Reply to an <i>Edit</i> prompt to change a draft.");
}

async function onCallback(deps: Deps, tg: TelegramNotifier, cq: NonNullable<TgUpdate["callback_query"]>) {
  const chatId = cq.message?.chat.id;
  const parsed = cq.data ? parseCallback(cq.data) : null;
  const link: TelegramLink | null = chatId ? await deps.repo.telegramLinkByChat(chatId) : null;
  if (!parsed || !link || !cq.message) {
    await tg.answerCallback(cq.id, "Not available");
    return;
  }
  const { action, id, arg } = parsed;
  const card = cq.message.message_id;
  const view = await deps.repo.view(id);
  if (!view || view.userId !== link.userId) {
    await tg.answerCallback(cq.id, "Not found");
    return;
  }

  try {
    switch (action) {
      case "approve":
        await approve(deps, link.userId, id, "telegram");
        await tg.answerCallback(cq.id, "Approved");
        await tg.updateCard(chatId!, card, outcomeLine(view, view.channel === "email"
          ? `Approved. Sends ${view.sendAt && view.sendAt > deps.now() ? "in their send window" : "within 15 minutes"}.`
          : "Approved. Send it on LinkedIn using the message below."));
        return;
      case "edit": {
        await tg.answerCallback(cq.id);
        const prompt = await tg.askForEdit(chatId!, `What should change in the draft for <b>${escapeHtml(view.contact.name)}</b>? Reply to this message.`);
        await deps.repo.setTelegramPendingEdit(link.userId, id, prompt);
        return;
      }
      case "snooze":
        if (!arg) {
          await tg.answerCallback(cq.id);
          await tg.editButtons(chatId!, card, [[
            { text: "2 days", data: `fu:snooze:${id}:2d` },
            { text: "1 week", data: `fu:snooze:${id}:7d` },
            { text: "2 weeks", data: `fu:snooze:${id}:14d` },
          ]]);
          return;
        } else {
          const days = { "2d": 2, "7d": 7, "14d": 14 }[arg];
          if (!days) throw new Error("bad snooze option");
          await snooze(deps, link.userId, id, "telegram", new Date(deps.now().getTime() + days * DAY));
          await tg.answerCallback(cq.id, `Snoozed ${days} days`);
          await tg.updateCard(chatId!, card, outcomeLine(view, `Snoozed for ${days} days. A fresh draft will come then.`));
          return;
        }
      case "skip":
        await skip(deps, link.userId, id, "telegram");
        await tg.answerCallback(cq.id, "Skipped");
        await tg.updateCard(chatId!, card, outcomeLine(view, "Skipped."));
        return;
      case "marksent":
        await markSent(deps, link.userId, id, "telegram");
        await tg.answerCallback(cq.id, "Logged as sent");
        await tg.updateCard(chatId!, card, outcomeLine(view, "Sent on LinkedIn and logged."));
        return;
      default:
        await tg.answerCallback(cq.id, "Not available");
    }
  } catch (e) {
    const already = (e as Error).name === "ConflictError";
    await tg.answerCallback(cq.id, already ? "Already handled" : "Something went wrong").catch(() => {});
    if (!already) console.error(JSON.stringify({ level: "error", msg: "telegram action failed", action, error: String((e as Error).message) }));
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
    requireSecret(req.headers.get("X-Telegram-Bot-Api-Secret-Token"), "TELEGRAM_WEBHOOK_SECRET");
  } catch {
    return json({ error: "unauthorized" }, 401);
  }

  let update: TgUpdate;
  try {
    update = await req.json();
  } catch {
    return json({ ok: true }); // malformed: acknowledge so Telegram does not retry forever
  }

  const deps = buildDeps();
  const tg = bot();
  const work = update.callback_query
    ? onCallback(deps, tg, update.callback_query)
    : update.message
    ? onMessage(deps, tg, update.message)
    : Promise.resolve();
  background(work);
  return json({ ok: true });
});
