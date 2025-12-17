import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Building2, 
  HandshakeIcon, 
  CheckSquare, 
  LayoutDashboard,
  Zap,
  Shield,
  BarChart3
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Contact Management",
    description: "Organize and manage all your contacts with detailed profiles, status tracking, and company associations.",
  },
  {
    icon: Building2,
    title: "Company Tracking",
    description: "Keep track of companies, their details, and relationships with your contacts and deals.",
  },
  {
    icon: HandshakeIcon,
    title: "Deal Pipeline",
    description: "Visual Kanban board to track deals through stages from lead to close with drag-and-drop functionality.",
  },
  {
    icon: CheckSquare,
    title: "Task Management",
    description: "Create and manage tasks with due dates, priorities, and link them to contacts, companies, or deals.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Analytics",
    description: "Get instant insights with key metrics including pipeline value, deal counts, and activity summaries.",
  },
  {
    icon: Zap,
    title: "Quick Search",
    description: "Find anything instantly with Cmd+K global search across contacts, companies, deals, and tasks.",
  },
];


export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <HandshakeIcon className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold" data-testid="text-logo">CRM</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" data-testid="button-login-nav">Login</Button>
            </Link>
            <Link href="/login">
              <Button data-testid="button-get-started-nav">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6" data-testid="text-hero-title">
            Modern CRM for Growing Teams
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your sales process with a powerful, intuitive CRM. Manage contacts, track deals, and close more business.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/login">
              <Button size="lg" data-testid="button-start-free">
                Start Free Trial
              </Button>
            </Link>
            <Button variant="outline" size="lg" data-testid="button-learn-more">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-t">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-features-title">
              Everything You Need to Manage Sales
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you organize contacts, track deals, and grow your business.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover-elevate" data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary mb-2">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-t bg-muted/30">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4" data-testid="text-cta-title">
            Ready to Grow Your Business?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of teams using our CRM to close more deals and build better customer relationships.
          </p>
          <Link href="/login">
            <Button size="lg" data-testid="button-start-trial">
              Start Your Free 7-Day Trial
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      <footer className="border-t py-8 px-4">
        <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <HandshakeIcon className="h-3 w-3" />
            </div>
            <span className="text-sm font-medium">CRM</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Inspired by TwentyCRM. Built with modern technologies.
          </p>
        </div>
      </footer>
    </div>
  );
}
