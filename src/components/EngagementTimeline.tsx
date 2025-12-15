import { Engagement } from "@/types/engagement";
import { formatDistanceToNow } from "date-fns";
import { Mail, Phone, Linkedin, Users, Calendar, ArrowRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EngagementTimelineProps {
    engagements: Engagement[];
    loading: boolean;
    onDelete: (id: string) => void;
}

export function EngagementTimeline({ engagements, loading, onDelete }: EngagementTimelineProps) {
    if (loading) {
        return <div className="text-center py-8 text-muted-foreground">Loading specific interactions...</div>;
    }

    if (engagements.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed text-muted-foreground">
                <p>No interactions logged yet.</p>
                <p className="text-sm mt-1">Log a call, email, or meeting to start tracking history.</p>
            </div>
        );
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'email': return <Mail className="h-4 w-4" />;
            case 'call': return <Phone className="h-4 w-4" />;
            case 'linkedin': return <Linkedin className="h-4 w-4" />;
            case 'meeting': return <Users className="h-4 w-4" />;
            default: return <Calendar className="h-4 w-4" />;
        }
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'positive': return "bg-green-100 text-green-700 border-green-200";
            case 'negative': return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    return (
        <div className="space-y-6 pl-2">
            {engagements.map((engagement) => (
                <div key={engagement.id} className="relative pl-6 border-l-2 border-muted pb-6 last:pb-0 last:border-0">
                    {/* Timestamp Dot */}
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary ring-2 ring-background" />

                    <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="font-semibold capitalize flex items-center gap-2">
                                    {getIcon(engagement.type)}
                                    {engagement.type}
                                </span>
                                <Badge variant="outline" className="text-xs font-normal">
                                    {engagement.direction === 'inbound' ? <ArrowLeft className="h-3 w-3 mr-1 text-green-500" /> : <ArrowRight className="h-3 w-3 mr-1 text-blue-500" />}
                                    {engagement.direction}
                                </Badge>
                                <Badge className={`text-xs capitalize shadow-none ${getSentimentColor(engagement.sentiment)}`}>
                                    {engagement.sentiment}
                                </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(engagement.date), { addSuffix: true })}
                            </span>
                        </div>

                        {engagement.notes && (
                            <p className="text-sm text-foreground/80 bg-muted/40 p-3 rounded-md">
                                {engagement.notes}
                            </p>
                        )}

                        {/* Optionally add delete button here if needed */}
                    </div>
                </div>
            ))}
        </div>
    );
}
