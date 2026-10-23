import type { ApprovalCard, Notifier } from "../ports.ts";
import type { FetchFn } from "./http.ts";

type Button = { text: string; url?: string; data?: string };

function keyboard(rows: Button[][]) {
  return {
    inline_keyboard: rows.map((r) =>
      r.map((b) => (b.url ? { text: b.text, url: b.url } : { text: b.text, callback_data: b.data }))
    ),
  };
}

/** callback_data must stay under 64 bytes: "fu:<action>:<uuid>" is at most 46. */
export function callbackData(action: string, followUpId: string): string {
  return `fu:${action}:${followUpId}`;
}

export function parseCallback(data: string): { action: string; id: string; arg?: string } | null {
  const m = data.match(/^fu:([a-z_]+):([0-9a-f-]{36})(?::([a-z0-9]+))?$/);
  return m ? { action: m[1], id: m[2], arg: m[3] } : null;
}

export function approvalButtons(card: ApprovalCard, appUrl: string | null): Button[][] {
  const rows: Button[][] = [
    [
      { text: "Approve", data: callbackData("approve", card.followUpId) },
      { text: "Edit", data: callbackData("edit", card.followUpId) },
    ],
    [
      { text: "Snooze", data: callbackData("snooze", card.followUpId) },
      { text: "Skip", data: callbackData("skip", card.followUpId) },
    ],
  ];
  if (appUrl) rows.push([{ text: "Open JobOS", url: appUrl }]);
  return rows;
}

export class TelegramNotifier implements Notifier {
  private base: string;

  constructor(botToken: string, private appUrl: string | null = null, private fetchFn: FetchFn = fetch) {
    if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is not set");
    this.base = `https://api.telegram.org/bot${botToken}`;
  }

  async call<T>(method: string, body: Record<string, unknown>): Promise<T> {
    const res = await this.fetchFn(`${this.base}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const json = await res.json() as { ok: boolean; result: T; description?: string };
    // Never echo the URL: it contains the bot token.
    if (!json.ok) throw new Error(`telegram ${method} failed: ${json.description ?? res.status}`);
    return json.result;
  }

  async sendCard(chatId: number, card: ApprovalCard): Promise<number> {
    const msg = await this.call<{ message_id: number }>("sendMessage", {
      chat_id: chatId,
      text: card.text,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_markup: keyboard(approvalButtons(card, this.appUrl)),
    });
    return msg.message_id;
  }

  async updateCard(chatId: number, messageId: number, text: string): Promise<void> {
    try {
      await this.call("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
    } catch (e) {
      // "message is not modified" or too old to edit: harmless.
      if (!String((e as Error).message).includes("not modified")) console.warn((e as Error).message);
    }
  }

  async sendText(chatId: number, html: string, buttons?: Button[][]): Promise<number> {
    const msg = await this.call<{ message_id: number }>("sendMessage", {
      chat_id: chatId,
      text: html,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      ...(buttons ? { reply_markup: keyboard(buttons) } : {}),
    });
    return msg.message_id;
  }

  async askForEdit(chatId: number, prompt: string): Promise<number> {
    const msg = await this.call<{ message_id: number }>("sendMessage", {
      chat_id: chatId,
      text: prompt,
      parse_mode: "HTML",
      reply_markup: { force_reply: true, input_field_placeholder: "e.g. shorter, mention my RAG project" },
    });
    return msg.message_id;
  }

  async answerCallback(callbackQueryId: string, text?: string): Promise<void> {
    await this.call("answerCallbackQuery", { callback_query_id: callbackQueryId, text });
  }

  async editButtons(chatId: number, messageId: number, rows: Button[][]): Promise<void> {
    await this.call("editMessageReplyMarkup", { chat_id: chatId, message_id: messageId, reply_markup: keyboard(rows) });
  }
}
