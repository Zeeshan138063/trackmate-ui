import { useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Linkedin, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ContactBranch, TimelineItem } from "@/types/followup";

const REPLY_LABEL: Record<string, string> = {
  interview_invite: "Interview invite",
  rejection: "Rejection",
  still_reviewing: "Still reviewing",
  question_for_you: "Question for you",
  auto_reply_ooo: "Out of office",
  other: "Reply",
};

const FOLLOWUP_TITLE: Record<string, string> = {
  chaser: "Follow-up",
  thank_you: "Thank-you",
  deadline_checkin: "Check-in",
  nurture: "Keep in touch",
};

type Tone = "sent" | "reply" | "waiting" | "planned" | "failed" | "closed";

const DOT: Record<Tone, string> = {
  sent: "bg-muted-foreground/60 border-muted-foreground/60",
  reply: "bg-emerald-500 border-emerald-500",
  waiting: "bg-primary border-primary",
  planned: "bg-background border-muted-foreground/50",
  failed: "bg-destructive border-destructive",
  closed: "bg-background border-muted-foreground/30",
};

const CARD: Record<Tone, string> = {
  sent: "border-border",
  reply: "border-emerald-500/60",
  waiting: "border-primary border-dashed bg-primary/5",
  planned: "border-dashed border-muted-foreground/40",
  failed: "border-destructive/60",
  closed: "border-dashed border-muted-foreground/20 opacity-60",
};

function describe(item: TimelineItem): { tone: Tone; title: string; subtitle: string; channel: string } {
  if (item.type === "engagement") {
    const e = item.engagement;
    const inbound = e.direction === "inbound";
    const via = e.provider ? (e.provider === "gmail" ? "Gmail" : "Outlook") : e.type === "linkedin" ? "LinkedIn" : e.type;
    const title = inbound
      ? REPLY_LABEL[e.classification ?? ""] ?? "Reply received"
      : e.kind === "application" ? "Applied" : e.kind === "thank_you" ? "Thank-you sent" : e.kind === "followup" ? "Follow-up sent" : "Message sent";
    return { tone: inbound ? "reply" : "sent", title, subtitle: `${inbound ? "From them" : "From you"} · ${via}`, channel: e.type };
  }
  const f = item.followUp;
  const name = `${FOLLOWUP_TITLE[f.kind] ?? f.kind}${f.kind === "chaser" ? ` ${f.attempt_no}` : ""}`;
  const map: Record<string, [Tone, string]> = {
    planned: ["planned", "scheduled"],
    drafting: ["planned", "drafting"],
    awaiting_approval: ["waiting", "awaiting your approval"],
    approved: ["planned", "approved, sending soon"],
    sending: ["planned", "sending"],
    awaiting_manual_send: ["waiting", "send it on LinkedIn"],
    failed: ["failed", "not sent"],
    skipped: ["closed", "skipped"],
    cancelled: ["closed", "cancelled, they replied"],
  };
  const [tone, status] = map[f.state] ?? ["planned", f.state];
  return { tone, title: name, subtitle: status, channel: f.channel };
}

function dayLabel(at: Date, start: Date | null): string {
  if (!start) return format(at, "d MMM");
  const n = differenceInCalendarDays(at, start);
  return n >= 0 ? `Day ${n}` : format(at, "d MMM");
}

export function HistoryTree({ branches, appliedOn }: { branches: ContactBranch[]; appliedOn: string | null | undefined }) {
  const [open, setOpen] = useState<TimelineItem | null>(null);

  const firstOutbound = branches
    .flatMap((b) => b.items)
    .filter((i) => i.type === "engagement" && i.engagement.kind === "application")
    .map((i) => i.at)
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const start = appliedOn ? new Date(appliedOn) : firstOutbound ?? null;

  return (
    <div className="space-y-4">
      {start && (
        <div className="flex justify-center">
          <div className="rounded-lg border px-4 py-2 text-sm font-medium">Day 0 · Applied {format(start, "d MMM yyyy")}</div>
        </div>
      )}

      <div className={cn("grid gap-6", branches.length > 1 ? "md:grid-cols-2" : "", branches.length > 2 ? "lg:grid-cols-3" : "")}>
        {branches.map(({ contact, items }) => (
          <section key={contact.id} aria-label={`History with ${contact.name}`} className="min-w-0">
            <header className="mb-3 border-b pb-2">
              <div className="truncate font-semibold">{contact.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {[contact.position ?? contact.interaction_type, contact.email ? "email" : null, contact.linkedin_url ? "LinkedIn" : null]
                  .filter(Boolean).join(" · ") || "No email or LinkedIn yet"}
              </div>
            </header>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing yet. {contact.email || contact.linkedin_url ? "The first follow-up is planned after you apply." : "Add an email or LinkedIn URL to this contact so follow-ups can be planned."}
              </p>
            ) : (
              <ol className="relative ml-2 border-l-2 border-muted">
                {items.map((item, i) => {
                  const d = describe(item);
                  const Icon = d.channel === "linkedin" ? Linkedin : Mail;
                  const Dir = item.type === "engagement" && item.engagement.direction === "inbound" ? ArrowDownLeft : ArrowUpRight;
                  return (
                    <li key={`${item.type}-${item.type === "engagement" ? item.engagement.id : item.followUp.id}-${i}`} className="relative pb-4 pl-5 last:pb-0">
                      <span className={cn("absolute -left-[7px] top-3 h-3 w-3 rounded-full border-2", DOT[d.tone])} aria-hidden />
                      <button
                        type="button"
                        onClick={() => setOpen(item)}
                        className={cn("w-full rounded-lg border p-2.5 text-left transition hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring", CARD[d.tone])}
                      >
                        <div className="flex items-center justify-between gap-2 text-sm font-medium">
                          <span className="truncate">{dayLabel(item.at, start)} · {d.title}</span>
                          <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
                            <Dir className="h-3.5 w-3.5" />
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{d.subtitle}</div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(["sent", "reply", "waiting", "planned", "failed"] as Tone[]).map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full border-2", DOT[t])} />
            {{ sent: "sent", reply: "reply", waiting: "needs you", planned: "planned", failed: "not sent", closed: "" }[t]}
          </span>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{describe(open).title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <div className="text-muted-foreground">{format(open.at, "EEE d MMM yyyy, HH:mm")} · {describe(open).subtitle}</div>
                {open.type === "engagement" ? (
                  <>
                    {open.engagement.subject && <div className="font-medium">{open.engagement.subject}</div>}
                    <div className="whitespace-pre-wrap rounded-md bg-muted/40 p-3">{open.engagement.notes || "No text saved."}</div>
                  </>
                ) : (
                  <>
                    {open.followUp.draft_subject && <div className="font-medium">{open.followUp.draft_subject}</div>}
                    <div className="whitespace-pre-wrap rounded-md bg-muted/40 p-3">{open.followUp.draft_body || "Not drafted yet."}</div>
                    {open.followUp.edit_notes.length > 0 && (
                      <div className="text-xs text-muted-foreground">Your edits: {open.followUp.edit_notes.join(" · ")}</div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
