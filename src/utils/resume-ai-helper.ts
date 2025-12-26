import { generateText } from 'ai';
import { getProvider, AIProviderId } from './ai-providers/registry';
import { MasterProfile } from '@/types/resume';

export const ResumeAIHelper = {

    tailorResume: async (jobDescription: string, masterProfile: MasterProfile, instructions?: string): Promise<MasterProfile> => {
        const providerId = (localStorage.getItem('AI_PROVIDER') as AIProviderId) || 'gemini';
        const model = getProvider(providerId);

        if (!model) {
            throw new Error(`Please configure your ${providerId} API Key in Settings first.`);
        }

        // Minify profile to save context window tokens
        const profileJson = JSON.stringify(masterProfile);

        const prompt = `
      You are an expert Resume Strategist and ATS Specialist.
      
      TASK:
      Tailor the provided "Master Profile" to perfectly match the "Job Description" (JD).
      
      GOALS:
      1.  **Relevance**: Select ONLY the most relevant Experience, Projects, and Skills.
      2.  **Keywords**: Rewrite the "Summary" and "Experience" bullet points to naturally incorporate keywords from the JD.
      3.  **Impact**: Ensure all bullet points are action-oriented and results-driven.
      
      INPUT DATA:
      
      [JOB DESCRIPTION]
      ${jobDescription.substring(0, 8000)}
      
      [MASTER PROFILE JSON]
      ${profileJson}

      ${instructions ? `[USER INSTRUCTIONS - CRITICAL]\n${instructions}\n` : ''}
      
      INSTRUCTIONS:
      -   **Summary**: Rewrite it to pitch the candidate for THIS specific role.
      -   **Experience**: Keep the same company/role structure, but you may reorder or rewrite the bullet points (description). Focus on what matters for this JD.
      -   **Skills**: Filter the list to prioritize skills mentioned in the JD.
      -   **Projects**: Select the top 3-5 projects from the Master Profile that demonstrate required skills.
          -   **STRICT REQUIREMENT**: You MUST use actual projects from the Master Profile. Do NOT invent, hallucinate, or create new projects from scratch.
          -   You may rephrase the description to highlight relevant technologies, but the project identity must remain the same.
      -   **CRITICAL FIELDS**: For every project, you MUST populate the "name", "technologies" AND "description" fields.
          -   "technologies": If not explicitly listed, infer reasonable technologies based on the project description and common stack usage.
          -   "description": Must be detailed, bulleted (concatenated as string), and explain *how* the technologies were used to solve a problem.
      -   **PLAIN TEXT ONLY**: Do NOT use markdown syntax (like **bold**, *italic*) within the JSON string values. The output must be pure plain text.
      -   Do NOT invent false facts. Only reframe existing experience.
      
      OUTPUT FORMAT:
      Return a valid JSON object matching the 'MasterProfile' structure EXACTLY.
      Do not wrap in markdown code blocks. Just the raw JSON string.
    `;

        try {
            const { text } = await generateText({
                model,
                prompt,
            });

            // Clean up potential markdown code blocks if the model ignores the instruction
            const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();

            const tailoredProfile = JSON.parse(jsonString) as MasterProfile;
            return tailoredProfile;

        } catch (error) {
            console.error("Resume Tailoring Error:", error);
            throw error;
        }
    },

    optimizeSection: async (sectionName: string, content: string, jobDescription: string): Promise<string> => {
        const providerId = (localStorage.getItem('AI_PROVIDER') as AIProviderId) || 'gemini';
        const model = getProvider(providerId);

        if (!model) throw new Error("AI Provider not configured");

        const prompt = `
       Optimize the following "${sectionName}" content for this Job Description.
       Make it concise, punchy, and keyword-rich.
       
       Job Description Snippet:
       ${jobDescription.substring(0, 1000)}...
       
       Content to Optimize:
       ${content}
       
       Output ONLY the optimized text.
     `;

        const { text } = await generateText({ model, prompt });
        return text;
    },

    parseResumeFromText: async (resumeText: string): Promise<MasterProfile> => {
        const providerId = (localStorage.getItem('AI_PROVIDER') as AIProviderId) || 'gemini';
        const model = getProvider(providerId);

        if (!model) {
            throw new Error(`Please configure your ${providerId} API Key in Settings first.`);
        }

        const prompt = `
      You are an expert Resume Parser.
      
      TASK:
      Extract structured data from the provided raw resume text and map it to the 'MasterProfile' JSON schema.
      
      INPUT TEXT:
      ${resumeText.substring(0, 15000)}
      
      INSTRUCTIONS:
      -   **Contact**: Extract name, email, phone, location, and links (LinkedIn, GitHub, etc.).
      -   **Summary**: specific professional summary or objective, if present.
      -   **Experience**: Extract all work experience. Infer "current" if no end date. split description into bullet points.
      -   **Education**: Extract school, degree, field/major, dates.
      -   **Skills**: Group skills into categories if possible, or put them all under "General".
      -   **Projects**: Extract any separate projects section. If none, leave empty array.
          -   **IMPORTANT**: For projects, try to identify the 'name', 'technologies', and 'description'.
      -   **Certifications/Awards/Volunteering/Publications**: Extract if present.
      
      OUTPUT FORMAT:
      Return a VALID JSON object matching the 'MasterProfile' interface structure EXACTLY.
      Do not wrap in markdown code blocks. Just the raw JSON string.
      
      MasterProfile Interface Reference:
      {
        contact: { firstName, lastName, email, phone, location, linkedin, github, portfolio },
        targetTitle: string,
        summary: string,
        experience: [{ company, position, location, startDate, endDate, current: boolean, description }],
        education: [{ school, degree, field, location, startDate, endDate }],
        skills: [{ category, items }], // items is comma separated string
        projects: [{ name, technologies, description, link }],
        certifications: [{ name, issuer, date }],
        awards: [{ title, issuer, date }],
        volunteering: [{ organization, role, startDate, endDate, current, description }],
        publications: [{ title, publisher, date, link }],
        interests: string
      }
    `;

        try {
            const { text } = await generateText({
                model,
                prompt,
            });

            // Clean up potential markdown
            const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsedProfile = JSON.parse(jsonString) as MasterProfile;
            return parsedProfile;

        } catch (error) {
            console.error("Resume Parsing Error:", error);
            throw error;
        }
    },

    tailorAndScoreResume: async (jobDescription: string, masterProfile: MasterProfile): Promise<{ tailoredProfile: MasterProfile, matchScore: number, explanation: string }> => {
        const providerId = (localStorage.getItem('AI_PROVIDER') as AIProviderId) || 'gemini';
        const model = getProvider(providerId);

        if (!model) {
            throw new Error(`Please configure your ${providerId} API Key in Settings first.`);
        }

        // Minify profile to save context window tokens
        const profileJson = JSON.stringify(masterProfile);

        const prompt = `
      You are an expert Resume Strategist and ATS Specialist.
      
      TASK:
      1. Tailor the provided "Master Profile" to perfectly match the "Job Description" (JD).
      2. Calculate a "Match Score" (0-100) based on how well the NEW tailored resume fits the JD.
      
      GOALS:
      1.  **Relevance**: Select ONLY the most relevant Experience, Projects, and Skills.
      2.  **Keywords**: Rewrite the "Summary" and "Experience" bullet points to naturally incorporate keywords from the JD.
      3.  **Impact**: Ensure all bullet points are action-oriented and results-driven.
      
      INPUT DATA:
      
      [JOB DESCRIPTION]
      ${jobDescription.substring(0, 8000)}
      
      [MASTER PROFILE JSON]
      ${profileJson}
      
      OUTPUT FORMAT:
      Return a valid JSON object with the following structure:
      {
        "tailoredProfile": { ...MasterProfile object properly tailored... },
        "matchScore": number, // 0-100 integer
        "explanation": string // Brief 1-sentence explanation of the score and what was improved.
      }
      
      Do not wrap in markdown code blocks. Just the raw JSON string.
    `;

        try {
            const { text } = await generateText({
                model,
                prompt,
            });

            // Clean up potential markdown code blocks if the model ignores the instruction
            const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();

            const result = JSON.parse(jsonString);
            return result;

        } catch (error) {
            console.error("Resume Tailoring & Scoring Error:", error);
            throw error;
        }
    }
};
