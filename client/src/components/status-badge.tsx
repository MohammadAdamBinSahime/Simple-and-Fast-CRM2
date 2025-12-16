import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "lead" | "qualified" | "customer" | "inactive" | "proposal" | "negotiation" | "closed_won" | "closed_lost" | "low" | "medium" | "high";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  lead: { label: "Lead", variant: "secondary" },
  qualified: { label: "Qualified", variant: "default" },
  customer: { label: "Customer", variant: "default" },
  inactive: { label: "Inactive", variant: "outline" },
  proposal: { label: "Proposal", variant: "secondary" },
  negotiation: { label: "Negotiation", variant: "secondary" },
  closed_won: { label: "Won", variant: "default" },
  closed_lost: { label: "Lost", variant: "destructive" },
  low: { label: "Low", variant: "outline" },
  medium: { label: "Medium", variant: "secondary" },
  high: { label: "High", variant: "destructive" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "outline" as const };
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn("text-xs", className)}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
