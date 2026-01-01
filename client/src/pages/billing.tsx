import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Check, ExternalLink, Clock, Gift, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocation } from "wouter";

interface TrialStatus {
  isTrialActive: boolean;
  daysLeft: number;
  trialEndDate: string;
  hasSubscription: boolean;
}

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  metadata: Record<string, string> | null;
  prices: Price[];
}

interface Subscription {
  id: string;
  status: string;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  _raw_data?: {
    billing_cycle_anchor?: number;
    current_period_end?: number;
  };
  items?: {
    data?: Array<{
      current_period_end?: number;
    }>;
  };
}

function getSubscriptionEndDate(subscription: Subscription): number | null {
  if (subscription.current_period_end) {
    return subscription.current_period_end;
  }
  if (subscription._raw_data?.current_period_end) {
    return subscription._raw_data.current_period_end;
  }
  if (subscription.items?.data?.[0]?.current_period_end) {
    return subscription.items.data[0].current_period_end;
  }
  if (subscription._raw_data?.billing_cycle_anchor) {
    const anchor = subscription._raw_data.billing_cycle_anchor;
    const nextMonth = new Date(anchor * 1000);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return Math.floor(nextMonth.getTime() / 1000);
  }
  return null;
}

export default function BillingPage() {
  const { toast } = useToast();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  const { data: productsData, isLoading: productsLoading } = useQuery<{ data: Product[] }>({
    queryKey: ["/api/billing/products"],
  });

  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery<{ subscription: Subscription | null }>({
    queryKey: ["/api/billing/subscription"],
  });

  const { data: trialData, isLoading: trialLoading } = useQuery<TrialStatus>({
    queryKey: ["/api/billing/trial"],
  });

  const { data: invoiceResp, isLoading: invoicesLoading } = useQuery<{ invoices: any[] }>({
    queryKey: ["/api/billing/invoices"],
  });

  useEffect(() => {
    if (success || canceled) {
      queryClient.invalidateQueries({ queryKey: ["/api/billing/subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billing/trial"] });
    }
  }, [success, canceled]);

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/billing/checkout", { priceId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/billing/portal", {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/billing/cancel", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Canceled",
        description: "Your subscription will end at the current billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/billing/subscription"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatInterval = (interval: string) => {
    switch (interval) {
      case "month":
        return "per month";
      case "year":
        return "per year";
      case "week":
        return "per week";
      case "day":
        return "per day";
      default:
        return `per ${interval}`;
    }
  };

  const products = productsData?.data || [];
  const subscription = subscriptionData?.subscription;
  const trial = trialData;
  const invoices = invoiceResp?.invoices || [];
  const isLoading = productsLoading || subscriptionLoading || trialLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      {(!trial?.isTrialActive || subscription) && (
        products.length > 0 ? (
          <div>
            <h2 className="text-lg font-medium mb-4">Available Plans</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id} className="flex flex-col" data-testid={`card-product-${product.id}`}>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    {product.description && (
                      <CardDescription>{product.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1">
                    {product.prices.length > 0 && (
                      <div className="space-y-2">
                        {product.prices.map((price) => (
                          <div key={price.id} className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold">
                              {formatPrice(price.unit_amount, price.currency)}
                            </span>
                            {price.recurring && (
                              <span className="text-muted-foreground text-sm">
                                {formatInterval(price.recurring.interval)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    {product.prices.length > 0 && (
                      <Button
                        className="w-full"
                        onClick={() => checkoutMutation.mutate(product.prices[0].id)}
                        disabled={checkoutMutation.isPending || !!subscription}
                        data-testid={`button-subscribe-${product.id}`}
                      >
                        {checkoutMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {subscription ? "Already subscribed" : "Subscribe Now"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Plans Available</h3>
              <p className="text-muted-foreground">
                Subscription plans will appear here once configured.
              </p>
            </CardContent>
          </Card>
        )
      )}

      {success && (
        <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Payment successful</p>
                <p className="text-sm text-green-700 dark:text-green-300">Your subscription is now active.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {canceled && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Payment canceled</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">You can try again when you're ready.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {trial?.isTrialActive && (
        <Card className="border-primary/50 bg-primary/5" data-testid="card-trial-status">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Free Trial Active
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium" data-testid="text-trial-days-left">
                  {trial.daysLeft} {trial.daysLeft === 1 ? "day" : "days"} left
                </p>
                <p className="text-sm text-muted-foreground">
                  Your 7-day free trial ends on {new Date(trial.trialEndDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="bg-background/50 rounded-md p-4 border">
              <p className="text-sm font-medium mb-1">Payment Required After Trial</p>
              <p className="text-sm text-muted-foreground">
                You have full access to all features during your trial. After your trial ends, you will need to subscribe to continue using the CRM at RM99.99/month.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {trial && !trial.isTrialActive && !trial.hasSubscription && (
        <Card className="border-destructive/50 bg-destructive/5" data-testid="card-trial-expired">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Trial Expired</p>
                <p className="text-sm text-muted-foreground">
                  Your free trial has ended. Subscribe now to continue using all features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {subscription && (() => {
        const periodEnd = getSubscriptionEndDate(subscription);
        return (
        <Card className={subscription.cancel_at_period_end ? "border-yellow-500/50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={subscription.cancel_at_period_end ? "secondary" : subscription.status === "active" ? "default" : "secondary"}>
                {subscription.cancel_at_period_end ? "Canceling" : subscription.status}
              </Badge>
            </div>
            {subscription.cancel_at_period_end && periodEnd && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Your access ends on {new Date(periodEnd * 1000).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Subscribe again to continue using all CRM features after this date.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
              data-testid="button-manage-billing"
            >
              {portalMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
            
          </CardFooter>
        </Card>
        );
      })()}

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Past invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices found.</p>
          ) : (
            <Table data-testid="table-billing-history">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} data-testid={`row-invoice-${inv.id}`}>
                    <TableCell>
                      {inv.created ? new Date(inv.created).toLocaleDateString("en-GB", {
                        day: "numeric", month: "long", year: "numeric"
                      }) : "-"}
                    </TableCell>
                    <TableCell>
                      {typeof inv.amount_paid === "number" ? (
                        <span className="font-medium">
                          {(inv.amount_paid / 100).toLocaleString(undefined, { style: "currency", currency: (inv.currency || "usd").toUpperCase() })}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={inv.status === "paid" ? "default" : "secondary"}>{inv.status || "n/a"}</Badge>
                    </TableCell>
                    <TableCell>
                      {inv.hosted_invoice_url ? (
                        <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer" className="text-primary underline">
                          View
                        </a>
                      ) : inv.invoice_pdf ? (
                        <a href={inv.invoice_pdf} target="_blank" rel="noreferrer" className="text-primary underline">
                          PDF
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      
    </div>
  );
}
