import { MasterProfile } from "@/types/resume";
import { JOB_TEMPLATES, COMPANIES, MockJobTemplate } from "@/data/mock-jobs";
import { supabase } from "@/integrations/supabase/client";

export interface ScannedJob extends MockJobTemplate {
    id: string;
    matchScore: number;
    foundDate: string;
    source: 'LinkedIn' | 'Indeed' | 'Company Site';
    job_url?: string;
}

export const JobService = {
    /**
     * Simulates an intelligent background scan for jobs matching the profile
     */
    autoPopulateJobs: async (profile: MasterProfile, keyword?: string): Promise<ScannedJob[]> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const matches: ScannedJob[] = [];
        // Use provided keyword, or fallback to profile title
        const targetTitle = (keyword || profile.targetTitle || "").toLowerCase();
        // const userSkills = profile.skills.map(s => s.items.toLowerCase().split(',')).flat();

        // 1. Filter templates that loosely match the title or skills
        const relevantTemplates = JOB_TEMPLATES.filter(t => {
            const titleMatch = targetTitle ? t.title.toLowerCase().includes(targetTitle) || targetTitle.includes(t.title.toLowerCase()) : true;
            return titleMatch;
        });

        // 2. Generate variations
        const count = 5 + Math.floor(Math.random() * 5); // 5-10 jobs

        for (let i = 0; i < count; i++) {
            const template = relevantTemplates.length > 0
                ? relevantTemplates[Math.floor(Math.random() * relevantTemplates.length)]
                : JOB_TEMPLATES[Math.floor(Math.random() * JOB_TEMPLATES.length)];

            const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
            const matchScore = 70 + Math.floor(Math.random() * 25); // 70-95% match

            matches.push({
                ...template,
                id: `job-${Date.now()}-${i}`,
                company: `${company} ${Math.floor(Math.random() * 100)}`, // Randomize company name slightly
                matchScore,
                foundDate: new Date().toISOString(),
                source: Math.random() > 0.5 ? 'LinkedIn' : 'Indeed'
            });
        }

        return matches.sort((a, b) => b.matchScore - a.matchScore);
    },

    /**
     * Real Job Discovery from Supabase (LinkedIn Scraper)
     */
    getDiscoveredJobs: async (keyword?: string, page: number = 0, pageSize: number = 20): Promise<any[]> => {
        try {
            if (keyword) {
                // RAG: Use Semantic Search Edge Function
                const offset = page * pageSize;
                const { data, error } = await supabase.functions.invoke('search-jobs', {
                    body: { query: keyword, offset, limit: pageSize }
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
    }
};
