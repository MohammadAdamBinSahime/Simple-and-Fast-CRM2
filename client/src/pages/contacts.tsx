import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Download, Upload, Tags, MessageCircle } from "lucide-react";
import { SiFacebook, SiLinkedin, SiWhatsapp } from "react-icons/si";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactSchema, contactStatuses, type Contact, type Company, type InsertContact, type Tag } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest, getErrorMessage } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const contactFormSchema = insertContactSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Contacts() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: allTags } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  const exportToCSV = () => {
    if (!contacts || contacts.length === 0) {
      toast({ title: "No contacts to export", variant: "destructive" });
      return;
    }
    const headers = ["First Name", "Last Name", "Email", "Phone", "Job Title", "Company", "Status"];
    const csvContent = [
      headers.join(","),
      ...contacts.map(c => [
        `"${c.firstName}"`,
        `"${c.lastName}"`,
        `"${c.email}"`,
        `"${c.phone || ""}"`,
        `"${c.jobTitle || ""}"`,
        `"${getCompanyName(c.companyId)}"`,
        `"${c.status}"`
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "contacts.csv";
    link.click();
    toast({ title: "Contacts exported successfully" });
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim());
      if (lines.length <= 1) {
        toast({ title: "No data found in CSV", variant: "destructive" });
        return;
      }
      
      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (values && values.length >= 3) {
          const cleanValue = (v: string) => v?.replace(/^"|"$/g, "").trim() || "";
          try {
            await apiRequest("POST", "/api/contacts", {
              firstName: cleanValue(values[0]),
              lastName: cleanValue(values[1]),
              email: cleanValue(values[2]),
              phone: cleanValue(values[3]) || null,
              jobTitle: cleanValue(values[4]) || null,
              status: cleanValue(values[6]) || "lead",
            });
            imported++;
          } catch (err) {
            console.error("Failed to import row:", i, err);
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({ title: `Imported ${imported} contacts successfully` });
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      companyId: null,
      status: "lead",
      linkedinUrl: "",
      facebookUrl: "",
      whatsappNumber: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    if (params.get("new") === "true") {
      setIsDialogOpen(true);
      setLocation("/contacts", { replace: true });
    }
  }, [location, setLocation]);

  useEffect(() => {
    if (editingContact) {
      form.reset({
        firstName: editingContact.firstName,
        lastName: editingContact.lastName,
        email: editingContact.email,
        phone: editingContact.phone || "",
        jobTitle: editingContact.jobTitle || "",
        companyId: editingContact.companyId,
        status: editingContact.status,
        linkedinUrl: editingContact.linkedinUrl || "",
        facebookUrl: editingContact.facebookUrl || "",
        whatsappNumber: editingContact.whatsappNumber || "",
      });
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        companyId: null,
        status: "lead",
        linkedinUrl: "",
        facebookUrl: "",
        whatsappNumber: "",
      });
    }
  }, [editingContact, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      return await apiRequest("POST", "/api/contacts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Contact created successfully" });
    },
    onError: (error) => {
      toast({ title: getErrorMessage(error, "Failed to create contact"), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertContact & { id: string }) => {
      return await apiRequest("PATCH", `/api/contacts/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setIsDialogOpen(false);
      setEditingContact(null);
      form.reset();
      toast({ title: "Contact updated successfully" });
    },
    onError: (error) => {
      toast({ title: getErrorMessage(error, "Failed to update contact"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({ title: "Contact deleted successfully" });
    },
    onError: (error) => {
      toast({ title: getErrorMessage(error, "Failed to delete contact"), variant: "destructive" });
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    if (editingContact) {
      updateMutation.mutate({ ...data, id: editingContact.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingContact(null);
    form.reset();
  };

  const filteredContacts = contacts?.filter((contact) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      contact.firstName.toLowerCase().includes(searchLower) ||
      contact.lastName.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower)
    );
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getCompanyName = (companyId: string | null) => {
    if (!companyId || !companies) return "-";
    const company = companies.find((c) => c.id === companyId);
    return company?.name || "-";
  };

  const columns: Column<Contact>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
            {row.firstName[0]}{row.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-sm">{row.firstName} {row.lastName}</p>
            <p className="text-xs text-muted-foreground">{row.jobTitle || "-"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (row) => <span className="text-sm">{row.email}</span>,
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => <span className="text-sm font-mono">{row.phone || "-"}</span>,
    },
    {
      key: "company",
      header: "Company",
      cell: (row) => <span className="text-sm">{getCompanyName(row.companyId)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "social",
      header: "Connect",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!row.whatsappNumber && !row.phone}
            onClick={(e) => {
              e.stopPropagation();
              const number = row.whatsappNumber || row.phone;
              if (number) {
                window.open(`https://wa.me/${number.replace(/\D/g, '')}`, '_blank');
              }
            }}
            data-testid={`button-whatsapp-${row.id}`}
            title="Message on WhatsApp"
          >
            <SiWhatsapp className="h-4 w-4 text-green-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!row.linkedinUrl}
            onClick={(e) => {
              e.stopPropagation();
              if (row.linkedinUrl) {
                window.open(row.linkedinUrl, '_blank');
              }
            }}
            data-testid={`button-linkedin-${row.id}`}
            title="View LinkedIn profile"
          >
            <SiLinkedin className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!row.facebookUrl}
            onClick={(e) => {
              e.stopPropagation();
              if (row.facebookUrl) {
                window.open(row.facebookUrl, '_blank');
              }
            }}
            data-testid={`button-facebook-${row.id}`}
            title="View Facebook profile"
          >
            <SiFacebook className="h-4 w-4 text-blue-500" />
          </Button>
        </div>
      ),
      className: "w-28",
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" data-testid={`button-actions-${row.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row)} data-testid={`menu-item-edit-${row.id}`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(row.id)}
              className="text-destructive"
              data-testid={`menu-item-delete-${row.id}`}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-12",
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Contacts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your contacts and leads
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={exportToCSV} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <label>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCSV}
              data-testid="input-import-csv"
            />
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </span>
            </Button>
          </label>
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-contact">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-contacts"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {contactStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredContacts || []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        selectedRows={selectedRows}
        onSelectRow={(id) => {
          setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
          );
        }}
        onSelectAll={() => {
          if (selectedRows.length === filteredContacts?.length) {
            setSelectedRows([]);
          } else {
            setSelectedRows(filteredContacts?.map((c) => c.id) || []);
          }
        }}
        emptyMessage="No contacts found. Add your first contact to get started."
        testIdPrefix="contacts"
      />

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
            <DialogDescription>
              {editingContact
                ? "Update the contact information below."
                : "Fill in the details to create a new contact."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-job-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-company">
                            <SelectValue placeholder="Select a company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No company</SelectItem>
                          {companies?.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contactStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Social Links
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <SiWhatsapp className="h-3 w-3 text-green-500" />
                          WhatsApp
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ""} 
                            placeholder="+1234567890"
                            data-testid="input-whatsapp" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <SiLinkedin className="h-3 w-3 text-blue-600" />
                          LinkedIn
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ""} 
                            placeholder="https://linkedin.com/in/..."
                            data-testid="input-linkedin" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="facebookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <SiFacebook className="h-3 w-3 text-blue-500" />
                          Facebook
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ""} 
                            placeholder="https://facebook.com/..."
                            data-testid="input-facebook" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-contact"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingContact
                    ? "Update Contact"
                    : "Create Contact"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
