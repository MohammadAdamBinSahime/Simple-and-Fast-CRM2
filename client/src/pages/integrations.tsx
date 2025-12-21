import { useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ExternalLink, 
  MessageCircle, 
  Users, 
  Link2, 
  Upload, 
  LogIn, 
  AlertCircle,
  FileText,
  Download,
  CheckCircle,
  Loader2
} from "lucide-react";
import { SiFacebook, SiLinkedin, SiWhatsapp } from "react-icons/si";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const integrationConfigs = {
  whatsapp: {
    name: "WhatsApp",
    icon: SiWhatsapp,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    description: "Import contacts from WhatsApp and message them directly",
    csvTemplate: "Name,Phone Number,Notes\nJohn Doe,+1234567890,From WhatsApp\nJane Smith,+0987654321,Business contact",
    csvInstructions: [
      "Open WhatsApp on your phone",
      "Go to Settings > Chats > Export chat or use a contact export app",
      "Copy contact names and phone numbers",
      "Paste into the import area below or upload a CSV file",
    ],
    oauthNote: "WhatsApp Business API requires Meta Business verification. For personal use, export your contacts manually.",
    fields: ["firstName", "lastName", "phone", "whatsappNumber"],
  },
  linkedin: {
    name: "LinkedIn",
    icon: SiLinkedin,
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
    description: "Import your LinkedIn connections as CRM contacts",
    csvTemplate: "First Name,Last Name,Email,Company,Position,LinkedIn URL\nJohn,Doe,john@example.com,Acme Inc,CEO,https://linkedin.com/in/johndoe",
    csvInstructions: [
      "Go to LinkedIn Settings > Data Privacy > Get a copy of your data",
      "Select 'Connections' and request the archive",
      "Download the ZIP file and extract Connections.csv",
      "Upload the CSV file below",
    ],
    oauthNote: "Direct LinkedIn login requires a LinkedIn Developer App with Partner Program access. Use CSV export for now.",
    fields: ["firstName", "lastName", "email", "jobTitle", "linkedinUrl"],
  },
  facebook: {
    name: "Facebook",
    icon: SiFacebook,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Import contacts from Facebook for social engagement",
    csvTemplate: "Name,Email,Facebook URL\nJohn Doe,john@example.com,https://facebook.com/johndoe",
    csvInstructions: [
      "Go to Facebook Settings > Your Facebook Information",
      "Click 'Download Your Information'",
      "Select 'Friends' and download",
      "Extract and upload the contacts file below",
    ],
    oauthNote: "Facebook Graph API restricts friend list access. Use the data export feature to get your contacts.",
    fields: ["firstName", "lastName", "email", "facebookUrl"],
  },
};

type IntegrationType = keyof typeof integrationConfigs;

