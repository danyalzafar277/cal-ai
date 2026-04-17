import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  className?: string;
  accent?: boolean;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  trend,
  trendLabel,
  className,
  accent,
}: KPICardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        accent && "border-primary/20 bg-primary/5",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
              {title}
            </p>
            <p className="mt-1.5 text-2xl font-bold text-foreground leading-none">
              {value}
            </p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trendLabel && (
              <p
                className={cn(
                  "mt-1.5 text-xs font-medium",
                  trend === "up" && "text-green-600",
                  trend === "down" && "text-red-500",
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {trendLabel}
              </p>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                "flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl",
                accent ? "bg-primary/10" : "bg-muted"
              )}
            >
              <Icon className={cn("w-5 h-5", iconColor)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
