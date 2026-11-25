import { useMemo } from "react";
import { Link2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Contact } from "@/types/contact";
import { contactsAtCompany, countContactable } from "@/utils/company-match";
import { ContactStageBadge } from "./ContactStageBadge";

/**
 * Small "N contacts" marker for a job in a list (REQ-006, AC-6, AC-7). Counts only people who
 * are definitely at the company and may be contacted (DEC-004). Renders nothing for zero.
 */
export function KnownContactsMarker({ company, contacts }: { company?: string | null; contacts: Contact[] }) {
    const count = useMemo(() => countContactable(contactsAtCompany(company, contacts)), [company, contacts]);
    if (count === 0) return null;
    return (
        <Badge
            variant="outline"
            className="text-[10px] py-0 h-5 font-medium gap-1 border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
            title={`You know ${count} ${count === 1 ? "person" : "people"} at ${company}`}
        >
            <Users className="h-3 w-3" />
            {count} {count === 1 ? "contact" : "contacts"}
        </Badge>
    );
}

interface KnownContactsProps {
    company?: string | null;
    contacts: Contact[];
    /** Contact ids already linked to this job; they get no link button. */
    linkedIds?: string[];
    /** When given, each unlinked contact gets "Link to this job". */
    onLink?: (contact: Contact) => void;
}

/** "People you know at <company>" with each person's warmth stage (REQ-006, AC-5, AC-7, AC-8). */
export function KnownContacts({ company, contacts, linkedIds = [], onLink }: KnownContactsProps) {
    const matches = useMemo(() => contactsAtCompany(company, contacts), [company, contacts]);
    const label = company?.trim() || "this company";

    return (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                People you know at {label}
            </h4>

            {matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contacts at {label} yet.</p>
            ) : (
                <ul className="space-y-2">
                    {matches.map(({ contact, kind, doNotContact }) => (
                        <li key={contact.id} className="flex items-center justify-between gap-3 text-sm">
                            <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                <span className="font-medium truncate">{contact.name}</span>
                                {contact.position && <span className="text-xs text-muted-foreground truncate">{contact.position}</span>}
                                <ContactStageBadge stage={contact.warmth_stage ?? "identified"} />
                                {kind === "possible" && (
                                    <Badge variant="outline" className="text-[10px] py-0 h-5 font-normal" title={`Listed at "${contact.company}", which may be the same company`}>
                                        Possible match: {contact.company}
                                    </Badge>
                                )}
                                {doNotContact && (
                                    <Badge variant="destructive" className="text-[10px] py-0 h-5 font-normal">Do not contact</Badge>
                                )}
                            </div>
                            {onLink && !linkedIds.includes(contact.id) && (
                                <Button size="sm" variant="outline" className="shrink-0 h-7" onClick={() => onLink(contact)}>
                                    <Link2 className="h-3.5 w-3.5 mr-1.5" />
                                    Link to this job
                                </Button>
                            )}
                            {onLink && linkedIds.includes(contact.id) && (
                                <span className="text-xs text-muted-foreground shrink-0">Linked</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