export default function Integrations() {
  const [, params] = useRoute("/integrations/:type");
  const type = (params?.type as IntegrationType) || "whatsapp";
  const config = integrationConfigs[type] || integrationConfigs.whatsapp;
  const Icon = config.icon;
  const { toast } = useToast();

  const [csvData, setCsvData] = useState("");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

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
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: `Successfully imported ${count} contacts` });
      setCsvData("");
    },
    onError: () => {
      toast({ title: "Failed to import contacts", variant: "destructive" });
    },
  });

  const parseCSV = (csv: string): any[] => {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const contacts: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
      if (values.length < 2) continue;

      const cleanValue = (v: string) => v?.replace(/^"|"$/g, "").trim() || "";
      
      const contact: any = { status: "lead" };
      
      headers.forEach((header, idx) => {
        const value = cleanValue(values[idx] || "");
        if (!value) return;
        
        if (header.includes("first") && header.includes("name")) {
          contact.firstName = value;
        } else if (header.includes("last") && header.includes("name")) {
          contact.lastName = value;
        } else if (header === "name" || header === "full name") {
          const parts = value.split(" ");
          contact.firstName = parts[0] || "";
          contact.lastName = parts.slice(1).join(" ") || "";
        } else if (header.includes("email")) {
          contact.email = value;
        } else if (header.includes("phone") || header.includes("number")) {
          contact.phone = value;
          if (type === "whatsapp") {
            contact.whatsappNumber = value;
          }
        } else if (header.includes("company") || header.includes("organization")) {
          // Skip for now, would need company lookup
        } else if (header.includes("position") || header.includes("title") || header.includes("job")) {
          contact.jobTitle = value;
        } else if (header.includes("linkedin")) {
          contact.linkedinUrl = value;
        } else if (header.includes("facebook")) {
          contact.facebookUrl = value;
        }
      });

      // Validate required fields
      if (contact.firstName && (contact.email || contact.phone)) {
        if (!contact.lastName) contact.lastName = "";
        if (!contact.email) contact.email = `${contact.firstName.toLowerCase()}@imported.local`;
        contacts.push(contact);
      }
    }

    return contacts;
  };

  const handleImport = () => {
    const contacts = parseCSV(csvData);
    if (contacts.length === 0) {
      toast({ title: "No valid contacts found in the data", variant: "destructive" });
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
      setCsvData(text);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const blob = new Blob([config.csvTemplate], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_contacts_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOAuthLogin = () => {
    setIsImportDialogOpen(true);
  };

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
              <LogIn className="h-5 w-5" />
              Connect with {config.name}
            </CardTitle>
            <CardDescription>
              Sign in to import your contacts directly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full gap-2" 
              variant="outline"
              onClick={handleOAuthLogin}
              data-testid={`button-login-${type}`}
            >
              <Icon className={`h-5 w-5 ${config.color}`} />
              Sign in with {config.name}
            </Button>
            <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {config.oauthNote}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import from CSV
            </CardTitle>
            <CardDescription>
              Upload a CSV file or paste contact data to import
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>How to export from {config.name}:</Label>
              <ol className="space-y-2 text-sm text-muted-foreground">
                {config.csvInstructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`flex-shrink-0 h-5 w-5 rounded-full ${config.bgColor} ${config.color} flex items-center justify-center text-xs font-medium`}>
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                <Download className="h-4 w-4" />
                Download Template
              </Button>
              <label>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  data-testid="input-upload-csv"
                />
                <Button variant="outline" size="sm" asChild className="gap-2 cursor-pointer">
                  <span>
                    <FileText className="h-4 w-4" />
                    Upload CSV File
                  </span>
                </Button>
              </label>
            </div>

            <div className="space-y-2">
              <Label>Or paste CSV data:</Label>
              <Textarea
                placeholder={config.csvTemplate}
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                className="min-h-[150px] font-mono text-xs"
                data-testid="textarea-csv-data"
              />
            </div>

            <Button 
              onClick={handleImport} 
              disabled={!csvData.trim() || importMutation.isPending}
              className="w-full gap-2"
              data-testid="button-import-contacts"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Import Contacts
                </>
              )}
            </Button>

            {importedCount > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Successfully imported {importedCount} contacts</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <a href="/contacts" data-testid="link-view-contacts">
                <Users className="h-4 w-4" />
                View All Contacts
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <a href="/contacts?new=true" data-testid="link-add-contact">
                <MessageCircle className="h-4 w-4" />
                Add Contact Manually
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${config.color}`} />
              {config.name} Login Required
            </DialogTitle>
            <DialogDescription>
              Direct login with {config.name} requires additional setup
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {config.oauthNote}
            </p>
            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <p className="text-sm font-medium">For now, you can:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. Export your contacts from {config.name}</li>
                <li>2. Use the CSV import feature above</li>
                <li>3. Add contacts manually with their {config.name} profile links</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Got it
            </Button>
            <Button onClick={() => {
              setIsImportDialogOpen(false);
              downloadTemplate();
            }}>
              Download Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
