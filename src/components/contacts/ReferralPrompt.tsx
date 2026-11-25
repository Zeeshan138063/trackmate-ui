import { Handshake, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Contact } from "@/types/contact";
import { ContactStageBadge } from "./ContactStageBadge";

const MAX_SHOWN = 3;

interface Props {
    company: string;
    /** From referralCandidates(): exact matches at In conversation or Advocate. */
    candidates: Contact[];
    onOpenContact: (contact: Contact) => void;
    onDismiss: () => void;
}

/**
 * Referral-first prompt (REQ-007): shown on a job the user has not applied to yet when they are
 * already talking to someone at the company. A suggestion only: it never blocks applying, and
 * JobOS sends nothing (P2).
 */
export function ReferralPrompt({ company, candidates, onOpenContact, onDismiss }: Props) {
    if (candidates.length === 0) return null;
    const shown = candidates.slice(0, MAX_SHOWN);
    const more = candidates.length - shown.length;

    return (
        <div
            role="status"
            className="mx-6 mb-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/40"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                    <Handshake className="h-4 w-4 mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                    <div className="space-y-2 min-w-0">
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                            Ask before you apply: you already know {candidates.length === 1 ? "someone" : "people"} at {company}.
                        </p>
                        <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                            A referral usually does more than a cold application. Ask first, then apply.
                        </p>
                        <ul className="flex flex-wrap gap-2">
                            {shown.map((contact) => (
                                <li key={contact.id}>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-7 gap-2 bg-background"
                                        onClick={() => onOpenContact(contact)}
                                    >
                                        {contact.name}
                                        <ContactStageBadge stage={contact.warmth_stage ?? "identified"} />
                                    </Button>
                                </li>
                            ))}
                            {more > 0 && <li className="text-xs text-muted-foreground self-center">and {more} more</li>}
                        </ul>
                    </div>
                </div>
                <Button type="button" size="sm" variant="ghost" className="h-7 shrink-0" onClick={onDismiss}>
                    <X className="h-3.5 w-3.5 mr-1" />
                    Not now
                </Button>
            </div>
        </div>
    );
}
