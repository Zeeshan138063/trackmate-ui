// Repo port over Supabase (service role). Every query is scoped explicitly;
// the service role bypasses RLS, so ownership checks live in the callers and RPCs.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  ConflictError,
  type FollowUpRow,
  type FollowUpView,
  type InboundMatch,
  type MailAccount,
  type MailProvider,
  type PlanningCandidate,
  type Repo,
  type ReplyTarget,
  type TelegramLink,
  type Transition,
} from "../ports.ts";
import type { FollowUpState } from "../state.ts";

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

const OPEN: FollowUpState[] = ["planned", "drafting", "awaiting_approval", "approved", "sending", "awaiting_manual_send", "failed"];
const ACTIVE_JOB = ["Applied", "Interviewing", "Negotiating"];
const FU_COLUMNS =
  "id,user_id,job_id,contact_id,kind,attempt_no,channel,state,due_date,send_at,draft_subject,draft_body,draft_version,edit_notes,mail_account_id,telegram_message_id,retry_count,locked_until,created_at,attach_resume";

const d = (v: string | null | undefined) => (v ? new Date(v) : null);

export function toFollowUp(r: Row): FollowUpRow {
  return {
    id: r.id,
    userId: r.user_id,
    jobId: r.job_id,
    contactId: r.contact_id,
    kind: r.kind,
    attemptNo: r.attempt_no,
    channel: r.channel,
    state: r.state,
    dueAt: new Date(r.due_date),
    sendAt: d(r.send_at),
    draftSubject: r.draft_subject,
    draftBody: r.draft_body,
    draftVersion: r.draft_version ?? 0,
    editNotes: r.edit_notes ?? [],
    mailAccountId: r.mail_account_id,
    telegramMessageId: r.telegram_message_id ? Number(r.telegram_message_id) : null,
    retryCount: r.retry_count ?? 0,
    lockedUntil: d(r.locked_until),
    createdAt: new Date(r.created_at),
    attachResume: !!r.attach_resume,
  };
}

function toAccount(r: Row): MailAccount {
  return {
    id: r.id,
    userId: r.user_id,
    provider: r.provider,
    address: r.address,
    syncCursor: r.sync_cursor,
    subscriptionId: r.subscription_id,
    watchExpiresAt: d(r.watch_expires_at),
    status: r.status,
    dailySendCap: r.daily_send_cap ?? 15,
  };
}

function check<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) {
    if (res.error.code === "40001" || /conflict:/.test(res.error.message)) throw new ConflictError(res.error.message);
    throw new Error(res.error.message);
  }
  return res.data;
}

function factsList(text: string | null | undefined): string[] {
  return (text ?? "").split("\n").map((l) => l.replace(/^[-*\s]+/, "").trim()).filter(Boolean).slice(0, 30);
}

function contactName(c: Row): string {
  return (c.name || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || "there").trim();
}

export class SupabaseRepo implements Repo {
  constructor(private db: SupabaseClient) {}

  async heartbeat(name: string) {
    check(await this.db.from("heartbeats").upsert({ name, last_seen_at: new Date().toISOString() }));
  }

  // ------------------------------------------------------------ accounts ----

  async activeMailAccounts() {
    return (check(await this.db.from("mail_accounts").select("*").eq("status", "active")) ?? []).map(toAccount);
  }
  async mailAccount(id: string) {
    const r = check(await this.db.from("mail_accounts").select("*").eq("id", id).maybeSingle());
    return r ? toAccount(r) : null;
  }
  async mailAccountsForUser(userId: string) {
    return (check(await this.db.from("mail_accounts").select("*").eq("user_id", userId)) ?? []).map(toAccount);
  }
  async mailAccountBySubscription(subscriptionId: string) {
    const r = check(await this.db.from("mail_accounts").select("*").eq("subscription_id", subscriptionId).maybeSingle());
    return r ? toAccount(r) : null;
  }
  async mailAccountByAddress(provider: MailProvider, address: string) {
    const rows = check(
      await this.db.from("mail_accounts").select("*").eq("provider", provider).eq("address", address.toLowerCase()).eq("status", "active"),
    ) ?? [];
    return rows.length ? toAccount(rows[0]) : null;
  }
  async updateMailAccount(id: string, patch: Partial<Pick<MailAccount, "syncCursor" | "subscriptionId" | "watchExpiresAt" | "status">>) {
    const row: Row = { updated_at: new Date().toISOString() };
    if ("syncCursor" in patch) row.sync_cursor = patch.syncCursor;
    if ("subscriptionId" in patch) row.subscription_id = patch.subscriptionId;
    if ("watchExpiresAt" in patch) row.watch_expires_at = patch.watchExpiresAt?.toISOString() ?? null;
    if ("status" in patch) row.status = patch.status;
    check(await this.db.from("mail_accounts").update(row).eq("id", id));
  }

