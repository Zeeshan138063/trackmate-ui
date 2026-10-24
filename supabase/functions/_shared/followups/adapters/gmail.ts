import type { EmailProvider, MailAccount, MailMessage, OutgoingEmail, SentEmail, TokenProvider } from "../ports.ts";
import { type FetchFn, requestJson } from "./http.ts";
import { buildRawMessage, parseAddress, replySubject } from "./mime.ts";

const API = "https://gmail.googleapis.com/gmail/v1/users/me";

interface GmailHeader {
  name: string;
  value: string;
}
interface GmailMessage {
  id: string;
  threadId: string;
  internalDate: string;
  snippet?: string;
  labelIds?: string[];
  payload?: { headers?: GmailHeader[] };
}

const META_HEADERS = ["From", "To", "Subject", "Message-ID", "Date"];

function header(m: GmailMessage, name: string): string | null {
  return m.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? null;
}

export function toMailMessage(m: GmailMessage): MailMessage {
  const from = parseAddress(header(m, "From") ?? "");
  return {
    provider: "gmail",
    messageId: m.id,
    threadId: m.threadId,
    rfc822MessageId: header(m, "Message-ID"),
    from: from.address,
    fromName: from.name,
    to: (header(m, "To") ?? "").split(",").map((a) => parseAddress(a).address).filter(Boolean),
    subject: header(m, "Subject") ?? "",
    date: new Date(Number(m.internalDate)),
    snippet: m.snippet ?? "",
  };
}

export interface GmailOptions {
  /** projects/<project>/topics/<topic>; when unset, inbound mail is polled only. */
  pubsubTopic?: string;
}

export class GmailProvider implements EmailProvider {
  readonly provider = "gmail" as const;

  constructor(private tokens: TokenProvider, private opts: GmailOptions = {}, private fetchFn: FetchFn = fetch) {}

  private async call<T>(acct: MailAccount, path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.tokens.accessToken(acct);
    return await requestJson<T>(this.fetchFn, `${API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
  }

  private async metadata(acct: MailAccount, id: string, extra: string[] = []): Promise<GmailMessage> {
    const q = [...META_HEADERS, ...extra].map((h) => `metadataHeaders=${encodeURIComponent(h)}`).join("&");
    return await this.call<GmailMessage>(acct, `/messages/${encodeURIComponent(id)}?format=metadata&${q}`);
  }

  async send(acct: MailAccount, email: OutgoingEmail): Promise<SentEmail> {
    const raw = buildRawMessage({
      to: email.to,
      subject: email.replyTo ? replySubject(email.replyTo.subject, email.subject) : email.subject,
      bodyText: email.bodyText,
      followUpId: email.followUpId,
      inReplyTo: email.replyTo?.rfc822MessageId ?? null,
      attachment: email.attachment ?? null,
    });
    const sent = await this.call<{ id: string; threadId: string }>(acct, "/messages/send", {
      method: "POST",
      body: JSON.stringify(email.replyTo ? { raw, threadId: email.replyTo.threadId } : { raw }),
    });
    let rfc822: string | null = null;
    try {
      rfc822 = header(await this.metadata(acct, sent.id), "Message-ID");
    } catch {
      // Not needed for correctness; the next reply can still thread by threadId.
    }
    return { messageId: sent.id, threadId: sent.threadId, rfc822MessageId: rfc822 };
  }

  async thread(acct: MailAccount, threadId: string, limit: number): Promise<MailMessage[]> {
    const q = META_HEADERS.map((h) => `metadataHeaders=${encodeURIComponent(h)}`).join("&");
    const t = await this.call<{ messages?: GmailMessage[] }>(
      acct,
      `/threads/${encodeURIComponent(threadId)}?format=metadata&${q}`,
    );
    return (t.messages ?? []).map(toMailMessage).slice(-limit);
  }

  async inboundSince(acct: MailAccount, cursor: string | null) {
    const profile = async () => (await this.call<{ historyId: string }>(acct, "/profile")).historyId;
    if (!cursor) return { messages: [], cursor: await profile() };

    const ids = new Set<string>();
    let pageToken: string | undefined;
    let latest = cursor;
    try {
      do {
        const page = await this.call<{
          history?: { messagesAdded?: { message: GmailMessage }[] }[];
          historyId: string;
          nextPageToken?: string;
        }>(
          acct,
          `/history?startHistoryId=${encodeURIComponent(cursor)}&historyTypes=messageAdded&labelId=INBOX&maxResults=100` +
            (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""),
        );
        for (const h of page.history ?? []) for (const a of h.messagesAdded ?? []) ids.add(a.message.id);
        latest = page.historyId ?? latest;
        pageToken = page.nextPageToken;
      } while (pageToken && ids.size < 200);
    } catch (e) {
      // 404: the history id is too old; restart from now rather than failing forever.
      if ((e as { status?: number }).status === 404) return { messages: [], cursor: await profile() };
      throw e;
    }

    const messages: MailMessage[] = [];
    for (const id of [...ids].slice(0, 50)) {
      const m = await this.metadata(acct, id);
      if (m.labelIds?.includes("SENT")) continue;
      messages.push(toMailMessage(m));
    }
    return { messages, cursor: latest };
  }

  async findSent(acct: MailAccount, q: { followUpId: string; to: string; subject: string; since: Date }) {
    const after = Math.floor(q.since.getTime() / 1000) - 60;
    const search = encodeURIComponent(`in:sent to:${q.to} after:${after}`);
    const list = await this.call<{ messages?: { id: string }[] }>(acct, `/messages?q=${search}&maxResults=10`);
    for (const { id } of list.messages ?? []) {
      const m = await this.metadata(acct, id, ["X-JobOS-Followup-Id"]);
      if (header(m, "X-JobOS-Followup-Id") === q.followUpId) return id;
    }
    return null;
  }

  async ensureSubscription(acct: MailAccount) {
    if (!this.opts.pubsubTopic) return { expiresAt: null, subscriptionId: null };
    const res = await this.call<{ historyId: string; expiration: string }>(acct, "/watch", {
      method: "POST",
      body: JSON.stringify({ topicName: this.opts.pubsubTopic, labelIds: ["INBOX"], labelFilterBehavior: "include" }),
    });
    return {
      expiresAt: new Date(Number(res.expiration)),
      subscriptionId: null,
      cursor: acct.syncCursor ? undefined : res.historyId,
    };
  }
}
