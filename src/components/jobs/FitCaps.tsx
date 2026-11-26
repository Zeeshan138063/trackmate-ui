import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FitCap } from "@/utils/job-fit";

/** Short badges for a job card: what in the posting rules the user out (REQ-008). */
export function FitCapBadges({ caps }: { caps: FitCap[] }) {
    if (caps.length === 0) return null;
    return (
        <>
            {caps.map((cap) => (
                <Badge key={cap.kind + cap.label} variant="outline" title={cap.reason} className="text-[10px] gap-1 border-amber-300 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-3 w-3" />
                    {cap.label}
                </Badge>
            ))}
        </>
    );
}

/** The full reasons, each with the posting's own words, so the user can judge the call. */
export function FitCapDetails({ caps }: { caps: FitCap[] }) {
    if (caps.length === 0) return null;
    return (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                This posting may rule you out
            </p>
            <ul className="space-y-2">
                {caps.map((cap) => (
                    <li key={cap.kind + cap.label} className="text-sm text-amber-900 dark:text-amber-200">
                        {cap.reason}
                        <span className="block text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">From the posting: "{cap.evidence}"</span>
                    </li>
                ))}
            </ul>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80">Read from the posting's text against your campaign in Settings. Check the posting before you decide.</p>
        </div>
    );
}
