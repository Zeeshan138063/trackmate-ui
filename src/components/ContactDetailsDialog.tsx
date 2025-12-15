import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Contact } from "@/types/contact";
import {
    Mail,
    Phone,
    MapPin,
    Linkedin,
    Building2,
    Calendar,
    Briefcase,
    History,
    BellRing,
    User,
    Plus,
    Sparkles,
    Send,
    Copy,
    Loader2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EngagementTimeline } from "./EngagementTimeline";
import { AddEngagementDialog } from "./AddEngagementDialog";
import { FollowUpList } from "./FollowUpList";
import { useEngagements } from "@/hooks/useEngagements";
import { useFollowUps } from "@/hooks/useFollowUps";
import { Textarea } from "@/components/ui/textarea";
import { AIGenerator } from "@/services/AIGenerator";
import { useResume } from "@/hooks/useResume";
import { useContacts } from "@/hooks/useContacts";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ContactDetailsDialogProps {
    contact: Contact | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: (contact: Contact) => void;
}

export function ContactDetailsDialog({
    contact,
    open,
    onOpenChange,
    onEdit
}: ContactDetailsDialogProps) {
    const [isAddEngagementOpen, setIsAddEngagementOpen] = useState(false);

    // AI Note Generation State
    const [invitationNote, setInvitationNote] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [connectionContext, setConnectionContext] = useState("general");
    const [customContext, setCustomContext] = useState("");
    const { masterProfile } = useResume();
    const { updateContact } = useContacts();
    const { toast } = useToast();

    // Hooks for engagement system
    const {
        engagements,
        loading: loadingEngagements,
        fetchEngagements,
        addEngagement,
        deleteEngagement
    } = useEngagements(contact?.id);

    const {
        followUps,
        loading: loadingFollowUps,
        fetchFollowUps,
        addFollowUp,
        updateStatus,
        deleteFollowUp
    } = useFollowUps(contact?.id);

    // Refresh data when dialog opens
    useEffect(() => {
        if (open && contact?.id) {
            fetchEngagements();
            fetchFollowUps();
            setInvitationNote(contact.invitation_note || "");
        }
    }, [open, contact?.id]);

    if (!contact) return null;

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    const handleGenerateNote = async () => {
        setIsGenerating(true);
        try {
            const contextToSend = connectionContext === "custom" ? customContext : connectionContext;
            const note = await AIGenerator.generateConnectionNote(contact, masterProfile, contextToSend);
            setInvitationNote(note);
            toast({ title: "Note Generated", description: "You can edit it before saving." });
        } catch (error) {
            toast({ variant: "destructive", title: "Generation Failed", description: "Could not generate note." });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveNote = async () => {
        if (!contact.id) return;
        await updateContact(contact.id, { invitation_note: invitationNote });
        toast({ title: "Note Saved", description: "Invitation note attached to contact." });
    };

    const handleCopyNote = () => {
        navigator.clipboard.writeText(invitationNote);
        toast({ title: "Copied!", description: "Note copied to clipboard." });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col gap-0 p-0"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-start justify-between pr-8">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border-2 border-primary/10">
                                <AvatarImage src="" />
                                <AvatarFallback className="text-xl bg-primary/5 text-primary font-medium">
                                    {getInitials(contact.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <DialogTitle className="text-xl">{contact.name}</DialogTitle>
                                {contact.position && <p className="text-sm text-muted-foreground">{contact.position} at {contact.company}</p>}
                            </div>
                        </div>
                        {onEdit && (
                            <Button variant="outline" size="sm" onClick={() => {
                                onOpenChange(false);
                                onEdit(contact);
                            }}>
                                Edit Contact
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <div className="p-6 pt-2 h-full">
                    <Tabs defaultValue="details" className="h-full">
                        <TabsList className="mb-4 w-full justify-start">
                            <TabsTrigger value="details" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Details
                            </TabsTrigger>
                            <TabsTrigger value="connection" className="flex items-center gap-2">
                                <Linkedin className="h-4 w-4" />
                                Connection
                            </TabsTrigger>
                            <TabsTrigger value="engagement" className="flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Timeline
                            </TabsTrigger>
                            <TabsTrigger value="reminders" className="flex items-center gap-2">
                                <BellRing className="h-4 w-4" />
                                Reminders
                                {followUps.filter(f => f.status === 'pending').length > 0 && (
                                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 min-w-[1.25rem]">
                                        {followUps.filter(f => f.status === 'pending').length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-6 mt-0">
                            {/* Contact Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {contact.email && (
                                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                                        <div className="bg-primary/10 p-2 rounded-full text-primary">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-medium text-muted-foreground">Email</p>
                                            <a href={`mailto:${contact.email}`} className="text-sm hover:underline">
                                                {contact.email}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {contact.phone && (
                                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                                        <div className="bg-primary/10 p-2 rounded-full text-primary">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-medium text-muted-foreground">Phone</p>
                                            <a href={`tel:${contact.phone}`} className="text-sm hover:underline">
                                                {contact.phone}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {(contact.address || contact.country) && (
                                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                                        <div className="bg-primary/10 p-2 rounded-full text-primary">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-medium text-muted-foreground">Location</p>
                                            <p className="text-sm">
                                                {[contact.address, contact.country].filter(Boolean).join(", ")}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {contact.linkedin_url && (
                                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                                        <div className="bg-[#0A66C2]/10 p-2 rounded-full text-[#0A66C2]">
                                            <Linkedin className="h-4 w-4" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-medium text-muted-foreground">LinkedIn</p>
                                            <a
                                                href={contact.linkedin_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm hover:underline truncate max-w-[200px] block"
                                            >
                                                View Profile
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* About / Notes Section */}
                            {contact.notes && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium flex items-center">
                                        <span className="bg-primary/10 p-1.5 rounded mr-2">
                                            <Briefcase className="h-3.5 w-3.5 text-primary" />
                                        </span>
                                        About & Notes
                                    </h3>
                                    <div className="bg-muted/30 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 border">
                                        {contact.notes}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center text-xs text-muted-foreground pt-4 border-t">
                                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                                Added on {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : 'N/A'}
                            </div>
                        </TabsContent>

                        <TabsContent value="connection" className="space-y-4">
                            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg mb-4">
                                <h3 className="font-medium text-indigo-900 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-indigo-600" />
                                    AI Invitation Generator
                                </h3>
                                <p className="text-sm text-indigo-800 mt-1">
                                    Craft the perfect LinkedIn invitation note customized for {contact.name}.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground">Context / Tone</label>
                                        <Select value={connectionContext} onValueChange={setConnectionContext}>
                                            <SelectTrigger className="h-8 text-xs bg-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="general">Professional / General</SelectItem>
                                                <SelectItem value="conference">Met at Conference / Event</SelectItem>
                                                <SelectItem value="social_media">Social Media Fan</SelectItem>
                                                <SelectItem value="alumni">Alumni / Shared Group</SelectItem>
                                                <SelectItem value="reconnecting">Reconnecting</SelectItem>
                                                <SelectItem value="custom">Custom (Type your own)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-end justify-end">
                                        <Button
                                            onClick={handleGenerateNote}
                                            disabled={isGenerating}
                                            size="sm"
                                            variant="outline"
                                            className="gap-2 w-full h-8"
                                        >
                                            {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-indigo-600" />}
                                            {invitationNote ? "Regenerate" : "Generate Draft"}
                                        </Button>
                                    </div>
                                </div>

                                {connectionContext === "custom" && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Custom Context</label>
                                        <Input
                                            value={customContext}
                                            onChange={(e) => setCustomContext(e.target.value)}
                                            placeholder="e.g. Met at the dog park, both love hiking..."
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                )}

                                <Textarea
                                    className="min-h-[120px] bg-slate-50 border-slate-200 mt-2"
                                    placeholder="Click generate to create a personalized note..."
                                    value={invitationNote}
                                    onChange={(e) => setInvitationNote(e.target.value)}
                                />
                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                    <span>{invitationNote.length} / 300 characters</span>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" onClick={handleCopyNote} disabled={!invitationNote}>
                                            <Copy className="h-3 w-3 mr-2" />
                                            Copy
                                        </Button>
                                        <Button size="sm" onClick={handleSaveNote} disabled={!invitationNote}>
                                            <Send className="h-3 w-3 mr-2" />
                                            Save Note
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="engagement" className="space-y-4">
                            <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg">
                                <div>
                                    <h3 className="font-medium">Interaction History</h3>
                                    <p className="text-sm text-muted-foreground">Track your professional relationship journey.</p>
                                </div>
                                <Button onClick={() => setIsAddEngagementOpen(true)} size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Log Interaction
                                </Button>
                            </div>

                            <div className="h-[400px] overflow-y-auto pr-2">
                                <EngagementTimeline
                                    engagements={engagements}
                                    loading={loadingEngagements}
                                    onDelete={deleteEngagement}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="reminders" className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
                                <h3 className="font-medium text-amber-900 flex items-center gap-2">
                                    <BellRing className="h-4 w-4" />
                                    Stay in touch
                                </h3>
                                <p className="text-sm text-amber-800 mt-1">
                                    Set reminders for birthdays, job updates, or simple health check-ins to keep the relationship warm.
                                </p>
                            </div>

                            <FollowUpList
                                followUps={followUps}
                                loading={loadingFollowUps}
                                onAdd={addFollowUp}
                                onUpdateStatus={updateStatus}
                                onDelete={deleteFollowUp}
                                contactId={contact.id}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>

            <AddEngagementDialog
                open={isAddEngagementOpen}
                onOpenChange={setIsAddEngagementOpen}
                onSubmit={addEngagement}
                contactId={contact.id}
            />
        </Dialog>
    );
}
