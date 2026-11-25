import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlarmClock, Check, CheckCircle2, ExternalLink, Send, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddEngagementDialog } from "@/components/AddEngagementDialog";
import { useContacts } from "@/hooks/useContacts";
import { useDailyQueue } from "@/hooks/useDailyQueue";
import { useEngagements } from "@/hooks/useEngagements";
import { localToday } from "@/hooks/useContactActions";
import type { Contact } from "@/types/contact";
import type { Job } from "@/types/job";
import { addDays, daysBetween } from "@/utils/contact-next-action";
import { GROUP_LABELS, QUEUE_GROUPS, type QueueItem } from "@/utils/daily-queue";

const SNOOZE_DAYS = [1, 3, 7];
const LIMIT_CHOICES = [3, 5, 10, 15, 20, 30];
const SAVE_FAILED = "That could not be saved, so the item is still on your list.";

interface Props {
    jobs: Job[];
    contacts: Contact[];
}

/**
 * Today (REQ-004): one ordered list of what is due across applications, follow-ups and people.
 * JobOS only lists and tracks; the user does each item (P1, P2).
 */
export function DailyQueue({ jobs, contacts }: Props) {
    const navigate = useNavigate();
    const { queue, limit, setLimit, record, refresh } = useDailyQueue(jobs, contacts);
    const { updateContact } = useContacts();
    const { addEngagement } = useEngagements();
    const [logging, setLogging] = useState<QueueItem | null>(null);
    const today = localToday();

    const open = (item: QueueItem) =>
        navigate(item.target.type === "job" ? `/trackers?job=${item.target.id}` : `/connections?contact=${item.target.id}`);

    const done = async (item: QueueItem) => {
        if (item.source === "contact") {
            setLogging(item); // logging the interaction is what completes a contact item
            return;
        }
        if (!(await record(item, "done"))) toast.error(SAVE_FAILED);
    };

    const snooze = async (item: QueueItem, days: number) => {
        if (!(await record(item, "snoozed", days))) {
            toast.error(SAVE_FAILED);
            return;
        }
        // Keep Connections in step: the contact's own snooze uses the same return date.
        if (item.source === "contact") {
            await updateContact(item.target.id, { next_action_snoozed_until: addDays(today, days) });
        }
    };

    // REQ-009: the user sent the connection invitation by hand and marks it here.
    const markInvited = async (item: QueueItem) => {
        const saved = await updateContact(item.target.id, { invitation_sent_at: new Date().toISOString() });
        if (saved && !(await record(item, "done"))) toast.error(SAVE_FAILED);
    };

    const skip = async (item: QueueItem) => {
        if (!(await record(item, "skipped"))) toast.error(SAVE_FAILED);
    };

    const total = queue.items.length + queue.hiddenCount;

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        Today
                        <Badge variant="secondary">{total}</Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Daily limit</span>
                        <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                            <SelectTrigger className="h-8 w-20" aria-label="Daily limit"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {(LIMIT_CHOICES.includes(limit) ? LIMIT_CHOICES : [...LIMIT_CHOICES, limit].sort((a, b) => a - b)).map((n) => (
                                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">
                    What is due across your applications, follow-ups and contacts. You do each step; JobOS keeps track.
                </p>
            </CardHeader>
            <CardContent className="space-y-5">
                {queue.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Nothing due today.
                    </p>
                ) : (
                    QUEUE_GROUPS.map((group) => {
                        const items = queue.items.filter((i) => i.group === group);
                        if (items.length === 0) return null;
                        return (
                            <section key={group} className="space-y-2">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {GROUP_LABELS[group]}
                                    {queue.totals[group] > items.length && (
                                        <span className="font-normal normal-case tracking-normal"> · showing {items.length} of {queue.totals[group]}</span>
                                    )}
                                </h3>
                                {items.map((item) => {
                                    const overdue = daysBetween(item.dueDate, today);
                                    return (
                                        <div key={item.key} className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-lg border bg-card">
                                            <div className="min-w-0 space-y-0.5">
                                                <p className="text-sm font-medium">{item.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.reason}
                                                    {overdue > 0 && (
                                                        <span className="text-amber-700 dark:text-amber-400"> · {overdue} day{overdue === 1 ? "" : "s"} overdue</span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                                {item.key.endsWith(":connect") && (
                                                    <Button size="sm" onClick={() => markInvited(item)}>
                                                        <Send className="h-3.5 w-3.5 mr-1.5" />
                                                        Mark invitation sent
                                                    </Button>
                                                )}
                                                {item.source !== "agent" && (
                                                    <Button size="sm" variant={item.key.endsWith(":connect") ? "outline" : "default"} onClick={() => done(item)}>
                                                        <Check className="h-3.5 w-3.5 mr-1.5" />
                                                        {item.source === "contact" ? "Log it" : "Done"}
                                                    </Button>
                                                )}
                                                <Button size="sm" variant={item.source === "agent" ? "default" : "outline"} onClick={() => open(item)}>
                                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                                    {item.source === "agent" ? "Review" : "Open"}
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
                                                            <DropdownMenuItem key={days} onClick={() => snooze(item, days)}>
                                                                {days} day{days === 1 ? "" : "s"}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <Button size="sm" variant="ghost" onClick={() => skip(item)}>
                                                    <SkipForward className="h-3.5 w-3.5 mr-1.5" />
                                                    Skip
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </section>
                        );
                    })
                )}

                {queue.hiddenCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                        {queue.hiddenCount} more due {queue.hiddenCount === 1 ? "item is" : "items are"} waiting behind your daily limit.
                    </p>
                )}
            </CardContent>

            {logging && (
                <AddEngagementDialog
                    open
                    onOpenChange={(isOpen) => { if (!isOpen) setLogging(null); }}
                    contactId={logging.target.id}
                    onSubmit={async (engagement) => {
                        const saved = await addEngagement(engagement);
                        if (saved) {
                            const item = logging;
                            if (!(await record(item, "done"))) toast.error(SAVE_FAILED);
                            await refresh();
                        }
                        return saved;
                    }}
                />
            )}
        </Card>
    );
}
