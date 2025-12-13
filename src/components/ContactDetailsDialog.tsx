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
import { Contact } from "@/types/contact";
import {
    Mail,
    Phone,
    MapPin,
    Linkedin,
    Building2,
    Calendar,
    Briefcase
} from "lucide-react";

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
    if (!contact) return null;

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <DialogTitle className="text-xl">Contact Details</DialogTitle>
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

                <div className="flex flex-col space-y-6 mt-4">
                    {/* Header Section */}
                    <div className="flex items-start space-x-4">
                        <Avatar className="h-20 w-20 border-2 border-primary/10">
                            <AvatarImage src="" /> {/* Placeholder for avatar URL */}
                            <AvatarFallback className="text-xl bg-primary/5 text-primary font-medium">
                                {getInitials(contact.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1.5 flex-1">
                            <h2 className="text-2xl font-bold tracking-tight">{contact.name}</h2>

                            <div className="flex flex-wrap gap-2 text-muted-foreground">
                                {contact.position && (
                                    <div className="flex items-center text-sm font-medium">
                                        <Briefcase className="mr-1.5 h-4 w-4" />
                                        {contact.position}
                                    </div>
                                )}
                                {contact.company && (
                                    <div className="flex items-center text-sm">
                                        <Building2 className="mr-1.5 h-4 w-4" />
                                        {contact.company}
                                    </div>
                                )}
                            </div>

                            {contact.relationship && (
                                <Badge variant="secondary" className="mt-2">
                                    {contact.relationship}
                                </Badge>
                            )}
                        </div>
                    </div>

                    <Separator />

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

                    {/* Meta Info */}
                    {(contact.created_at) && (
                        <div className="flex items-center text-xs text-muted-foreground pt-4 border-t">
                            <Calendar className="mr-1.5 h-3.5 w-3.5" />
                            Added on {new Date(contact.created_at).toLocaleDateString()}
                        </div>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    );
}
