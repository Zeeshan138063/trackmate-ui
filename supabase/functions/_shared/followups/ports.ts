// Ports: everything the follow-up services need from the outside world.
// Adapters live in ./adapters; tests use in-memory fakes.

import type { FollowUpKind } from "./cadence.ts";
import type { FollowUpState } from "./state.ts";

// ---------------------------------------------------------------- email ----

export type MailProvider = "gmail" | "outlook";

export interface MailAccount {
  id: string;
  userId: string;
  provider: MailProvider;
  address: string;
  syncCursor: string | null;
  subscriptionId: string | null;
  watchExpiresAt: Date | null;
  status: "active" | "reauth_required" | "disabled";
  dailySendCap: number;
}

export interface MailMessage {
  provider: MailProvider;
  messageId: string;
  threadId: string;
  rfc822MessageId: string | null;
  from: string; // bare lower-case address
  fromName: string | null;
  to: string[];
  subject: string;
  date: Date;
  snippet: string;
}

export interface ReplyTarget {
  threadId: string;
  providerMessageId: string | null; // Outlook needs the message to reply to
  rfc822MessageId: string | null; // Gmail threading headers
  subject: string | null;
}

export interface EmailAttachment {
  fileName: string;
  mimeType: string;
  content: Uint8Array;
}

export interface OutgoingEmail {
  to: string;
  subject: string;
  bodyText: string;
  followUpId: string;
  replyTo: ReplyTarget | null;
  attachment?: EmailAttachment | null;
}

export interface SentEmail {
  messageId: string;
  threadId: string;
  rfc822MessageId: string | null;
}

export class MailAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MailAuthError";
  }
}

export class TransientMailError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "TransientMailError";
  }
}

export interface EmailProvider {
  readonly provider: MailProvider;
  send(acct: MailAccount, email: OutgoingEmail): Promise<SentEmail>;
  thread(acct: MailAccount, threadId: string, limit: number): Promise<MailMessage[]>;
  /** New inbox messages since the cursor. A null cursor starts from now and returns nothing. */
  inboundSince(acct: MailAccount, cursor: string | null): Promise<{ messages: MailMessage[]; cursor: string }>;
  /** Crash recovery: was this follow-up already sent? Returns the provider message id if so. */
  findSent(acct: MailAccount, q: { followUpId: string; to: string; subject: string; since: Date }): Promise<string | null>;
  /** Create or renew push notifications; returns the new expiry (or null when push is not configured). */
  ensureSubscription(acct: MailAccount): Promise<{ expiresAt: Date | null; subscriptionId: string | null; cursor?: string }>;
}

/** Access tokens from stored refresh tokens. Rotated refresh tokens are written back. */
export interface TokenProvider {
  accessToken(acct: MailAccount): Promise<string>;
}

/** Private resume files (Supabase Storage, read with the service role, never via public URLs). */
export interface FileStore {
  download(storagePath: string): Promise<Uint8Array>;
}

// ------------------------------------------------------------- notifier ----

export interface ApprovalCard {
  followUpId: string;
  text: string; // HTML for Telegram
  channel: "email" | "linkedin";
}

export interface Notifier {
  sendCard(chatId: number, card: ApprovalCard): Promise<number>;
  updateCard(chatId: number, messageId: number, text: string): Promise<void>;
  sendText(chatId: number, html: string, buttons?: { text: string; url?: string; data?: string }[][]): Promise<number>;
  askForEdit(chatId: number, prompt: string): Promise<number>;
}

// -------------------------------------------------------------- drafter ----

export interface DraftContext {
  kind: FollowUpKind;
  attemptNo: number;
  channel: "email" | "linkedin";
  job: { position: string; company: string; appliedOn: string | null; jdSummary: string | null };
  contact: { name: string; firstName: string | null; role: string | null };
  you: { name: string | null; facts: string[]; signature: string };
  thread: { from: string; date: string; subject: string; text: string }[];
  previousValuePoints: string[];
  editNotes: string[];
  /** True only when the attached resume really goes out with this message. */
  hasAttachment: boolean;
}

export interface Draft {
  subject: string;
  body: string;
  valuePoint: string;
}

export interface Drafter {
  draft(ctx: DraftContext, fixes?: string[]): Promise<Draft>;
}

export type ReplyLabel =
  | "interview_invite"
  | "rejection"
  | "still_reviewing"
  | "question_for_you"
  | "auto_reply_ooo"
  | "other";

export interface Classifier {
  classify(email: { subject: string; text: string }): Promise<ReplyLabel>;
}

// ----------------------------------------------------------- repository ----

export interface FollowUpRow {
  id: string;
  userId: string;
  jobId: string;
  contactId: string;
  kind: FollowUpKind;
  attemptNo: number;
  channel: "email" | "linkedin";
  state: FollowUpState;
  dueAt: Date;
  sendAt: Date | null;
  draftSubject: string | null;
  draftBody: string | null;
  draftVersion: number;
  editNotes: string[];
  mailAccountId: string | null;
  telegramMessageId: number | null;
  retryCount: number;
  lockedUntil: Date | null;
  createdAt: Date;
  attachResume: boolean;
}

