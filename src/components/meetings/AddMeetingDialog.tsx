import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MeetingService } from "@/services/MeetingService";
import { MeetingInsert } from "@/types/meeting";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Job } from "@/types/job";
import { Contact } from "@/types/contact";
import { subMonths, format, isBefore } from "date-fns";

interface AddMeetingDialogProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddMeetingDialog = ({ userId, isOpen, onClose, onSuccess }: AddMeetingDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const { toast } = useToast();

    const minDate = useMemo(() => {
        const date = subMonths(new Date(), 2);
        return format(date, "yyyy-MM-dd'T'HH:mm");
    }, []);

    const [formData, setFormData] = useState({
        title: "",
        scheduledAt: "",
        durationMinutes: "30",
        jobId: "",
        contactId: "",
        locationPlatform: "Zoom",
        meetingLink: "",
        description: ""
    });

    useEffect(() => {
        if (isOpen) {
            fetchJobs();
            fetchContacts();
        }
    }, [isOpen]);

    const fetchJobs = async () => {
        const { data } = await supabase.from("jobs").select("*").eq("user_id", userId);
        if (data) setJobs(data as any);
    };

    const fetchContacts = async () => {
        const { data } = await supabase.from("contacts").select("*").eq("user_id", userId);
        if (data) setContacts(data as any);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const selectedDate = new Date(formData.scheduledAt);
        const minAllowedDate = subMonths(new Date(), 2);

        if (isBefore(selectedDate, minAllowedDate)) {
            toast({
                title: "Invalid Date",
                description: "You cannot schedule meetings more than 2 months in the past.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            const meeting: MeetingInsert = {
                user_id: userId,
                title: formData.title,
                scheduled_at: selectedDate.toISOString(),
                duration_minutes: parseInt(formData.durationMinutes),
                job_id: formData.jobId || null,
                contact_id: formData.contactId || null,
                location_platform: formData.locationPlatform,
                meeting_link: formData.meetingLink,
                description: formData.description
            };

            await MeetingService.createMeeting(meeting);
            toast({ title: "Meeting scheduled", description: "Your interview has been added to the hub." });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error creating meeting:", error);
            toast({ title: "Error", description: "Failed to schedule meeting.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Schedule New Meeting</DialogTitle>
                    <DialogDescription>Add a new interview or follow-up call to your schedule.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Technical Interview at Google"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date & Time</Label>
                            <Input
                                id="date"
                                type="datetime-local"
                                required
                                min={minDate}
                                value={formData.scheduledAt}
                                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="duration">Duration (mins)</Label>
                            <Input
                                id="duration"
                                type="number"
                                required
                                value={formData.durationMinutes}
                                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Linked Job (Optional)</Label>
                            <Select
                                value={formData.jobId}
                                onValueChange={(val) => setFormData({ ...formData, jobId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a job" />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobs.map(job => (
                                        <SelectItem key={job.id} value={job.id}>{job.position} @ {job.company}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Contact (Optional)</Label>
                            <Select
                                value={formData.contactId}
                                onValueChange={(val) => setFormData({ ...formData, contactId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a contact" />
                                </SelectTrigger>
                                <SelectContent>
                                    {contacts.map(contact => (
                                        <SelectItem key={contact.id} value={contact.id}>{contact.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="link">Meeting Link</Label>
                        <Input
                            id="link"
                            placeholder="https://zoom.us/j/..."
                            value={formData.meetingLink}
                            onChange={(e) => {
                                const link = e.target.value;
                                let platform = formData.locationPlatform;
                                if (link.includes("zoom.us")) platform = "Zoom";
                                else if (link.includes("meet.google.com")) platform = "Google Meet";
                                else if (link.includes("teams.microsoft.com")) platform = "Microsoft Teams";

                                setFormData({
                                    ...formData,
                                    meetingLink: link,
                                    locationPlatform: platform
                                });
                            }}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Scheduling..." : "Schedule Meeting"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddMeetingDialog;
