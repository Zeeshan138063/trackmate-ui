export interface ResumeContact {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
}

export interface ResumeWorkExperience {
    id: string;
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate?: string; // Empty/undefined means "Present"
    current: boolean;
    description: string; // Bullet points as a single string or separated by newlines
}

export interface ResumeEducation {
    id: string;
    school: string;
    degree: string;
    field: string;
    location: string;
    startDate: string;
    endDate: string;
    gpa?: string;
}

export interface ResumeSkill {
    id: string;
    category: string; // e.g., "Languages", "Frameworks"
    items: string; // Comma separated items
}

export interface ResumeProject {
    id: string;
    name: string;
    role?: string;
    technologies: string;
    link?: string;
    description: string;
}

export interface ResumeCertification {
    id: string;
    name: string;
    issuer: string;
    date: string;
    link?: string;
}

export interface ResumeAward {
    id: string;
    title: string;
    issuer: string;
    date: string;
    description?: string;
}

export interface ResumeVolunteering {
    id: string;
    organization: string;
    role: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
}

export interface ResumePublication {
    id: string;
    title: string;
    publisher: string;
    date: string;
    link?: string;
}

export interface MasterProfile {
    contact: ResumeContact;
    targetTitle: string;
    summary: string;
    experience: ResumeWorkExperience[];
    education: ResumeEducation[];
    skills: ResumeSkill[];
    projects: ResumeProject[];
    certifications: ResumeCertification[];
    awards: ResumeAward[];
    volunteering: ResumeVolunteering[];
    publications: ResumePublication[];
    interests?: string; // Skills & Interests combined in one section conceptually, but can be separate in data
}

// Initial/Empty State for Master Profile
export const initialMasterProfile: MasterProfile = {
    contact: { firstName: "", lastName: "", email: "", phone: "", location: "" },
    targetTitle: "",
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    awards: [],
    volunteering: [],
    publications: [],
    interests: ""
};

export type ResumeTemplateId = 'ats' | 'europass' | 'modern' | 'hybrid' | 'tech_snapshot';

export interface ResumeConfig {
    templateId: ResumeTemplateId;
    showPhoto: boolean;
    showLocation: boolean;
    accentColor: string; // Hex code
    font: 'serif' | 'sans' | 'mono';
}

export const initialResumeConfig: ResumeConfig = {
    templateId: 'ats',
    showPhoto: false,
    showLocation: true,
    accentColor: '#000000',
    font: 'serif'
};
