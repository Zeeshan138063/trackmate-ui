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
            const storageKey = `trackmate_notified_${todayStr}`;

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

                    // Trigger Novu
                    // Using the specific subscriberId from Header.tsx for demo consistency
                    // In real app, use user.id
                    await NovuService.triggerNotification("6956acd8f9d367c59645b1d6", {
                        title: `🔔 Application Deadline: ${job.position}`,
                        body: `Today is the final day to apply to ${job.company}. Don't miss this opportunity!`,
                        jobId: job.id,
                        position: job.position,
                        company: job.company,
                        location: job.location || "Remote",
                        jobUrl: job.jobUrl || "#"
                    });
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

                    await NovuService.triggerNotification("6956acd8f9d367c59645b1d6", {
                        title: `📅 Follow-up Reminder: ${job.position}`,
                        body: `It's time to follow up with ${job.company}. A quick message keeps you top of mind!`,
                        jobId: job.id,
                        position: job.position,
                        company: job.company,
                        location: job.location || "Remote",
                        jobUrl: job.jobUrl || "#"
                    });
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
