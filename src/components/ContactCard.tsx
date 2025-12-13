import { Contact } from "@/types/contact";
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
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src="" /> {/* Todo: add avatar url if we have it later */}
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(contact.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <h3 className="font-semibold leading-none">
                            {contact.name}
                        </h3>
                        {contact.position && (
                            <p className="text-sm text-muted-foreground">{contact.position}</p>
                        )}
                        {contact.company && (
                            <div className="flex items-center text-xs text-muted-foreground">
                                <Building2 className="mr-1 h-3 w-3" />
                                {contact.company}
                            </div>
                        )}
                        {contact.relationship && (
                            <div className="pt-1">
                                <Badge variant="outline" className="text-[10px] py-0 h-5">
                                    {contact.relationship}
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {interactionType && (
                        <Badge variant="secondary" className="text-xs">
                            {interactionType}
                        </Badge>
                    )}

                    {(onEdit || onDelete) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {onEdit && (
                                    <DropdownMenuItem onClick={() => onEdit(contact)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                    <DropdownMenuItem
                                        onClick={() => onDelete(contact.id)}
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
            </CardHeader>
            <CardContent className="space-y-2 text-sm pt-2">
                {(contact.email || contact.phone || contact.linkedin_url) && (
                    <div className="grid gap-1.5">
                        {contact.email && (
                            <div className="flex items-center text-muted-foreground">
                                <Mail className="mr-2 h-3.5 w-3.5" />
                                <a href={`mailto:${contact.email}`} className="hover:underline">
                                    {contact.email}
                                </a>
                            </div>
                        )}
                        {contact.phone && (
                            <div className="flex items-center text-muted-foreground">
                                <Phone className="mr-2 h-3.5 w-3.5" />
                                <a href={`tel:${contact.phone}`} className="hover:underline">
                                    {contact.phone}
                                </a>
                            </div>
                        )}
                        {contact.address && (
                            <div className="flex items-center text-muted-foreground">
                                <MapPin className="mr-2 h-3.5 w-3.5" />
                                {contact.address}
                                {contact.country && `, ${contact.country}`}
                            </div>
                        )}
                        {contact.linkedin_url && (
                            <div className="flex items-center text-muted-foreground">
                                <Linkedin className="mr-2 h-3.5 w-3.5" />
                                <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    LinkedIn Profile
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {contact.notes && (
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground italic">
                        "{contact.notes}"
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
