import { Card, CardContent } from "@/components/ui/card";

interface StatusCardProps {
  title: string;
  count: number | string;
  variant?: "default" | "primary" | "success" | "warning";
}

export function StatusCard({ title, count, variant = "default" }: StatusCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "border-primary/20 bg-primary/5";
      case "success":
        return "border-success/20 bg-success/5";
      case "warning":
        return "border-warning/20 bg-warning/5";
      default:
        return "border-border bg-card";
    }
  };

  return (
    <Card className={`${getVariantClasses()} hover:shadow-md transition-shadow`}>
      <CardContent className="p-6 text-center">
        <div className="text-3xl font-bold text-foreground mb-2">{count}</div>
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </div>
      </CardContent>
    </Card>
  );
}