export interface FollowUpView extends FollowUpRow {
  job: { position: string; company: string; dateApplied: string | null; description: string | null; mailAccountId: string | null };
  contact: { name: string; email: string | null; linkedinUrl: string | null; position: string | null; timeZone: string; country: string | null };
  user: { name: string | null; facts: string[]; signature: string; timeZone: string };
  replyTarget: ReplyTarget | null;
  previousValuePoints: string[];
  /** The resume attached to this application, if any. */
  resume: { storagePath: string; fileName: string; mimeType: string; sizeBytes: number } | null;
}

export interface Transition {
  to: FollowUpState | null;
  actor: "system" | "telegram" | "web" | "agent";
  expect?: FollowUpState[];
  patch?: Record<string, unknown>;
  detail?: Record<string, unknown>;
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export interface PlanningCandidate {
  userId: string;
  jobId: string;
  contactId: string;
  job: {
    status: string;
    dateApplied: string | null;
    appliedVia: "job_board" | "email" | "linkedin" | null;
    doNotFollowup: boolean;
    followupsPaused: boolean;
    responsePromisedBy: string | null;
    mailAccountId: string | null;
    hasResume: boolean;
  };
  contact: {
    relationshipStage: "active" | "nurture" | "dormant" | "do_not_contact";
    timeZone: string;
    country: string | null;
    hasEmail: boolean;
    hasLinkedIn: boolean;
  };
  touchpoints: { at: string; direction: "inbound" | "outbound"; kind: string | null; channel: string }[];
  followUps: { kind: FollowUpKind; attemptNo: number; state: FollowUpState; dueAt: string; sentAt: string | null }[];
}

export interface InboundMatch {
  userId: string;
  contactId: string;
  jobIds: string[];
}

export interface TelegramLink {
  userId: string;
  chatId: number;
  quietStart: number;
  quietEnd: number;
  timeZone: string;
  lastDigestOn: string | null;
  pendingEditFollowUpId: string | null;
  pendingEditPromptMessageId: number | null;
}

export interface Repo {
  heartbeat(name: string): Promise<void>;

  activeMailAccounts(): Promise<MailAccount[]>;
  mailAccount(id: string): Promise<MailAccount | null>;
  mailAccountsForUser(userId: string): Promise<MailAccount[]>;
  mailAccountBySubscription(subscriptionId: string): Promise<MailAccount | null>;
  mailAccountByAddress(provider: MailProvider, address: string): Promise<MailAccount | null>;
  updateMailAccount(id: string, patch: Partial<Pick<MailAccount, "syncCursor" | "subscriptionId" | "watchExpiresAt" | "status">>): Promise<void>;

  planningCandidates(): Promise<PlanningCandidate[]>;
  insertPlanned(p: { userId: string; jobId: string; contactId: string; kind: string; attemptNo: number; channel: string; dueAt: Date; mailAccountId: string | null; attachResume: boolean }): Promise<boolean>;
  moveToNurture(p: { userId: string; contactId: string; nextTouchAt: Date; reason: string }): Promise<void>;

  claim(from: FollowUpState, to: FollowUpState, dueBefore: Date, limit: number): Promise<FollowUpRow[]>;
  view(id: string): Promise<FollowUpView | null>;
  followUp(id: string): Promise<FollowUpRow | null>;
  transition(id: string, userId: string | null, t: Transition): Promise<FollowUpRow>;
  stuck(state: "sending" | "drafting", now: Date): Promise<FollowUpRow[]>;
  awaitingApproval(userId: string): Promise<FollowUpRow[]>;

  matchInbound(accountUserId: string, fromAddress: string, threadId: string): Promise<InboundMatch | null>;
  recordEngagement(e: {
    userId: string; contactId: string; jobId: string | null; type: "email" | "linkedin"; direction: "inbound" | "outbound";
    kind: string; date: Date; notes: string | null; provider?: MailProvider | null; mailAccountId?: string | null;
    threadId?: string | null; messageId?: string | null; rfc822MessageId?: string | null; subject?: string | null;
    classification?: string | null; attachmentName?: string | null;
  }): Promise<boolean>;
  inboundSince(contactId: string, since: Date): Promise<number>;
  openFollowUps(userId: string, contactId: string, jobIds: string[] | null): Promise<FollowUpRow[]>;
  sentToday(mailAccountId: string, now: Date): Promise<number>;

  telegramLink(userId: string): Promise<TelegramLink | null>;
  telegramLinkByChat(chatId: number): Promise<TelegramLink | null>;
  allTelegramLinks(): Promise<TelegramLink[]>;
  completeTelegramLink(code: string, chatId: number): Promise<string | null>;
  setTelegramPendingEdit(userId: string, followUpId: string | null, promptMessageId: number | null): Promise<void>;
  setDigestSent(userId: string, onDate: string): Promise<void>;
}
