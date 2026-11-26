import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCampaign } from "@/hooks/useCampaign";
import { useFollowUps } from "@/hooks/useFollowUps";
import { localToday, useContactActions } from "@/hooks/useContactActions";
import type { Contact } from "@/types/contact";
import { referralCandidates } from "@/utils/company-match";
import { addDays } from "@/utils/contact-next-action";
import { ageHours, FRESH_HOURS, freshHighFit, type FoundJob } from "@/utils/job-fit";
import type { Job } from "@/types/job";
import {
    buildDailyQueue,
    clampLimit,
    DEFAULT_LIMIT,
    effectiveUntil,
    type QueueAgentFollowUp,
    type QueueEvent,
    type QueueEventAction,
    type QueueItem,
} from "@/utils/daily-queue";

const LIMIT_KEY = "jobos_daily_queue_limit";

// Browser storage is a convenience here (DEC-006) and can be unavailable: never let it throw.
function readLimit(): number {
    try {
        return clampLimit(localStorage.getItem(LIMIT_KEY) ?? DEFAULT_LIMIT);
    } catch {
        return DEFAULT_LIMIT;
    }
}

/**
 * Today's queue for the signed-in user (REQ-004). Jobs and contacts come from the caller, which
 * has them loaded already; this hook adds reminders, the follow-up agent's items that wait on
 * the user, and the done / snoozed / skipped log.
 */
