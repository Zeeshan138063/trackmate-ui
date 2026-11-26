import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Contact } from "@/types/contact";
import { MAX_FILE_BYTES, parseConnectionsCsv, planImport, rowMatches, toContact, type ParsedConnections } from "@/utils/linkedin-csv";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    existing: Contact[];
    onImport: (rows: Partial<Contact>[]) => Promise<{ added: number; error: string | null }>;
}

const PREVIEW = 200;

/**
 * Imports the user's own LinkedIn "Connections.csv" export. The file is read in the browser; JobOS
 * never signs in to or reads LinkedIn (P1). The user chooses which people to add.
 */
export function ImportConnectionsDialog({ open, onOpenChange, existing, onImport }: Props) {
    const [parsed, setParsed] = useState<ParsedConnections | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [query, setQuery] = useState("");
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<{ added: number; error: string | null } | null>(null);

    const plan = useMemo(() => (parsed ? planImport(parsed.rows, existing) : null), [parsed, existing]);
    const visible = useMemo(() => (plan ? plan.fresh.filter((r) => rowMatches(r, query)) : []), [plan, query]);

    const reset = () => {
        setParsed(null);
        setFileError(null);
        setSelected(new Set());
        setQuery("");
        setResult(null);
    };

    const onFile = async (file: File | undefined) => {
        reset();
        if (!file) return;
        if (file.size > MAX_FILE_BYTES) {
            setFileError("That file is larger than 5 MB. LinkedIn's Connections.csv is much smaller; check you picked the right file.");
            return;
        }
        try {
            const next = parseConnectionsCsv(await file.text());
            if (next.error) {
                setFileError(next.error);
                return;
            }
            setParsed(next);
            // Nothing is ticked to start with: a few hundred imported people would each get a next step.
        } catch {
            setFileError("The file could not be read.");
        }
    };

    const toggle = (index: number, on: boolean) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (on) next.add(index); else next.delete(index);
            return next;
        });
    const allVisibleOn = visible.length > 0 && visible.every((r) => selected.has(r.index));
    const toggleVisible = (on: boolean) =>
        setSelected((prev) => {
            const next = new Set(prev);
            for (const r of visible) { if (on) next.add(r.index); else next.delete(r.index); }
            return next;
        });

    const run = async () => {
        if (!plan) return;
        setBusy(true);
        const outcome = await onImport(plan.fresh.filter((r) => selected.has(r.index)).map(toContact));
        setBusy(false);
        setResult(outcome);
        if (!outcome.error) {
            setParsed(null);
            setSelected(new Set());
        }
    };

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next); }}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import your LinkedIn connections</DialogTitle>
                    <DialogDescription>
                        Uses the file LinkedIn gives you. On LinkedIn: Settings &amp; Privacy, Data privacy, Get a copy of your data, choose Connections, then download the archive and pick Connections.csv here. The file is read in your browser; JobOS does not sign in to LinkedIn.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <label className="flex items-center gap-3 rounded-lg border border-dashed p-4 cursor-pointer hover:bg-muted/40">
                        <FileUp className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">Choose Connections.csv</span>
                        <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
                    </label>

                    {fileError && (
                        <p role="alert" className="text-sm text-destructive flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />{fileError}</p>
                    )}

                    {result && (
                        <p role="status" className={`text-sm flex items-start gap-2 ${result.error ? "text-destructive" : ""}`}>
                            {result.error ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> : <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />}
                            {result.added} contact{result.added === 1 ? "" : "s"} added{result.error ? `. Some were not saved: ${result.error}` : " at stage Connected."}
                        </p>
                    )}

                    {plan && parsed && (
                        <>
                            <p className="text-sm text-muted-foreground">
                                {parsed.rows.length} connection{parsed.rows.length === 1 ? "" : "s"} in the file: <strong className="text-foreground">{plan.fresh.length} new</strong>, {plan.duplicates.length} already in your contacts
                                {parsed.skipped > 0 && `, ${parsed.skipped} with no name skipped`}
                                {parsed.truncated && ". Only the first 5,000 were read"}.
                            </p>
                            {plan.fresh.length > 0 && (
                                <>
                                    <p className="text-sm">Tick the people who matter for your search: recruiters, hiring managers, people at companies you want. Each one you add gets a next step, so add a few at a time.</p>
                                    <div className="flex items-center gap-3">
                                        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by name, company or role" aria-label="Filter connections" />
                                        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                                            <Checkbox checked={allVisibleOn} onCheckedChange={(v) => toggleVisible(v === true)} />
                                            All {visible.length} shown
                                        </label>
                                    </div>
                                    <ul className="border rounded-lg divide-y max-h-72 overflow-y-auto">
                                        {visible.slice(0, PREVIEW).map((row) => (
                                            <li key={row.index}>
                                                <label className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted/40">
                                                    <Checkbox checked={selected.has(row.index)} onCheckedChange={(v) => toggle(row.index, v === true)} />
                                                    <span className="min-w-0">
                                                        <span className="font-medium">{row.name}</span>
                                                        <span className="text-muted-foreground block truncate">{[row.position, row.company].filter(Boolean).join(" at ") || "No role or company in the file"}</span>
                                                    </span>
                                                </label>
                                            </li>
                                        ))}
                                        {visible.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">No one matches that filter.</li>}
                                    </ul>
                                    {visible.length > PREVIEW && <p className="text-xs text-muted-foreground">Showing the first {PREVIEW} of {visible.length}. Filter to narrow the list; "All shown" ticks every match.</p>}
                                </>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{result && !result.error ? "Close" : "Cancel"}</Button>
                    <Button onClick={run} disabled={busy || selected.size === 0}>
                        {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Add {selected.size} contact{selected.size === 1 ? "" : "s"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
