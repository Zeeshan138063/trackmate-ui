import { generateText } from 'ai';
import { getProvider, AIProviderId } from './ai-providers/registry';
import { MasterProfile } from '@/types/resume';

export const ResumeAIHelper = {

    tailorResume: async (jobDescription: string, masterProfile: MasterProfile): Promise<MasterProfile> => {
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
    }
};
