import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandSearch } from "@/components/command-search";
import { useAuth } from "@/hooks/use-auth";
import { TrialBanner } from "@/components/trial-banner";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Contacts from "@/pages/contacts";
import ContactProfile from "@/pages/contact-profile";
import Companies from "@/pages/companies";
import CompanyProfile from "@/pages/company-profile";
import Deals from "@/pages/deals";
import Tasks from "@/pages/tasks";
import Email from "@/pages/email";
import ChatPage from "@/pages/chat";
import BillingPage from "@/pages/billing";
import Developer from "@/pages/developer";
import Home from "@/pages/home";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface TrialStatus {
  isTrialActive: boolean;
  daysLeft: number;
  trialEndDate: string;
  hasSubscription: boolean;
}

interface Subscription {
  id: string;
  status: string;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/contacts/:id" component={ContactProfile} />
      <Route path="/companies" component={Companies} />
      <Route path="/companies/:id" component={CompanyProfile} />
      <Route path="/deals" component={Deals} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/email" component={Email} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/billing" component={BillingPage} />
      <Route path="/developer" component={Developer} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const [location, setLocation] = useLocation();
  const style = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3rem",
  };

  const { data: trialData, isLoading: trialLoading } = useQuery<TrialStatus>({
    queryKey: ["/api/billing/trial"],
  });

  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery<{ subscription: Subscription | null }>({
    queryKey: ["/api/billing/subscription"],
  });

  const isLoading = trialLoading || subscriptionLoading;
  const trial = trialData;
  const subscription = subscriptionData?.subscription;

  useEffect(() => {
    if (isLoading) return;
    
    // Only redirect if we have valid trial data and trial has expired
    const trialExpired = trial && !trial.isTrialActive && !trial.hasSubscription;
    const hasActiveSubscription = subscription && subscription.status === "active";
    
    // Redirect to billing if trial expired and no active subscription
    if (trialExpired && !hasActiveSubscription && location !== "/billing") {
      setLocation("/billing");
    }
  }, [isLoading, trial, subscription, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TrialBanner />
          <header className="flex items-center justify-between gap-4 p-4 border-b h-14 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <CommandSearch />
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Home />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="crm-theme">
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
