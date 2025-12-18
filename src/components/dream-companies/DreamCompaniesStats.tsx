
import { useQuery } from "@tanstack/react-query";
import { dreamCompaniesService } from "@/services/dreamCompanies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Send, Handshake, Trophy } from "lucide-react";

export function DreamCompaniesStats() {
    const { data: companies } = useQuery({
        queryKey: ["dream-companies"],
        queryFn: dreamCompaniesService.getAll
    });

    if (!companies) return null;

    const total = companies.length;
    const applied = companies.filter(c =>
        ["Applied", "Interviewing", "Offer", "Rejected"].includes(c.status || "")
    ).length;

    const interviewing = companies.filter(c =>
        ["Interviewing", "Offer"].includes(c.status || "")
    ).length;

    const offers = companies.filter(c => c.status === "Offer").length;

    // Calculate Interview Rate ( Interviews / Applications or Total? User said "Interview rate")
    // Assuming Rate = Interviewing / Applied * 100
    const interviewRate = applied > 0 ? Math.round((interviewing / applied) * 100) : 0;

    const stats = [
        {
            title: "Total Companies",
            value: total,
            icon: Target,
            description: "Target list size",
            color: "text-blue-500"
        },
        {
            title: "Applied",
            value: applied,
            icon: Send,
            description: "Applications sent",
            color: "text-purple-500"
        },
        {
            title: "Interview Rate",
            value: `${interviewRate}%`,
            icon: Handshake,
            description: "Of applied companies",
            color: "text-orange-500"
        },
        {
            title: "Offers",
            value: offers,
            icon: Trophy,
            description: "Offers received",
            color: "text-green-500"
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.title} className="border-white/5 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">
                            {stat.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
