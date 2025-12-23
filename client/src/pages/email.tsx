import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  Mail,
  Plus,
  Send,
  Clock,
  FileText,
  Calendar as CalendarIcon,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { ScheduledEmail, EmailTemplate } from "@shared/schema";

interface UserInfo {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export default function Email() {
  const { toast } = useToast();
  const [composeOpen, setComposeOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("09:00");

  const { data: user } = useQuery<UserInfo>({
    queryKey: ["/api/me"],
  });

  const { data: scheduledEmails = [], isLoading: emailsLoading } = useQuery<ScheduledEmail[]>({
    queryKey: ["/api/scheduled-emails"],
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email-templates"],
  });

  const createEmail = useMutation({
    mutationFn: async (data: {
      toEmail: string;
      subject: string;
      body: string;
      fromEmail?: string;
      scheduledAt?: Date;
      status: string;
    }) => {
      return apiRequest("POST", "/api/scheduled-emails", data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-emails"] });
      setComposeOpen(false);
      setSelectedDate(undefined);
      toast({ 
        title: variables.scheduledAt ? "Email scheduled" : "Email sent", 
        description: variables.scheduledAt ? `Will be sent on ${format(variables.scheduledAt, "PPP")}` : "Your email is being sent now"
      });
    },
    onError: () => {
      toast({ title: "Failed to send email", variant: "destructive" });
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (data: { name: string; subject: string; body: string }) => {
      return apiRequest("POST", "/api/email-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      setTemplateOpen(false);
      toast({ title: "Template created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    },
  });

  const deleteEmail = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/scheduled-emails/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-emails"] });
      toast({ title: "Email deleted" });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/email-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({ title: "Template deleted" });
    },
  });

  const handleComposeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const toEmail = formData.get("toEmail") as string;
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;

    let scheduledAt: Date | undefined;
    if (selectedDate) {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hours, minutes, 0, 0);
    }

    createEmail.mutate({
      toEmail,
      subject,
      body,
      fromEmail: user?.email || undefined,
      scheduledAt,
      status: scheduledAt ? "scheduled" : "sending",
    });
  };

  const handleTemplateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTemplate.mutate({
      name: formData.get("name") as string,
      subject: formData.get("subject") as string,
      body: formData.get("body") as string,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />Sent</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Scheduled</Badge>;
      case "failed":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
      case "sending":
        return <Badge className="gap-1"><Loader2 className="h-3 w-3 animate-spin" />Sending</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><FileText className="h-3 w-3" />Draft</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Email</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Compose, schedule, and automate your email communications
          </p>
          {user?.email && (
            <div className="flex items-center gap-2 mt-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Sending from:</span>
              <span className="text-sm font-medium" data-testid="text-current-email">{user.email}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-new-template">
                <FileText className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Email Template</DialogTitle>
                <DialogDescription>
                  Save a reusable email template for quick composition
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleTemplateSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    name="name"
                    placeholder="e.g., Follow-up Email"
                    data-testid="input-template-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-subject">Subject Line</Label>
                  <Input
                    id="template-subject"
                    name="subject"
                    placeholder="Email subject"
                    data-testid="input-template-subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-body">Email Body</Label>
                  <Textarea
                    id="template-body"
                    name="body"
                    placeholder="Write your email template..."
                    rows={6}
                    data-testid="input-template-body"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setTemplateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTemplate.isPending} data-testid="button-save-template">
                    {createTemplate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Template
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-compose-email">
                <Plus className="h-4 w-4 mr-2" />
                Compose Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Compose Email</DialogTitle>
                <DialogDescription>
                  Write an email and optionally schedule it to send later
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleComposeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Send From</Label>
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/50">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user?.email || "Loading..."}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toEmail">To</Label>
                  <Input
                    id="toEmail"
                    name="toEmail"
                    type="email"
                    placeholder="recipient@example.com"
                    data-testid="input-to-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="Email subject"
                    data-testid="input-subject"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Message</Label>
                  <Textarea
                    id="body"
                    name="body"
                    placeholder="Write your message..."
                    rows={8}
                    data-testid="input-body"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Schedule (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-[200px] justify-start text-left font-normal"
                          data-testid="button-select-date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-[120px]"
                      data-testid="input-time"
                    />
                    {selectedDate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedDate(undefined)}
                        data-testid="button-clear-schedule"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {selectedDate && (
                    <p className="text-sm text-muted-foreground">
                      Will be sent on {format(selectedDate, "PPPP")} at {selectedTime}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setComposeOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createEmail.isPending} data-testid="button-send-email">
                    {createEmail.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {selectedDate ? (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Schedule
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Now
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="scheduled" className="space-y-6">
        <TabsList>
          <TabsTrigger value="scheduled" data-testid="tab-scheduled">
            <Clock className="h-4 w-4 mr-2" />
            Scheduled ({scheduledEmails.length})
          </TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates ({templates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          {emailsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : scheduledEmails.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Mail className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No scheduled emails yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {scheduledEmails.map((email) => (
                <Card key={email.id} data-testid={`card-email-${email.id}`}>
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{email.subject}</h3>
                        {getStatusBadge(email.status)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        To: {email.toEmail}
                      </p>
                      {email.scheduledAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Scheduled for: {format(new Date(email.scheduledAt), "PPp")}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteEmail.mutate(email.id)}
                      disabled={deleteEmail.isPending}
                      data-testid={`button-delete-email-${email.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {templatesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No templates yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} data-testid={`card-template-${template.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => deleteTemplate.mutate(template.id)}
                        disabled={deleteTemplate.isPending}
                        data-testid={`button-delete-template-${template.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription className="truncate">{template.subject}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {template.body}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
