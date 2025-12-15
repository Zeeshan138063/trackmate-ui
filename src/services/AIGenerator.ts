import { Contact } from "@/types/contact";
import { MasterProfile } from "@/types/resume";
import { getProvider, AIProviderId } from "@/utils/ai-providers/registry";
import { generateText } from "ai";

export const AIGenerator = {
    /**
     * Generates a personalized LinkedIn connection note.
     * Uses the configured AI provider if available, otherwise falls back to templates.
     */
    generateConnectionNote: async (contact: Contact, profile: MasterProfile | null, context: string = "general"): Promise<string> => {
        const storedProvider = localStorage.getItem("AI_PROVIDER") as AIProviderId | null;

        // 1. Try Real AI Generation
        if (storedProvider) {
            const model = getProvider(storedProvider);
            if (model) {
                try {
                    const prompt = `
                        Draft a friendly, professional LinkedIn connection invitation note (max 300 characters strictly) from me to ${contact.name}.
                        
                        My Context:
                        - Name: ${profile?.contact.firstName || "me"} ${profile?.contact.lastName || ""}
                        - Role: ${profile?.targetTitle || "Professional"}
                        
                        Their Context:
                        - Name: ${contact.name}
                        - Role: ${contact.position || "Professional"}
                        - Company: ${contact.company || "their company"}

                        Connection Context/Tone: ${context}
                        (e.g., if "conference", mention meeting there. If "social media", mention their posts. If "cold", be direct/professional.)
                        
                        Goal: Connect professionally.
                        Shape it as a direct message. No hashtags. No "Dear X" header, just the message body.
                    `;

                    const { text } = await generateText({
                        model,
                        prompt,
                    });

                    return text.trim();
                } catch (error) {
                    console.error("AI Generation failed, falling back to template.", error);
                    // Fallthrough to template
                }
            }
        }

        // 2. Fallback Simulation (Template Engine)
        // Simulate "thinking" time
        await new Promise(resolve => setTimeout(resolve, 800));

        const myName = profile?.contact.firstName || "me";
        const theirName = contact.name.split(' ')[0];
        const theirRole = contact.position || "professional";
        const theirCompany = contact.company || "your company";

        let templates: string[] = [];

        switch (context) {
            case "conference":
                templates = [
                    `Hi ${theirName}, it was great meeting you at the recent conference. I'd love to stay in touch and follow your work at ${theirCompany}.`,
                    `Hi ${theirName}, enjoying the event? I'd love to connect and discuss some of the topics raised about ${theirRole}.`,
                ];
                break;
            case "social_media":
                templates = [
                    `Hi ${theirName}, I've been following your posts about ${theirRole} and really enjoy your insights. I'd love to connect!`,
                    `Hi ${theirName}, your recent post caught my eye. As a fellow ${profile?.targetTitle || "professional"}, I'd love to follow your updates.`,
                ];
                break;
            case "alumni":
                templates = [
                    `Hi ${theirName}, I noticed we have a shared background. I'd love to connect with fellow alumni in the ${theirRole} space.`,
                    `Hi ${theirName}, always great to find others from our network. I'm working as a ${profile?.targetTitle} and would love to connect.`,
                ];
                break;
            case "reconnecting":
                templates = [
                    `Hi ${theirName}, it's been a while! I noticed you're now at ${theirCompany}. Congrats! Let's reconnect.`,
                    `Hi ${theirName}, hope you're doing well. I'd love to catch up and hear about your work as a ${theirRole}.`,
                ];
                break;
            default: // general/cold
                templates = [
                    `Hi ${theirName}, I'm a fellow ${profile?.targetTitle || "professional"} and I've been following your work at ${theirCompany}. I'd love to connect!`,
                    `Hi ${theirName}, I noticed your profile and your role as ${theirRole}. I'd love to connect to learn more about your experience at ${theirCompany}.`,
                    `Hi ${theirName}, impressed by your path at ${theirCompany}. Would accept a connection request? Thanks, ${myName}`
                ];
                break;
        }

        return templates[Math.floor(Math.random() * templates.length)];
    }
};
