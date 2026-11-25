
import { generateText } from "ai";
import { getProvider, AIProviderId } from "@/utils/ai-providers/registry";
import { supabase } from "@/integrations/supabase/client";
import { MasterProfile } from "@/types/resume";

export const GrowthEngine = {
    /**
     * Generates a LinkedIn post based on topic and user profile.
     */
    generatePost: async (topic: string, format: string, profile: MasterProfile | null): Promise<string> => {
        const providerId = (localStorage.getItem("AI_PROVIDER") as AIProviderId) || "gemini";
        const model = getProvider(providerId);

        if (!model) {
            throw new Error(`AI Provider ${providerId} not configured.`);
        }

        // Fetch user growth settings for tone (optional, falling back to default if missing)
        let tone = "professional yet engaging";
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from("profile_growth_settings")
                    .select("tone_voice")
                    .eq("user_id", user.id)
                    .single();

                if (data?.tone_voice) {
                    // simple heuristic for MVP
                    tone = JSON.stringify(data.tone_voice);
                }
            }
        } catch (e) {
            console.warn("Could not fetch tone settings", e);
        }

        const experienceContext = profile?.experience
            ? profile.experience.map(exp => `${exp.position} at ${exp.company}`).join(", ")
            : "an experienced professional";

        const prompt = `
      You are an expert LinkedIn Content Strategist.
      
      AUTHOR CONTEXT:
      - Role: ${profile?.targetTitle || "Professional"}
      - Experience: ${experienceContext}
      - Tone: ${tone}

      TASK:
      Write a viral-style LinkedIn post about: "${topic}".
      Format: ${format} (options: 'story', 'educational', 'opinion')
      
      STRUCTURE:
      1. Hook: 1 short, punchy line to stop the scroll.
      2. Body: Space out paragraphs. Use short sentences.
      3. Insight: Share unique expertise.
      4. CTA: End with a question to drive comments.
      
      CONSTRAINTS:
      - Max 1500 chars.
      - Use 2-3 relevant hashtags at the end.
      - NO "Here is a post" preamble. Just the post.
    `;

        try {
            const { text } = await generateText({
                model,
                prompt,
            });
            return text.trim();
        } catch (error) {
            console.error("Growth Engine Error:", error);
            throw error;
        }
    },
};
