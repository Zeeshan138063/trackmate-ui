import { useMemo, useState } from "react";
import { AlarmClock, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, PenLine, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Contact } from "@/types/contact";
import type { ContactActionInfo } from "@/hooks/useContactActions";
import { localToday } from "@/hooks/useContactActions";
import { daysBetween, dueToday } from "@/utils/contact-next-action";
import { ContactStageBadge } from "./ContactStageBadge";

const VISIBLE = 10;
const SNOOZE_DAYS = [1, 3, 7];

interface Props {
    contacts: Contact[];
    actions: Map<string, ContactActionInfo>;
    onLog: (contact: Contact) => void;
    onSnooze: (contact: Contact, days: number) => void;
    onOpen: (contact: Contact) => void;
    /** REQ-009: the user sent a connection invitation by hand and marks it here. */
    onMarkInvited?: (contact: Contact) => void;
}

/**
 * The people to act on today (REQ-003, AC-7): every contact whose next action is due, most
 * overdue first. JobOS only prompts; the user does the action and logs it (P1, P2).
 */
export function TodayActions({ contacts, actions, onLog, onSnooze, onOpen, onMarkInvited }: Props) {
    const [showAll, setShowAll] = useState(false);
    const today = localToday();

    const due = useMemo(() => {
        const items = contacts.flatMap((contact) => {
            const info = actions.get(contact.id);
            return info ? [{ name: contact.name, contact, action: info.action }] : [];
        });
        return dueToday(items, today);
    }, [contacts, actions, today]);

    if (contacts.length === 0) return null;

    const visible = showAll ? due : due.slice(0, VISIBLE);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    Today
                    <Badge variant="secondary">{due.length}</Badge>
                    <span className="text-xs font-normal text-muted-foreground">
                        People whose next step is due. You do the step; JobOS keeps track.
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {due.length === 0 ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Nothing due today.
                    </p>
                ) : (
                    visible.map(({ contact, action }) => {
                        if (action.kind === "none") return null;
                        const overdue = daysBetween(action.dueDate, today);
                        return (
                            <div
                                key={contact.id}
                                className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                            >
                                <div className="min-w-0 space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium truncate">{contact.name}</span>
                                        {contact.company && (
                                            <span className="text-xs text-muted-foreground truncate">{contact.company}</span>
                                        )}
                                        <ContactStageBadge stage={contact.warmth_stage ?? "identified"} />
                                        {overdue > 0 && (
                                            <Badge variant="outline" className="text-[10px] py-0 h-5 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                                                {overdue} day{overdue === 1 ? "" : "s"} overdue
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm">
                                        <span className="font-medium">{action.label}</span>
                                        <span className="text-muted-foreground"> · {action.reason}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                    {action.kind === "connect" && onMarkInvited && (
                                        <Button size="sm" onClick={() => onMarkInvited(contact)}>
                                            <Send className="h-3.5 w-3.5 mr-1.5" />
                                            Mark invitation sent
                                        </Button>
                                    )}
                                    <Button size="sm" variant={action.kind === "connect" && onMarkInvited ? "outline" : "default"} onClick={() => onLog(contact)}>
                                        <PenLine className="h-3.5 w-3.5 mr-1.5" />
                                        Log it
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="sm" variant="outline">
                                                <AlarmClock className="h-3.5 w-3.5 mr-1.5" />
                                                Snooze
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {SNOOZE_DAYS.map((days) => (
                                                <DropdownMenuItem key={days} onClick={() => onSnooze(contact, days)}>
                                                    {days} day{days === 1 ? "" : "s"}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button size="sm" variant="ghost" onClick={() => onOpen(contact)}>
                                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                        Open
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}

                {due.length > VISIBLE && (
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAll((v) => !v)}>
                        {showAll ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                        {showAll ? "Show fewer" : `Show all ${due.length}`}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
