import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCampaign } from "@/hooks/useCampaign";
import { useFollowUps } from "@/hooks/useFollowUps";
import { localToday, useContactActions } from "@/hooks/useContactActions";
import type { Contact } from "@/types/contact";
import { referralCandidates } from "@/utils/company-match";
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
        return buildDailyQueue({ jobs: queueJobs, agentFollowUps, contactActions, events }, localToday(), limit);
    }, [jobs, contacts, agentRows, byContact, events, limit]);

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
        const until = effectiveUntil(action, localToday(), snoozeDays);
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
        await Promise.all([fetchReminders(), refreshInteractions(), loadExtras()]);
    }, [fetchReminders, refreshInteractions, loadExtras]);

    return { queue, limit, setLimit, record, refresh };
}
