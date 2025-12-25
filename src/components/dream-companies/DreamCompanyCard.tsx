
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DreamCompany } from "@/services/dreamCompanies";
import { Building, Globe, MapPin, Linkedin } from "lucide-react";
import { useMemo } from "react";

interface DreamCompanyCardProps {
    company: DreamCompany;
    onClick?: () => void;
}

export function DreamCompanyCard({ company, onClick }: DreamCompanyCardProps) {
    const getPriorityColor = (priority: string | null) => {
        if (!priority) return "bg-slate-500/10 text-slate-500";
        switch (priority.toLowerCase()) {
            case "high": return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
            case "medium": return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
            case "low": return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
            default: return "bg-slate-500/10 text-slate-500";
        }
    };

    const getStatusColor = (status: string | null) => {
        if (!status) return "bg-slate-500/10 text-slate-500";
        switch (status.toLowerCase()) {
            case "hired": return "bg-emerald-500/10 text-emerald-500";
            case "offer": return "bg-green-500/10 text-green-500";
            case "applied": return "bg-purple-500/10 text-purple-500";
            case "rejected": return "bg-red-500/10 text-red-500";
            case "interviewing": return "bg-indigo-500/10 text-indigo-500";
            case "targeting": return "bg-orange-500/10 text-orange-500";
            case "researching": return "bg-blue-500/10 text-blue-500";
            default: return "bg-slate-500/10 text-slate-500";
        }
    };

    const normalizedStatus = useMemo(() => {
        if (!company.status) return "Researching";
        // Simple capitalization since we store valid lowercase values now
        return company.status.charAt(0).toUpperCase() + company.status.slice(1);
    }, [company.status]);

    const normalizedPriority = useMemo(() => {
        if (!company.priority) return "Medium";
        const priorities = ["High", "Medium", "Low"];
        return priorities.find(p => p.toLowerCase() === company.priority?.toLowerCase()) || company.priority;
    }, [company.priority]);

    return (
        <Card
            className="hover:shadow-md transition-all duration-300 border-white/5 bg-card/50 backdrop-blur-sm cursor-pointer hover:border-primary/50 group"
            onClick={onClick}
        >
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-semibold truncate flex items-center gap-2">
                        {company.name}
                    </CardTitle>
                    <Badge variant="outline" className={getPriorityColor(company.priority)}>
                        {normalizedPriority}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className={getStatusColor(company.status)}>
                        {normalizedStatus}
                    </Badge>
                    {company.industry && (
                        <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded text-xs">
                            <Building className="w-3 h-3" /> {company.industry}
                        </span>
                    )}
                    {company.location && (
                        <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded text-xs">
                            <MapPin className="w-3 h-3" /> {company.location}
                        </span>
                    )}
                </div>

                {company.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {company.notes}
                    </p>
                )}

                <div className="flex items-center gap-3 mt-auto pt-2">
                    {company.website_url && (
                        <a
                            href={company.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Globe className="w-3 h-3" /> Website
                        </a>
                    )}
                    {(company as any).social_media?.linkedin && (
                        <a
                            href={(company as any).social_media.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Linkedin className="w-3 h-3" /> LinkedIn
                        </a>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
