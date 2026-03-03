import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, Send, Users } from "lucide-react";

interface DailyStatsProps {
    stats: {
        bookmarked: number;
        applied: number;
        interviewing: number;
    };
}

const cards = [
    {
        title: "New Opportunities",
        description: "Saved today",
        icon: Bookmark,
        color: "text-indigo-400",
        key: "bookmarked" as const,
    },
    {
        title: "Applications Sent",
        description: "Applied today",
        icon: Send,
        color: "text-purple-400",
        key: "applied" as const,
    },
    {
        title: "Active Interviews",
        description: "Interview today",
        icon: Users,
        color: "text-orange-400",
        key: "interviewing" as const,
    },
];

export function DailyStats({ stats }: DailyStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
                <Card key={card.title} className="border-white/5 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {card.title}
                        </CardTitle>
                        <card.icon className={`h-4 w-4 ${card.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats[card.key]}</div>
                        <p className="text-xs text-muted-foreground">
                            {card.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
