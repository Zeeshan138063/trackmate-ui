// "Not now" on the referral-first prompt (REQ-007), remembered per job in this browser.

const DISMISS_PREFIX = "jobos_referral_dismissed_";

// "Not now" is a per-browser convenience. Storage can be unavailable: never let it throw.
export function isReferralDismissed(jobId: string): boolean {
    try {
        return localStorage.getItem(DISMISS_PREFIX + jobId) === "1";
    } catch {
        return false;
    }
}

export function dismissReferral(jobId: string): void {
    try {
        localStorage.setItem(DISMISS_PREFIX + jobId, "1");
    } catch {
        // dismissed for this visit only
    }
}
