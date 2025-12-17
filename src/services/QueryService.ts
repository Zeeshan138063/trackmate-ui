import { supabase } from "@/integrations/supabase/client";

export interface JobSearchQuery {
    id: string;
    user_id: string;
    keyword: string;
    filters: Record<string, any>;
    is_active: boolean;
    last_run_at: string | null;
    created_at: string;
}

export const QueryService = {
    async getQueries() {
        // @ts-ignore
        const { data, error } = await supabase
            .from('job_search_queries' as any)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as JobSearchQuery[];
    },

    async addQuery(keyword: string, filters: Record<string, any> = {}) {
        const { data, error } = await supabase
            .from('job_search_queries' as any)
            .insert([{ keyword, filters, is_active: true }])
            .select()
            .single();

        if (error) throw error;
        return data as JobSearchQuery;
    },

    async deleteQuery(id: string) {
        const { error } = await supabase
            .from('job_search_queries' as any)
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async toggleQuery(id: string, isActive: boolean) {
        const { data, error } = await supabase
            .from('job_search_queries' as any)
            .update({ is_active: isActive })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as JobSearchQuery;
    }
};
