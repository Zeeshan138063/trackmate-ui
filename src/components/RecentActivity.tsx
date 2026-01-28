
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Briefcase, MessageSquare, UserPlus } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { useInterviewFeedback } from "@/hooks/useInterviewFeedback";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

export function RecentActivity() {
    const { jobs } = useJobs();
    const { feedbacks } = useInterviewFeedback();
    const navigate = useNavigate();

    const activities = [
        ...jobs.map(job => ({
            id: job.id,
            type: 'job',
            title: `${job.company} - ${job.position}`,
            description: `Status updated to ${job.status}`,
            date: new Date(job.dateSaved),
            icon: Briefcase,
            color: 'text-blue-500',
            link: '/trackers'
        })),
        ...feedbacks.map(fb => ({
            id: fb.id,
            type: 'feedback',
            title: fb.company,
            description: `Added interview feedback for ${fb.position}`,
            date: new Date(fb.created_at),
            icon: MessageSquare,
            color: 'text-teal-500',
            link: '/interview-feedback'
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

    return (
        <Card className="col-span-1 h-full">
            <CardHeader>
                <div className="flex items-center space-x-2">
                    <History className="h-5 w-5 text-primary" />
                    <CardTitle>Recent Activity</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {activities.length > 0 ? (
                    <div className="space-y-6">
                        {activities.map((activity, idx) => (
                            <div
                                key={`${activity.type}-${activity.id}-${idx}`}
                                className="flex items-start space-x-4 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                                onClick={() => navigate(activity.link)}
                            >
                                <div className={`mt-1 p-2 rounded-full bg-muted ${activity.color}`}>
                                    <activity.icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                                    <p className="text-[10px] text-muted-foreground/60">
                                        {formatDistanceToNow(activity.date, { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p className="text-sm">No recent activity found.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
