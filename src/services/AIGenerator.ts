import { Contact } from "@/types/contact";
import { MasterProfile } from "@/types/resume";
import { getProvider, AIProviderId } from "@/utils/ai-providers/registry";
import { generateText } from "ai";

export const AIGenerator = {
    /**
     * Generates a personalized LinkedIn connection note.
     * Uses the configured AI provider. Throws a message for the user when no key is set or the
     * call fails; it never substitutes a canned note.
     */
    generateConnectionNote: async (contact: Contact, profile: MasterProfile | null, context: string = "general"): Promise<string> => {
        const providerId = (localStorage.getItem("AI_PROVIDER") as AIProviderId | null) || "gemini";
        const model = getProvider(providerId);
        if (!model) {
            // No silent template: a canned note would state things that may not be true (P3, P10).
            throw new Error(`Add your ${providerId} API key in Settings to draft notes.`);
        }

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

            Rules:
            - Use only the facts given above. Do not claim we have met, worked together, share a
              background, or that I follow their posts unless the connection context says so.
            - Do not invent achievements, employers or mutual contacts.

            Goal: Connect professionally.
            Shape it as a direct message. No hashtags. No "Dear X" header, just the message body.
        `;


        try {
            const { text } = await generateText({ model, prompt });
            return text.trim();
        } catch (error) {
            console.error("Connection note generation failed:", error);
            throw new Error("The AI provider could not draft the note. Check your key and try again.");
        }
    }
};
