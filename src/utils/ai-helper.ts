
export interface AIMatchResult {
    score: number;
    missingKeywords: string[];
    explanation: string;
}

export interface AICoverLetterResult {
    coverLetter: string;
}

// Simulating AI behavior for now. 
// In a real implementation, this would call OpenAI or Gemini API.
export const AIHelper = {

    analyzeMatch: async (jobDescription: string, resumeContent: string): Promise<AIMatchResult> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock logic to generate a somewhat realistic score based on string length or random
                // This is just a placeholder simulation
                const score = Math.floor(Math.random() * (95 - 60 + 1) + 60);

                const possibleKeywords = ["React", "TypeScript", "Node.js", "AWS", "GraphQL", "Docker", "Kubernetes", "CI/CD", "Testing", "Agile"];
                const missing = possibleKeywords.filter(() => Math.random() > 0.7).slice(0, 3);

                resolve({
                    score,
                    missingKeywords: missing,
                    explanation: `Your resume matches ${score}% of the job requirements. You have strong coverage in core technologies, but adding the missing keywords could improve your ATS ranking.`
                });
            }, 1500);
        });
    },

    generateCoverLetter: async (jobDescription: string, resumeContent: string, jobTitle: string, companyName: string): Promise<AICoverLetterResult> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const letter = `Dear Hiring Manager at ${companyName},

I am writing to express my strong interest in the ${jobTitle} position. With my background in software development and experience with similar technologies, I am confident in my ability to contribute effectively to your team.

I was particularly drawn to this role because of [mention something specific from job description if parsed]. My experience aligns well with the requirements for this position.

Thank you for considering my application. I look forward to the possibility of discussing how my skills and experience can benefit ${companyName}.

Sincerely,
[Your Name]`;
                resolve({ coverLetter: letter });
            }, 2000);
        });
    }
};
