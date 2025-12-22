import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Check, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

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
  current_period_end: number;
  cancel_at_period_end: boolean;
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

  useEffect(() => {
    if (success || canceled) {
      queryClient.invalidateQueries({ queryKey: ["/api/billing/subscription"] });
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
  const isLoading = productsLoading || subscriptionLoading;

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

      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                {subscription.status}
              </Badge>
            </div>
            {subscription.current_period_end && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {subscription.cancel_at_period_end ? "Ends on" : "Renews on"}
                </span>
                <span>{new Date(subscription.current_period_end * 1000).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
          <CardFooter>
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
      )}

      {products.length > 0 ? (
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
                      {subscription ? "Already subscribed" : "Subscribe"}
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
      )}
    </div>
  );
}
