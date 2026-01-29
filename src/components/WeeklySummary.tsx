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
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            trend: "+24%",
            trendUp: true
        },
        {
            label: "New Connections",
            value: newConnections.toString(),
            icon: Users,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            trend: "+12%",
            trendUp: true
        },
        {
            label: "Avg. Excitement",
            value: avgExcitement.toFixed(1),
            icon: Star,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            trend: "+0.2",
            trendUp: true
        },
        {
            label: "Apply Velocity",
            value: `${applyVelocity}%`,
            icon: Zap,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
            trend: "+5%",
            trendUp: true
        },
    ];

    return (
        <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Weekly Performance
                    </CardTitle>
                    <span className="text-[10px] font-bold bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/20 backdrop-blur-sm">
                        ACTIVE CYCLE
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-6 mt-2">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="group relative">
                            <div className="flex items-center gap-4">
                                <div className={`${stat.bg} p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <div>
                                    <div className="text-2xl font-black tracking-tighter tabular-nums">{stat.value}</div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</span>
                                        <span className={`text-[10px] font-bold ${stat.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {stat.trend} week-over-week
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

