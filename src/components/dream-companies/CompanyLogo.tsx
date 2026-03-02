import { useState } from "react";
import { cn } from "@/lib/utils";

interface CompanyLogoProps {
    src?: string | null;
    alt: string;
    className?: string;
    iconClassName?: string;
    websiteUrl?: string | null;
}

// Extract domain from a URL for Clearbit lookup
function getDomain(url?: string | null): string | null {
    if (!url) return null;
    try {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        return u.hostname.replace(/^www\./, "");
    } catch {
        return null;
    }
}

// Get first letter of company name for avatar fallback
function getInitial(name: string): string {
    return (name || "?").charAt(0).toUpperCase();
}

// Consistent indigo shade based on company name (for visual variety)
const INDIGO_SHADES = [
    "bg-indigo-600",
    "bg-violet-600",
    "bg-blue-600",
    "bg-purple-600",
];
function getAvatarColor(name: string): string {
    const idx = name.charCodeAt(0) % INDIGO_SHADES.length;
    return INDIGO_SHADES[idx];
}

export function CompanyLogo({ src, alt, className, websiteUrl }: CompanyLogoProps) {
    const [imgError, setImgError] = useState(false);
    const [clearbitError, setClearbitError] = useState(false);

    // Determine logo source priority:
    // 1. Explicit src (logo_url from DB)
    // 2. Clearbit by domain extracted from websiteUrl
    // 3. Letter avatar fallback
    const domain = getDomain(websiteUrl);
    const clearbitSrc = domain ? `https://logo.clearbit.com/${domain}` : null;

    const logoSrc = !imgError && src ? src
        : !clearbitError && clearbitSrc ? clearbitSrc
            : null;

    const handleError = () => {
        if (!imgError && src) {
            setImgError(true);
        } else {
            setClearbitError(true);
        }
    };

    if (logoSrc) {
        return (
            <div className={cn("overflow-hidden rounded-lg border bg-white shadow-sm flex items-center justify-center", className)}>
                <img
                    src={logoSrc}
                    alt={alt}
                    className="h-full w-full object-contain p-0.5"
                    onError={handleError}
                    loading="lazy"
                />
            </div>
        );
    }

    // Letter avatar fallback — indigo bg with white initial
    return (
        <div className={cn(
            "flex items-center justify-center rounded-lg shrink-0 shadow-sm",
            getAvatarColor(alt),
            className
        )}>
            <span className="text-white font-bold text-base leading-none select-none">
                {getInitial(alt)}
            </span>
        </div>
    );
}
