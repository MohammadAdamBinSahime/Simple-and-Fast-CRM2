import { useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Upload, 
  Download,
  CheckCircle,
  Loader2,
  Smartphone,
  Globe,
  FileSpreadsheet,
  ArrowRight,
  HelpCircle,
  Link2,
  Copy,
  RefreshCw,
  Zap,
  Settings2,
  Unplug,
  Clock
} from "lucide-react";
import { SiFacebook, SiLinkedin, SiWhatsapp } from "react-icons/si";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { IntegrationAccount } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const integrationConfigs = {
  whatsapp: {
    name: "WhatsApp",
    icon: SiWhatsapp,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    heroText: "Connect Your WhatsApp",
    heroDescription: "Automatically sync your WhatsApp contacts to your CRM. New contacts you message will appear here!",
    csvTemplate: "Name,Phone Number\nJohn Smith,+1234567890\nMary Johnson,+0987654321",
    automationSteps: [
      "Click 'Connect WhatsApp' below to set up automatic sync",
      "Copy your unique webhook link",
      "Use Zapier or Make.com to connect WhatsApp to this link",
      "New contacts will automatically appear in your CRM"
    ],
    manualSteps: [
      {
        title: "Open WhatsApp on your phone",
        description: "Go to Settings, then tap on your profile",
        icon: Smartphone,
      },
      {
        title: "Export your contacts",
        description: "Your phone's contacts app can export contacts as a file",
        icon: FileSpreadsheet,
      },
      {
        title: "Upload or paste below",
        description: "Drop your file here or copy and paste the contact list",
        icon: Upload,
      },
    ],
    faq: [
      {
        q: "What is automatic sync?",
        a: "Automatic sync uses services like Zapier or Make.com to watch your WhatsApp and automatically add new contacts to your CRM - no manual work needed!",
      },
      {
        q: "Is automatic sync free?",
        a: "Zapier and Make.com have free plans that work great for most agents. They only charge for high-volume use.",
      },
      {
        q: "How do I get my contacts from my phone manually?",
        a: "On iPhone: Open Contacts app > tap a contact > Share Contact > copy info. On Android: Open Contacts > Menu > Export. You can then paste the info below.",
      },
    ],
  },
  linkedin: {
    name: "LinkedIn",
    icon: SiLinkedin,
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
    heroText: "Connect Your LinkedIn",
    heroDescription: "Keep your professional network synced. New connections appear in your CRM automatically!",
    csvTemplate: "First Name,Last Name,Email,Company,Position\nJohn,Smith,john@email.com,ABC Realty,Broker\nMary,Johnson,mary@email.com,XYZ Properties,Agent",
    automationSteps: [
      "Click 'Connect LinkedIn' below to set up automatic sync",
      "Copy your unique webhook link",
      "Use Zapier or Make.com to connect LinkedIn to this link",
      "New connections will automatically appear in your CRM"
    ],
    manualSteps: [
      {
        title: "Go to LinkedIn.com",
        description: "Open LinkedIn in your web browser and sign in",
        icon: Globe,
      },
      {
        title: "Download your connections",
        description: "Settings > Data Privacy > Get a copy of your data > Select 'Connections'",
        icon: Download,
      },
      {
        title: "Upload the file here",
        description: "Find the downloaded file and upload it below",
        icon: Upload,
      },
    ],
    faq: [
      {
        q: "What is automatic sync?",
        a: "Automatic sync uses services like Zapier to watch your LinkedIn. When you connect with someone new, they automatically get added to your CRM.",
      },
      {
        q: "Will LinkedIn know I'm syncing?",
        a: "This is completely private - it just reads your public connection info that you already have access to.",
      },
      {
        q: "Where do I find my LinkedIn data for manual import?",
        a: "Click your profile picture on LinkedIn > Settings & Privacy > Data Privacy > Get a copy of your data. Select 'Connections' and request the download.",
      },
    ],
  },
  facebook: {
    name: "Facebook",
    icon: SiFacebook,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    heroText: "Connect Your Facebook",
    heroDescription: "Sync your Facebook contacts to never miss a lead. Stay connected with your network!",
    csvTemplate: "Name,Email\nJohn Smith,john@email.com\nMary Johnson,mary@email.com",
    automationSteps: [
      "Click 'Connect Facebook' below to set up automatic sync",
      "Copy your unique webhook link",
      "Use Zapier or Make.com to connect Facebook to this link",
      "New contacts will automatically appear in your CRM"
    ],
    manualSteps: [
      {
        title: "Go to Facebook Settings",
        description: "Click Menu > Settings & Privacy > Settings",
        icon: Globe,
      },
      {
        title: "Download your information",
        description: "Your Facebook Information > Download Your Information",
        icon: Download,
      },
      {
        title: "Upload contacts here",
        description: "Select the friends data and upload below",
        icon: Upload,
      },
    ],
    faq: [
      {
        q: "What is automatic sync?",
        a: "Automatic sync uses Zapier or Make.com to automatically add Facebook contacts to your CRM when they message your business page or interact with you.",
      },
      {
        q: "Will my friends know I imported them?",
        a: "No, this is just for your personal CRM. Your friends won't be notified.",
      },
      {
        q: "What if I only want to add a few people?",
        a: "You can add contacts one by one from the Contacts page - just click 'Add Contact'.",
      },
    ],
  },
};

