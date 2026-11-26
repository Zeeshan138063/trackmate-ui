import { useState } from "react";
import { AlertTriangle, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCampaign } from "@/hooks/useCampaign";
import { campaignGaps, normalizeCampaign, type Campaign } from "@/utils/campaign";
import { MAX_LIMIT, MIN_LIMIT } from "@/utils/daily-queue";

interface Form {
    roleTitles: string;
    regions: string;
    remoteOk: boolean;
    citizenships: string;
    languages: string;
    needsSponsorship: boolean;
    yearsExperience: string;
    payFloor: string;
    payCurrency: string;
    earliestStart: string;
    dailyCapacity: string;
}

/**
 * Campaign setup (REQ-001): what the user is looking for and what limits them. Job fit caps and
 * the Today list read this. Nothing here is sent anywhere but the user's own row.
 */
export function CampaignSettings() {
    const { campaign, saved, loading, error, save } = useCampaign();
    if (loading) {
        return <Card><CardContent className="p-6 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading your campaign</CardContent></Card>;
    }
    return <CampaignForm campaign={campaign} saved={saved} error={error} save={save} />;
}

function CampaignForm({ campaign, saved, error, save }: { campaign: Campaign; saved: boolean; error: string | null; save: (next: Campaign) => Promise<string | null> }) {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<Form>(() => ({
        roleTitles: campaign.roleTitles.join("\n"),
        regions: campaign.regions.join(", "),
        remoteOk: campaign.remoteOk,
        citizenships: campaign.citizenships.join(", "),
        languages: campaign.languages.join(", "),
        needsSponsorship: campaign.needsSponsorship,
        yearsExperience: campaign.yearsExperience?.toString() ?? "",
        payFloor: campaign.payFloor?.toString() ?? "",
        payCurrency: campaign.payCurrency,
        earliestStart: campaign.earliestStart ?? "",
        dailyCapacity: String(campaign.dailyCapacity),
    }));

    const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));
    const draft = normalizeCampaign(form);
    const gaps = campaignGaps(draft);

    const onSave = async () => {
        setSaving(true);
        const problem = await save(draft);
        setSaving(false);
        if (problem) toast({ variant: "destructive", title: "Campaign not saved", description: problem });
        else toast({ title: "Campaign saved", description: "Job matching and your Today list now use it." });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Campaign</CardTitle>
                <CardDescription>
                    What you are looking for and what limits you. JobOS uses it to flag jobs you cannot take and to size your Today list.
                    {!saved && " Not set up yet."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                {error && (
                    <p className="text-sm text-destructive flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        Your campaign could not be loaded ({error}). Saving may fail until the database is updated.
                    </p>
                )}

                <div className="space-y-2">
                    <Label htmlFor="campaign-roles">Role titles</Label>
                    <Textarea id="campaign-roles" rows={3} value={form.roleTitles} onChange={(e) => set("roleTitles", e.target.value)} placeholder={"Backend Engineer\nPython Developer"} />
                    <p className="text-xs text-muted-foreground">One per line. A job matches when its title contains every word of one of these.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="campaign-regions">Regions you will work in</Label>
                        <Input id="campaign-regions" value={form.regions} onChange={(e) => set("regions", e.target.value)} placeholder="Germany, Netherlands, UAE" />
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                        <Label htmlFor="campaign-remote">Remote roles are fine</Label>
                        <Switch id="campaign-remote" checked={form.remoteOk} onCheckedChange={(v) => set("remoteOk", v)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="campaign-citizenships">Citizenships you hold</Label>
                        <Input id="campaign-citizenships" value={form.citizenships} onChange={(e) => set("citizenships", e.target.value)} placeholder="Pakistan" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="campaign-languages">Languages you can work in</Label>
                        <Input id="campaign-languages" value={form.languages} onChange={(e) => set("languages", e.target.value)} placeholder="English, Urdu" />
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                        <Label htmlFor="campaign-sponsorship">I need visa sponsorship</Label>
                        <Switch id="campaign-sponsorship" checked={form.needsSponsorship} onCheckedChange={(v) => set("needsSponsorship", v)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="campaign-years">Years of experience</Label>
                        <Input id="campaign-years" type="number" min={0} max={60} value={form.yearsExperience} onChange={(e) => set("yearsExperience", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="campaign-pay">Lowest yearly pay you will accept</Label>
                        <div className="flex gap-2">
                            <Input id="campaign-pay" type="number" min={0} value={form.payFloor} onChange={(e) => set("payFloor", e.target.value)} />
                            <Input aria-label="Currency" className="w-24" maxLength={3} value={form.payCurrency} onChange={(e) => set("payCurrency", e.target.value.toUpperCase())} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="campaign-start">Earliest start date</Label>
                        <Input id="campaign-start" type="date" value={form.earliestStart} onChange={(e) => set("earliestStart", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="campaign-capacity">Items a day on your Today list</Label>
                        <Input id="campaign-capacity" type="number" min={MIN_LIMIT} max={MAX_LIMIT} value={form.dailyCapacity} onChange={(e) => set("dailyCapacity", e.target.value)} />
                        <p className="text-xs text-muted-foreground">Between {MIN_LIMIT} and {MAX_LIMIT}.</p>
                    </div>
                </div>

                {gaps.length > 0 && (
                    <ul className="text-xs text-amber-700 space-y-1">
                        {gaps.map((g) => <li key={g} className="flex items-start gap-1.5"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />{g}</li>)}
                    </ul>
                )}

                <div className="flex justify-end">
                    <Button onClick={onSave} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save campaign
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
