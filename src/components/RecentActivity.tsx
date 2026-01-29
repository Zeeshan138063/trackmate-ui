import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Briefcase, ChevronRight, Activity } from "lucide-react";
import { Job } from "@/types/job";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
    jobs: Job[];
}

export function RecentActivity({ jobs }: RecentActivityProps) {
    const activities = jobs
        .map(job => {
            // Prioritize createdAt for accurate "time ago", fall back to dateApplied or dateSaved
            const date = job.createdAt ? new Date(job.createdAt) : new Date(job.dateApplied || job.dateSaved);
            const type = job.dateApplied ? "Applied" : "Bookmarked";
            return {
                id: job.id,
                position: job.position,
                company: job.company,
                status: job.status,
                type,
                date,
            };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 4);

    return (
        <Card className="border-none shadow-xl bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <History className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">Recent Activity</CardTitle>
                    </div>
                    <Activity className="h-4 w-4 text-muted-foreground/30 animate-pulse" />
                </div>
            </CardHeader>
            <CardContent className="px-5">
                <div className="space-y-4">
                    {activities.length > 0 ? (
                        activities.map((activity) => (
                            <div key={activity.id} className="group flex items-center justify-between p-2 rounded-xl hover:bg-primary/5 transition-all duration-300 cursor-pointer">
                                <div className="flex items-center space-x-4">
                                    <div className="relative">
                                        <div className="bg-muted p-2.5 rounded-xl group-hover:bg-background transition-colors shadow-sm">
                                            <Briefcase className="h-4 w-4 text-primary" />
                                        </div>
                                        {activity.type === 'Applied' && (
                                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full" />
                                        )}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold leading-none tracking-tight group-hover:text-primary transition-colors pr-2">
                                            {activity.company}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[120px]">
                                            {activity.position}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] text-muted-foreground font-semibold tabular-nums">
                                        {formatDistanceToNow(activity.date, { addSuffix: true })}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/50">{activity.status}</span>
                                        <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-50 flex flex-col items-center">
                            <div className="h-10 w-10 border-2 border-dashed border-muted-foreground rounded-full flex items-center justify-center mb-2">
                                <History className="h-4 w-4" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest">Quiet for now</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


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
