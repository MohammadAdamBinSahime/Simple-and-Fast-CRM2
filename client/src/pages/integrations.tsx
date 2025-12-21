import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, MessageCircle, Users, Link2, CheckCircle } from "lucide-react";
import { SiFacebook, SiLinkedin, SiWhatsapp } from "react-icons/si";

const integrationConfigs = {
  whatsapp: {
    name: "WhatsApp",
    icon: SiWhatsapp,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    description: "Connect with your contacts directly through WhatsApp messaging",
    features: [
      "Send messages directly from contact cards",
      "Quick access via contact phone numbers",
      "Open WhatsApp Web or mobile app",
    ],
    setupSteps: [
      "Add a phone number to your contacts",
      "Click the WhatsApp icon on any contact row",
      "Start messaging instantly",
    ],
    docLink: "https://faq.whatsapp.com/",
  },
  linkedin: {
    name: "LinkedIn",
    icon: SiLinkedin,
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
    description: "View and connect with contacts on LinkedIn for professional networking",
    features: [
      "Quick access to LinkedIn profiles",
      "Professional networking from CRM",
      "Track professional connections",
    ],
    setupSteps: [
      "Add LinkedIn profile URLs to contacts",
      "Click the LinkedIn icon on any contact row",
      "View their professional profile",
    ],
    docLink: "https://www.linkedin.com/help/",
  },
  facebook: {
    name: "Facebook",
    icon: SiFacebook,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Connect with contacts through Facebook for social engagement",
    features: [
      "Quick access to Facebook profiles",
      "Social engagement from CRM",
      "Track social connections",
    ],
    setupSteps: [
      "Add Facebook profile URLs to contacts",
      "Click the Facebook icon on any contact row",
      "View their social profile",
    ],
    docLink: "https://www.facebook.com/help/",
  },
};

type IntegrationType = keyof typeof integrationConfigs;

export default function Integrations() {
  const [, params] = useRoute("/integrations/:type");
  const type = (params?.type as IntegrationType) || "whatsapp";
  const config = integrationConfigs[type] || integrationConfigs.whatsapp;
  const Icon = config.icon;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${config.bgColor}`}>
          <Icon className={`h-6 w-6 ${config.color}`} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            {config.name} Integration
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {config.description}
          </p>
        </div>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Integration Active
            </CardTitle>
            <CardDescription>
              {config.name} integration is ready to use on your contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                Connected
              </Badge>
              <span className="text-sm text-muted-foreground">
                Available on all contact records
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {config.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              How to Use
            </CardTitle>
            <CardDescription>
              Follow these steps to use {config.name} with your contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {config.setupSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={`flex-shrink-0 h-6 w-6 rounded-full ${config.bgColor} ${config.color} flex items-center justify-center text-xs font-medium`}>
                    {i + 1}
                  </div>
                  <span className="text-sm pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <a href="/contacts" data-testid="link-view-contacts">
                <Users className="h-4 w-4" />
                View Contacts
                <span className="ml-auto text-xs text-muted-foreground">
                  Add {config.name} links to contacts
                </span>
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <a href={config.docLink} target="_blank" rel="noopener noreferrer" data-testid="link-documentation">
                <ExternalLink className="h-4 w-4" />
                {config.name} Help Center
                <span className="ml-auto text-xs text-muted-foreground">
                  External link
                </span>
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
