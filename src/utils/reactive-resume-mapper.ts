import { MasterProfile, ResumeWorkExperience, ResumeEducation, ResumeSkill, ResumeProject, ResumeCertification, ResumeAward, ResumeVolunteering, ResumePublication } from "@/types/resume";

export function mapReactiveResumeToMasterProfile(json: any): MasterProfile {
    const basics = json.basics || {};
    const summary = json.summary || {};
    const sections = json.sections || {};

    // Split name into first and last
    const fullNames = (basics.name || "").trim().split(/\s+/);
    const firstName = fullNames[0] || "";
    const lastName = fullNames.slice(1).join(" ") || "";

    // Map profiles (LinkedIn, GitHub, etc.)
    const profiles = sections.profiles?.items || [];
    const linkedin = profiles.find((p: any) => p.network?.toLowerCase().includes("linkedin"))?.website?.url || "";
    const github = profiles.find((p: any) => p.network?.toLowerCase().includes("github"))?.website?.url || "";
    const portfolio = profiles.find((p: any) =>
        p.network?.toLowerCase().includes("portfolio") ||
        p.network?.toLowerCase().includes("website")
    )?.website?.url || basics.website?.url || "";

    return {
        contact: {
            firstName,
            lastName,
            email: basics.email || "",
            phone: basics.phone || "",
            location: basics.location || "",
            linkedin,
            github,
            portfolio,
        },
        targetTitle: basics.headline || "",
        summary: summary.content || "",
        experience: (sections.experience?.items || []).map((item: any): ResumeWorkExperience => ({
            id: item.id || crypto.randomUUID(),
            company: item.company || "",
            position: item.position || "",
            location: item.location || "",
            startDate: item.period || "",
            endDate: "", // Reactive Resume often uses a single "period" string
            current: item.period?.toLowerCase().includes("present") || false,
            description: item.description || "",
        })),
        education: (sections.education?.items || []).map((item: any): ResumeEducation => ({
            id: item.id || crypto.randomUUID(),
            school: item.school || "",
            degree: item.degree || "",
            field: item.area || "",
            location: item.location || "",
            startDate: item.period || "",
            endDate: "",
        })),
        skills: (sections.skills?.items || []).map((item: any): ResumeSkill => ({
            id: item.id || crypto.randomUUID(),
            category: item.name || "General",
            items: item.keywords?.join(", ") || (item.proficiency ? `${item.name}: ${item.proficiency}` : item.name) || "",
        })),
        projects: (sections.projects?.items || []).map((item: any): ResumeProject => ({
            id: item.id || crypto.randomUUID(),
            name: item.name || "",
            description: item.description || "",
            technologies: "", // Reactive Resume doesn't have a separate tech field in schema usually
            link: item.website?.url || "",
        })),
        certifications: (sections.certifications?.items || []).map((item: any): ResumeCertification => ({
            id: item.id || crypto.randomUUID(),
            name: item.title || "",
            issuer: item.issuer || "",
            date: item.date || "",
        })),
        awards: (sections.awards?.items || []).map((item: any): ResumeAward => ({
            id: item.id || crypto.randomUUID(),
            title: item.title || "",
            issuer: item.awarder || "",
            date: item.date || "",
            description: item.description || "",
        })),
        volunteering: (sections.volunteer?.items || []).map((item: any): ResumeVolunteering => ({
            id: item.id || crypto.randomUUID(),
            organization: item.organization || "",
            role: item.role || "",
            startDate: item.period || "",
            current: item.period?.toLowerCase().includes("present") || false,
            description: item.description || "",
        })),
        publications: (sections.publications?.items || []).map((item: any): ResumePublication => ({
            id: item.id || crypto.randomUUID(),
            title: item.title || "",
            publisher: item.publisher || "",
            date: item.date || "",
            link: item.website?.url || "",
        })),
        interests: (sections.interests?.items || []).map((item: any) => item.name).join(", "),
    };
}
