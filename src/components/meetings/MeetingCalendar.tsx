import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, Clock, Video, MapPin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isSameDay } from "date-fns";
import type { Meeting } from "@/types/meeting";
import { Button } from "@/components/ui/button";

interface MeetingCalendarProps {
    meetings: Meeting[];
    onSelectMeeting?: (meeting: Meeting) => void;
}

export function MeetingCalendar({ meetings, onSelectMeeting }: MeetingCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const getMeetingsForDate = (date: Date) => {
        return meetings.filter(m => isSameDay(new Date(m.scheduled_at), date));
    };

    const selectedDateMeetings = selectedDate ? getMeetingsForDate(selectedDate) : [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            <div className="space-y-4">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border shadow bg-card w-full"
                    components={{
                        DayContent: ({ date }) => {
                            const hasMeeting = meetings.some(m => isSameDay(new Date(m.scheduled_at), date));
                            return (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <span>{date.getDate()}</span>
                                    {hasMeeting && (
                                        <div className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                                    )}
                                </div>
                            );
                        }
                    }}
                />

                <div className="bg-muted/30 p-4 rounded-lg border border-dashed">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Quick Summary</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        You have {meetings.length} total meetings scheduled this month.
                        {meetings.filter(m => m.status === 'SCHEDULED' && new Date(m.scheduled_at) > new Date()).length} are upcoming.
                    </p>
                </div>
            </div>

            <div className="flex flex-col min-h-0 border rounded-lg bg-card/50 overflow-hidden">
                <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                    <h4 className="font-semibold text-sm">
                        {selectedDate ? format(selectedDate, "EEEE, MMM do") : "Select a date"}
                    </h4>
                    <Badge variant="outline" className="text-[10px]">
                        {selectedDateMeetings.length} Events
                    </Badge>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {selectedDateMeetings.length > 0 ? (
                        selectedDateMeetings.map((meeting) => (
                            <Card key={meeting.id} className="hover:border-primary transition-colors cursor-pointer group">
                                <CardContent className="p-3 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h5 className="font-medium text-sm group-hover:text-primary transition-colors">
                                            {meeting.title}
                                        </h5>
                                        <span className="text-[10px] font-bold text-primary">
                                            {format(new Date(meeting.scheduled_at), "h:mm a")}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            {meeting.location_platform === 'Zoom' || meeting.location_platform === 'Google Meet' ? (
                                                <Video className="h-3 w-3" />
                                            ) : (
                                                <MapPin className="h-3 w-3" />
                                            )}
                                            {meeting.location_platform}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {meeting.duration_minutes}m
                                        </div>
                                    </div>

                                    {meeting.meeting_link && (
                                        <div className="pt-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="w-full h-7 text-[10px] gap-2"
                                                onClick={() => window.open(meeting.meeting_link!, '_blank')}
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                Join Meeting
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 py-12">
                            <CalendarDays className="h-10 w-10 mb-2" />
                            <p className="text-xs">No interviews today</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const Badge = ({ children, variant, className }: any) => (
    <span className={cn(
        "px-2 py-0.5 rounded-full border text-xs font-medium",
        variant === 'outline' ? "border-primary/20 text-primary bg-primary/5" : "bg-primary text-primary-foreground",
        className
    )}>
        {children}
    </span>
);
