import { supabase } from "@/integrations/supabase/client";
import { Meeting, MeetingInsert, AvailabilityPreference, CalendarAccount, CalendarAccountInsert } from "@/types/meeting";

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

    static async updateAvailabilityPreference(userId: string, preferences: Partial<AvailabilityPreference>[]) {
        // This is a bit complex since we might want to bulk update/replace
        // Simplest for now: delete all for user and re-insert or upsert
        // Let's assume the UI sends the full list

        // For now, let's just implement a simple upsert if ID is present
        const { data, error } = await supabase
            .from("availability_preferences")
            .upsert(preferences.map(p => ({ ...p, user_id: userId })))
            .select();

        if (error) throw error;
        return data;
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
            .upsert(account, { onConflict: 'user_id, provider, account_email' })
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
        // This would involve calling Google/Outlook APIs with the stored tokens
        // For now, we return a mock or empty list until OAuth is implemented
        console.log("Syncing external events for user:", userId);
        return [];
    }
}
