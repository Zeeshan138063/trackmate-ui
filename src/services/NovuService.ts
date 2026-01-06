export const NovuService = {
    /**
     * Triggers a notification via Novu API
     * NOTE: In a production app, this should be done on the backend to keep the API key secret.
     */
    triggerNotification: async (
        subscriberId: string,
        payload: {
            title: string;
            body: string;
            jobId?: string;
            location?: string;
            jobUrl?: string;
            company?: string;
            position?: string;
        }
    ) => {
        // REPLACE WITH YOUR NOVU API KEY
        const API_KEY = import.meta.env.VITE_NOVU_API_KEY;

        // Workflow Identifier from your screenshot
        const WORKFLOW_ID = "job-alert";

        try {
            // Use local proxy to avoid CORS errors
            const response = await fetch("/api/novu/events/trigger", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `ApiKey ${API_KEY}`,
                },
                body: JSON.stringify({
                    name: WORKFLOW_ID,
                    to: {
                        subscriberId: subscriberId,
                        // You can add email/phone if your workflow uses them:
                        // email: "user@example.com" 
                    },
                    payload: {
                        ...payload
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Novu Trigger Error:", errorData);
                throw new Error(`Failed to trigger notification: ${errorData.message || response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Novu Service Error:", error);
            throw error;
        }
    }
};
