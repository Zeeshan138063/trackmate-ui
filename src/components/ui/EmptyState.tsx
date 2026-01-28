
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    trigger?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    trigger,
    className
}: EmptyStateProps) {
    return (
        <Card className={cn(
            "flex flex-col items-center justify-center p-8 text-center bg-muted/20 border-dashed",
            className
        )}>
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-[250px] mb-6">
                {description}
            </p>
            {actionLabel && onAction && (
                <Button onClick={onAction} variant="outline" size="sm">
                    {actionLabel}
                </Button>
            )}
            {trigger}
        </Card>
    );
}