type IntegrationType = keyof typeof integrationConfigs;

export default function Integrations() {
  const [, params] = useRoute("/integrations/:type");
  const type = (params?.type as IntegrationType) || "whatsapp";
  const config = integrationConfigs[type] || integrationConfigs.whatsapp;
  const Icon = config.icon;
  const { toast } = useToast();

  const [contactData, setContactData] = useState("");
  const [importedCount, setImportedCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("automatic");

  // Fetch existing integrations
  const { data: integrations = [], isLoading: integrationsLoading } = useQuery<IntegrationAccount[]>({
    queryKey: ["/api/integrations"],
  });

  // Fetch webhook base URL from server
  const { data: webhookBaseUrlData } = useQuery<{ baseUrl: string }>({
    queryKey: ["/api/integrations/webhook-base-url"],
  });

  const currentIntegration = integrations.find(i => i.platform === type);
  const isConnected = !!currentIntegration && currentIntegration.isActive === "true";

  // Connect integration
  const connectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/integrations", { platform: type, accountName: config.name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({ title: `${config.name} connected! Copy your webhook link to complete setup.` });
    },
    onError: (error: any) => {
      toast({ 
        title: error.message || "Failed to connect. Please try again.", 
        variant: "destructive" 
      });
    },
  });

  // Disconnect integration
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!currentIntegration) return;
      return apiRequest("DELETE", `/api/integrations/${currentIntegration.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({ title: `${config.name} disconnected.` });
    },
    onError: () => {
      toast({ title: "Failed to disconnect. Please try again.", variant: "destructive" });
    },
  });

  // Manual import
  const importMutation = useMutation({
    mutationFn: async (contacts: any[]) => {
      let imported = 0;
      for (const contact of contacts) {
        try {
          await apiRequest("POST", "/api/contacts", contact);
          imported++;
        } catch (e) {
          console.error("Failed to import contact:", e);
        }
      }
      return imported;
    },
    onSuccess: (count) => {
      setImportedCount(count);
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: `Added ${count} new contacts to your CRM!` });
      setContactData("");
    },
    onError: () => {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    },
  });

  const parseContacts = (text: string): any[] => {
    const lines = text.trim().split("\n").filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const contacts: any[] = [];
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes("name") || firstLine.includes("email") || firstLine.includes("phone");
    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(/[,\t]/).map(p => p.replace(/^"|"$/g, "").trim());
      
      if (parts.length >= 1) {
        const contact: any = { status: "lead" };
        
        const namePart = parts[0];
        if (namePart.includes(" ")) {
          const nameParts = namePart.split(" ");
          contact.firstName = nameParts[0];
          contact.lastName = nameParts.slice(1).join(" ");
        } else {
          contact.firstName = namePart;
          contact.lastName = "";
        }

        for (let j = 1; j < parts.length; j++) {
          const part = parts[j].trim();
          if (part.includes("@")) {
            contact.email = part;
          } else if (part.match(/^\+?[\d\s\-()]+$/) && part.replace(/\D/g, "").length >= 7) {
            contact.phone = part;
            if (type === "whatsapp") {
              contact.whatsappNumber = part;
            }
          } else if (part.includes("linkedin.com")) {
            contact.linkedinUrl = part;
          } else if (part.includes("facebook.com")) {
            contact.facebookUrl = part;
          } else if (!contact.jobTitle && part.length > 2 && !part.match(/^\d+$/)) {
            contact.jobTitle = part;
          }
        }

        if (!contact.email && contact.firstName) {
          contact.email = `${contact.firstName.toLowerCase().replace(/\s/g, '')}@imported.crm`;
        }

        if (contact.firstName) {
          contacts.push(contact);
        }
      }
    }

    return contacts;
  };

  const handleImport = () => {
    const contacts = parseContacts(contactData);
    if (contacts.length === 0) {
      toast({ 
        title: "No contacts found", 
        description: "Please paste your contacts in the box above. Put each person on a new line.",
        variant: "destructive" 
      });
      return;
    }
    importMutation.mutate(contacts);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContactData(text);
      toast({ title: "File loaded! Click 'Add to My CRM' to import." });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const blob = new Blob([config.csvTemplate], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my_${type}_contacts.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Template downloaded! Fill it in with your contacts." });
  };

  const getWebhookUrl = () => {
    if (!currentIntegration?.webhookSecret) return "";
    const baseUrl = webhookBaseUrlData?.baseUrl || window.location.origin;
    return `${baseUrl}/api/webhook/contacts/${type}?webhookSecret=${currentIntegration.webhookSecret}`;
  };

  const isWebhookUrlValid = () => {
    const url = getWebhookUrl();
    return url && !url.includes("localhost") && !url.includes("127.0.0.1") && !url.startsWith("file://");
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(getWebhookUrl());
    toast({ title: "Copied! Paste this in Zapier or Make.com" });
  };

  if (showSuccess) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className={`mx-auto w-16 h-16 rounded-full ${config.bgColor} flex items-center justify-center`}>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">All done!</h2>
              <p className="text-muted-foreground mt-2">
                {importedCount} contacts have been added to your CRM
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild data-testid="button-view-contacts">
                <a href="/contacts">
                  <Users className="h-4 w-4 mr-2" />
                  View My Contacts
                </a>
              </Button>
              <Button variant="outline" onClick={() => setShowSuccess(false)} data-testid="button-import-more">
                Import More Contacts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-3xl mx-auto">
      <div className="text-center space-y-4">
        <div className={`mx-auto w-16 h-16 rounded-full ${config.bgColor} flex items-center justify-center`}>
          <Icon className={`h-8 w-8 ${config.color}`} />
        </div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          {config.heroText}
        </h1>
        <p className="text-muted-foreground">
          {config.heroDescription}
        </p>
        {isConnected && (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="automatic" className="gap-2" data-testid="tab-automatic">
            <Zap className="h-4 w-4" />
            Automatic Sync
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2" data-testid="tab-manual">
            <Upload className="h-4 w-4" />
            Manual Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="automatic" className="mt-6 space-y-6">
          {/* Connection Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                {isConnected ? "Your Connection" : "Set Up Automatic Sync"}
              </CardTitle>
              <CardDescription>
                {isConnected 
                  ? "Your sync is active. New contacts will be added automatically."
                  : "Connect once and your contacts sync automatically - no manual work!"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isConnected && currentIntegration ? (
                <>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{currentIntegration.contactsImported} contacts synced</span>
                    </div>
                    {currentIntegration.lastSyncAt && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Last sync: {formatDistanceToNow(new Date(currentIntegration.lastSyncAt))} ago</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Webhook Link</label>
                    <p className="text-xs text-muted-foreground">
                      Paste this link in Zapier or Make.com to send contacts here automatically
                    </p>
                    <div className="flex gap-2">
                      <Input 
                        value={getWebhookUrl()} 
                        readOnly 
                        className="text-xs font-mono"
                        data-testid="input-webhook-url"
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={copyWebhookUrl}
                        data-testid="button-copy-webhook"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {!isWebhookUrlValid() && (
                      <p className="text-xs text-amber-600 dark:text-amber-500">
                        Note: You're currently in development mode. Publish your app first so Zapier can reach this link.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="gap-2" data-testid="button-disconnect">
                          <Unplug className="h-4 w-4" />
                          Disconnect
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disconnect {config.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will stop automatic syncing. Your existing contacts will stay in your CRM.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => disconnectMutation.mutate()}
                            data-testid="button-confirm-disconnect"
                          >
                            Disconnect
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    {config.automationSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full ${config.bgColor} flex items-center justify-center`}>
                          <span className={`text-xs font-bold ${config.color}`}>{i + 1}</span>
                        </div>
                        <p className="text-sm pt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => connectMutation.mutate()}
                    disabled={connectMutation.isPending || integrationsLoading}
                    className="w-full gap-2"
                    size="lg"
                    data-testid="button-connect"
                  >
                    {connectMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        Connect {config.name}
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Help for automation services */}
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Need Help with Zapier or Make.com?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>These services connect your apps together automatically. Here's how to get started:</p>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>Create a free account at <a href="https://zapier.com" target="_blank" rel="noopener" className="text-primary underline">Zapier.com</a> or <a href="https://make.com" target="_blank" rel="noopener" className="text-primary underline">Make.com</a></li>
                <li>Create a new automation that watches {config.name}</li>
                <li>Set the action to "Webhooks" and paste your link above</li>
                <li>Turn it on and your contacts will sync automatically!</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {config.manualSteps.map((step, i) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                        <span className={`text-sm font-bold ${config.color}`}>{i + 1}</span>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-medium">{step.title}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Add Your Contacts
              </CardTitle>
              <CardDescription>
                Paste your contacts below or upload a file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={`Paste your contacts here...\n\nExample:\nJohn Smith, +1234567890, john@email.com\nMary Johnson, +0987654321, mary@email.com`}
                value={contactData}
                onChange={(e) => setContactData(e.target.value)}
                className="min-h-[180px] text-sm"
                data-testid="textarea-contacts"
              />

              <div className="flex flex-wrap gap-2">
                <label>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                    data-testid="input-file-upload"
                  />
                  <Button variant="outline" size="sm" asChild className="cursor-pointer gap-2">
                    <span>
                      <FileSpreadsheet className="h-4 w-4" />
                      Upload a File
                    </span>
                  </Button>
                </label>
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2" data-testid="button-download-template">
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>

              <Button 
                onClick={handleImport} 
                disabled={!contactData.trim() || importMutation.isPending}
                className="w-full gap-2"
                size="lg"
                data-testid="button-import"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding contacts...
                  </>
                ) : (
                  <>
                    Add to My CRM
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Common Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {config.faq.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          Need help? Reach out to support anytime.
        </p>
      </div>
    </div>
  );
}
