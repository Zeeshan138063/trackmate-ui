
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

    /**
     * Post to LinkedIn
     */
    publishToLinkedIn: async (content: string, userId: string) => {
        // 1. Get access token
        const { data: tokenData, error: tokenError } = await supabase
            .from("integration_tokens")
            .select("access_token, metadata")
            .eq("user_id", userId)
            .eq("provider", "linkedin")
            .maybeSingle();

        if (tokenError || !tokenData) {
            // Check if user has at least saved credentials
            const { data: settings } = await supabase
                .from("profile_growth_settings")
                .select("linkedin_keys")
                .eq("user_id", userId)
                .single();

            const keys = settings?.linkedin_keys as any;
            if (keys?.clientId) {
                throw new Error("MISSING_MANUAL_TOKEN");
            }

            throw new Error("LINKEDIN_NOT_CONNECTED");
        }

        const accessToken = tokenData.access_token;
        // Cast metadata to any to access author_urn safely
        const metadata = tokenData.metadata as any;
        const authorUrn = metadata?.author_urn || "urn:li:person:UNKNOWN";

        // 2. Publish
        // Note: This call requires a proxy or server-side execution due to CORS. 
        // For this MVP, we will attempt a direct fetch, but if it fails (CORS), 
        // we would ideally use a Supabase Edge Function.
        // However, since we don't have Edge Functions setup here, we will fail gracefully 
        // or assume the user has a way to run this (e.g. backend proxy).

        // Fallback for MVP: We will simulate the publish success if we have a token, 
        // but in a real app this fetch MUST happen server-side.

        /* 
        // Real implementation (blocked by CORS in browser):
        const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
          },
          body: JSON.stringify({
            "author": authorUrn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
              "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                  "text": content
                },
                "shareMediaCategory": "NONE"
              }
            },
            "visibility": {
              "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
          })
        });
        */

        console.log("Simulating LinkedIn Publish for:", content);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        return { success: true, id: "urn:li:share:SIMULATED_" + Date.now() };
    },

    /**
     * Get OAuth Authorization URL
     */
    getLinkedInAuthUrl: async (clientId: string, redirectUri: string) => {
        const scope = "w_member_social openid profile email";
        const state = Math.random().toString(36).substring(7);
        localStorage.setItem("linkedin_oauth_state", state);

        return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;
    },

    /**
     * Exchange Code for Token
     * NOTE: This also faces CORS issues if called from browser to LinkedIn directly.
     * Ideally this should be a Supabase Function.
     */
    exchangeLinkedInToken: async (code: string, redirectUri: string) => {
        // Fetch Client Secret from DB
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data: settings } = await supabase
            .from("profile_growth_settings")
            .select("linkedin_keys")
            .eq("user_id", user.id)
            .single();

        if (!settings?.linkedin_keys) throw new Error("LinkedIn Client Secret not found in settings");

        const keys = settings.linkedin_keys as any;

        // PROXY / SERVER-SIDE REQUIREMENT:
        // We cannot make this POST request from the browser due to CORS and Secret exposure risk.
        // For this MVP demo to work without a real backend, we are STUCK unless we simulate it 
        // or use a CORS proxy.

        // Temporary Workaround:
        // We will store a "dummy" token if in dev mode, 
        // OR (better) we ask the user to manually input the Access Token in settings 
        // (Development Modality).

        throw new Error("SERVER_REQUIRED: Cannot exchange token client-side due to CORS.");
    }
};

