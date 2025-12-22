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
import { Card, CardContent } from "@/components/ui/card";
import { KanbanBoard } from "@/components/kanban-board";
import { StatusBadge } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutGrid, Table2 } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDealSchema, dealStages, type Deal, type Contact, type Company, type InsertDeal } from "@shared/schema";
import { queryClient, apiRequest, getErrorMessage } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { format } from "date-fns";

const dealFormSchema = insertDealSchema.extend({
  name: z.string().default(""),
  value: z.string().default("0"),
});

type DealFormValues = z.infer<typeof dealFormSchema>;

const stageLabels: Record<string, string> = {
  lead: "Lead",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export default function Deals() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [defaultStage, setDefaultStage] = useState<string>("lead");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const { toast } = useToast();

  const { data: deals, isLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      name: "",
      value: "",
      stage: "lead",
      probability: 0,
      expectedCloseDate: null,
      contactId: null,
      companyId: null,
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    if (params.get("new") === "true") {
      setIsDialogOpen(true);
      setLocation("/deals", { replace: true });
    }
  }, [location, setLocation]);

  useEffect(() => {
    if (editingDeal) {
      form.reset({
        name: editingDeal.name,
        value: String(editingDeal.value),
        stage: editingDeal.stage,
        probability: editingDeal.probability || 0,
        expectedCloseDate: editingDeal.expectedCloseDate,
        contactId: editingDeal.contactId,
        companyId: editingDeal.companyId,
      });
    } else {
      form.reset({
        name: "",
        value: "",
        stage: defaultStage,
        probability: 0,
        expectedCloseDate: null,
        contactId: null,
        companyId: null,
      });
    }
  }, [editingDeal, form, defaultStage]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertDeal) => {
      return await apiRequest("POST", "/api/deals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Deal created successfully" });
    },
    onError: (error) => {
      toast({ title: getErrorMessage(error, "Failed to create deal"), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertDeal & { id: string }) => {
      return await apiRequest("PATCH", `/api/deals/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsDialogOpen(false);
      setEditingDeal(null);
      form.reset();
      toast({ title: "Deal updated successfully" });
    },
    onError: (error) => {
      toast({ title: getErrorMessage(error, "Failed to update deal"), variant: "destructive" });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      return await apiRequest("PATCH", `/api/deals/${id}`, { stage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
    },
    onError: (error) => {
      toast({ title: getErrorMessage(error, "Failed to update deal stage"), variant: "destructive" });
    },
  });

  const onSubmit = (data: DealFormValues) => {
    if (editingDeal) {
      updateMutation.mutate({ ...data, id: editingDeal.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleAddItem = (stage: string) => {
    setDefaultStage(stage);
    setEditingDeal(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDeal(null);
    form.reset();
  };

  const handleDragEnd = (itemId: string, newStage: string) => {
    updateStageMutation.mutate({ id: itemId, stage: newStage });
  };

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  const getContactName = (contactId: string | null) => {
    if (!contactId || !contacts) return "-";
    const contact = contacts.find((c) => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : "-";
  };

  const getCompanyName = (companyId: string | null) => {
    if (!companyId || !companies) return "-";
    const company = companies.find((c) => c.id === companyId);
    return company?.name || "-";
  };

  const kanbanColumns = dealStages
    .filter((stage) => stage !== "closed_lost")
    .map((stage) => ({
      id: stage,
      title: stageLabels[stage],
      items: deals?.filter((d) => d.stage === stage) || [],
    }));

  const renderDealCard = (deal: Deal) => (
    <CardContent className="p-4 pr-8">
      <h4 className="font-medium text-sm mb-2">{deal.name}</h4>
      <p className="text-lg font-semibold text-primary mb-2">
        {formatCurrency(deal.value)}
      </p>
      <div className="space-y-1 text-xs text-muted-foreground">
        {deal.contactId && (
          <p>{getContactName(deal.contactId)}</p>
        )}
        {deal.companyId && (
          <p>{getCompanyName(deal.companyId)}</p>
        )}
        {deal.expectedCloseDate && (
          <p>Close: {format(new Date(deal.expectedCloseDate), "MMM d, yyyy")}</p>
        )}
      </div>
    </CardContent>
  );

  const columns: Column<Deal>[] = [
    {
      key: "name",
      header: "Deal",
      cell: (row) => <span className="font-medium text-sm">{row.name}</span>,
    },
    {
      key: "value",
      header: "Value",
      cell: (row) => (
        <span className="font-semibold text-sm">{formatCurrency(row.value)}</span>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      cell: (row) => <StatusBadge status={row.stage} />,
    },
    {
      key: "contact",
      header: "Contact",
      cell: (row) => <span className="text-sm">{getContactName(row.contactId)}</span>,
    },
    {
      key: "company",
      header: "Company",
      cell: (row) => <span className="text-sm">{getCompanyName(row.companyId)}</span>,
    },
    {
      key: "expectedCloseDate",
      header: "Expected Close",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.expectedCloseDate
            ? format(new Date(row.expectedCloseDate), "MMM d, yyyy")
            : "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Deals</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track your sales pipeline and opportunities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "kanban" | "table")}>
            <TabsList>
              <TabsTrigger value="kanban" data-testid="tab-kanban">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="table" data-testid="tab-table">
                <Table2 className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => handleAddItem("lead")} data-testid="button-add-deal">
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <KanbanBoard
          columns={kanbanColumns}
          renderCard={renderDealCard}
          onDragEnd={handleDragEnd}
          onAddItem={handleAddItem}
          getItemId={(deal) => deal.id}
          isLoading={isLoading}
          testIdPrefix="deals"
        />
      ) : (
        <DataTable
          columns={columns}
          data={deals || []}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          onRowClick={(row) => {
            setEditingDeal(row);
            setIsDialogOpen(true);
          }}
          emptyMessage="No deals found. Create your first deal to start tracking opportunities."
          testIdPrefix="deals"
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDeal ? "Edit Deal" : "Add New Deal"}</DialogTitle>
            <DialogDescription>
              {editingDeal
                ? "Update the deal information below."
                : "Fill in the details to create a new deal."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-deal-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          data-testid="input-value"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stage</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-stage">
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dealStages.map((stage) => (
                            <SelectItem key={stage} value={stage}>
                              {stageLabels[stage]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-contact">
                            <SelectValue placeholder="Select contact" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No contact</SelectItem>
                          {contacts?.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.firstName} {contact.lastName}
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
                            <SelectValue placeholder="Select company" />
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="probability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Probability (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-probability"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expectedCloseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Close Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? new Date(e.target.value) : null)
                          }
                          data-testid="input-expected-close"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-deal"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingDeal
                    ? "Update Deal"
                    : "Create Deal"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
