import { cn } from "@/lib/utils";
import { INVITE_STOP_AT, type InvitationUsage } from "@/utils/invitation-limits";

/**
 * Invitations marked as sent in the last seven days (REQ-009, AC-5). The number is only what
 * the user marked in JobOS; LinkedIn's limit is about 100 a week and is not published.
 */
export function InvitationMeter({ usage }: { usage: InvitationUsage }) {
    const percent = Math.min(100, Math.round((usage.count / INVITE_STOP_AT) * 100));
    const tone =
        usage.state === "stop"
            ? { bar: "bg-red-500", text: "text-red-700 dark:text-red-400", border: "border-red-300 dark:border-red-800" }
            : usage.state === "warn"
                ? { bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", border: "border-amber-300 dark:border-amber-800" }
                : { bar: "bg-emerald-500", text: "text-muted-foreground", border: "border-border" };

    return (
        <div className={cn("rounded-lg border p-3 space-y-2", tone.border)} role="status">
            <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">
                    Invitations in the last 7 days: {usage.count} of about {INVITE_STOP_AT}
                </span>
                <span className="text-xs text-muted-foreground">marked in JobOS</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden" aria-hidden>
                <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${percent}%` }} />
            </div>
            {usage.state === "warn" && (
                <p className={cn("text-xs", tone.text)}>
                    Slow down: LinkedIn restricts accounts that send about {INVITE_STOP_AT} invitations a week.
                </p>
            )}
            {usage.state === "stop" && (
                <p className={cn("text-xs", tone.text)}>
                    Weekly limit reached. JobOS has stopped suggesting connection requests
                    {usage.nextSlotOn ? ` until ${usage.nextSlotOn}` : ""}.
                </p>
            )}
        </div>
    );
}
