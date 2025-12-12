
export interface AIMatchResult {
    score: number;
    missingKeywords: string[];
    explanation: string;
}

export interface AICoverLetterResult {
    coverLetter: string;
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const callGemini = async (prompt: string, apiKey: string) => {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: prompt }]
                }
            ]
        }),
    });

    if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
};

export const AIHelper = {

    analyzeMatch: async (jobDescription: string, resumeContent: string): Promise<AIMatchResult> => {
        const apiKey = localStorage.getItem("GEMINI_API_KEY");
        if (!apiKey) {
            throw new Error("Please configure your Gemini API Key in Settings first.");
        }

        const prompt = `
      You are an expert ATS (Applicant Tracking System) optimizer.
      Analyze the following Job Description and Resume.
      
      Job Description:
      ${jobDescription.substring(0, 5000)}

      Resume Content (Summary/Skills/Exp):
      ${resumeContent.substring(0, 2000)}

      Output a JSON object ONLY with this structure (no markdown):
      {
        "score": number (0-100),
        "missingKeywords": ["string", "string", ...],
        "explanation": "string (brief explanation)"
      }
    `;

        try {
            const responseText = await callGemini(prompt, apiKey);
            // Clean up potential markdown code blocks
            const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(jsonString);
        } catch (error) {
            console.error("AI Match Error:", error);
            // Fallback or re-throw
            throw error;
        }
    },

    generateCoverLetter: async (jobDescription: string, resumeContent: string, jobTitle: string, companyName: string): Promise<AICoverLetterResult> => {
        const apiKey = localStorage.getItem("GEMINI_API_KEY");
        if (!apiKey) {
            throw new Error("Please configure your Gemini API Key in Settings first.");
        }

        const prompt = `
      Write a professional, tailored cover letter for the position of ${jobTitle} at ${companyName}.
      
      Job Description:
      ${jobDescription.substring(0, 5000)}

      My Resume Details:
      ${resumeContent.substring(0, 2000)}

      Instructions:
      - Keep it concise (under 300 words).
      - Highlight 2-3 key matches between my resume and the job description.
      - Use a professional but enthusiastic tone.
      - Output ONLY the body of the letter (No placeholders like [Your Name], I will add that).
    `;

        try {
            const coverLetter = await callGemini(prompt, apiKey);
            return { coverLetter };
        } catch (error) {
            console.error("AI Cover Letter Error:", error);
            throw error;
        }
    }
};
