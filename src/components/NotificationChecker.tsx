import { useEffect } from 'react';
import { useJobs } from '@/hooks/useJobs';
import { useAuth } from '@/hooks/useAuth';
import { NovuService } from '@/services/NovuService';
import { useToast } from '@/hooks/use-toast';

export function NotificationChecker() {
    const { jobs } = useJobs();
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (!user || jobs.length === 0) return;

        const checkNotifications = async () => {
            // Use local date (YYYY-MM-DD) to match the user's timezone, not UTC
            const today = new Date();
            const todayStr = today.toLocaleDateString('en-CA');
            const storageKey = `careerpilot_notified_${todayStr}`;

            // Prevent redundant notifications for the same day
            if (localStorage.getItem(storageKey)) {
                return;
            }

            let notificationsSent = 0;

            // Check Deadlines
            const deadlineJobs = jobs.filter(job => job.deadline === todayStr);
            for (const job of deadlineJobs) {
                try {
                    // Trigger local toast
                    toast({
                        title: "Application Deadline Today!",
                        description: `Deadline for ${job.position} at ${job.company}`,
                    });

                    await NovuService.triggerReminder("deadline", job.id);
                    notificationsSent++;
                } catch (e) {
                    console.error("Failed to notify for deadline", e);
                }
            }

            // Check Follow-ups
            const followUpJobs = jobs.filter(job => job.followUp === todayStr);
            for (const job of followUpJobs) {
                try {
                    // Trigger local toast
                    toast({
                        title: "Follow-up Reminder",
                        description: `Time to follow up for ${job.position} at ${job.company}`,
                    });

                    await NovuService.triggerReminder("follow_up", job.id);
                    notificationsSent++;
                } catch (e) {
                    console.error("Failed to notify for follow-up", e);
                }
            }

            if (notificationsSent > 0) {
                // Mark as done for today so we don't spam on refresh
                localStorage.setItem(storageKey, 'true');
            }
        };

        // Run check after a short delay to ensure data is loaded
        const timer = setTimeout(() => {
            checkNotifications();
        }, 5000);

        return () => clearTimeout(timer);

    }, [jobs, user, toast]);

    return null; // This component is invisible
}
