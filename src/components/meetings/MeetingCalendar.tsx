import { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, subMonths, isBefore, startOfDay } from "date-fns";
import type { Meeting } from "@/types/meeting";
import { MeetingCard } from "./MeetingCard";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MeetingCalendarProps {
    meetings: Meeting[];
    onSelectMeeting?: (meeting: Meeting) => void;
    onNewMeeting?: () => void;
    className?: string;
}

export function MeetingCalendar({ meetings, onSelectMeeting, onNewMeeting }: MeetingCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [view, setView] = useState<'date' | 'upcoming' | 'all'>('date');
    const minDate = subMonths(startOfDay(new Date()), 2);

    const getMeetingsForDate = (date: Date) => {
        return meetings.filter(m => isSameDay(new Date(m.scheduled_at), date));
    };

    const selectedDateMeetings = selectedDate ? getMeetingsForDate(selectedDate) : [];
    // Sort meetings by time
    selectedDateMeetings.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

    const upcomingMeetings = meetings
        .filter(m => new Date(m.scheduled_at) > new Date())
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

    const allMeetings = [...meetings].sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

    const displayedMeetings = view === 'date' ? selectedDateMeetings :
        view === 'upcoming' ? upcomingMeetings :
            allMeetings;

    const upcomingCount = upcomingMeetings.length;

    // Filter meetings for the current month
    const currentMonthMeetings = meetings.filter(m => {
        const meetingDate = new Date(m.scheduled_at);
        const today = new Date();
        return meetingDate.getMonth() === today.getMonth() &&
            meetingDate.getFullYear() === today.getFullYear();
    });

    const getHeaderText = () => {
        if (view === 'upcoming') return "Upcoming Interviews";
        if (view === 'all') return "All Interviews";
        return selectedDate ? format(selectedDate, "EEEE, MMM do") : "Today";
    };

    const getSubHeaderText = () => {
        if (displayedMeetings.length === 0) {
            return view === 'date' ? "No interviews" : "No meetings found";
        }
        return `${displayedMeetings.length} scheduled`;
    };

    // Helper to group meetings by date
    const groupMeetingsByDate = (meetingsToGroup: Meeting[]) => {
        const groups: Record<string, Meeting[]> = {};
        meetingsToGroup.forEach(meeting => {
            const dateKey = format(new Date(meeting.scheduled_at), 'yyyy-MM-dd');
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(meeting);
        });
        return groups;
    };

    const renderMeetingList = () => {
        if (displayedMeetings.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-[300px] text-center border rounded-xl bg-muted/5 border-dashed">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                        <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-sm">
                        {view === 'date' ? "No sessions today" : "No meetings found"}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-4">
                        {view === 'date'
                            ? "You don't have any interviews scheduled for this day."
                            : "No interviews found for this selection."}
                    </p>
                    {view === 'date' && selectedDate && !isBefore(selectedDate, minDate) && (
                        <Button variant="outline" size="sm" className="gap-2 h-8 text-xs" onClick={onNewMeeting}>
                            <Plus className="h-3 w-3" />
                            Schedule Interview
                        </Button>
                    )}
                </div>
            );
        }

        // If specific date view, show flat list
        if (view === 'date') {
            return displayedMeetings.map((meeting) => (
                <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onClick={() => onSelectMeeting?.(meeting)}
                />
            ));
        }

        // For Upcoming/All, group by date
        const groups = groupMeetingsByDate(displayedMeetings);
        const sortedDateKeys = Object.keys(groups).sort((a, b) => {
            return view === 'upcoming'
                ? new Date(a).getTime() - new Date(b).getTime() // Ascending for upcoming
                : new Date(b).getTime() - new Date(a).getTime(); // Descending for all (recent first)
        });

        return sortedDateKeys.map(dateKey => {
            const date = new Date(dateKey);
            const meetings = groups[dateKey];

            // Format header text
            let headerText = format(date, "EEEE, MMMM do, yyyy");
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);

            if (isSameDay(date, today)) headerText = "Today";
            else if (isSameDay(date, tomorrow)) headerText = "Tomorrow";

            return (
                <div key={dateKey} className="space-y-2 mb-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10 w-full">
                        {headerText}
                    </h3>
                    <div className="space-y-3">
                        {meetings.map(meeting => (
                            <MeetingCard
                                key={meeting.id}
                                meeting={meeting}
                                onClick={() => onSelectMeeting?.(meeting)}
                            />
                        ))}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
            {/* Left Column: Calendar Navigation */}
            <div className="md:col-span-6 lg:col-span-5 h-full">
                <div className="rounded-xl border dark:border-[#2D3148] bg-card dark:bg-[#141828] text-card-foreground h-full flex flex-col">
                    <div className="p-4 border-b bg-muted/10">
                        <h3 className="font-semibold flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            Interview Calendar
                        </h3>
                    </div>
                    <div className="p-4 space-y-4 flex-1">
                        <div className="rounded-md border dark:border-[#2D3148] dark:bg-[#141828] overflow-hidden">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                    setSelectedDate(date);
                                    if (date) setView('date');
                                }}
                                className="p-3 w-full"
                                classNames={{
                                    months: "flex flex-col w-full",
                                    month: "space-y-4 w-full",
                                    table: "w-full border-collapse space-y-1",
                                    head_row: "grid grid-cols-7 w-full mb-2",
                                    head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] flex items-center justify-center",
                                    row: "grid grid-cols-7 w-full mt-2",
                                    cell: "w-full p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                    day: "w-full h-full aspect-square p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-all flex items-center justify-center",
                                    day_selected: "bg-[#6366F1] text-white hover:bg-[#4F46E5] hover:text-white focus:bg-[#6366F1] focus:text-white shadow-md",
                                    day_today: "bg-muted text-foreground font-semibold aria-selected:bg-[#6366F1] aria-selected:text-white",
                                    day_outside: "text-muted-foreground opacity-50",
                                }}
                                components={{
                                    DayContent: ({ date }) => {
                                        const hasMeeting = meetings.some(m => isSameDay(new Date(m.scheduled_at), date));
                                        return (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <span className="z-10 text-xs">{date.getDate()}</span>
                                                {hasMeeting && (
                                                    <div className="absolute bottom-1 h-1 w-1 rounded-full bg-[#6366F1]" />
                                                )}
                                            </div>
                                        );
                                    }
                                }}
                            />
                        </div>

                        <div className="bg-muted/30 dark:bg-[#0F1424] p-4 rounded-xl border dark:border-[#2D3148] flex flex-col gap-1">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Overview</div>
                            <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                                You have <span className="font-bold text-foreground">{currentMonthMeetings.length}</span> meetings this month.
                                <br />
                                <span
                                    className="font-bold text-primary cursor-pointer hover:underline"
                                    onClick={() => setView('upcoming')}
                                >
                                    {upcomingCount} upcoming
                                </span>.
                            </p>
                        </div>

                        <div className="bg-muted/30 dark:bg-[#0F1424] p-2 rounded-xl border dark:border-[#2D3148] flex flex-col gap-1">
                            <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Interviews</div>
                            <div className="flex flex-col gap-1">
                                <Button
                                    variant={view === 'upcoming' ? "secondary" : "ghost"}
                                    size="sm"
                                    className="justify-start h-8 font-normal transition-all hover:translate-x-1 cursor-pointer select-none"
                                    onClick={() => setView('upcoming')}
                                >
                                    Upcoming Interviews
                                </Button>
                                <Button
                                    variant={view === 'all' ? "secondary" : "ghost"}
                                    size="sm"
                                    className="justify-start h-8 font-normal transition-all hover:translate-x-1 cursor-pointer select-none"
                                    onClick={() => setView('all')}
                                >
                                    All Interviews
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Center Column: Timeline/Agenda */}
            <div className="md:col-span-6 lg:col-span-7 relative min-h-[500px] md:min-h-0">
                <div className="md:absolute md:inset-0 flex flex-col">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold tracking-tight flex items-baseline gap-2">
                            {getHeaderText()}
                            <span className="text-xs font-normal text-muted-foreground">
                                {getSubHeaderText()}
                            </span>
                        </h2>
                    </div>

                    <div
                        key={view}
                        className="flex-1 space-y-3 overflow-y-auto px-2 pt-1 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    >
                        {renderMeetingList()}
                    </div>
                </div>
            </div>
        </div>
    );
}
