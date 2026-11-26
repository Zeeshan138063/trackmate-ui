import { getProvider, AIProviderId } from "@/utils/ai-providers/registry";
import { generateText } from "ai";
import { buildDraftPrompt, type AskKind, type DraftContact, type DraftSender } from "@/utils/message-draft";

export const AIGenerator = {
    /**
     * Drafts one message for one contact (REQ-005). The prompt and its truth rules are built in
     * utils/message-draft.ts. Throws a message for the user when the contact has no notes, no key
     * is set or the call fails; it never substitutes a canned message (P3, P10).
     */
    draftMessage: async (contact: DraftContact, sender: DraftSender, ask: AskKind, jobContext?: string | null): Promise<string> => {
        const prompt = buildDraftPrompt(contact, sender, ask, jobContext);
        const providerId = (localStorage.getItem("AI_PROVIDER") as AIProviderId | null) || "gemini";
        const model = getProvider(providerId);
        if (!model) throw new Error(`Add your ${providerId} API key in Settings to draft messages.`);
        try {
            const { text } = await generateText({ model, prompt });
            return text.trim().replace(/^["“]|["”]$/g, "");
        } catch (error) {
            console.error("Message drafting failed:", error);
            throw new Error("The AI provider could not write the draft. Check your key and try again.");
        }
    },
};
