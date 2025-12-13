import { useState } from "react";
import { Contact } from "@/types/contact";
import { ContactDetailsDialog } from "./ContactDetailsDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Mail,
    Phone,
    MapPin,
    Linkedin,
    Building2,
    MoreVertical,
    Edit,
    Trash2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ContactCardProps {
    contact: Contact;
    onEdit?: (contact: Contact) => void;
    onDelete?: (id: string) => void;
    interactionType?: string; // For job specific context
}

export function ContactCard({ contact, onEdit, onDelete, interactionType }: ContactCardProps) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <>
            <Card
                className="group relative h-[300px] flex flex-col hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border-muted/60"
                onClick={() => setIsDetailsOpen(true)}
            >
                {/* Header Actions - Positioned absolutely to not mess with flex layout */}
                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(onEdit || onDelete) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm self-end">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                {onEdit && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(contact); }}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                    <DropdownMenuItem
                                        onClick={(e) => { e.stopPropagation(); onDelete(contact.id); }}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <CardContent className="flex flex-col h-full p-5 space-y-4">
                    {/* Header Section */}
                    <div className="flex items-start space-x-4">
                        <Avatar className="h-14 w-14 border border-input shadow-sm shrink-0">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-primary/5 text-primary text-base font-medium">
                                {getInitials(contact.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1 min-w-0 flex-1">
                            <h3 className="font-semibold text-base leading-tight truncate pr-6">
                                {contact.name}
                            </h3>
                            <div className="flex flex-col space-y-0.5 text-xs text-muted-foreground">
                                {contact.position && (
                                    <span className="truncate font-medium text-foreground/80">
                                        {contact.position}
                                    </span>
                                )}
                                {contact.company && (
                                    <span className="truncate flex items-center">
                                        <Building2 className="mr-1 h-3 w-3 shrink-0" />
                                        {contact.company}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Meta badges */}
                    <div className="flex flex-wrap gap-1.5">
                        {contact.relationship && (
                            <Badge variant="outline" className="text-[10px] py-0 h-5 font-normal bg-background/50">
                                {contact.relationship}
                            </Badge>
                        )}
                        {interactionType && (
                            <Badge variant="secondary" className="text-[10px] py-0 h-5 font-normal">
                                {interactionType}
                            </Badge>
                        )}
                    </div>

                    {/* Content Section - Grows to fill space */}
                    <div className="flex-1 min-h-0 relative">
                        {contact.notes ? (
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 italic">
                                "{contact.notes}"
                            </p>
                        ) : (
                            <div className="h-full flex items-center justify-center opacity-30">
                                <p className="text-xs italic">No additional notes</p>
                            </div>
                        )}
                        {/* Fade out effect at bottom of notes if needed, or just let line-clamp do it */}
                    </div>

                    {/* Footer Contact Info - Fixed height at bottom */}
                    <div className="pt-3 border-t flex items-center justify-between text-muted-foreground mt-auto shrink-0">
                        <div className="flex gap-3">
                            {contact.email && <Mail className="h-3.5 w-3.5 hover:text-primary transition-colors" />}
                            {contact.phone && <Phone className="h-3.5 w-3.5 hover:text-primary transition-colors" />}
                            {contact.linkedin_url && <Linkedin className="h-3.5 w-3.5 hover:text-[#0A66C2] transition-colors" />}
                        </div>

                        {(contact.address || contact.country) && (
                            <div className="flex items-center text-[10px] max-w-[120px] truncate">
                                <MapPin className="mr-1 h-3 w-3 shrink-0" />
                                <span className="truncate">
                                    {contact.country || contact.address?.split(',')[0]}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <ContactDetailsDialog
                contact={contact}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onEdit={onEdit}
            />
        </>
    );
}
