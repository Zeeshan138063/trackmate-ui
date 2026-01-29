import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Job } from "@/types/job";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { History, Briefcase, ChevronRight, Activity, ChevronLeft } from "lucide-react";

interface RecentActivityProps {
    jobs: Job[];
}

export function RecentActivity({ jobs }: RecentActivityProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 2;

    const allActivities = jobs
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
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    const totalPages = Math.ceil(allActivities.length / itemsPerPage);
    const activities = allActivities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <Card className="border-none shadow-xl bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-3 border-b border-border/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <History className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">Recent Activity</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground/30 animate-pulse mr-2" />
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-md hover:bg-primary/20"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-3 w-3" />
                                </Button>
                                <span className="text-[10px] font-bold tabular-nums text-muted-foreground w-8 text-center">
                                    {currentPage}/{totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-md hover:bg-primary/20"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-5 pt-4">
                <div className="space-y-4 min-h-[160px]">
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
