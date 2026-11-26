import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, ScanSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { MasterProfile } from "@/types/resume";
import { buildReport, type ConsistencyReport } from "@/utils/consistency";

interface TailoredResume {
    label: string;
    resume: MasterProfile | null;
}

/** The newest tailored version for each application, with its job's name. */
async function loadTailored(): Promise<TailoredResume[]> {
    const { data, error } = await supabase
        .from("application_resumes" as never)
        .select("job_id, resume_json, created_at, jobs(position, company)")
        .eq("source", "tailored")
        .not("resume_json", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);
    if (error) throw new Error(error.message);
    const seen = new Set<string>();
    const out: TailoredResume[] = [];
    for (const row of (data ?? []) as unknown as { job_id: string; resume_json: MasterProfile | null; jobs: { position?: string; company?: string } | null }[]) {
        if (seen.has(row.job_id)) continue;
        seen.add(row.job_id);
        out.push({ label: `Resume for ${row.jobs?.position ?? "a job"} at ${row.jobs?.company ?? "unknown company"}`, resume: row.resume_json });
    }
    return out;
}

/**
 * Consistency checker (REQ-002): compares the Master Profile with every tailored resume and with
 * LinkedIn text the user pastes. It reports differences; it changes nothing and uses no AI. The
 * pasted text stays in this dialog and is not saved or sent anywhere.
 */
export function ConsistencyChecker({ profile }: { profile: MasterProfile }) {
    const [open, setOpen] = useState(false);
    const [tailored, setTailored] = useState<TailoredResume[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [linkedIn, setLinkedIn] = useState("");
    const [report, setReport] = useState<ConsistencyReport | null>(null);

    useEffect(() => {
        if (!open) return;
        setReport(null);
        setLoadError(null);
        setTailored(null);
        loadTailored().then(setTailored).catch((e: Error) => {
            setLoadError(e.message);
            setTailored([]);
        });
    }, [open]);

    const nothingToCompare = tailored !== null && tailored.length === 0 && !linkedIn.trim();
    const bySource = useMemo(() => {
        const map = new Map<string, ConsistencyReport["findings"]>();
        for (const f of report?.findings ?? []) map.set(f.source, [...(map.get(f.source) ?? []), f]);
        return map;
    }, [report]);

    return (
        <>
            <Button size="sm" variant="outline" className="gap-2 bg-background shadow-sm" onClick={() => setOpen(true)}>
                <ScanSearch className="h-4 w-4" />
                Check consistency
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Consistency check</DialogTitle>
                        <DialogDescription>
                            Recruiters compare your resume with your LinkedIn profile. This checks that your dates, titles, employers, schools and location agree everywhere. It reports differences and changes nothing.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="text-sm">
                            {tailored === null ? (
                                <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading your tailored resumes</span>
                            ) : loadError ? (
                                <span className="flex items-start gap-2 text-destructive"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />Your tailored resumes could not be loaded ({loadError}). You can still check LinkedIn.</span>
                            ) : (
                                <span className="text-muted-foreground">{tailored.length === 0 ? "No tailored resumes saved yet." : `${tailored.length} tailored resume${tailored.length === 1 ? "" : "s"} will be compared with your Master Profile.`}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="linkedin-text" className="text-sm font-medium">Your LinkedIn profile text (optional)</label>
                            <Textarea
                                id="linkedin-text"
                                rows={6}
                                value={linkedIn}
                                onChange={(e) => setLinkedIn(e.target.value)}
                                placeholder="Open your own LinkedIn profile, select the page text (Experience and Education included), copy it and paste it here."
                            />
                            <p className="text-xs text-muted-foreground">You paste it yourself; JobOS does not read LinkedIn. The text is used for this check only and is not saved.</p>
                        </div>

                        <Button onClick={() => setReport(buildReport(profile, tailored ?? [], linkedIn))} disabled={tailored === null || nothingToCompare}>
                            Run check
                        </Button>
                        {nothingToCompare && <p className="text-xs text-muted-foreground">Paste your LinkedIn text or save a tailored resume to have something to compare.</p>}

                        {report && (
                            <div className="space-y-4 border-t pt-4">
                                {report.findings.length === 0 ? (
                                    <p className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />No differences found in {report.sources.length} document{report.sources.length === 1 ? "" : "s"}.</p>
                                ) : (
                                    <p className="text-sm">
                                        <strong>{report.conflicts}</strong> conflict{report.conflicts === 1 ? "" : "s"} and <strong>{report.checks}</strong> thing{report.checks === 1 ? "" : "s"} to check across {report.sources.length} document{report.sources.length === 1 ? "" : "s"}.
                                    </p>
                                )}
                                {report.sources.map(({ source }) => {
                                    const findings = bySource.get(source) ?? [];
                                    return (
                                        <section key={source} className="space-y-2">
                                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                                {source}
                                                {findings.length === 0 && <Badge variant="outline" className="text-emerald-700 border-emerald-300">Agrees</Badge>}
                                            </h3>
                                            {findings.map((f, i) => (
                                                <div key={i} className={`rounded-lg border p-3 text-sm ${f.severity === "conflict" ? "border-red-300 bg-red-50 dark:bg-red-950/30" : "border-amber-300 bg-amber-50 dark:bg-amber-950/30"}`}>
                                                    <p className="font-medium flex items-start gap-2">
                                                        {f.severity === "conflict" ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-red-600" /> : <Info className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />}
                                                        <span>{f.subject}: {f.message}</span>
                                                    </p>
                                                    {(f.master || f.other) && (
                                                        <dl className="mt-1 ml-6 text-xs text-muted-foreground space-y-0.5">
                                                            {f.master && <div><dt className="inline font-medium">Master Profile: </dt><dd className="inline">{f.master}</dd></div>}
                                                            {f.other && <div><dt className="inline font-medium">{source === "LinkedIn" ? "LinkedIn" : "This resume"}: </dt><dd className="inline">{f.other}</dd></div>}
                                                        </dl>
                                                    )}
                                                </div>
                                            ))}
                                        </section>
                                    );
                                })}
                                <p className="text-xs text-muted-foreground">Decide which side is right and fix the other. If your Master Profile is wrong, fix it first: every tailored resume starts from it.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
