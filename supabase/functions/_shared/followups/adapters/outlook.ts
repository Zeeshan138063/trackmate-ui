import type { EmailProvider, MailAccount, MailMessage, OutgoingEmail, SentEmail, TokenProvider } from "../ports.ts";
import { headerSafe } from "../security.ts";
import { type FetchFn, requestJson } from "./http.ts";
import { assertAttachment, attachmentName, bytesToBase64 } from "./mime.ts";

const API = "https://graph.microsoft.com/v1.0/me";
const SELECT = "id,conversationId,internetMessageId,from,toRecipients,subject,receivedDateTime,sentDateTime,bodyPreview";
/** Graph allows up to 10,080 minutes for mail subscriptions; renew well before. */
const SUBSCRIPTION_MINUTES = 4 * 24 * 60;

interface GraphAddress {
  emailAddress: { address: string; name?: string };
}
interface GraphMessage {
  id: string;
  conversationId: string;
  internetMessageId?: string;
  from?: GraphAddress;
  toRecipients?: GraphAddress[];
  subject?: string;
  receivedDateTime?: string;
  sentDateTime?: string;
  bodyPreview?: string;
}

export function toMailMessage(m: GraphMessage): MailMessage {
  return {
    provider: "outlook",
    messageId: m.id,
    threadId: m.conversationId,
    rfc822MessageId: m.internetMessageId ?? null,
    from: (m.from?.emailAddress.address ?? "").toLowerCase(),
    fromName: m.from?.emailAddress.name ?? null,
    to: (m.toRecipients ?? []).map((r) => r.emailAddress.address.toLowerCase()),
    subject: m.subject ?? "",
    date: new Date(m.receivedDateTime ?? m.sentDateTime ?? Date.now()),
    snippet: m.bodyPreview ?? "",
  };
}

export interface OutlookOptions {
  /** Public URL of followups-mail-webhook; when unset, inbound mail is polled only. */
  notificationUrl?: string;
  /** Shared secret Graph echoes back as clientState on every notification. */
  clientState?: string;
}

const odataString = (s: string) => `'${s.replace(/'/g, "''")}'`;

export class OutlookProvider implements EmailProvider {
  readonly provider = "outlook" as const;

  constructor(private tokens: TokenProvider, private opts: OutlookOptions = {}, private fetchFn: FetchFn = fetch) {}

  private async call<T>(acct: MailAccount, path: string, init: RequestInit = {}, base = API): Promise<T> {
    const token = await this.tokens.accessToken(acct);
    return await requestJson<T>(this.fetchFn, `${base}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
  }

  async send(acct: MailAccount, email: OutgoingEmail): Promise<SentEmail> {
    if (email.attachment) assertAttachment(email.attachment);
    const fileAttachment = email.attachment
      ? {
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: attachmentName(email.attachment.fileName),
        contentType: email.attachment.mimeType,
        contentBytes: bytesToBase64(email.attachment.content),
      }
      : null;
    let draft: GraphMessage;
    if (email.replyTo?.providerMessageId) {
      // createReply keeps the conversation and quotes the original below our text.
      draft = await this.call<GraphMessage>(
        acct,
        `/messages/${encodeURIComponent(email.replyTo.providerMessageId)}/createReply`,
        { method: "POST", body: JSON.stringify({ comment: email.bodyText }) },
      );
      if (fileAttachment) {
        // Files under 3 MB can be added to a draft in one request.
        await this.call(acct, `/messages/${encodeURIComponent(draft.id)}/attachments`, {
          method: "POST",
          body: JSON.stringify(fileAttachment),
        });
      }
    } else {
      draft = await this.call<GraphMessage>(acct, "/messages", {
        method: "POST",
        body: JSON.stringify({
          subject: headerSafe(email.subject),
          body: { contentType: "Text", content: email.bodyText },
          toRecipients: [{ emailAddress: { address: email.to } }],
          internetMessageHeaders: [{ name: "X-JobOS-Followup-Id", value: email.followUpId }],
          ...(fileAttachment ? { attachments: [fileAttachment] } : {}),
        }),
      });
    }
    await this.call<void>(acct, `/messages/${encodeURIComponent(draft.id)}/send`, { method: "POST" });
    return { messageId: draft.id, threadId: draft.conversationId, rfc822MessageId: draft.internetMessageId ?? null };
  }

  async thread(acct: MailAccount, threadId: string, limit: number): Promise<MailMessage[]> {
    const res = await this.call<{ value: GraphMessage[] }>(
      acct,
      `/messages?$filter=${encodeURIComponent(`conversationId eq ${odataString(threadId)}`)}&$select=${SELECT}&$top=25`,
    );
    return res.value.map(toMailMessage).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(-limit);
  }

  async inboundSince(acct: MailAccount, cursor: string | null) {
    if (!cursor) return { messages: [], cursor: new Date().toISOString() };
    const filter = encodeURIComponent(`receivedDateTime gt ${cursor}`);
    const res = await this.call<{ value: GraphMessage[] }>(
      acct,
      `/mailFolders('inbox')/messages?$filter=${filter}&$orderby=receivedDateTime asc&$select=${SELECT}&$top=50`,
    );
    const messages = res.value.map(toMailMessage);
    const last = res.value.at(-1)?.receivedDateTime ?? cursor;
    return { messages, cursor: last };
  }

  async findSent(acct: MailAccount, q: { followUpId: string; to: string; subject: string; since: Date }) {
    const filter = encodeURIComponent(`sentDateTime ge ${new Date(q.since.getTime() - 60_000).toISOString()}`);
    const res = await this.call<{ value: GraphMessage[] }>(
      acct,
      `/mailFolders('sentitems')/messages?$filter=${filter}&$select=${SELECT}&$top=25`,
    );
    const wanted = q.subject.replace(/^\s*re:\s*/i, "").toLowerCase();
    const hit = res.value.find((m) =>
      (m.toRecipients ?? []).some((r) => r.emailAddress.address.toLowerCase() === q.to.toLowerCase()) &&
      (m.subject ?? "").toLowerCase().includes(wanted)
    );
    return hit?.id ?? null;
  }

  async ensureSubscription(acct: MailAccount) {
    if (!this.opts.notificationUrl || !this.opts.clientState) return { expiresAt: null, subscriptionId: null };
    const expiresAt = new Date(Date.now() + SUBSCRIPTION_MINUTES * 60_000);
    const root = "https://graph.microsoft.com/v1.0";

    if (acct.subscriptionId) {
      try {
        await this.call<void>(acct, `/subscriptions/${encodeURIComponent(acct.subscriptionId)}`, {
          method: "PATCH",
          body: JSON.stringify({ expirationDateTime: expiresAt.toISOString() }),
        }, root);
        return { expiresAt, subscriptionId: acct.subscriptionId };
      } catch (e) {
        if ((e as { status?: number }).status !== 404) throw e; // gone: recreate below
      }
    }
    const sub = await this.call<{ id: string; expirationDateTime: string }>(acct, "/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        changeType: "created",
        notificationUrl: this.opts.notificationUrl,
        lifecycleNotificationUrl: this.opts.notificationUrl,
        resource: "me/mailFolders('inbox')/messages",
        expirationDateTime: expiresAt.toISOString(),
        clientState: this.opts.clientState,
      }),
    }, root);
    return { expiresAt: new Date(sub.expirationDateTime), subscriptionId: sub.id };
  }
}
