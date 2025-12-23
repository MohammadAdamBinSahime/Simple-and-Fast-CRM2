import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Code, Database, Server, Users, Building2, HandshakeIcon, CheckSquare, FileText, Tag, RefreshCw, Play, Loader2, Terminal } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Contact, Company, Deal, Task, Note } from "@shared/schema";

const DEVELOPER_EMAIL = "adamsahime1998@gmail.com";

interface SqlResult {
  rows: Record<string, any>[];
  rowCount: number;
  fields: { name: string; dataTypeID: number }[];
}

export default function Developer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM contacts LIMIT 10;");
  const [sqlResult, setSqlResult] = useState<SqlResult | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);

  const { data: contacts } = useQuery<Contact[]>({ queryKey: ["/api/contacts"] });
  const { data: companies } = useQuery<Company[]>({ queryKey: ["/api/companies"] });
  const { data: deals } = useQuery<Deal[]>({ queryKey: ["/api/deals"] });
  const { data: tasks } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: notes } = useQuery<Note[]>({ queryKey: ["/api/notes"] });

  if (user?.email !== DEVELOPER_EMAIL) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Access denied. This page is only available to the developer.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sqlMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/developer/sql", { query });
      return response.json();
    },
    onSuccess: (data: SqlResult) => {
      setSqlResult(data);
      setSqlError(null);
      toast({ title: "Query executed", description: `${data.rowCount ?? data.rows.length} row(s) returned` });
    },
    onError: (error: any) => {
      setSqlResult(null);
      setSqlError(error.message || "Query failed");
      toast({ title: "Query failed", description: error.message, variant: "destructive" });
    },
  });

  const handleExecuteQuery = () => {
    if (sqlQuery.trim()) {
      sqlMutation.mutate(sqlQuery);
    }
  };

  const handleRefreshCache = () => {
    queryClient.invalidateQueries();
    toast({ title: "Cache refreshed", description: "All queries have been invalidated and will refetch." });
  };

  const stats = [
    { label: "Contacts", value: contacts?.length || 0, icon: Users },
    { label: "Companies", value: companies?.length || 0, icon: Building2 },
    { label: "Deals", value: deals?.length || 0, icon: HandshakeIcon },
    { label: "Tasks", value: tasks?.length || 0, icon: CheckSquare },
    { label: "Notes", value: notes?.length || 0, icon: FileText },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Developer Tools</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Admin tools and system information
          </p>
        </div>
        <Badge variant="secondary">
          <Code className="h-3 w-3 mr-1" />
          Developer Only
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Info</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-mono text-xs">{user?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="truncate max-w-[150px]">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stripe Customer:</span>
                <span className="font-mono text-xs truncate max-w-[120px]">{user?.stripeCustomerId || "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscription:</span>
                <Badge variant={user?.stripeSubscriptionId ? "default" : "secondary"} className="text-xs">
                  {user?.stripeSubscriptionId ? "Active" : "None"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Stats</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{stat.label}:</span>
                  </div>
                  <span className="font-medium">{stat.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={handleRefreshCache}
              data-testid="button-refresh-cache"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All Cache
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Environment Info</CardTitle>
          <CardDescription>Current runtime environment details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode:</span>
                <Badge variant="outline">{import.meta.env.MODE}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base URL:</span>
                <span className="font-mono text-xs">{import.meta.env.BASE_URL}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dev Mode:</span>
                <Badge variant={import.meta.env.DEV ? "default" : "secondary"}>
                  {import.meta.env.DEV ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Production:</span>
                <Badge variant={import.meta.env.PROD ? "default" : "secondary"}>
                  {import.meta.env.PROD ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              SQL Console
            </CardTitle>
            <CardDescription>Execute SQL queries against the database</CardDescription>
          </div>
          <Button 
            onClick={handleExecuteQuery} 
            disabled={sqlMutation.isPending || !sqlQuery.trim()}
            data-testid="button-execute-sql"
          >
            {sqlMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Execute
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            placeholder="Enter SQL query..."
            className="font-mono text-sm min-h-[100px]"
            data-testid="input-sql-query"
          />
          
          {sqlError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-mono">{sqlError}</p>
            </div>
          )}

          {sqlResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {sqlResult.rowCount ?? sqlResult.rows.length} row(s) returned
                </p>
                {sqlResult.fields && (
                  <p className="text-xs text-muted-foreground">
                    Columns: {sqlResult.fields.map(f => f.name).join(", ")}
                  </p>
                )}
              </div>
              <ScrollArea className="h-[300px] rounded-md border">
                <div className="p-4">
                  {sqlResult.rows.length > 0 ? (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          {sqlResult.fields?.map((field) => (
                            <th key={field.name} className="text-left p-2 font-medium">
                              {field.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        {sqlResult.rows.map((row, i) => (
                          <tr key={i} className="border-b border-border/50">
                            {sqlResult.fields?.map((field) => (
                              <td key={field.name} className="p-2 max-w-[200px] truncate">
                                {row[field.name] === null ? (
                                  <span className="text-muted-foreground italic">null</span>
                                ) : typeof row[field.name] === "object" ? (
                                  JSON.stringify(row[field.name])
                                ) : (
                                  String(row[field.name])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Query executed successfully. No rows returned.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
