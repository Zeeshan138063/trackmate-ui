
import { format } from "date-fns";
import { Video, MapPin, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Meeting } from "@/types/meeting";

interface MeetingCardProps {
    meeting: Meeting;
    isCompact?: boolean;
    onClick?: () => void;
}

const GoogleMeetIcon = ({ className }: { className?: string }) => (
    <svg role="img" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className={className}>
        <title>Google Meet</title>
        <path fill="#ea4335" d="M166 106v90H76" />
        <path fill="#ffba00" d="M166 106v90h120v62l90-73v-49q0-30-30-30" />
        <path fill="#00ac47" d="M346 406q30 0 30-30V327l-90-71v60H164v90m212-77 42 34c9 7 18 7 18-7V156c0-14-9-14-18-7l-42 34" />
        <path fill="#0066da" d="M76 314v62q0 30 30 30h60v-92" />
        <path fill="#2684fc" d="M76 196h90v120H76" />
        <path fill="#00832d" d="M286 256l90-73v146" />
    </svg>
);

export function MeetingCard({ meeting, isCompact = false, onClick }: MeetingCardProps) {
    const statusColors = {
        SCHEDULED: "border-blue-500",
        COMPLETED: "border-green-500",
        CANCELLED: "border-red-500",
    };

    const statusTextColors = {
        SCHEDULED: "text-blue-600",
        COMPLETED: "text-green-600",
        CANCELLED: "text-red-600",
    };

    const statusLabel = {
        SCHEDULED: "Scheduled",
        COMPLETED: "Completed",
        CANCELLED: "Cancelled",
    };

    const isUpcoming = meeting.status === 'SCHEDULED' && new Date(meeting.scheduled_at) > new Date();

    const getPlatformIcon = (platform: string | null, link: string | null = null) => {
        let icon;
        if (link?.includes('meet.google.com') || platform === 'Google Meet' || platform?.includes('Meet')) {
            icon = <GoogleMeetIcon className="h-4 w-4" />;
        } else if (link?.includes('zoom.us') || platform === 'Zoom' || platform?.includes('Zoom')) {
            icon = <Video className="h-4 w-4 text-[#2D8CFF]" />;
        } else {
            icon = <MapPin className="h-4 w-4 text-muted-foreground" />;
        }

        if (link) {
            return (
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:opacity-80 transition-opacity"
                    title="Join Meeting"
                >
                    {icon}
                </a>
            );
        }

        return icon;
    };

    // Determine border color/style based on platform and status
    const getBorderStyles = () => {
        if (meeting.status === 'SCHEDULED') {
            if (meeting.meeting_link?.includes('meet.google.com') || meeting.location_platform === 'Google Meet' || meeting.location_platform?.includes('Meet')) {
                return {
                    borderLeft: '6px solid transparent',
                    borderImage: 'linear-gradient(to bottom, #34A853, #FBBC04, #EA4335, #4285F4) 1',
                };
            }
            if (meeting.meeting_link?.includes('zoom.us') || meeting.location_platform === 'Zoom' || meeting.location_platform?.includes('Zoom')) {
                return { borderLeft: '6px solid #2D8CFF' };
            }
            return { borderLeft: '6px solid #3b82f6' }; // Default Blue-500
        }
        if (meeting.status === 'COMPLETED') return { borderLeft: '6px solid #22c55e' }; // Green-500
        if (meeting.status === 'CANCELLED') return { borderLeft: '6px solid #ef4444' }; // Red-500
        return { borderLeft: '6px solid #d1d5db' }; // Gray-300
    };

    return (
        <div
            onClick={onClick}
            style={getBorderStyles()}
            className={cn(
                "bg-card rounded-lg border shadow-sm p-4 relative overflow-hidden transition-all hover:shadow-md cursor-pointer group",
                "transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2",
                "border-t border-r border-b" // Keep other borders
            )}
        >
            <div className="flex justify-between items-start">
                <div className="space-y-2"> {/* Increased spacing */}
                    <span className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider",
                        statusTextColors[meeting.status] || "text-muted-foreground"
                    )}>
                        {statusLabel[meeting.status]}
                    </span>

                    <h4 className="font-bold text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {meeting.title}
                    </h4>

                    <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-1">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            <span className="font-medium">
                                {format(new Date(meeting.scheduled_at), "EEE, MMM do, yyyy")}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                                {format(new Date(meeting.scheduled_at), "h:mm a")} - {format(new Date(new Date(meeting.scheduled_at).getTime() + meeting.duration_minutes * 60000), "h:mm a")}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {getPlatformIcon(meeting.location_platform, meeting.meeting_link)}
                        <span>{meeting.location_platform || 'No Location'}</span>
                    </div>
                </div>

                {isUpcoming && meeting.meeting_link && !isCompact && (
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-4 text-xs font-medium"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(meeting.meeting_link!, '_blank');
                        }}
                    >
                        Join
                    </Button>
                )}
            </div>
        </div>
    );
}
