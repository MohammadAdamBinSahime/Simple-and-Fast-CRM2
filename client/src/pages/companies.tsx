import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { ImageUpload } from "@/components/image-upload";
import { VideoUpload } from "@/components/video-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Building2, Video } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompanySchema, type Company, type InsertCompany } from "@shared/schema";
import { queryClient, apiRequest, getErrorMessage } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";

const companyFormSchema = insertCompanySchema.extend({
  name: z.string().default(""),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

const industries = [
  "Technology",
  "Finance",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Education",
  "Real Estate",
  "Consulting",
  "Other",
];

const companySizes = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

export default function Companies() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      domain: "",
      industry: "",
      size: "",
      address: "",
      phone: "",
      logoUrl: "",
      videoUrl: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    if (params.get("new") === "true") {
      setIsDialogOpen(true);
      setLocation("/companies", { replace: true });
    }
  }, [location, setLocation]);

  useEffect(() => {
    if (editingCompany) {
      form.reset({
        name: editingCompany.name,
        domain: editingCompany.domain || "",
        industry: editingCompany.industry || "",
        size: editingCompany.size || "",
        address: editingCompany.address || "",
        phone: editingCompany.phone || "",
        logoUrl: editingCompany.logoUrl || "",
        videoUrl: editingCompany.videoUrl || "",
      });
    } else {
      form.reset({
        name: "",
        domain: "",
        industry: "",
        size: "",
        address: "",
        phone: "",
        logoUrl: "",
        videoUrl: "",
      });
    }
  }, [editingCompany, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertCompany) => {
      return await apiRequest("POST", "/api/companies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Company created successfully" });
    },
    onError: (error) => {
      toast({ title: getErrorMessage(error, "Failed to create company"), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertCompany & { id: string }) => {
      return await apiRequest("PATCH", `/api/companies/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsDialogOpen(false);
      setEditingCompany(null);
      form.reset();
      toast({ title: "Company updated successfully" });
    },
    onError: (error) => {
      toast({ title: getErrorMessage(error, "Failed to update company"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({ title: "Company deleted successfully" });
    },
    onError: (error) => {
      toast({ title: getErrorMessage(error, "Failed to delete company"), variant: "destructive" });
    },
  });

  const onSubmit = (data: CompanyFormValues) => {
    if (editingCompany) {
      updateMutation.mutate({ ...data, id: editingCompany.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this company?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCompany(null);
    form.reset();
  };

  const filteredCompanies = companies?.filter((company) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      company.name.toLowerCase().includes(searchLower) ||
      (company.domain?.toLowerCase().includes(searchLower) ?? false) ||
      (company.industry?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  const columns: Column<Company>[] = [
    {
      key: "name",
      header: "Company",
      cell: (row) => {
        const hasLogo = row.logoUrl && row.logoUrl.trim().length > 0;
        const hasVideo = row.videoUrl && row.videoUrl.trim().length > 0;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 rounded-md">
              {hasLogo && <AvatarImage src={row.logoUrl!} alt={row.name} />}
              <AvatarFallback className="rounded-md bg-muted">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm">{row.name}</p>
                {hasVideo && (
                  <Video className="h-3.5 w-3.5 text-muted-foreground" data-testid={`icon-video-company-${row.id}`} />
                )}
              </div>
              {row.domain && (
                <p className="text-xs text-muted-foreground">{row.domain}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "industry",
      header: "Industry",
      cell: (row) => <span className="text-sm">{row.industry || "-"}</span>,
    },
    {
      key: "size",
      header: "Size",
      cell: (row) => <span className="text-sm">{row.size ? `${row.size} employees` : "-"}</span>,
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => <span className="text-sm font-mono">{row.phone || "-"}</span>,
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
        </span>
      ),
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
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Companies</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your organizations and accounts
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-company">
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-companies"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredCompanies || []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={(row) => setLocation(`/companies/${row.id}`)}
        selectedRows={selectedRows}
        onSelectRow={(id) => {
          setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
          );
        }}
        onSelectAll={() => {
          if (selectedRows.length === filteredCompanies?.length) {
            setSelectedRows([]);
          } else {
            setSelectedRows(filteredCompanies?.map((c) => c.id) || []);
          }
        }}
        emptyMessage="No companies found. Add your first company to get started."
        testIdPrefix="companies"
      />

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCompany ? "Edit Company" : "Add New Company"}</DialogTitle>
            <DialogDescription>
              {editingCompany
                ? "Update the company information below."
                : "Fill in the details to create a new company."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel>Company Logo</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        type="company"
                        fallbackText={form.watch("name")?.charAt(0) || "?"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <VideoUpload
                        value={field.value}
                        onChange={field.onChange}
                        label="Company Video"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="example.com"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-domain"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-industry">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {industries.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Size</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-size">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companySizes.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size} employees
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
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-company"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingCompany
                    ? "Update Company"
                    : "Create Company"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
