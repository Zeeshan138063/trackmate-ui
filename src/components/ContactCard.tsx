import { useState } from "react";
import { Contact } from "@/types/contact";
import { ContactDetailsDialog } from "./ContactDetailsDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContactStageBadge } from "@/components/contacts/ContactStageBadge";
import type { ContactActionInfo } from "@/hooks/useContactActions";
import { ROLE_LABELS, STAGE_LABELS } from "@/utils/contact-next-action";
import { safeHttpUrl } from "@/utils/contact-list";
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
    /** REQ-003: next action and suggested stage from useContactActions. Omitted outside Connections. */
    actionInfo?: ContactActionInfo;
    /** Saves stage, role type or do-not-contact through the page's contact list. */
    onUpdate?: (id: string, updates: Partial<Contact>) => Promise<unknown>;
    /** When given, the page opens the details itself and the card mounts no dialog of its own. */
    onOpen?: (contact: Contact) => void;
}

export function ContactCard({ contact, onEdit, onDelete, interactionType, actionInfo, onUpdate, onOpen }: ContactCardProps) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const stage = contact.warmth_stage ?? "identified";
    const doNotContact = contact.relationship_stage === "do_not_contact";
    const action = actionInfo?.action;
    const suggested = actionInfo?.suggested ?? null;
    const open = () => (onOpen ? onOpen(contact) : setIsDetailsOpen(true));
    const linkedIn = safeHttpUrl(contact.linkedin_url);

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
                className="group relative h-[330px] flex flex-col hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                role="button"
                tabIndex={0}
                aria-label={`Open ${contact.name}`}
                onClick={open}
                onKeyDown={(e) => {
                    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        open();
                    }
                }}
            >
                {/* Header Actions - Positioned absolutely to not mess with flex layout */}
                <div className="absolute top-3 right-3 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    {(onEdit || onDelete) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label={`Actions for ${contact.name}`} className="h-8 w-8 bg-background/80 backdrop-blur-sm self-end">
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
                        <ContactStageBadge stage={stage} />
                        {contact.role_type && contact.role_type !== "other" && (
                            <Badge variant="outline" className="text-[10px] py-0 h-5 font-normal bg-background/50">
                                {ROLE_LABELS[contact.role_type]}
                            </Badge>
                        )}
                        {doNotContact && (
                            <Badge variant="destructive" className="text-[10px] py-0 h-5 font-normal">
                                Do not contact
                            </Badge>
                        )}
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

                    {/* Next action (REQ-003). A prompt only: the user does it and logs it. */}
                    {action && (
                        <div className="text-xs shrink-0 space-y-1">
                            {action.kind === "none" ? (
                                <p className="text-muted-foreground truncate" title={action.reason}>{action.reason}</p>
                            ) : (
                                <p className="truncate" title={`${action.label} · ${action.reason}`}>
                                    <span className="font-medium">Next: {action.label}</span>
                                    <span className="text-muted-foreground"> · due {action.dueDate}</span>
                                </p>
                            )}
                            {action.kind === "connect" && onUpdate && (
                                <button
                                    type="button"
                                    className="text-primary hover:underline block"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdate(contact.id, { invitation_sent_at: new Date().toISOString() });
                                    }}
                                >
                                    Mark invitation sent
                                </button>
                            )}
                            {suggested && onUpdate && (
                                <button
                                    type="button"
                                    className="text-primary hover:underline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdate(contact.id, { warmth_stage: suggested });
                                    }}
                                >
                                    Suggested: {STAGE_LABELS[suggested]}. Move?
                                </button>
                            )}
                        </div>
                    )}

                    {/* Footer Contact Info - Fixed height at bottom */}
                    <div className="pt-3 border-t flex items-center justify-between text-muted-foreground mt-auto shrink-0">
                        <div className="flex gap-3">
                            {contact.email && (
                                <a href={`mailto:${contact.email}`} aria-label={`Email ${contact.name}`} title={contact.email} onClick={(e) => e.stopPropagation()} className="hover:text-primary transition-colors">
                                    <Mail className="h-3.5 w-3.5" />
                                </a>
                            )}
                            {contact.phone && (
                                <a href={`tel:${contact.phone}`} aria-label={`Call ${contact.name}`} title={contact.phone} onClick={(e) => e.stopPropagation()} className="hover:text-primary transition-colors">
                                    <Phone className="h-3.5 w-3.5" />
                                </a>
                            )}
                            {linkedIn && (
                                <a href={linkedIn} target="_blank" rel="noopener noreferrer" aria-label={`${contact.name} on LinkedIn`} title="Open LinkedIn profile" onClick={(e) => e.stopPropagation()} className="hover:text-[#0A66C2] transition-colors">
                                    <Linkedin className="h-3.5 w-3.5" />
                                </a>
                            )}
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

            {/* Mounted only while open: the dialog loads its own data, and a page of cards must not load it once per card. */}
            {isDetailsOpen && (
                <ContactDetailsDialog
                    contact={contact}
                    open
                    onOpenChange={setIsDetailsOpen}
                    onEdit={onEdit}
                    onUpdate={onUpdate}
                />
            )}
        </>
    );
}