export function useDailyQueue(jobs: Job[], contacts: Contact[]) {
    const { user } = useAuth();
    const { followUps: reminders, fetchFollowUps: fetchReminders } = useFollowUps();
    const { byContact, refresh: refreshInteractions } = useContactActions(contacts, reminders);
    const [agentRows, setAgentRows] = useState<{ id: string; job_id: string; contact_id: string | null; state: string; due_date: string | null }[]>([]);
    const [events, setEvents] = useState<QueueEvent[]>([]);
    // The limit is the campaign's daily capacity once a campaign is saved (REQ-001). Until then
    // it is the number kept in this browser (DEC-006).
    const { campaign, saved: campaignSaved, save: saveCampaign } = useCampaign();
    const [localLimit, setLimitState] = useState<number>(readLimit);
    const limit = campaignSaved ? campaign.dailyCapacity : localLimit;

    const [found, setFound] = useState<FoundJob[]>([]);

    // REQ-008: postings from the last 48 hours, only once a campaign says what to look for.
    const loadFound = useCallback(async () => {
        if (!user || !campaignSaved || campaign.roleTitles.length === 0) {
            setFound([]);
            return;
        }
        const since = new Date(Date.now() - FRESH_HOURS * 3_600_000).toISOString();
        const { data, error } = await supabase
            .from("discovered_jobs" as never)
            .select("id, title, company, description, job_url, posted_at, first_seen_at")
            .or(`posted_at.gte.${since},and(posted_at.is.null,first_seen_at.gte.${since})`)
            .order("first_seen_at", { ascending: false })
            .limit(200);
        if (error) {
            // Before migration 20261126110000 there is no first_seen_at: no fresh items, the rest of the queue still works.
            console.error("Daily queue: new jobs not loaded:", error.message);
            setFound([]);
            return;
        }
        setFound(((data ?? []) as unknown as { id: string; title: string; company: string; description: string | null; job_url: string | null; posted_at: string | null; first_seen_at: string | null }[])
            .map((j) => ({ id: j.id, title: j.title, company: j.company, description: j.description, jobUrl: j.job_url, postedAt: j.posted_at, firstSeenAt: j.first_seen_at })));
    }, [user, campaignSaved, campaign.roleTitles]);

    useEffect(() => {
        loadFound();
    }, [loadFound]);

    const loadExtras = useCallback(async () => {
        if (!user) return;
        const today = localToday();
        const [agent, log] = await Promise.all([
            supabase
                .from("follow_ups" as never)
                .select("id, job_id, contact_id, state, due_date")
                .in("state", ["awaiting_approval", "awaiting_manual_send"]),
            supabase
                .from("daily_queue_events" as never)
                .select("item_key, action, effective_until")
                .gte("effective_until", today),
        ]);
        // Either read can fail on a database without the matching migration (AC-9). The queue
        // still shows what it can; writes report their own errors.
        if (agent.error) console.error("Daily queue: follow-ups not loaded:", agent.error.message);
        else setAgentRows((agent.data ?? []) as never);
        if (log.error) console.error("Daily queue: events not loaded:", log.error.message);
        else {
            setEvents(((log.data ?? []) as unknown as { item_key: string; action: QueueEventAction; effective_until: string }[])
                .map((e) => ({ itemKey: e.item_key, action: e.action, effectiveUntil: e.effective_until })));
        }
    }, [user]);

    useEffect(() => {
        fetchReminders();
        loadExtras();
    }, [fetchReminders, loadExtras]);

    const queue = useMemo(() => {
        const names = new Map(contacts.map((c) => [c.id, c.name]));
        const agentFollowUps: QueueAgentFollowUp[] = agentRows.map((r) => ({
            id: r.id,
            jobId: r.job_id,
            state: r.state,
            dueDate: r.due_date,
            contactName: r.contact_id ? names.get(r.contact_id) ?? null : null,
        }));
        const contactActions = contacts.flatMap((c) => {
            const info = byContact.get(c.id);
            return info ? [{ contactId: c.id, name: c.name, company: c.company, action: info.action }] : [];
        });
        // REQ-007: say who could refer the user, for applications not yet sent.
        const queueJobs = jobs.map((job) => ({
            ...job,
            referralName: job.status === "Bookmarked" || job.status === "Applying"
                ? referralCandidates(job.company, contacts)[0]?.name ?? null
                : null,
        }));
        const now = new Date();
        const freshJobs = freshHighFit(found, campaign, jobs, now).map((j) => ({
            id: j.id,
            title: j.title,
            company: j.company,
            jobUrl: j.jobUrl,
            ageHours: ageHours(j, now) ?? 0,
            datePosted: !!j.postedAt,
        }));
        return buildDailyQueue({ jobs: queueJobs, agentFollowUps, contactActions, events, freshJobs }, localToday(), limit);
    }, [jobs, contacts, agentRows, byContact, events, limit, found, campaign]);

    const setLimit = useCallback((value: number) => {
        const next = clampLimit(value);
        setLimitState(next);
        try {
            localStorage.setItem(LIMIT_KEY, String(next));
        } catch {
            // remembered for this visit only
        }
        if (campaignSaved) void saveCampaign({ ...campaign, dailyCapacity: next });
    }, [campaignSaved, campaign, saveCampaign]);

    /** Records what the user did with an item. Returns false, leaving the item in place, on failure (AC-8). */
    const record = useCallback(async (item: QueueItem, action: QueueEventAction, snoozeDays = 1): Promise<boolean> => {
        if (!user) return false;
        // A found job the user finished with or passed on stays away for the rest of its fresh window.
        const until = item.source === "found" && action !== "snoozed"
            ? addDays(localToday(), 3)
            : effectiveUntil(action, localToday(), snoozeDays);
        const { error } = await supabase
            .from("daily_queue_events" as never)
            .insert({ user_id: user.id, item_key: item.key, item_group: item.group, action, effective_until: until } as never);
        if (error) {
            console.error("Daily queue: event not saved:", error.message);
            return false;
        }
        setEvents((prev) => [...prev, { itemKey: item.key, action, effectiveUntil: until }]);
        return true;
    }, [user]);

    const refresh = useCallback(async () => {
        await Promise.all([fetchReminders(), refreshInteractions(), loadExtras(), loadFound()]);
    }, [fetchReminders, refreshInteractions, loadExtras, loadFound]);

    return { queue, limit, setLimit, record, refresh };
}
