import { useQuery } from "@tanstack/react-query";
import { Clock, Gift } from "lucide-react";
import { Link } from "wouter";

interface TrialStatus {
  isTrialActive: boolean;
  daysLeft: number;
  trialEndDate: string;
  hasSubscription: boolean;
}

export function TrialBanner() {
  const { data: trial } = useQuery<TrialStatus>({
    queryKey: ["/api/billing/trial"],
  });

  if (!trial || trial.hasSubscription) {
    return null;
  }

  if (trial.isTrialActive) {
    return (
      <div 
        className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-sm border-b"
        data-testid="banner-trial"
      >
        <Gift className="h-4 w-4 text-primary" />
        <span>
          <span className="font-medium">{trial.daysLeft} {trial.daysLeft === 1 ? "day" : "days"}</span> left in your free trial.
          <span className="text-muted-foreground ml-1">Payment required after trial ends (RM59.99/month).</span>
        </span>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center justify-center gap-2 px-4 py-2 bg-destructive/10 text-sm border-b"
      data-testid="banner-trial-expired"
    >
      <Clock className="h-4 w-4 text-destructive" />
      <span>Your free trial has ended</span>
      <Link href="/billing" className="text-primary font-medium underline-offset-4 hover:underline">
        Subscribe to continue
      </Link>
    </div>
  );
}