  // ------------------------------------------------------------ planning ----

  async planningCandidates(): Promise<PlanningCandidate[]> {
    const rows = check(await this.db.rpc("follow_up_planning_candidates", { p_limit: 500 })) as Row[] ?? [];
    return rows.map((r) => ({
      userId: r.user_id,
      jobId: r.job_id,
      contactId: r.contact_id,
      job: {
        status: r.job.status,
        dateApplied: r.job.date_applied,
        appliedVia: r.job.applied_via,
        doNotFollowup: r.job.do_not_followup,
        followupsPaused: r.job.followups_paused,
        responsePromisedBy: r.job.response_promised_by,
        mailAccountId: r.job.mail_account_id,
        hasResume: !!r.job.has_resume,
      },
      contact: {
        relationshipStage: r.contact.relationship_stage,
        timeZone: r.contact.timezone,
        country: r.contact.country,
        hasEmail: r.contact.has_email,
        hasLinkedIn: r.contact.has_linkedin,
      },
      touchpoints: r.touchpoints,
      followUps: (r.follow_ups as Row[]).map((f) => ({
        kind: f.kind,
        attemptNo: f.attempt_no,
        state: f.state,
        dueAt: f.due_at,
        sentAt: f.sent_at,
      })),
    }));
  }

  async insertPlanned(p: { userId: string; jobId: string; contactId: string; kind: string; attemptNo: number; channel: string; dueAt: Date; mailAccountId: string | null; attachResume: boolean }) {
    const res = await this.db.from("follow_ups").insert({
      user_id: p.userId,
      job_id: p.jobId,
      contact_id: p.contactId,
      type: "job_update",
      kind: p.kind,
      attempt_no: p.attemptNo,
      channel: p.channel,
      state: "planned",
      due_date: p.dueAt.toISOString(),
      mail_account_id: p.mailAccountId,
      attach_resume: p.attachResume,
    });
    if (res.error?.code === "23505") return false; // already planned: the idempotency key did its job
    check(res);
    return true;
  }

  async moveToNurture(p: { userId: string; contactId: string; nextTouchAt: Date; reason: string }) {
    const updated = check(
      await this.db.from("contacts")
        .update({ relationship_stage: "nurture", next_touch_at: p.nextTouchAt.toISOString() })
        .eq("id", p.contactId).eq("user_id", p.userId).eq("relationship_stage", "active")
        .select("id"),
    ) ?? [];
    if (!updated.length) return;
    // A plain reminder in the existing Reminders list; you decide what to send.
    check(await this.db.from("follow_ups").insert({
      user_id: p.userId,
      contact_id: p.contactId,
      due_date: p.nextTouchAt.toISOString(),
      type: "general_checkin",
      notes: "Keep in touch: share something useful, no ask.",
    }));
  }

  // ----------------------------------------------------------- follow-ups ----

  async claim(from: FollowUpState, to: FollowUpState, dueBefore: Date, limit: number) {
    const rows = check(await this.db.rpc("claim_follow_ups", {
      p_from_state: from,
      p_to_state: to,
      p_due_before: dueBefore.toISOString(),
      p_limit: limit,
    })) as Row[] ?? [];
    return rows.map(toFollowUp);
  }

  async followUp(id: string) {
    const r = check(await this.db.from("follow_ups").select(FU_COLUMNS).eq("id", id).not("state", "is", null).maybeSingle());
    return r ? toFollowUp(r) : null;
  }

