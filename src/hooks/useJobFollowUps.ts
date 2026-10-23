import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  type AgentFollowUp,
  type ContactBranch,
  type MailAccountSummary,
  NEEDS_YOU,
  type TimelineContact,
  type TimelineEngagement,
  type TimelineItem,
} from "@/types/followup";

type ApiAction = "approve" | "redraft" | "snooze" | "skip" | "mark_sent" | "retry";

/** Call followups-api; surfaces the server's message without leaking anything else. */
export async function callFollowUpsApi(action: ApiAction | "telegram_link", payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("followups-api", { body: { action, ...payload } });
  if (error) {
    let message = "Something went wrong. Please try again.";
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) message = body.error;
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }
  return data as { ok?: boolean; state?: string; url?: string };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sortByTime = (a: TimelineItem, b: TimelineItem) => a.at.getTime() - b.at.getTime();

export function buildBranches(
  contacts: TimelineContact[],
  engagements: TimelineEngagement[],
  followUps: AgentFollowUp[],
): ContactBranch[] {
  return contacts.map((contact) => {
    const items: TimelineItem[] = [
      ...engagements
        .filter((e) => e.contact_id === contact.id)
        .map((e) => ({ type: "engagement" as const, at: new Date(e.date), engagement: e })),
      // Sent follow-ups already appear as outbound engagements; show the rest as intentions.
      ...followUps
        .filter((f) => f.contact_id === contact.id && f.state !== "sent")
        .map((f) => ({ type: "followup" as const, at: new Date(f.send_at ?? f.due_date), followUp: f })),
    ];
    return { contact, items: items.sort(sortByTime) };
  });
}

export function useJobFollowUps(jobId: string | undefined) {
  const [followUps, setFollowUps] = useState<AgentFollowUp[]>([]);
  const [engagements, setEngagements] = useState<TimelineEngagement[]>([]);
  const [contacts, setContacts] = useState<TimelineContact[]>([]);
  const [mailAccounts, setMailAccounts] = useState<MailAccountSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!jobId || !UUID_RE.test(jobId)) return; // only ever a real id goes into a filter string
    const links = await supabase
      .from("job_contacts" as never)
      .select("interaction_type, contact:contacts(id, name, first_name, last_name, email, linkedin_url, position, title)")
      .eq("job_id", jobId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const people: TimelineContact[] = ((links.data ?? []) as any[])
      .filter((l) => l.contact)
      .map((l) => ({
        id: l.contact.id,
        name: l.contact.name || [l.contact.first_name, l.contact.last_name].filter(Boolean).join(" ") || l.contact.email || "Contact",
        email: l.contact.email,
        linkedin_url: l.contact.linkedin_url,
        position: l.contact.position || l.contact.title,
        interaction_type: l.interaction_type,
      }));
    const contactIds = people.map((p) => p.id);

    const [fu, eng, accts] = await Promise.all([
      supabase.from("follow_ups" as never).select("*").eq("job_id", jobId).not("state", "is", null),
      contactIds.length
        ? supabase
          .from("engagements" as never)
          .select("id, contact_id, job_id, type, direction, kind, date, notes, subject, classification, provider")
          .in("contact_id", contactIds)
          .or(`job_id.eq.${jobId},job_id.is.null`)
          .order("date", { ascending: true })
        : Promise.resolve({ data: [] }),
      supabase.from("mail_accounts" as never).select("id, provider, address, status"),
    ]);

    setContacts(people);
    setFollowUps((fu.data ?? []) as unknown as AgentFollowUp[]);
    setEngagements((eng.data ?? []) as unknown as TimelineEngagement[]);
    setMailAccounts((accts.data ?? []) as unknown as MailAccountSummary[]);
    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    refresh();
    // Live: approving on Telegram updates the open modal within a second.
    const channel = supabase
      .channel(`followups-${jobId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "follow_ups", filter: `job_id=eq.${jobId}` }, () => refresh())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "engagements" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, refresh]);

  const branches = useMemo(() => buildBranches(contacts, engagements, followUps), [contacts, engagements, followUps]);

  const nextUp = useMemo(() => {
    const byDue = [...followUps].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    return byDue.find((f) => NEEDS_YOU.includes(f.state)) ??
      byDue.find((f) => ["planned", "drafting", "approved", "sending"].includes(f.state)) ??
      null;
  }, [followUps]);

  const waitingCount = followUps.filter((f) => NEEDS_YOU.includes(f.state)).length;

  return { loading, branches, followUps, contacts, nextUp, waitingCount, mailAccounts, refresh };
}
