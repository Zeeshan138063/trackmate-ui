import { supabase } from "@/integrations/supabase/client";

export type ReminderKind = "deadline" | "follow_up";

export const NovuService = {
    /**
     * Asks the notify-reminder edge function to send the signed-in user an in-app reminder
     * about one of their jobs. The Novu API key lives in that function's secrets (P4); the
     * function builds the message from the job row and sends it only to the caller.
     */
    triggerReminder: async (kind: ReminderKind, jobId: string): Promise<void> => {
        const { error } = await supabase.functions.invoke("notify-reminder", {
            body: { kind, jobId },
        });
        if (error) throw error;
    },
};
