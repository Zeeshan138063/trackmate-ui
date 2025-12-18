import { generateText } from 'ai';
import { getProvider, AIProviderId } from './ai-providers/registry';

export interface AIMatchResult {
    score: number;
    missingKeywords: string[];
    explanation: string;
}

export interface AICoverLetterResult {
    coverLetter: string;
}

export const AIHelper = {

    analyzeMatch: async (jobDescription: string, resumeContent: string): Promise<AIMatchResult> => {
        const providerId = (localStorage.getItem('AI_PROVIDER') as AIProviderId) || 'gemini';
        const model = getProvider(providerId);

        if (!model) {
            throw new Error(`Please configure your ${providerId} API Key in Settings first.`);
        }

        const prompt = `
      You are an expert ATS (Applicant Tracking System) optimizer.
      Analyze the following Job Description and Resume.
      
      Job Description:
      ${jobDescription.substring(0, 5000)}

      Resume Content (Summary/Skills/Exp):
      ${resumeContent.substring(0, 15000)}

      Output a JSON object ONLY with this structure (no markdown):
      {
        "score": number (0-100),
        "missingKeywords": ["string", "string", ...],
        "explanation": "string (brief explanation)"
      }
    `;

        try {
            const { text } = await generateText({
                model,
                prompt,
            });

            // Clean up potential markdown code blocks
            const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(jsonString);
        } catch (error) {
            console.error("AI Match Error:", error);
            throw error;
        }
    },

    generateCoverLetter: async (jobDescription: string, resumeContent: string, jobTitle: string, companyName: string): Promise<AICoverLetterResult> => {
        const providerId = (localStorage.getItem('AI_PROVIDER') as AIProviderId) || 'gemini';
        const model = getProvider(providerId);

        if (!model) {
            throw new Error(`Please configure your ${providerId} API Key in Settings first.`);
        }

        const prompt = `
      Write a professional, tailored cover letter for the position of ${jobTitle} at ${companyName}.
      
      Job Description:
      ${jobDescription.substring(0, 5000)}

      My Resume Details:
      ${resumeContent.substring(0, 15000)}

      Instructions:
      - Keep it concise (under 300 words).
      - Highlight 2-3 key matches between my resume and the job description.
      - Use a professional but enthusiastic tone.
      - Output ONLY the body of the letter (No placeholders like [Your Name], I will add that).
    `;

        try {
            const { text } = await generateText({
                model,
                prompt,
            });
            return { coverLetter: text };
        } catch (error) {
            console.error("AI Cover Letter Error:", error);
            throw error;
        }
    },

    generateEmailFromLetter: async (coverLetter: string, jobTitle: string, companyName: string): Promise<string> => {
        const providerId = (localStorage.getItem('AI_PROVIDER') as AIProviderId) || 'gemini';
        const model = getProvider(providerId);

        if (!model) {
            throw new Error(`Please configure your ${providerId} API Key in Settings first.`);
        }

        const prompt = `
      Convert the following cover letter into a professional email format for a job application.
      
      Job Title: ${jobTitle}
      Company: ${companyName}
      
      Original Cover Letter:
      ${coverLetter}

      Instructions:
      - Create a clear, professional Subject Line.
      - Make the body concise and suitable for email reading (shorter paragraphs).
      - Maintain the professional tone.
      - Output the Subject Line first, followed by the Body.
      - Format:
        Subject: [Subject Line]
        
        [Email Body]
    `;

        try {
            const { text } = await generateText({
                model,
                prompt,
            });
            return text;
        } catch (error) {
            console.error("AI Email Conversion Error:", error);
            throw error;
        }
    },

    validateConnection: async (): Promise<boolean> => {
        // This is primarily used by the Settings page connection test
        const providerId = (localStorage.getItem('AI_PROVIDER') as AIProviderId) || 'gemini';
        const model = getProvider(providerId);

        if (!model) {
            throw new Error("Provider not configured correctly.");
        }

        try {
            const { text } = await generateText({
                model,
                prompt: "Reply with 'OK' if you can read this.",
            });
            return text.length > 0;
        } catch (error) {
            console.error("Connection Validation Error:", error);
            throw error;
        }
    }
};
