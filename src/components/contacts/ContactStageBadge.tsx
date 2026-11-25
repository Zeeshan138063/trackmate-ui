import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STAGE_LABELS, type WarmthStage } from "@/utils/contact-next-action";

// One colour per stage, cool to warm, with a dark-mode pair for each.
const STAGE_CLASSES: Record<WarmthStage, string> = {
    identified: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    following: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-800",
    engaged: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800",
    connected: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800",
    in_conversation: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
    advocate: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
};

export function ContactStageBadge({ stage, className }: { stage: WarmthStage; className?: string }) {
    return (
        <Badge variant="outline" className={cn("text-[10px] py-0 h-5 font-medium", STAGE_CLASSES[stage], className)}>
            {STAGE_LABELS[stage]}
        </Badge>
    );
}