  async view(id: string): Promise<FollowUpView | null> {
    const f = await this.followUp(id);
    if (!f) return null;

    const [job, contact, settings, profile, userSettings, lastMail, siblings, resume] = await Promise.all([
      this.db.from("jobs").select("position,company,date_applied,description,mail_account_id").eq("id", f.jobId).eq("user_id", f.userId).single(),
      this.db.from("contacts").select("*").eq("id", f.contactId).eq("user_id", f.userId).single(),
      this.db.from("followup_settings").select("facts,signature,timezone").eq("user_id", f.userId).maybeSingle(),
      this.db.from("profiles").select("full_name").eq("user_id", f.userId).maybeSingle(),
      this.db.from("user_settings").select("timezone").eq("user_id", f.userId).maybeSingle(),
      this.db.from("engagements")
        .select("provider,mail_account_id,thread_id,message_id,rfc822_message_id,subject,job_id")
        .eq("user_id", f.userId).eq("contact_id", f.contactId).not("thread_id", "is", null)
        .order("date", { ascending: false }).limit(5),
      this.db.from("follow_ups").select("id").eq("job_id", f.jobId).eq("contact_id", f.contactId).eq("state", "sent").neq("id", f.id),
      this.db.from("application_resumes").select("storage_path,file_name,mime_type,size_bytes")
        .eq("job_id", f.jobId).eq("user_id", f.userId).eq("is_attached", true).maybeSingle(),
    ]);
    const r = resume.error ? null : resume.data as Row | null;
    const j = check(job) as Row | null;
    const c = check(contact) as Row | null;
    if (!j || !c) return null; // job or contact deleted since planning
    const s = check(settings) as Row | null;
    const tz = c.timezone || s?.timezone || check(userSettings)?.timezone || "UTC";

    // Reply in the most recent thread with this person, preferring this application's thread.
    const mails = check(lastMail) ?? [];
    const mail = mails.find((m: Row) => m.job_id === f.jobId) ?? mails[0];
    const replyTarget: ReplyTarget | null = mail
      ? { threadId: mail.thread_id, providerMessageId: mail.message_id, rfc822MessageId: mail.rfc822_message_id, subject: mail.subject }
      : null;

    let previousValuePoints: string[] = [];
    const siblingIds = (check(siblings) ?? []).map((r: Row) => r.id);
    if (siblingIds.length) {
      const ev = check(
        await this.db.from("follow_up_events").select("detail").in("follow_up_id", siblingIds).eq("to_state", "awaiting_approval"),
      ) ?? [];
      previousValuePoints = ev.map((e: Row) => e.detail?.value_point).filter(Boolean);
    }

    return {
      ...f,
      mailAccountId: f.mailAccountId ?? mail?.mail_account_id ?? null,
      job: {
        position: j.position,
        company: j.company,
        dateApplied: j.date_applied,
        description: j.description,
        mailAccountId: j.mail_account_id,
      },
      contact: {
        name: contactName(c),
        email: c.email || null,
        linkedinUrl: c.linkedin_url || null,
        position: c.position || c.title || null,
        timeZone: tz,
        country: c.country || null,
      },
      user: {
        name: check(profile)?.full_name ?? null,
        facts: factsList(s?.facts),
        signature: s?.signature ?? "",
        timeZone: s?.timezone || check(userSettings)?.timezone || "UTC",
      },
      replyTarget,
      previousValuePoints,
      resume: r ? { storagePath: r.storage_path, fileName: r.file_name, mimeType: r.mime_type, sizeBytes: r.size_bytes } : null,
    };
  }

  async transition(id: string, userId: string | null, t: Transition) {
    const row = check(await this.db.rpc("follow_up_transition", {
      p_id: id,
      p_user_id: userId,
      p_to: t.to,
      p_actor: t.actor,
      p_expect: t.expect ?? null,
      p_patch: t.patch ?? {},
      p_detail: t.detail ?? {},
    })) as Row;
    return toFollowUp(row);
  }

  async stuck(state: "sending" | "drafting", now: Date) {
    const iso = now.toISOString();
    const stale = new Date(now.getTime() - 10 * 60_000).toISOString();
    const rows = check(
      await this.db.from("follow_ups").select(FU_COLUMNS).eq("state", state)
        .or(`locked_until.lt.${iso},and(locked_until.is.null,updated_at.lt.${stale})`).limit(20),
    ) ?? [];
    return rows.map(toFollowUp);
  }

  async awaitingApproval(userId: string) {
    const rows = check(
      await this.db.from("follow_ups").select(FU_COLUMNS).eq("user_id", userId).eq("state", "awaiting_approval").order("due_date"),
    ) ?? [];
    return rows.map(toFollowUp);
  }

  // -------------------------------------------------------------- inbound ----

  async matchInbound(userId: string, fromAddress: string, threadId: string): Promise<InboundMatch | null> {
    const byThread = check(
      await this.db.from("engagements").select("contact_id,job_id").eq("user_id", userId).eq("thread_id", threadId).limit(1),
    ) ?? [];
    let contactId: string | null = byThread[0]?.contact_id ?? null;
    let jobIds: string[] = byThread[0]?.job_id ? [byThread[0].job_id] : [];

    if (!contactId) {
      const byEmail = check(
        await this.db.from("contacts").select("id").eq("user_id", userId).ilike("email", fromAddress.replace(/[%_]/g, "\\$&")).limit(1),
      ) ?? [];
      contactId = byEmail[0]?.id ?? null;
    }
    if (!contactId) return null;

    if (!jobIds.length) {
      const links = check(
        await this.db.from("job_contacts").select("job_id, jobs!inner(status,user_id)").eq("contact_id", contactId)
          .eq("jobs.user_id", userId).in("jobs.status", ACTIVE_JOB),
      ) ?? [];
      jobIds = links.map((l: Row) => l.job_id);
    }
    return { userId, contactId, jobIds };
  }

