import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Contact } from "@/types/contact";
import type { FollowUp } from "@/types/engagement";
import {
    type ContactForAction,
    type InteractionForAction,
    type NextAction,
    nextAction,
    type ReminderForAction,
    suggestedStage,
    type WarmthStage,
} from "@/utils/contact-next-action";

/** The calendar date where the user is, as YYYY-MM-DD. */
export function localToday(): string {
    return new Date().toLocaleDateString("en-CA");
}

/**
 * Reads a contact row into what the engine needs. Rows loaded before the REQ-003 migration is
 * applied have none of the new columns: they read as Identified since they were created (AC-10).
 */
export function toActionContact(contact: Contact): ContactForAction {
    return {
        warmthStage: contact.warmth_stage ?? "identified",
        warmthStageChangedAt: contact.warmth_stage_changed_at ?? contact.created_at ?? new Date(0).toISOString(),
        doNotContact: contact.relationship_stage === "do_not_contact",
        snoozedUntil: contact.next_action_snoozed_until ?? null,
        nurtureNextTouchAt: contact.relationship_stage === "nurture" ? contact.next_touch_at ?? null : null,
    };
}

export interface ContactActionInfo {
    action: NextAction;
    suggested: WarmthStage | null;
}

type InteractionRow = InteractionForAction & { contact_id: string };

/**
 * Next action and suggested stage for every contact (REQ-003). Loads the interaction log once
 * (four columns) and computes the rest in memory with the pure engine.
 *
 * `reminders` are the user's pending manual reminders. Rows the follow-up agent owns
 * (`state` set) are not reminders and are ignored here: they have their own tab.
 */
export function useContactActions(contacts: Contact[], reminders: FollowUp[]) {
    const { user } = useAuth();
    const [interactions, setInteractions] = useState<InteractionRow[]>([]);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!user) return;
        const { data, error: queryError } = await supabase
            .from("engagements" as never)
            .select("contact_id, type, direction, date")
            .eq("user_id", user.id);
        if (queryError) {
            console.error("Error loading interactions:", queryError);
            setError(queryError.message);
            return;
        }
        setError(null);
        setInteractions((data ?? []) as unknown as InteractionRow[]);
    }, [user]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const byContact = useMemo(() => {
        const today = localToday();

        const interactionsBy = new Map<string, InteractionForAction[]>();
        for (const row of interactions) {
            const list = interactionsBy.get(row.contact_id) ?? [];
            list.push(row);
            interactionsBy.set(row.contact_id, list);
        }

        const remindersBy = new Map<string, ReminderForAction[]>();
        for (const r of reminders) {
            if ((r as FollowUp & { state?: string | null }).state) continue; // follow-up agent row
            const list = remindersBy.get(r.contact_id) ?? [];
            list.push({ id: r.id, dueDate: r.due_date, status: r.status, type: r.type, notes: r.notes });
            remindersBy.set(r.contact_id, list);
        }

        const result = new Map<string, ContactActionInfo>();
        for (const contact of contacts) {
            const forAction = toActionContact(contact);
            const history = interactionsBy.get(contact.id) ?? [];
            result.set(contact.id, {
                action: nextAction(forAction, history, remindersBy.get(contact.id) ?? [], today),
                suggested: suggestedStage(forAction, history),
            });
        }
        return result;
    }, [contacts, interactions, reminders]);

    return { byContact, refresh, error };
}
