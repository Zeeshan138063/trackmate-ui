import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Briefcase, Users, Star } from "lucide-react";

export function WeeklySummary() {
    const stats = [
        { label: "Jobs Saved", value: "12", icon: Briefcase, color: "text-blue-500", trend: "+20%" },
        { label: "New Connections", value: "5", icon: Users, color: "text-green-500", trend: "+8%" },
        { label: "Avg. Excitement", value: "4.2", icon: Star, color: "text-yellow-500", trend: "+0.5" },
        { label: "Activity Rate", value: "88%", icon: TrendingUp, color: "text-purple-500", trend: "+3%" },
    ];

    return (
        <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    Weekly Insight
                    <span className="text-[10px] font-normal bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full">
                        Last 7 Days
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="space-y-1">
                            <div className="flex items-center gap-2">
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                <span className="text-2xl font-bold tracking-tighter">{stat.value}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground font-medium">{stat.label}</span>
                                <span className="text-[10px] text-green-500 font-bold">{stat.trend}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
