import { useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  HelpCircle
} from "lucide-react";
import { SiFacebook, SiLinkedin, SiWhatsapp } from "react-icons/si";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const integrationConfigs = {
  whatsapp: {
    name: "WhatsApp",
    icon: SiWhatsapp,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    heroText: "Import your WhatsApp contacts",
    heroDescription: "Bring all your client contacts from WhatsApp into your CRM in just a few clicks",
    csvTemplate: "Name,Phone Number\nJohn Smith,+1234567890\nMary Johnson,+0987654321",
    steps: [
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
        q: "How do I get my contacts from my phone?",
        a: "On iPhone: Open Contacts app > tap a contact > Share Contact > copy info. On Android: Open Contacts > Menu > Export. You can then paste the info below.",
      },
      {
        q: "What format should my contacts be in?",
        a: "Just put each contact on a new line with their name and phone number. Example: John Smith, +1234567890",
      },
      {
        q: "Can I add contacts one by one instead?",
        a: "Yes! Go to Contacts in the menu and click 'Add Contact' to add them individually.",
      },
    ],
  },
  linkedin: {
    name: "LinkedIn",
    icon: SiLinkedin,
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
    heroText: "Import your LinkedIn connections",
    heroDescription: "Add your professional network to your CRM to stay in touch with potential clients",
    csvTemplate: "First Name,Last Name,Email,Company,Position\nJohn,Smith,john@email.com,ABC Realty,Broker\nMary,Johnson,mary@email.com,XYZ Properties,Agent",
    steps: [
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
        q: "Where do I find my LinkedIn data?",
        a: "Click your profile picture on LinkedIn > Settings & Privacy > Data Privacy > Get a copy of your data. Select 'Connections' and request the download.",
      },
      {
        q: "How long does the download take?",
        a: "LinkedIn usually sends you an email within 10 minutes with a download link.",
      },
      {
        q: "What file do I upload?",
        a: "After downloading, unzip the file and look for 'Connections.csv' - that's the one to upload here.",
      },
    ],
  },
  facebook: {
    name: "Facebook",
    icon: SiFacebook,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    heroText: "Import contacts from Facebook",
    heroDescription: "Connect with your Facebook friends who might be interested in buying or selling",
    csvTemplate: "Name,Email\nJohn Smith,john@email.com\nMary Johnson,mary@email.com",
    steps: [
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
        q: "Can I import all my Facebook friends?",
        a: "You can download your Facebook friends list and their info (if they've shared it). Go to Settings > Your Facebook Information > Download Your Information.",
      },
      {
        q: "Will my friends know I imported them?",
        a: "No, this is just for your personal CRM. Your friends won't be notified.",
      },
      {
        q: "What if I only want to add a few people?",
        a: "You can add contacts one by one from the Contacts page - just click 'Add Contact' and paste their Facebook profile link.",
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
        
        // Try to parse name
        const namePart = parts[0];
        if (namePart.includes(" ")) {
          const nameParts = namePart.split(" ");
          contact.firstName = nameParts[0];
          contact.lastName = nameParts.slice(1).join(" ");
        } else {
          contact.firstName = namePart;
          contact.lastName = "";
        }

        // Look for email and phone in remaining parts
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
            // Might be job title or company
            contact.jobTitle = part;
          }
        }

        // Generate placeholder email if needed
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
              <Button asChild>
                <a href="/contacts">
                  <Users className="h-4 w-4 mr-2" />
                  View My Contacts
                </a>
              </Button>
              <Button variant="outline" onClick={() => setShowSuccess(false)}>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {config.steps.map((step, i) => {
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
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
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
