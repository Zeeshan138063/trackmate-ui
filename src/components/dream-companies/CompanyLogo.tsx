import { useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyLogoProps {
    src?: string | null;
    alt: string;
    className?: string; // wrapper class
    iconClassName?: string;
}

export function CompanyLogo({ src, alt, className, iconClassName }: CompanyLogoProps) {
    const [error, setError] = useState(false);

    if (!src || error) {
        return (
            <div className={cn("flex items-center justify-center bg-white/50 border rounded-lg", className)}>
                <Building2 className={cn("text-muted-foreground/50", iconClassName || "h-5 w-5")} />
            </div>
        );
    }

    return (
        <div className={cn("overflow-hidden rounded-lg border bg-white shadow-sm flex items-center justify-center", className)}>
            <img
                src={src}
                alt={alt}
                className="h-full w-full object-contain p-0.5"
                onError={() => setError(true)}
                loading="lazy"
            />
        </div>
    );
}
