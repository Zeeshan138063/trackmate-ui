// deno-lint-ignore-file require-await
// In-memory fakes for service tests. They enforce the same state machine as the DB trigger.

import {
  type ApprovalCard,
  type Classifier,
  ConflictError,
  type Draft,
  type DraftContext,
  type Drafter,
  type EmailProvider,
  type FollowUpRow,
  type FollowUpView,
  type MailAccount,
  type MailMessage,
  type Notifier,
  type OutgoingEmail,
  type PlanningCandidate,
  type ReplyLabel,
  type Repo,
  type SentEmail,
  type TelegramLink,
  type Transition,
} from "../ports.ts";
import { canTransition, type FollowUpState } from "../state.ts";
import type { Deps } from "../services/deps.ts";

const OPEN: FollowUpState[] = ["planned", "drafting", "awaiting_approval", "approved", "sending", "awaiting_manual_send", "failed"];
let seq = 0;
export const uuid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`;

export interface FakeJob {
  id: string;
  userId: string;
  position: string;
  company: string;
  status: string;
  dateApplied: string | null;
  mailAccountId: string | null;
}
export interface FakeContact {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  linkedinUrl: string | null;
  timeZone: string;
  stage: "active" | "nurture" | "dormant" | "do_not_contact";
}
export interface FakeEngagement {
  userId: string;
  contactId: string;
  jobId: string | null;
  type: string;
  direction: "inbound" | "outbound";
  kind: string;
  date: Date;
  threadId?: string | null;
  messageId?: string | null;
  provider?: string | null;
  classification?: string | null;
  notes?: string | null;
}

export class FakeRepo implements Repo {
  jobs = new Map<string, FakeJob>();
  contacts = new Map<string, FakeContact>();
  links = new Map<string, string[]>(); // jobId -> contactIds
  followUps = new Map<string, FollowUpRow & { sentAt?: Date | null; sentMessageId?: string | null; lastError?: string | null }>();
  engagements: FakeEngagement[] = [];
  accounts = new Map<string, MailAccount>();
  telegram = new Map<string, TelegramLink>();
  events: { id: string; from: FollowUpState | null; to: FollowUpState; actor: string; detail: Record<string, unknown> }[] = [];
  nurtured: string[] = [];
  heartbeats = new Map<string, Date>();
  facts: string[] = [];
  now: () => Date = () => new Date();

  addJob(j: Partial<FakeJob> & { userId: string }): FakeJob {
    const job: FakeJob = { id: uuid(), position: "AI Engineer", company: "Acme", status: "Applied", dateApplied: null, mailAccountId: null, ...j };
    this.jobs.set(job.id, job);
    return job;
  }
  addContact(c: Partial<FakeContact> & { userId: string }): FakeContact {
    const contact: FakeContact = { id: uuid(), name: "Sara Khan", email: "sara@acme.com", linkedinUrl: null, timeZone: "Europe/Berlin", stage: "active", ...c };
    this.contacts.set(contact.id, contact);
    return contact;
  }
  link(jobId: string, contactId: string) {
    this.links.set(jobId, [...(this.links.get(jobId) ?? []), contactId]);
  }
  addAccount(a: Partial<MailAccount> & { userId: string }): MailAccount {
    const acct: MailAccount = {
      id: uuid(), provider: "gmail", address: "me@gmail.com", syncCursor: "1", subscriptionId: null,
      watchExpiresAt: null, status: "active", dailySendCap: 15, ...a,
    };
    this.accounts.set(acct.id, acct);
    return acct;
  }
  seedFollowUp(f: Partial<FollowUpRow> & { userId: string; jobId: string; contactId: string; state: FollowUpState }) {
    const row: FollowUpRow = {
      id: uuid(), kind: "chaser", attemptNo: 1, channel: "email", dueAt: this.now(), sendAt: null,
      draftSubject: "Following up", draftBody: "Hi Sara, ...", draftVersion: 1, editNotes: [], mailAccountId: null,
      telegramMessageId: null, retryCount: 0, lockedUntil: null, createdAt: new Date(this.now().getTime() - 86_400_000), ...f,
    };
    this.followUps.set(row.id, row);
    return row;
  }

  async heartbeat(name: string) { this.heartbeats.set(name, this.now()); }
  async activeMailAccounts() { return [...this.accounts.values()].filter((a) => a.status === "active"); }
  async mailAccount(id: string) { return this.accounts.get(id) ?? null; }
  async mailAccountsForUser(userId: string) { return [...this.accounts.values()].filter((a) => a.userId === userId); }
  async mailAccountBySubscription(s: string) { return [...this.accounts.values()].find((a) => a.subscriptionId === s) ?? null; }
  async mailAccountByAddress(p: string, addr: string) {
    return [...this.accounts.values()].find((a) => a.provider === p && a.address === addr.toLowerCase()) ?? null;
  }
  async updateMailAccount(id: string, patch: Partial<MailAccount>) {
    this.accounts.set(id, { ...this.accounts.get(id)!, ...patch });
  }

  async planningCandidates(): Promise<PlanningCandidate[]> {
    const out: PlanningCandidate[] = [];
    for (const job of this.jobs.values()) {
      for (const cid of this.links.get(job.id) ?? []) {
        const c = this.contacts.get(cid)!;
        out.push({
          userId: job.userId,
          jobId: job.id,
          contactId: cid,
          job: {
            status: job.status, dateApplied: job.dateApplied, appliedVia: "email", doNotFollowup: false,
            followupsPaused: false, responsePromisedBy: null, mailAccountId: job.mailAccountId,
          },
          contact: { relationshipStage: c.stage, timeZone: c.timeZone, country: null, hasEmail: !!c.email, hasLinkedIn: !!c.linkedinUrl },
          touchpoints: this.engagements.filter((e) => e.contactId === cid).map((e) => ({
            at: e.date.toISOString(), direction: e.direction, kind: e.kind, channel: e.type,
          })),
          followUps: [...this.followUps.values()].filter((f) => f.jobId === job.id && f.contactId === cid).map((f) => ({
            kind: f.kind, attemptNo: f.attemptNo, state: f.state, dueAt: f.dueAt.toISOString(), sentAt: f.sentAt?.toISOString() ?? null,
          })),
        });
      }
    }
    return out;
  }

  async insertPlanned(p: { userId: string; jobId: string; contactId: string; kind: string; attemptNo: number; channel: string; dueAt: Date; mailAccountId: string | null }) {
    const dup = [...this.followUps.values()].some((f) =>
      f.jobId === p.jobId && f.contactId === p.contactId && f.kind === p.kind && f.attemptNo === p.attemptNo
    );
    if (dup) return false;
    const row = this.seedFollowUp({
      userId: p.userId, jobId: p.jobId, contactId: p.contactId, state: "planned", kind: p.kind as FollowUpRow["kind"],
      attemptNo: p.attemptNo, channel: p.channel as "email", dueAt: p.dueAt, draftSubject: null, draftBody: null,
      draftVersion: 0, mailAccountId: p.mailAccountId, createdAt: this.now(),
    });
    this.events.push({ id: row.id, from: null, to: "planned", actor: "system", detail: {} });
    return true;
  }
  async moveToNurture(p: { contactId: string }) {
    const c = this.contacts.get(p.contactId)!;
    if (c.stage === "active") {
      c.stage = "nurture";
      this.nurtured.push(p.contactId);
    }
  }

  async claim(from: FollowUpState, to: FollowUpState, dueBefore: Date, limit: number) {
    const rows = [...this.followUps.values()]
      .filter((f) => f.state === from && (f.sendAt ?? f.dueAt) <= dueBefore && (!f.lockedUntil || f.lockedUntil < this.now()))
      .slice(0, limit);
    return rows.map((r) => this.apply(r, to, "system", {}, { locked_until: new Date(this.now().getTime() + 300_000).toISOString() }));
  }

  async followUp(id: string) {
    const f = this.followUps.get(id);
    return f ? { ...f } : null;
  }

  async view(id: string): Promise<FollowUpView | null> {
    const f = this.followUps.get(id);
    if (!f) return null;
    const job = this.jobs.get(f.jobId)!;
    const c = this.contacts.get(f.contactId)!;
    const mail = this.engagements.filter((e) => e.contactId === f.contactId && e.threadId).at(-1);
    return {
      ...f,
      job: { position: job.position, company: job.company, dateApplied: job.dateApplied, description: null, mailAccountId: job.mailAccountId },
      contact: { name: c.name, email: c.email, linkedinUrl: c.linkedinUrl, position: "Recruiter", timeZone: c.timeZone, country: null },
      user: { name: "Zeeshan", facts: this.facts, signature: "Zeeshan", timeZone: "Asia/Karachi" },
      replyTarget: mail ? { threadId: mail.threadId!, providerMessageId: mail.messageId ?? null, rfc822MessageId: null, subject: "Application" } : null,
      previousValuePoints: [],
    };
  }

  private apply(
    f: FollowUpRow & { sentAt?: Date | null },
    to: FollowUpState | null,
    actor: string,
    detail: Record<string, unknown>,
    patch: Record<string, unknown>,
  ) {
    if (to && to !== f.state && !canTransition(f.state, to)) throw new Error(`illegal transition ${f.state} -> ${to}`);
    const next = { ...f } as FollowUpRow & { sentAt?: Date | null; sentMessageId?: string | null; lastError?: string | null };
    if (to) next.state = to;
    if ("draft_subject" in patch) next.draftSubject = patch.draft_subject as string;
    if ("draft_body" in patch) {
      next.draftBody = patch.draft_body as string;
      if (to === "awaiting_approval") next.draftVersion++;
    }
    if ("edit_note" in patch) next.editNotes = [...next.editNotes, patch.edit_note as string];
    if ("due_date" in patch) next.dueAt = new Date(patch.due_date as string);
    if ("send_at" in patch) next.sendAt = new Date(patch.send_at as string);
    if ("mail_account_id" in patch) next.mailAccountId = patch.mail_account_id as string;
    if ("telegram_message_id" in patch) next.telegramMessageId = patch.telegram_message_id as number;
    if ("retry_count" in patch) next.retryCount = patch.retry_count as number;
    if ("last_error" in patch) next.lastError = patch.last_error as string | null;
    if ("sent_message_id" in patch) next.sentMessageId = patch.sent_message_id as string;
    if (to === "sent") next.sentAt = this.now();
    if ("locked_until" in patch) next.lockedUntil = new Date(patch.locked_until as string);
    else if (to && to !== "sending") next.lockedUntil = null;
    this.followUps.set(f.id, next);
    if (to && to !== f.state) this.events.push({ id: f.id, from: f.state, to, actor, detail });
    return { ...next };
  }

  async transition(id: string, userId: string | null, t: Transition) {
    const f = this.followUps.get(id);
    if (!f || (userId && f.userId !== userId)) throw new Error(`follow-up ${id} not found`);
    if (t.expect && !t.expect.includes(f.state)) throw new ConflictError(`conflict: follow-up is ${f.state}`);
    return this.apply(f, t.to, t.actor, t.detail ?? {}, t.patch ?? {});
  }

  async stuck(state: "sending" | "drafting", now: Date) {
    return [...this.followUps.values()].filter((f) => f.state === state && f.lockedUntil && f.lockedUntil < now);
  }
  async awaitingApproval(userId: string) {
    return [...this.followUps.values()].filter((f) => f.userId === userId && f.state === "awaiting_approval");
  }

  async matchInbound(userId: string, from: string, threadId: string) {
    const byThread = this.engagements.find((e) => e.userId === userId && e.threadId === threadId);
    const contact = byThread
      ? this.contacts.get(byThread.contactId)
      : [...this.contacts.values()].find((c) => c.userId === userId && c.email?.toLowerCase() === from);
    if (!contact) return null;
    const jobIds = [...this.links.entries()].filter(([, cs]) => cs.includes(contact.id)).map(([j]) => j);
    return { userId, contactId: contact.id, jobIds };
  }
  async recordEngagement(e: Parameters<Repo["recordEngagement"]>[0]) {
    if (e.messageId && this.engagements.some((x) => x.provider === e.provider && x.messageId === e.messageId)) return false;
    this.engagements.push({ ...e, provider: e.provider ?? null });
    return true;
  }
  async inboundSince(contactId: string, since: Date) {
    return this.engagements.filter((e) => e.contactId === contactId && e.direction === "inbound" && e.date > since).length;
  }
  async openFollowUps(userId: string, contactId: string, jobIds: string[] | null) {
    return [...this.followUps.values()].filter((f) =>
      f.userId === userId && f.contactId === contactId && OPEN.includes(f.state) && (!jobIds || jobIds.includes(f.jobId))
    );
  }
  async sentToday(mailAccountId: string, now: Date) {
    return [...this.followUps.values()].filter((f) =>
      f.mailAccountId === mailAccountId && f.state === "sent" && f.sentAt && now.getTime() - f.sentAt.getTime() < 86_400_000
    ).length;
  }

  async telegramLink(userId: string) { return this.telegram.get(userId) ?? null; }
  async telegramLinkByChat(chatId: number) { return [...this.telegram.values()].find((l) => l.chatId === chatId) ?? null; }
  async allTelegramLinks() { return [...this.telegram.values()]; }
  async completeTelegramLink() { return null; }
  async setTelegramPendingEdit(userId: string, fu: string | null, msg: number | null) {
    const l = this.telegram.get(userId);
    if (l) this.telegram.set(userId, { ...l, pendingEditFollowUpId: fu, pendingEditPromptMessageId: msg });
  }
  async setDigestSent(userId: string, on: string) {
    const l = this.telegram.get(userId);
    if (l) this.telegram.set(userId, { ...l, lastDigestOn: on });
  }
}

export class FakeEmail implements EmailProvider {
  readonly provider = "gmail" as const;
  sent: OutgoingEmail[] = [];
  inbox: MailMessage[] = [];
  threadMessages: MailMessage[] = [];
  failWith: Error[] = [];
  sentIds = new Map<string, string>();

  async send(_a: MailAccount, email: OutgoingEmail): Promise<SentEmail> {
    const err = this.failWith.shift();
    if (err) throw err;
    this.sent.push(email);
    const id = `msg-${this.sent.length}`;
    this.sentIds.set(email.followUpId, id);
    return { messageId: id, threadId: email.replyTo?.threadId ?? `thr-${this.sent.length}`, rfc822MessageId: `<${id}@x>` };
  }
  async thread() { return this.threadMessages; }
  async inboundSince(_a: MailAccount, cursor: string | null) {
    const messages = this.inbox;
    this.inbox = [];
    return { messages, cursor: String(Number(cursor ?? 0) + 1) };
  }
  async findSent(_a: MailAccount, q: { followUpId: string }) { return this.sentIds.get(q.followUpId) ?? null; }
  async ensureSubscription() { return { expiresAt: null, subscriptionId: null }; }
}

export class FakeDrafter implements Drafter {
  calls: { ctx: DraftContext; fixes?: string[] }[] = [];
  queue: (Draft | Error)[] = [];

  async draft(ctx: DraftContext, fixes?: string[]): Promise<Draft> {
    this.calls.push({ ctx, fixes });
    const next = this.queue.shift();
    if (next instanceof Error) throw next;
    return next ?? goodDraft(ctx);
  }
}

export function goodDraft(ctx: DraftContext): Draft {
  const name = ctx.contact.firstName ?? "there";
  const words = Array(50).fill("detail").join(" ");
  return {
    subject: `Following up: ${ctx.job.position} application`,
    body: `Hi ${name}, following up on my application for the ${ctx.job.position} role at ${ctx.job.company}. ${words}. Best, Zeeshan`,
    valuePoint: ctx.you.facts[0] ?? "",
  };
}

export class FakeClassifier implements Classifier {
  label: ReplyLabel = "still_reviewing";
  async classify() { return this.label; }
}

export class FakeNotifier implements Notifier {
  cards: { chatId: number; card: ApprovalCard }[] = [];
  updates: { messageId: number; text: string }[] = [];
  texts: { chatId: number; html: string }[] = [];
  async sendCard(chatId: number, card: ApprovalCard) {
    this.cards.push({ chatId, card });
    return 1000 + this.cards.length;
  }
  async updateCard(_c: number, messageId: number, text: string) { this.updates.push({ messageId, text }); }
  async sendText(chatId: number, html: string) {
    this.texts.push({ chatId, html });
    return 2000 + this.texts.length;
  }
  async askForEdit() { return 3000; }
}

export function makeDeps(now: Date) {
  const repo = new FakeRepo();
  repo.now = () => now;
  const email = new FakeEmail();
  const drafter = new FakeDrafter();
  const classifier = new FakeClassifier();
  const notifier = new FakeNotifier();
  const deps: Deps = {
    repo,
    providers: { gmail: email },
    drafter,
    classifier,
    notifier,
    now: () => now,
    log: { info() {}, warn() {}, error() {} },
    appUrl: "https://jobos.dev",
  };
  return { deps, repo, email, drafter, classifier, notifier };
}
