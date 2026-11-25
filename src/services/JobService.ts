import { supabase } from "@/integrations/supabase/client";

export interface ScannedJob {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string;
    description: string;
    skills: string[];
    isRemote: boolean;
    logo?: string;
    /** Semantic similarity as a percentage, or null when the job was not scored. Never invented. */
    matchScore: number | null;
    /** Best date we have: the employer's posting date, else when JobOS first saw the job. */
    foundDate: string;
    /** Which of the two foundDate is. Shown to the user so a first-seen date is never called "posted". */
    dateKind: 'posted' | 'first_seen';
    source: string;
    job_url?: string;
}

export const JobService = {
    /**
     * Real Job Discovery from Supabase (LinkedIn Scraper)
     */
    getDiscoveredJobs: async (keyword?: string, page: number = 0, pageSize: number = 20, config?: any): Promise<any[]> => {
        try {
            if (keyword) {
                // RAG: Use Semantic Search Edge Function
                const offset = page * pageSize;
                const { data, error } = await supabase.functions.invoke('search-jobs', {
                    body: {
                        query: keyword,
                        offset,
                        limit: pageSize,
                        datePosted: config?.datePosted,
                        remote: config?.remote
                    }
                });

                if (error) throw error;
                // Semantic search returns slightly different object structure (flat), which matches our needs
                return data || [];
            }

            // If no keyword, just fetch latest (SQL fallback)
            const from = page * pageSize;
            const to = from + pageSize - 1;

            const { data, error } = await supabase
                .from('discovered_jobs' as any)
                .select('*')
                .order('posted_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error("Failed to fetch discovered jobs", e);
            return [];
        }
    },

    getJobDetails: async (id: string): Promise<any | null> => {
        try {
            const { data, error } = await supabase
                .from('discovered_jobs' as any)
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        } catch (e) {
            console.error("Failed to fetch job details", e);
            return null;
        }
    },

    /**
     * Trigger Perplexity AI Search (Requires Auth)
     */
    triggerPerplexitySearch: async (role: string): Promise<any> => {
        try {
            console.log(`Triggering Perplexity search for: ${role}`);
            const { data, error } = await supabase.functions.invoke('perplexity-search', {
                body: { role }
            });

            if (error) throw error;
            console.log("Perplexity search initiated:", data);
            return data;
        } catch (e) {
            console.error("Failed to trigger perplexity search", e);
            throw e;
        }
    }
};
