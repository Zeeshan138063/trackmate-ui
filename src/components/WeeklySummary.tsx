import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Star, Briefcase, Zap } from "lucide-react";

interface WeeklySummaryProps {
    jobsSaved: number;
    newConnections: number;
    avgExcitement: number;
    applyVelocity: number;
}

export function WeeklySummary({
    jobsSaved,
    newConnections,
    avgExcitement,
    applyVelocity
}: WeeklySummaryProps) {
    const stats = [
        {
            label: "Jobs Saved",
            value: jobsSaved.toString(),
            icon: Briefcase,
            sublabel: "This week",
        },
        {
            label: "New Connections",
            value: newConnections.toString(),
            icon: Users,
            sublabel: "This week",
        },
        {
            label: "Avg. Excitement",
            value: avgExcitement.toFixed(1),
            icon: Star,
            sublabel: "Out of 5",
        },
        {
            label: "Apply Velocity",
            value: `${applyVelocity}%`,
            icon: Zap,
            sublabel: "Applied / Saved",
        },
    ];

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Weekly Performance
                    </CardTitle>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                        ACTIVE CYCLE
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-6 mt-2">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                                <stat.icon className="h-4 w-4 text-[#64748B]" />
                            </div>
                            <div>
                                <div className="text-2xl font-black tracking-tighter tabular-nums">{stat.value}</div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</span>
                                    <span className="text-[10px] text-muted-foreground/60">{stat.sublabel}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
