
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DreamCompany } from "@/services/dreamCompanies";
import { Building, Globe, MapPin } from "lucide-react";

interface DreamCompanyCardProps {
    company: DreamCompany;
    onClick?: () => void;
}

export function DreamCompanyCard({ company, onClick }: DreamCompanyCardProps) {
    const getPriorityColor = (priority: string | null) => {
        switch (priority) {
            case "High": return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
            case "Medium": return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
            case "Low": return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
            default: return "bg-slate-500/10 text-slate-500";
        }
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case "Offer": return "bg-green-500/10 text-green-500";
            case "Applied": return "bg-purple-500/10 text-purple-500";
            case "Rejected": return "bg-red-500/10 text-red-500";
            default: return "bg-slate-500/10 text-slate-500";
        }
    };

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
                        {company.priority}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className={getStatusColor(company.status)}>
                        {company.status}
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

                {company.website_url && (
                    <a
                        href={company.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                        <Globe className="w-3 h-3" /> Website
                    </a>
                )}
            </CardContent>
        </Card>
    );
}
