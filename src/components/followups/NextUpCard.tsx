import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarClock, Check, Linkedin, Loader2, Mail, Paperclip, Pencil, RotateCcw, SkipForward, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { callFollowUpsApi } from "@/hooks/useJobFollowUps";
import type { AgentFollowUp, TimelineContact } from "@/types/followup";

const KIND: Record<string, string> = {
  chaser: "Follow-up",
  thank_you: "Thank-you",
  deadline_checkin: "Check-in after their date",
  nurture: "Keep-in-touch note",
};

const STATUS: Record<string, string> = {
  planned: "Scheduled, a draft is coming",
  drafting: "Drafting now",
  awaiting_approval: "Waiting for your approval",
  approved: "Approved, will send in their send window",
  sending: "Sending",
  awaiting_manual_send: "Approved, send it on LinkedIn",
  failed: "Not sent",
};

interface Props {
  followUp: AgentFollowUp;
  contact: TimelineContact | undefined;
  /** File name of the resume attached to this application, if any. */
  attachedResume: string | null;
  onChanged: () => void;
}

export function NextUpCard({ followUp: f, contact, attachedResume, onChanged }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(f.draft_body ?? "");
  const [instruction, setInstruction] = useState("");
  const [snoozeDate, setSnoozeDate] = useState("");

  useEffect(() => {
    setBody(f.draft_body ?? "");
    setEditing(false);
  }, [f.id, f.draft_version, f.draft_body]);

  const run = async (label: string, action: Parameters<typeof callFollowUpsApi>[0], payload: Record<string, unknown> = {}, done?: string) => {
    setBusy(label);
    try {
      await callFollowUpsApi(action, { id: f.id, ...payload });
      if (done) toast.success(done);
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const name = contact?.name ?? "this contact";
  const needsYou = f.state === "awaiting_approval";
  const sendAt = f.send_at ? new Date(f.send_at) : new Date(f.due_date);

  return (
    <div className="rounded-xl border-2 border-primary/60 bg-primary/5 p-3 sm:p-4 space-y-3 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Next up: {KIND[f.kind] ?? f.kind}{f.kind === "chaser" ? ` ${f.attempt_no} of 2` : ""} to {name}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {f.channel === "email" ? <Mail className="h-3.5 w-3.5 shrink-0" /> : <Linkedin className="h-3.5 w-3.5 shrink-0" />}
            <span>
              {[f.channel === "email" ? "Email" : "LinkedIn, sent by you", STATUS[f.state] ?? f.state,
                f.state !== "failed" ? formatDistanceToNow(sendAt, { addSuffix: true }) : null].filter(Boolean).join(" · ")}
            </span>
          </div>
        </div>
        {f.edit_notes.length > 0 && <Badge variant="outline">Draft v{f.draft_version}</Badge>}
      </div>

      {f.channel === "email" && ["planned", "awaiting_approval", "failed"].includes(f.state) && (attachedResume || f.attach_resume) && (
        <label className="flex items-start gap-2 text-sm sm:items-center">
          <Switch
            checked={f.attach_resume}
            disabled={!!busy || (!attachedResume && !f.attach_resume)}
            onCheckedChange={(on) =>
              run("attach", "set_attachment", { attach: on }, on ? "Resume will be attached. The draft was updated to match." : "Resume won't be attached.")}
          />
          <Paperclip className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground sm:mt-0" />
          {attachedResume
            ? <span className="min-w-0 break-all">Attach <span className="font-medium">{attachedResume}</span></span>
            : <span className="text-destructive">Resume removed from this application. Attach one in the Resume tab or turn this off.</span>}
          {busy === "attach" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </label>
      )}

      {f.state === "failed" && f.last_error && (
        <p className="text-sm text-destructive">{f.last_error}</p>
      )}

      {f.draft_body && (needsYou || f.state === "awaiting_manual_send" || f.state === "approved") && (
        editing ? (
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} maxLength={5000} className="bg-background" />
        ) : (
          <div className="rounded-md border bg-background p-3 text-sm whitespace-pre-wrap break-words">
            {f.channel === "email" && f.draft_subject && (
              <div className="mb-2 text-xs text-muted-foreground">Subject: {f.draft_subject}</div>
            )}
            {f.draft_body}
          </div>
        )
      )}

      <div className="flex flex-wrap items-center gap-2">
        {needsYou && (
          <>
            <Button
              size="sm"
              disabled={!!busy}
              onClick={() => run("approve", "approve", editing ? { body } : {}, f.channel === "email" ? "Approved. It will go out in their send window." : "Approved. Send it on LinkedIn, then mark it sent.")}
            >
              {busy === "approve" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
              {editing ? "Approve my edit" : "Approve"}
            </Button>
            <Button size="sm" variant="outline" disabled={!!busy} onClick={() => setEditing((v) => !v)}>
              <Pencil className="mr-1 h-4 w-4" /> {editing ? "Cancel edit" : "Edit text"}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" disabled={!!busy}>
                  {busy === "redraft" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
                  Redraft
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 space-y-2">
                <p className="text-sm font-medium">What should change?</p>
                <Input
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Shorter, mention my RAG project"
                  maxLength={500}
                />
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!instruction.trim() || !!busy}
                  onClick={() => run("redraft", "redraft", { instruction }, "New draft ready.").then(() => setInstruction(""))}
                >
                  Redraft
                </Button>
              </PopoverContent>
            </Popover>
          </>
        )}

        {f.state === "awaiting_manual_send" && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(f.draft_body ?? "");
                toast.success("Copied. Paste it into LinkedIn.");
              }}
            >
              Copy message
            </Button>
            {contact?.linkedin_url?.startsWith("https://") && (
              <Button size="sm" variant="outline" asChild>
                <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer">Open profile</a>
              </Button>
            )}
            <Button size="sm" disabled={!!busy} onClick={() => run("sent", "mark_sent", {}, "Logged as sent.")}>
              <Check className="mr-1 h-4 w-4" /> Mark sent
            </Button>
          </>
        )}

        {f.state === "failed" && (
          <Button size="sm" disabled={!!busy} onClick={() => run("retry", "retry", {}, "Queued to send again.")}>
            <RotateCcw className="mr-1 h-4 w-4" /> Retry
          </Button>
        )}

        {["awaiting_approval", "awaiting_manual_send"].includes(f.state) && (
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" disabled={!!busy}>
                <CalendarClock className="mr-1 h-4 w-4" /> Snooze
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 space-y-2">
              {[2, 7, 14].map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => run("snooze", "snooze", { until: new Date(Date.now() + d * 86_400_000).toISOString() }, `Snoozed ${d} days.`)}
                >
                  {d === 7 ? "1 week" : d === 14 ? "2 weeks" : `${d} days`}
                </Button>
              ))}
              <div className="flex gap-2">
                <Input type="date" value={snoozeDate} onChange={(e) => setSnoozeDate(e.target.value)} />
                <Button
                  size="sm"
                  disabled={!snoozeDate}
                  onClick={() => run("snooze", "snooze", { until: new Date(`${snoozeDate}T09:00:00`).toISOString() }, "Snoozed.")}
                >
                  Set
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {f.state !== "sending" && (
          <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => run("skip", "skip", {}, "Skipped.")}>
            <SkipForward className="mr-1 h-4 w-4" /> Skip
          </Button>
        )}
      </div>
    </div>
  );
}
