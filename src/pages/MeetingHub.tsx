import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, Settings, Share2, Info, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import CalendarConnector from "@/components/meetings/CalendarConnector";
import AvailabilitySharer from "@/components/meetings/AvailabilitySharer";
import AddMeetingDialog from "@/components/meetings/AddMeetingDialog";
import AvailabilitySettings from "@/components/meetings/AvailabilitySettings";
import { MeetingCalendar } from "@/components/meetings/MeetingCalendar";
import { MeetingService } from "@/services/MeetingService";
import { Meeting } from "@/types/meeting";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const MeetingHub = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | null>(null);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                fetchMeetings(user.id);
            }
        };
        getUser();
    }, []);

    const fetchMeetings = async (uid: string) => {
        try {
            const data = await MeetingService.getMeetings(uid);
            setMeetings(data as any);
        } catch (error) {
            console.error("Error fetching meetings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Meeting Hub</h1>
                    <p className="text-muted-foreground">Manage your interview schedule and availability.</p>
                </div>
                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Share2 className="mr-2 h-4 w-4" />
                                Share Availability
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Share Your Availability</DialogTitle>
                                <DialogDescription>
                                    Select available slots to copy and share with recruiters.
                                </DialogDescription>
                            </DialogHeader>
                            <AvailabilitySharer />
                        </DialogContent>
                    </Dialog>

                    <Button onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Meeting
                    </Button>

                    {userId && (
                        <AddMeetingDialog
                            userId={userId}
                            isOpen={isAddDialogOpen}
                            onClose={() => setIsAddDialogOpen(false)}
                            onSuccess={() => fetchMeetings(userId)}
                        />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Interview Calendar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[600px]">
                        <MeetingCalendar meetings={meetings} />
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-primary" />
                                Calendar Sync
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {userId ? (
                                <CalendarConnector userId={userId} />
                            ) : (
                                <div className="text-center py-4 text-sm text-muted-foreground">
                                    Please sign in to manage calendars.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Availability Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {userId ? (
                                <AvailabilitySettings userId={userId} />
                            ) : (
                                <div className="text-center py-4 text-sm text-muted-foreground">
                                    Please sign in.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Interviews</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-muted-foreground animate-pulse">Loading meetings...</p>
                                </div>
                            ) : meetings.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-muted-foreground">No upcoming interviews scheduled.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {meetings.map((meeting) => (
                                        <div key={meeting.id} className="flex flex-col p-3 rounded-lg border bg-muted/30">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-medium text-sm">{meeting.title}</h4>
                                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                    {format(new Date(meeting.scheduled_at), "h:mm a")}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {format(new Date(meeting.scheduled_at), "EEEE, MMMM do")}
                                            </p>
                                            {meeting.meeting_link && (
                                                <Button variant="link" className="p-0 h-auto text-xs justify-start mt-2" onClick={() => window.open(meeting.meeting_link!, '_blank')}>
                                                    Join Meeting
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MeetingHub;
