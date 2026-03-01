import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Settings, Share2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import CalendarConnector from "@/components/meetings/CalendarConnector";
import AvailabilitySharer from "@/components/meetings/AvailabilitySharer";
import AddMeetingDialog from "@/components/meetings/AddMeetingDialog";
import AvailabilitySettings from "@/components/meetings/AvailabilitySettings";
import { EditMeetingDialog } from "@/components/meetings/EditMeetingDialog";
import { MeetingCalendar } from "@/components/meetings/MeetingCalendar";
import { MeetingService } from "@/services/MeetingService";
import { Meeting } from "@/types/meeting";

const MeetingHub = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | null>(null);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
        <div className="container mx-auto py-6 space-y-8 max-w-7xl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Meeting Hub</h1>
                    <p className="text-muted-foreground mt-1">Manage your interview schedule and availability settings.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Share2 className="h-4 w-4" />
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

                    <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 shadow-sm">
                        <Plus className="h-4 w-4" />
                        New Meeting
                    </Button>
                </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

                {/* Left & Center: Calendar & Agenda (Spans 8 or 9 cols) */}
                <div className="xl:col-span-8 lg:col-span-8 w-full">
                    <MeetingCalendar
                        meetings={meetings}
                        onSelectMeeting={(meeting) => {
                            setEditingMeeting(meeting);
                            setIsEditDialogOpen(true);
                        }}
                        onNewMeeting={() => setIsAddDialogOpen(true)}
                    />
                </div>

                {/* Right Column: Sidebar Utils (Spans 4 or 3 cols) */}
                <div className="xl:col-span-4 lg:col-span-4 space-y-6">
                    {/* Availability Widget */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground px-1 uppercase tracking-wider">Settings</h3>
                        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                            <div className="p-4 border-b bg-muted/10 flex items-center justify-between">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    Interview Hours
                                </h4>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Settings className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <div className="p-0">
                                {userId ? (
                                    <AvailabilitySettings userId={userId} embedded={true} />
                                ) : (
                                    <div className="p-4 text-sm text-center text-muted-foreground">Sign in to manage</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sync Widget */}
                    <div className="space-y-2">
                        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                            <div className="p-4 border-b bg-muted/10">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Share2 className="h-4 w-4 text-primary" />
                                    Calendar Sync
                                </h4>
                            </div>
                            <div className="p-4">
                                {userId ? (
                                    <CalendarConnector userId={userId} />
                                ) : (
                                    <div className="text-sm text-center text-muted-foreground">Sign in to sync</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            {userId && (
                <AddMeetingDialog
                    userId={userId}
                    isOpen={isAddDialogOpen}
                    onClose={() => setIsAddDialogOpen(false)}
                    onSuccess={() => fetchMeetings(userId)}
                />
            )}

            <EditMeetingDialog
                meeting={editingMeeting}
                open={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                onSuccess={() => {
                    if (userId) fetchMeetings(userId);
                }}
            />
        </div>
    );
};

export default MeetingHub;
