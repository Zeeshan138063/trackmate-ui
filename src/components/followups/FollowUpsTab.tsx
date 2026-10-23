import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useJobFollowUps } from "@/hooks/useJobFollowUps";
import { HistoryTree } from "./HistoryTree";
import { NextUpCard } from "./NextUpCard";

interface JobFollowUpSettings {
  applied_via: "job_board" | "email" | "linkedin" | null;
  mail_account_id: string | null;
  do_not_followup: boolean;
  followups_paused: boolean;
  response_promised_by: string | null;
}

export function FollowUpsTab({ jobId, appliedOn }: { jobId: string; appliedOn?: string | null }) {
  const { loading, branches, contacts, nextUp, mailAccounts, refresh } = useJobFollowUps(jobId);
  const [settings, setSettings] = useState<JobFollowUpSettings | null>(null);

  useEffect(() => {
    supabase
      .from("jobs")
      .select("applied_via, mail_account_id, do_not_followup, followups_paused, response_promised_by")
      .eq("id", jobId)
      .single()
      .then(({ data }) => setSettings(data as unknown as JobFollowUpSettings));
  }, [jobId]);

  const save = async (patch: Partial<JobFollowUpSettings>) => {
    const prev = settings;
    setSettings((s) => (s ? { ...s, ...patch } : s));
    const { error } = await supabase.from("jobs").update(patch as never).eq("id", jobId);
    if (error) {
      setSettings(prev);
      toast.error("Could not save follow-up settings.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading follow-ups
      </div>
    );
  }

  const activeInboxes = mailAccounts.filter((a) => a.status === "active");

  return (
    <div className="space-y-6">
      {nextUp ? (
        <NextUpCard followUp={nextUp} contact={contacts.find((c) => c.id === nextUp.contact_id)} onChanged={refresh} />
      ) : (
        <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          {contacts.length === 0
            ? "Link a recruiter or hiring manager in the Contacts tab, and set the Date Applied, so follow-ups can be planned."
            : "No follow-up due right now. The next one is planned automatically from this application's history."}
        </div>
      )}

      <HistoryTree branches={branches} appliedOn={appliedOn} />

      {settings && (
        <details className="rounded-lg border p-4">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <Settings2 className="h-4 w-4" /> Follow-up settings for this application
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Applied via</Label>
              <Select value={settings.applied_via ?? "unset"} onValueChange={(v) => save({ applied_via: v === "unset" ? null : v as JobFollowUpSettings["applied_via"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Not set</SelectItem>
                  <SelectItem value="job_board">Job board or ATS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="linkedin">LinkedIn message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Send email follow-ups from</Label>
              {activeInboxes.length ? (
                <Select value={settings.mail_account_id ?? "auto"} onValueChange={(v) => save({ mail_account_id: v === "auto" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">{activeInboxes.length === 1 ? activeInboxes[0].address : "The inbox I applied from"}</SelectItem>
                    {activeInboxes.map((a) => <SelectItem key={a.id} value={a.id}>{a.address}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No inbox connected. <Link to="/settings?tab=integrations" className="underline">Connect Gmail or Outlook</Link>
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promised">They said they'd reply by</Label>
              <Input
                id="promised"
                type="date"
                value={settings.response_promised_by ?? ""}
                onChange={(e) => save({ response_promised_by: e.target.value || null })}
              />
            </div>
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="pause">Pause follow-ups</Label>
                <Switch id="pause" checked={settings.followups_paused} onCheckedChange={(v) => save({ followups_paused: v })} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="dnf">Posting says no follow-ups</Label>
                <Switch id="dnf" checked={settings.do_not_followup} onCheckedChange={(v) => save({ do_not_followup: v })} />
              </div>
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
