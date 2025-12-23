import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  CheckSquare,
  FileText,
  HandshakeIcon,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { SiFacebook, SiLinkedin, SiWhatsapp } from "react-icons/si";
import { format } from "date-fns";
import type { Contact, Company, Deal, Task, Note } from "@shared/schema";

export default function ContactProfile() {
  const [, params] = useRoute("/contacts/:id");
  const contactId = params?.id;

  const { data: contact, isLoading: contactLoading } = useQuery<Contact>({
    queryKey: [`/api/contacts/${contactId}`],
    enabled: !!contactId,
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: allDeals = [] } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: allNotes = [] } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  if (contactLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Contact not found</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/contacts">Back to Contacts</Link>
          </Button>
        </div>
      </div>
    );
  }

  const company = companies.find(c => c.id === contact.companyId);
  const deals = allDeals.filter(d => d.contactId === contactId);
  const tasks = allTasks.filter(t => t.contactId === contactId);
  const notes = allNotes.filter(n => n.contactId === contactId);

  const initials = `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/contacts" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Contact Profile</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold" data-testid="text-contact-name">
                  {contact.firstName} {contact.lastName}
                </h2>
                {contact.jobTitle && (
                  <p className="text-muted-foreground">{contact.jobTitle}</p>
                )}
                <div className="mt-2">
                  <StatusBadge status={contact.status} />
                </div>

                <div className="flex items-center gap-2 mt-4">
                  {contact.linkedinUrl && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">
                        <SiLinkedin className="h-4 w-4 text-blue-600" />
                      </a>
                    </Button>
                  )}
                  {contact.facebookUrl && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer">
                        <SiFacebook className="h-4 w-4 text-blue-500" />
                      </a>
                    </Button>
                  )}
                  {contact.whatsappNumber && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={`https://wa.me/${contact.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                        <SiWhatsapp className="h-4 w-4 text-green-500" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a href={`mailto:${contact.email}`} className="text-sm hover:underline">
                      {contact.email}
                    </a>
                  </div>
                </div>

                {contact.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <a href={`tel:${contact.phone}`} className="text-sm hover:underline">
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                )}

                {company && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Company</p>
                      <Link href={`/companies/${company.id}`} className="text-sm hover:underline">
                        {company.name}
                      </Link>
                    </div>
                  </div>
                )}

                {contact.jobTitle && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Job Title</p>
                      <p className="text-sm">{contact.jobTitle}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Added</p>
                    <p className="text-sm">{format(new Date(contact.createdAt), "PPP")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HandshakeIcon className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Deals</CardTitle>
              </div>
              <CardDescription>
                {deals.length} deal{deals.length !== 1 ? 's' : ''} associated with this contact
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No deals yet</p>
              ) : (
                <div className="space-y-3">
                  {deals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 rounded-md border">
                      <div>
                        <p className="font-medium">{deal.name}</p>
                        <p className="text-sm text-muted-foreground">
                          RM {parseFloat(deal.value).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">{deal.stage}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Tasks</CardTitle>
              </div>
              <CardDescription>
                {tasks.length} task{tasks.length !== 1 ? 's' : ''} for this contact
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-md border">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${task.completed === 'true' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <div>
                          <p className={`font-medium ${task.completed === 'true' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </p>
                          {task.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              Due: {format(new Date(task.dueDate), "PPP")}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Notes</CardTitle>
              </div>
              <CardDescription>
                {notes.length} note{notes.length !== 1 ? 's' : ''} about this contact
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-md border">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(note.createdAt), "PPP 'at' p")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
