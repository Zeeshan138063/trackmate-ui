
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type DreamCompany = Database["public"]["Tables"]["dream_companies"]["Row"];
export type DreamCompanyInsert = Database["public"]["Tables"]["dream_companies"]["Insert"];
export type DreamCompanyUpdate = Database["public"]["Tables"]["dream_companies"]["Update"];

export type DreamCompanyReminder = Database["public"]["Tables"]["dream_company_reminders"]["Row"];
export type DreamCompanyReminderInsert = Database["public"]["Tables"]["dream_company_reminders"]["Insert"];
export type DreamCompanyReminderUpdate = Database["public"]["Tables"]["dream_company_reminders"]["Update"];

export const dreamCompaniesService = {
    async getAll() {
        const { data, error } = await supabase
            .from("dream_companies")
            .select("*")
            .order("updated_at", { ascending: false });

        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from("dream_companies")
            .select("*, contacts(*), dream_company_reminders(*)")
            .eq("id", id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(company: DreamCompanyInsert) {
        const { data, error } = await supabase
            .from("dream_companies")
            .insert(company)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: DreamCompanyUpdate) {
        const { data, error } = await supabase
            .from("dream_companies")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from("dream_companies")
            .delete()
            .eq("id", id);

        if (error) throw error;
    },

    // Reminders
    async getReminders(companyId: string) {
        const { data, error } = await supabase
            .from("dream_company_reminders")
            .select("*")
            .eq("dream_company_id", companyId)
            .order("due_date", { ascending: true });

        if (error) throw error;
        return data;
    },

    async createReminder(reminder: DreamCompanyReminderInsert) {
        const { data, error } = await supabase
            .from("dream_company_reminders")
            .insert(reminder)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateReminder(id: string, updates: DreamCompanyReminderUpdate) {
        const { data, error } = await supabase
            .from("dream_company_reminders")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteReminder(id: string) {
        const { error } = await supabase
            .from("dream_company_reminders")
            .delete()
            .eq("id", id);

        if (error) throw error;
    }
};
