import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Copy, Loader2, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AIGenerator } from "@/services/AIGenerator";
import type { Contact } from "@/types/contact";
import type { Engagement } from "@/types/engagement";
import type { MasterProfile } from "@/types/resume";
import {
    ASK_LABELS,
    ASK_MAX_CHARS,
    availableAsks,
    checkDraft,
    personalContext,
    recommendedAsk,
    senderFacts,
    type AskKind,
} from "@/utils/message-draft";

interface MessageDrafterProps {
    contact: Contact;
    /** The user's other contacts, to catch a draft reused from someone else. */
    otherContacts: Contact[];
    engagements: Engagement[];
    profile: MasterProfile | null;
    onSaveDraft: (text: string) => Promise<unknown>;
    onLogSent: (engagement: Omit<Engagement, "id" | "user_id" | "created_at">) => Promise<unknown>;
    onInvitationSent?: () => void;
}

/**
 * Drafts one message for one contact (REQ-005). The draft is built from the user's notes about
 * the person; JobOS never sends it (P2). The user copies it, sends it on LinkedIn, then marks it sent.
 */
export function MessageDrafter({ contact, otherContacts, engagements, profile, onSaveDraft, onLogSent, onInvitationSent }: MessageDrafterProps) {
    const { toast } = useToast();
    const stage = contact.warmth_stage ?? "identified";
    const hasInbound = engagements.some((e) => e.direction === "inbound");
    const asks = availableAsks(stage, hasInbound);
    const doNotContact = contact.relationship_stage === "do_not_contact";

    const [ask, setAsk] = useState<AskKind>(recommendedAsk(stage, hasInbound));
    const [draft, setDraft] = useState(contact.invitation_note ?? "");
    const [busy, setBusy] = useState<"draft" | "sent" | null>(null);

    useEffect(() => {
        setDraft(contact.invitation_note ?? "");
    }, [contact.id, contact.invitation_note]);

    // Keep the ask valid when the stage or the interaction log changes.
    useEffect(() => {
        if (!asks.includes(ask)) setAsk(recommendedAsk(stage, hasInbound));
    }, [asks, ask, stage, hasInbound]);

    const others = useMemo(
        () => otherContacts.filter((c) => c.id !== contact.id && c.invitation_note).map((c) => ({ name: c.name, text: c.invitation_note as string })),
        [otherContacts, contact.id],
    );
    const check = useMemo(() => checkDraft(draft, ask, contact, others), [draft, ask, contact, others]);
    const hasContext = personalContext(contact).length > 0;

    const generate = async () => {
        setBusy("draft");
        try {
            setDraft(await AIGenerator.draftMessage(
                contact,
                { firstName: profile?.contact?.firstName ?? "", targetTitle: profile?.targetTitle, facts: senderFacts(profile) },
                ask,
            ));
        } catch (error) {
            toast({ variant: "destructive", title: "Draft not written", description: error instanceof Error ? error.message : "Could not write the draft." });
        } finally {
            setBusy(null);
        }
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(draft);
            toast({ title: "Copied", description: "Paste it into LinkedIn and send it yourself." });
        } catch {
            toast({ variant: "destructive", title: "Could not copy", description: "Select the text and copy it by hand." });
        }
    };

    const markSent = async () => {
        setBusy("sent");
        try {
            await onSaveDraft(draft);
            await onLogSent({
                contact_id: contact.id,
                type: "linkedin",
                direction: "outbound",
                date: new Date().toISOString(),
                notes: `${ASK_LABELS[ask]}: ${draft.trim()}`,
                sentiment: "neutral",
            });
            if (ask === "connect" && !contact.invitation_sent_at) onInvitationSent?.();
        } finally {
            setBusy(null);
        }
    };

    if (doNotContact) {
        return <p className="text-sm text-muted-foreground p-4 border rounded-lg">This contact is marked do not contact. Drafting is off.</p>;
    }

    return (
        <div className="space-y-3">
            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                <h3 className="font-medium text-indigo-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    Message draft
                </h3>
                <p className="text-sm text-indigo-800 mt-1">
                    Written from your notes about {contact.name}. You send it yourself on LinkedIn; JobOS never sends messages.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Ask</label>
                    <Select value={ask} onValueChange={(v) => setAsk(v as AskKind)}>
                        <SelectTrigger className="h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {asks.map((a) => <SelectItem key={a} value={a}>{ASK_LABELS[a]}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-end justify-end">
                    <Button onClick={generate} disabled={busy !== null || !hasContext} size="sm" variant="outline" className="gap-2 w-full h-8">
                        {busy === "draft" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-indigo-600" />}
                        {draft ? "Write again" : "Write draft"}
                    </Button>
                </div>
            </div>

            {!asks.includes("referral") && (
                <p className="text-xs text-muted-foreground">
                    {asks.includes("advice")
                        ? "A referral ask opens once they have replied (log it under Interactions) and the stage is In conversation."
                        : "Advice and call asks open once you are connected."}
                </p>
            )}
            {!hasContext && (
                <p className="text-xs text-amber-700 flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Add a note about this person first (Edit contact: how you know them, or why you are writing). Drafts are built from your notes.
                </p>
            )}

            <Textarea
                className="min-h-[140px] bg-slate-50 border-slate-200"
                placeholder="Write a draft, or type your own message here."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
            />

            {draft.trim() && !check.ok && (
                <ul className="text-xs text-amber-700 space-y-1">
                    {check.problems.map((p) => (
                        <li key={p} className="flex items-start gap-1.5"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />{p}</li>
                    ))}
                </ul>
            )}

            <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{draft.trim().length} / {ASK_MAX_CHARS[ask]} characters</span>
                <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onSaveDraft(draft)} disabled={!draft.trim() || busy !== null}>
                        <Save className="h-3 w-3 mr-2" />Save draft
                    </Button>
                    <Button size="sm" variant="outline" onClick={copy} disabled={!check.ok}>
                        <Copy className="h-3 w-3 mr-2" />Copy
                    </Button>
                    <Button size="sm" onClick={markSent} disabled={!check.ok || busy !== null}>
                        {busy === "sent" ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Check className="h-3 w-3 mr-2" />}Mark as sent
                    </Button>
                </div>
            </div>
        </div>
    );
}
