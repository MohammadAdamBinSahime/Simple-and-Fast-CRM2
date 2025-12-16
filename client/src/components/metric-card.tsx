import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  isLoading?: boolean;
  testId?: string;
}

export function MetricCard({
  title,
  value,
  trend,
  icon,
  isLoading,
  testId,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold" data-testid={`${testId}-value`}>
          {value}
        </div>
        {trend && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {trend.value > 0 ? (
              <TrendingUp className={cn("h-3 w-3", "text-green-500")} />
            ) : trend.value < 0 ? (
              <TrendingDown className={cn("h-3 w-3", "text-red-500")} />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            <span
              className={cn(
                trend.value > 0 && "text-green-500",
                trend.value < 0 && "text-red-500"
              )}
            >
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </span>
            <span>{trend.label}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
