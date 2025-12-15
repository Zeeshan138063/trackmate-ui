export interface MockJobTemplate {
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string;
    description: string;
    skills: string[];
    isRemote: boolean;
    logo?: string;
}

export const JOB_TEMPLATES: MockJobTemplate[] = [
    {
        title: "Senior Software Engineer",
        company: "TechFlow Systems",
        location: "San Francisco, CA",
        type: "Full-time",
        salary: "$160k - $210k",
        description: "We are looking for a Senior Engineer to lead our core platform team...",
        skills: ["React", "TypeScript", "Node.js", "AWS"],
        isRemote: true
    },
    {
        title: "Product Manager",
        company: "GrowthRocket",
        location: "New York, NY",
        type: "Full-time",
        salary: "$140k - $180k",
        description: "Drive product strategy for our new B2B SaaS vertical...",
        skills: ["Product Strategy", "Agile", "Jira", "Analytics"],
        isRemote: false
    },
    {
        title: "Frontend Developer",
        company: "Creative Digital",
        location: "Austin, TX",
        type: "Contract",
        salary: "$90/hr",
        description: "Join our agency to build award-winning web experiences...",
        skills: ["Vue.js", "CSS", "Animation", "Figma"],
        isRemote: true
    },
    {
        title: "Backend Engineer",
        company: "CloudScale",
        location: "Seattle, WA",
        type: "Full-time",
        salary: "$170k - $220k",
        description: "Scale our distributed systems to handle millions of requests...",
        skills: ["Go", "Kubernetes", "Microservices", "PostgreSQL"],
        isRemote: true
    },
    {
        title: "UX Researcher",
        company: "UserFirst",
        location: "Chicago, IL",
        type: "Full-time",
        salary: "$110k - $150k",
        description: "Conduct user research to inform our product design decisions...",
        skills: ["User Research", "Usability Testing", "Figma", "Problem Solving"],
        isRemote: true
    },
    {
        title: "Full Stack Developer",
        company: "StartUp Inc",
        location: "Remote",
        type: "Full-time",
        salary: "$130k - $170k",
        description: "Wear many hats and build features from DB to UI...",
        skills: ["React", "Python", "Django", "PostgreSQL"],
        isRemote: true
    }
];

export const COMPANIES = [
    "NexTech", "Global Solutions", "Innovate Labs", "DataDriven", "SmartSoft", "Future AI", "WebWorks"
];
