import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { callFollowUpsApi } from "@/hooks/useJobFollowUps";
import type { MailAccountSummary } from "@/types/followup";

const OAUTH_HOSTS = ["accounts.google.com", "login.microsoftonline.com"];

const CALLBACK_MESSAGES: Record<string, [string, "success" | "error"]> = {
  connected: ["Inbox connected. Replies will now stop follow-ups automatically.", "success"],
  denied: ["Connection cancelled.", "error"],
  missing_permissions: ["Please allow both 'send' and 'read' permissions so replies can be detected.", "error"],
  invalid_state: ["That connection link expired. Please try again.", "error"],
  error: ["Could not connect the inbox. Please try again.", "error"],
};

interface Prefs {
  enabled: boolean;
  facts: string;
  signature: string;
  timezone: string;
}

export function FollowUpSettings() {
  const [params, setParams] = useSearchParams();
  const [accounts, setAccounts] = useState<MailAccountSummary[]>([]);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({ enabled: true, facts: "", signature: "", timezone: "" });
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [a, t, s] = await Promise.all([
      supabase.from("mail_accounts" as never).select("id, provider, address, status").order("created_at"),
      supabase.from("telegram_links" as never).select("chat_id").maybeSingle(),
      supabase.from("followup_settings" as never).select("enabled, facts, signature, timezone").maybeSingle(),
    ]);
    setAccounts((a.data ?? []) as unknown as MailAccountSummary[]);
    setTelegramLinked(!!(t.data as { chat_id?: number } | null)?.chat_id);
    const sp = s.data as Prefs | null;
    setPrefs({
      enabled: sp?.enabled ?? true,
      facts: sp?.facts ?? "",
      signature: sp?.signature ?? "",
      timezone: sp?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Result of the OAuth round trip.
  useEffect(() => {
    const result = params.get("followups");
    if (!result) return;
    const [message, kind] = CALLBACK_MESSAGES[result] ?? CALLBACK_MESSAGES.error;
    (kind === "success" ? toast.success : toast.error)(message);
    params.delete("followups");
    params.delete("provider");
    setParams(params, { replace: true });
  }, [params, setParams]);

  const connect = async (provider: "gmail" | "outlook") => {
    setBusy(provider);
    try {
      const { data, error } = await supabase.functions.invoke("followups-oauth", { body: { action: "start", provider } });
      if (error || !data?.url) throw new Error("Could not start the connection.");
      const url = new URL(data.url);
      if (url.protocol !== "https:" || !OAUTH_HOSTS.includes(url.hostname)) throw new Error("Unexpected sign-in address.");
      window.location.assign(url.toString());
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  };

  const disconnect = async (a: MailAccountSummary) => {
    if (!window.confirm(`Disconnect ${a.address}? Follow-ups from it will stop until you reconnect.`)) return;
    const { error } = await supabase.from("mail_accounts" as never).delete().eq("id", a.id);
    if (error) toast.error("Could not disconnect.");
    else {
      toast.success("Disconnected.");
      load();
    }
  };

  const linkTelegram = async () => {
    setBusy("telegram");
    try {
      const { url } = await callFollowUpsApi("telegram_link");
      const u = new URL(String(url));
      if (u.protocol !== "https:" || u.hostname !== "t.me") throw new Error("Unexpected link.");
      window.open(u.toString(), "_blank", "noopener,noreferrer");
      toast.message("Tap Start in Telegram to finish linking (the link works for 15 minutes).");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const savePrefs = async () => {
    setBusy("prefs");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setBusy(null);
    const { error } = await supabase.from("followup_settings" as never).upsert({
      user_id: user.id,
      enabled: prefs.enabled,
      facts: prefs.facts.slice(0, 4000),
      signature: prefs.signature.slice(0, 500),
      timezone: prefs.timezone || null,
      updated_at: new Date().toISOString(),
    } as never);
    setBusy(null);
    if (error) toast.error("Could not save.");
    else toast.success("Saved.");
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Follow-up agent</CardTitle>
        <CardDescription>
          Drafts follow-ups for your applications. Nothing is sent until you approve it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 p-4 pt-0 sm:p-6 sm:pt-0">
        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label className="text-base">Inboxes</Label>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button size="sm" variant="outline" disabled={!!busy} onClick={() => connect("gmail")}>
                {busy === "gmail" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Mail className="mr-1 h-4 w-4" />} Connect Gmail
              </Button>
              <Button size="sm" variant="outline" disabled={!!busy} onClick={() => connect("outlook")}>
                {busy === "outlook" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Mail className="mr-1 h-4 w-4" />} Connect Outlook
              </Button>
            </div>
          </div>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Connect the inbox you apply from. JobOS sends approved follow-ups as replies in the same thread and watches for
              replies from your contacts only. Other mail is never stored.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {accounts.map((a) => (
                <li key={a.id} className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge variant="outline" className="shrink-0">{a.provider === "gmail" ? "Gmail" : "Outlook"}</Badge>
                    <span className="min-w-0 break-all sm:truncate sm:break-normal" title={a.address}>{a.address}</span>
                    {a.status !== "active" && <Badge variant="destructive" className="shrink-0 whitespace-nowrap">Reconnect needed</Badge>}
                  </div>
                  <div className="flex shrink-0 items-center justify-end gap-2">
                    {a.status !== "active" && (
                      <Button size="sm" variant="outline" onClick={() => connect(a.provider)}>Reconnect</Button>
                    )}
                    <Button size="icon" variant="ghost" aria-label={`Disconnect ${a.address}`} onClick={() => disconnect(a)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <Label className="text-base">Telegram approvals</Label>
            <p className="text-sm text-muted-foreground">
              {telegramLinked ? "Linked. Drafts arrive in Telegram with Approve, Edit, Snooze and Skip." : "Approve drafts from your phone in one tap."}
            </p>
          </div>
          <Button size="sm" className="w-full sm:w-auto sm:shrink-0" variant={telegramLinked ? "outline" : "default"} disabled={!!busy} onClick={linkTelegram}>
            {busy === "telegram" && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {telegramLinked ? "Relink" : "Connect Telegram"}
          </Button>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="fu-enabled" className="text-base">Plan follow-ups automatically</Label>
            <Switch id="fu-enabled" checked={prefs.enabled} onCheckedChange={(v) => setPrefs((p) => ({ ...p, enabled: v }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fu-facts">Facts the agent may mention (one per line)</Label>
            <Textarea
              id="fu-facts"
              rows={6}
              maxLength={4000}
              value={prefs.facts}
              onChange={(e) => setPrefs((p) => ({ ...p, facts: e.target.value }))}
              placeholder={"Shipped RAG to production for a German healthtech company\nBuilt and run JobOS (jobos.dev), an AI job-search platform"}
            />
            <p className="text-xs text-muted-foreground">
              The agent only cites what is written here, so every follow-up stays true. Drafts that mention anything else are flagged.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fu-sig">Sign-off</Label>
              <Textarea id="fu-sig" rows={3} maxLength={500} value={prefs.signature} onChange={(e) => setPrefs((p) => ({ ...p, signature: e.target.value }))} placeholder={"Best,\nZeeshan"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fu-tz">Your time zone (quiet hours 23:00 to 09:00)</Label>
              <Input id="fu-tz" value={prefs.timezone} onChange={(e) => setPrefs((p) => ({ ...p, timezone: e.target.value }))} placeholder="Asia/Karachi" />
            </div>
          </div>
          <Button onClick={savePrefs} disabled={!!busy} className="w-full sm:w-auto">
            {busy === "prefs" && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Save
          </Button>
        </section>
      </CardContent>
    </Card>
  );
}
