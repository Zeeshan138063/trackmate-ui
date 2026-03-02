import { Card, CardContent } from "@/components/ui/card";
import { Bookmark, Send, Users, Sparkles } from "lucide-react";

interface DailyStatsProps {
    stats: {
        bookmarked: number;
        applied: number;
        interviewing: number;
    };
}

export function DailyStats({ stats }: DailyStatsProps) {
    const cards = [
        {
            icon: Bookmark,
            label: "New Opportunities",
            sublabel: "Saved today",
            value: stats.bookmarked,
        },
        {
            icon: Send,
            label: "Applications Sent",
            sublabel: "Applied today",
            value: stats.applied,
        },
        {
            icon: Users,
            label: "Active Interviews",
            sublabel: "Interview today",
            value: stats.interviewing,
        },
    ];

    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-[#64748B]" />
                <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                    Daily Pulse
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cards.map((card) => (
                    <Card key={card.label} className="relative overflow-hidden hover:shadow-md transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                                    <card.icon className="h-5 w-5 text-[#64748B]" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full">
                                    Today
                                </span>
                            </div>

                            <div className="space-y-0.5">
                                <div className="text-4xl font-bold tracking-tight tabular-nums">
                                    {card.value}
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {card.label}
                                </p>
                                <p className="text-xs text-muted-foreground/60">
                                    {card.sublabel}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