  async recordEngagement(e: Parameters<Repo["recordEngagement"]>[0]) {
    const res = await this.db.from("engagements").insert({
      user_id: e.userId,
      contact_id: e.contactId,
      job_id: e.jobId,
      type: e.type,
      direction: e.direction,
      kind: e.kind,
      date: e.date.toISOString(),
      notes: e.notes,
      provider: e.provider ?? null,
      mail_account_id: e.mailAccountId ?? null,
      thread_id: e.threadId ?? null,
      message_id: e.messageId ?? null,
      rfc822_message_id: e.rfc822MessageId ?? null,
      subject: e.subject ?? null,
      classification: e.classification ?? null,
      attachment_name: e.attachmentName ?? null,
    });
    if (res.error?.code === "23505") return false;
    check(res);
    return true;
  }

  async inboundSince(contactId: string, since: Date) {
    const res = await this.db.from("engagements").select("id", { count: "exact", head: true })
      .eq("contact_id", contactId).eq("direction", "inbound").gt("date", since.toISOString());
    check(res);
    return res.count ?? 0;
  }

  async openFollowUps(userId: string, contactId: string, jobIds: string[] | null) {
    let q = this.db.from("follow_ups").select(FU_COLUMNS).eq("user_id", userId).eq("contact_id", contactId).in("state", OPEN);
    if (jobIds) q = q.in("job_id", jobIds);
    return (check(await q) ?? []).map(toFollowUp);
  }

  async sentToday(mailAccountId: string, now: Date) {
    const res = await this.db.from("follow_ups").select("id", { count: "exact", head: true })
      .eq("mail_account_id", mailAccountId).eq("state", "sent")
      .gte("sent_at", new Date(now.getTime() - 86_400_000).toISOString());
    check(res);
    return res.count ?? 0;
  }

  // ------------------------------------------------------------- telegram ----

  private async toLink(r: Row | null): Promise<TelegramLink | null> {
    if (!r?.chat_id) return null;
    const [s, us] = await Promise.all([
      this.db.from("followup_settings").select("timezone").eq("user_id", r.user_id).maybeSingle(),
      this.db.from("user_settings").select("timezone").eq("user_id", r.user_id).maybeSingle(),
    ]);
    return {
      userId: r.user_id,
      chatId: Number(r.chat_id),
      quietStart: r.quiet_start,
      quietEnd: r.quiet_end,
      timeZone: check(s)?.timezone || check(us)?.timezone || "UTC",
      lastDigestOn: r.last_digest_on,
      pendingEditFollowUpId: r.pending_edit_follow_up_id,
      pendingEditPromptMessageId: r.pending_edit_prompt_message_id ? Number(r.pending_edit_prompt_message_id) : null,
    };
  }

  async telegramLink(userId: string) {
    return await this.toLink(check(await this.db.from("telegram_links").select("*").eq("user_id", userId).maybeSingle()));
  }
  async telegramLinkByChat(chatId: number) {
    return await this.toLink(check(await this.db.from("telegram_links").select("*").eq("chat_id", chatId).maybeSingle()));
  }
  async allTelegramLinks() {
    const rows = check(await this.db.from("telegram_links").select("*").not("chat_id", "is", null)) ?? [];
    return (await Promise.all(rows.map((r: Row) => this.toLink(r)))).filter(Boolean) as TelegramLink[];
  }
  async completeTelegramLink(code: string, chatId: number) {
    const res = await this.db.from("telegram_links")
      .update({ chat_id: chatId, linked_at: new Date().toISOString(), link_code: null, link_code_expires_at: null })
      .eq("link_code", code).gt("link_code_expires_at", new Date().toISOString())
      .select("user_id").maybeSingle();
    if (res.error) return null; // e.g. this chat is already linked to another account
    return res.data?.user_id ?? null;
  }
  async setTelegramPendingEdit(userId: string, followUpId: string | null, promptMessageId: number | null) {
    check(await this.db.from("telegram_links")
      .update({ pending_edit_follow_up_id: followUpId, pending_edit_prompt_message_id: promptMessageId })
      .eq("user_id", userId));
  }
  async setDigestSent(userId: string, onDate: string) {
    check(await this.db.from("telegram_links").update({ last_digest_on: onDate }).eq("user_id", userId));
  }
}
