import { MasterProfile } from "@/types/resume";
import { JOB_TEMPLATES, COMPANIES, MockJobTemplate } from "@/data/mock-jobs";

export interface ScannedJob extends MockJobTemplate {
    id: string;
    matchScore: number;
    foundDate: string;
    source: 'LinkedIn' | 'Indeed' | 'Company Site';
}

export const JobService = {
    /**
     * Simulates an intelligent background scan for jobs matching the profile
     */
    autoPopulateJobs: async (profile: MasterProfile): Promise<ScannedJob[]> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const matches: ScannedJob[] = [];
        const targetTitle = profile.targetTitle?.toLowerCase() || "";
        const userSkills = profile.skills.map(s => s.items.toLowerCase().split(',')).flat();

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
    }
};
