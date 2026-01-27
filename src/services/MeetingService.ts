import { supabase } from "@/integrations/supabase/client";
import { Meeting, MeetingInsert, AvailabilityPreference, CalendarAccount, CalendarAccountInsert } from "@/types/meeting";
import { addDays, format, parse, isSameDay, isWithinInterval, addMinutes, parseISO } from "date-fns";

export class MeetingService {
    static async getMeetings(userId: string) {
        const { data, error } = await supabase
            .from("meetings")
            .select(`
        *,
        job:jobs(id, position, company),
        contact:contacts(id, name, email)
      `)
            .eq("user_id", userId)
            .order("scheduled_at", { ascending: true });

        if (error) throw error;
        return data;
    }

    static async createMeeting(meeting: MeetingInsert) {
        const { data, error } = await supabase
            .from("meetings")
            .insert(meeting)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async updateMeeting(id: string, updates: Partial<Meeting>) {
        const { data, error } = await supabase
            .from("meetings")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async deleteMeeting(id: string) {
        const { error } = await supabase
            .from("meetings")
            .delete()
            .eq("id", id);

        if (error) throw error;
    }

    // Availability Preferences
    static async getAvailabilityPreferences(userId: string) {
        const { data, error } = await supabase
            .from("availability_preferences")
            .select("*")
            .eq("user_id", userId)
            .order("day_of_week", { ascending: true })
            .order("start_time", { ascending: true });

        if (error) throw error;
        return data as AvailabilityPreference[];
    }

    static async bulkSyncAvailability(userId: string, changes: {
        toCreate: Partial<AvailabilityPreference>[],
        toUpdate: Partial<AvailabilityPreference>[],
        toDelete: string[]
    }) {
        const { toCreate, toUpdate, toDelete } = changes;
        console.log("Syncing Availability:", { created: toCreate.length, updated: toUpdate.length, deleted: toDelete.length });

        const promises = [];

        // 1. Deletes
        if (toDelete.length > 0) {
            promises.push(
                supabase
                    .from("availability_preferences")
                    .delete()
                    .in("id", toDelete)
                    .then(({ error }) => { if (error) throw error; })
            );
        }

        // 2. Updates
        // Supabase upsert is efficient for updates if we have IDs.
        if (toUpdate.length > 0) {
            // Ensure payload has user_id
            const payload = toUpdate.map(p => ({ ...p, user_id: userId }));
            promises.push(
                supabase
                    .from("availability_preferences")
                    .upsert(payload)
                    .select()
                    .then(({ error }) => { if (error) throw error; })
            );
        }

        // 3. Inserts
        if (toCreate.length > 0) {
            // Ensure payload has user_id and NO id (let server gen)
            const payload = toCreate.map(p => {
                const { id, ...rest } = p; // remove any temp id or undefined id
                return { ...rest, user_id: userId };
            });

            promises.push(
                supabase
                    .from("availability_preferences")
                    .insert(payload)
                    .select()
                    .then(({ error }) => { if (error) throw error; })
            );
        }

        try {
            await Promise.all(promises);
            return true;
        } catch (error) {
            console.error("Bulk Sync Error:", error);
            throw error;
        }
    }

    static async updateAvailabilityPreference(userId: string, preferences: Partial<AvailabilityPreference>[]) {
        console.warn("updateAvailabilityPreference is deprecated. Use bulkSyncAvailability.");
        return [];
    }

    // Suggest Slots Generation
    static async getSuggestedSlots(userId: string, daysIdx: number = 7) {
        // 1. Get Preferences
        const prefs = await this.getAvailabilityPreferences(userId);
        if (!prefs || prefs.length === 0) return [];

        // 2. Get Existing Meetings (to avoid conflicts)
        const meetings = await this.getMeetings(userId);

        // 3. Generate Candidate Slots for next N days
        const slots: string[] = [];
        const today = new Date();

        for (let i = 0; i < daysIdx; i++) {
            const date = addDays(today, i);
            const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday...

            // Find preferences for this day
            const dayPrefs = prefs.filter(p => p.day_of_week === dayOfWeek && p.is_active);

            dayPrefs.forEach(pref => {
                // Parse start/end times
                // pref.start_time is "HH:mm:ss"
                const startDateTime = parse(`${format(date, 'yyyy-MM-dd')} ${pref.start_time}`, 'yyyy-MM-dd HH:mm:ss', new Date());
                const endDateTime = parse(`${format(date, 'yyyy-MM-dd')} ${pref.end_time}`, 'yyyy-MM-dd HH:mm:ss', new Date());

                // Simple Logic: Create 1-hour slots? Or just show the full range?
                // The screenshot showed specific 1-hour blocks (e.g. 2:00 PM to 3:00 PM).
                // Let's generate 1-hour blocks within the prefered range.

                let slotStart = startDateTime;
                while (addMinutes(slotStart, 60) <= endDateTime) {
                    const slotEnd = addMinutes(slotStart, 60);

                    // Check Conflict with Meetings
                    const hasConflict = meetings?.some(m => {
                        const mStart = new Date(m.scheduled_at);
                        const mEnd = addMinutes(mStart, m.duration_minutes || 30);

                        // Check overlap
                        return (slotStart < mEnd && slotEnd > mStart);
                    });

                    if (!hasConflict) {
                        // Format: "Mon, Dec 29 - 2:00 PM to 3:00 PM"
                        const slotString = `${format(slotStart, 'EEE, MMM d')} - ${format(slotStart, 'h:mm a')} to ${format(slotEnd, 'h:mm a')}`;
                        slots.push(slotString);
                    }

                    slotStart = slotEnd;
                }
            });
        }

        return slots.slice(0, 50); // Return top 50 to ensure we cover multiple days
    }

    // Calendar Accounts
    static async getCalendarAccounts(userId: string) {
        const { data, error } = await supabase
            .from("calendar_accounts")
            .select("*")
            .eq("user_id", userId);

        if (error) throw error;
        return data as CalendarAccount[];
    }

    static async connectCalendarAccount(account: CalendarAccountInsert) {
        const { data, error } = await supabase
            .from("calendar_accounts")
            .upsert(account, { onConflict: 'user_id,provider,account_email' })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async updateCalendarSettings(accountId: string, settings: any) {
        const { data, error } = await supabase
            .from("calendar_accounts")
            .update({ settings })
            .eq("id", accountId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Placeholder for sync logic
    static async syncExternalEvents(userId: string) {
        console.log("Syncing external events for user:", userId);
        return [];
    }
}
