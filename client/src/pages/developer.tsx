import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Code, Database, Server, Users, Building2, HandshakeIcon, CheckSquare, 
  FileText, Tag, RefreshCw, Play, Loader2, Terminal, Table, Key, 
  Link2, ChevronRight, Hash, Type, Calendar, ToggleLeft, Layers
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Contact, Company, Deal, Task, Note } from "@shared/schema";

const DEVELOPER_EMAIL = "adamsahime1998@gmail.com";

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
  maxLength: number | null;
  precision: number | null;
  isPrimaryKey: boolean;
  foreignKey: { table: string; column: string } | null;
}

interface TableInfo {
  name: string;
  schema: string;
  type: string;
  columns: Column[];
  rowCount: number;
}

interface SchemaData {
  tables: TableInfo[];
}

interface SqlResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  fields: { name: string; dataTypeID: number }[];
}

function getTypeIcon(type: string) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes("int") || lowerType.includes("numeric") || lowerType.includes("decimal")) {
    return <Hash className="h-3 w-3" />;
  }
  if (lowerType.includes("varchar") || lowerType.includes("text") || lowerType.includes("char")) {
    return <Type className="h-3 w-3" />;
  }
  if (lowerType.includes("timestamp") || lowerType.includes("date") || lowerType.includes("time")) {
    return <Calendar className="h-3 w-3" />;
  }
  if (lowerType.includes("bool")) {
    return <ToggleLeft className="h-3 w-3" />;
  }
  return <Layers className="h-3 w-3" />;
}

export default function Developer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM contacts LIMIT 10;");
  const [sqlResult, setSqlResult] = useState<SqlResult | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("editor");

  const { data: contacts } = useQuery<Contact[]>({ queryKey: ["/api/contacts"] });
  const { data: companies } = useQuery<Company[]>({ queryKey: ["/api/companies"] });
  const { data: deals } = useQuery<Deal[]>({ queryKey: ["/api/deals"] });
  const { data: tasks } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: notes } = useQuery<Note[]>({ queryKey: ["/api/notes"] });

  const { data: schemaData, isLoading: schemaLoading } = useQuery<SchemaData>({
    queryKey: ["/api/developer/schema"],
    enabled: user?.email === DEVELOPER_EMAIL,
  });

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
    onError: (error: Error) => {
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

  const handleTableClick = (tableName: string) => {
    setSelectedTable(tableName);
    setSqlQuery(`SELECT * FROM ${tableName} LIMIT 100;`);
  };

  const handleViewTableData = (tableName: string) => {
    setSqlQuery(`SELECT * FROM ${tableName} LIMIT 100;`);
    setActiveTab("editor");
    sqlMutation.mutate(`SELECT * FROM ${tableName} LIMIT 100;`);
  };

  const selectedTableInfo = schemaData?.tables.find(t => t.name === selectedTable);

  const stats = [
    { label: "Contacts", value: contacts?.length || 0, icon: Users },
    { label: "Companies", value: companies?.length || 0, icon: Building2 },
    { label: "Deals", value: deals?.length || 0, icon: HandshakeIcon },
    { label: "Tasks", value: tasks?.length || 0, icon: CheckSquare },
    { label: "Notes", value: notes?.length || 0, icon: FileText },
  ];

  return (
    <div className="flex h-full">
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <span className="font-semibold">Database</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">public schema</p>
        </div>
        
        <div className="p-2 border-b">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">TABLES</p>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {schemaLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : schemaData?.tables.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No tables found</p>
            ) : (
              schemaData?.tables.map((table) => (
                <button
                  key={table.name}
                  onClick={() => handleTableClick(table.name)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors hover-elevate",
                    selectedTable === table.name 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground"
                  )}
                  data-testid={`button-table-${table.name}`}
                >
                  <Table className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1">{table.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {table.rowCount}
                  </Badge>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleRefreshCache}
            data-testid="button-refresh-cache"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold" data-testid="text-page-title">Developer Tools</h1>
            <Badge variant="secondary">
              <Code className="h-3 w-3 mr-1" />
              Developer Only
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Server className="h-3.5 w-3.5" />
            <span>{schemaData?.tables.length || 0} tables</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 border-b">
            <TabsList className="h-10">
              <TabsTrigger value="editor" className="gap-2" data-testid="tab-editor">
                <Terminal className="h-3.5 w-3.5" />
                SQL Editor
              </TabsTrigger>
              <TabsTrigger value="schema" className="gap-2" data-testid="tab-schema">
                <Table className="h-3.5 w-3.5" />
                Table Definition
              </TabsTrigger>
              <TabsTrigger value="info" className="gap-2" data-testid="tab-info">
                <Server className="h-3.5 w-3.5" />
                System Info
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="editor" className="flex-1 flex flex-col m-0 p-0 overflow-hidden">
            <div className="p-4 border-b bg-muted/20">
              <div className="flex items-center gap-2">
                <Textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="Enter SQL query..."
                  className="font-mono text-sm min-h-[80px] flex-1 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleExecuteQuery();
                    }
                  }}
                  data-testid="input-sql-query"
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-muted-foreground">
                  Press Cmd/Ctrl + Enter to execute
                </p>
                <Button
                  onClick={handleExecuteQuery}
                  disabled={sqlMutation.isPending || !sqlQuery.trim()}
                  size="sm"
                  data-testid="button-execute-sql"
                >
                  {sqlMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run Query
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {sqlError && (
                <div className="m-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-mono">{sqlError}</p>
                </div>
              )}

              {sqlResult && (
                <div className="h-full flex flex-col">
                  <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {sqlResult.rowCount ?? sqlResult.rows.length} row(s) returned
                    </p>
                    {sqlResult.fields && (
                      <p className="text-xs text-muted-foreground">
                        {sqlResult.fields.length} column(s)
                      </p>
                    )}
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-0">
                      {sqlResult.rows.length > 0 ? (
                        <table className="w-full text-xs border-collapse">
                          <thead className="sticky top-0 bg-muted z-10">
                            <tr>
                              {sqlResult.fields?.map((field) => (
                                <th key={field.name} className="text-left px-3 py-2 font-medium border-b border-r last:border-r-0">
                                  {field.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="font-mono">
                            {sqlResult.rows.map((row, i) => (
                              <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                                {sqlResult.fields?.map((field) => (
                                  <td key={field.name} className="px-3 py-2 max-w-[250px] truncate border-r last:border-r-0">
                                    {row[field.name] === null ? (
                                      <span className="text-muted-foreground italic">NULL</span>
                                    ) : typeof row[field.name] === "object" ? (
                                      <span className="text-blue-500">{JSON.stringify(row[field.name])}</span>
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
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Query executed successfully. No rows returned.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {!sqlResult && !sqlError && (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Terminal className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Run a query to see results</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="schema" className="flex-1 m-0 p-0 overflow-hidden">
            {selectedTableInfo ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Table className="h-5 w-5 text-primary" />
                      <div>
                        <h2 className="font-semibold">{selectedTableInfo.name}</h2>
                        <p className="text-xs text-muted-foreground">
                          {selectedTableInfo.columns.length} columns, {selectedTableInfo.rowCount} rows
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewTableData(selectedTableInfo.name)}
                      data-testid="button-view-data"
                    >
                      <Play className="h-3.5 w-3.5 mr-2" />
                      View Data
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium">Column</th>
                          <th className="text-left py-2 px-3 font-medium">Type</th>
                          <th className="text-left py-2 px-3 font-medium">Nullable</th>
                          <th className="text-left py-2 px-3 font-medium">Default</th>
                          <th className="text-left py-2 px-3 font-medium">Constraints</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTableInfo.columns.map((column) => (
                          <tr key={column.name} className="border-b border-border/50">
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                {getTypeIcon(column.type)}
                                <span className="font-mono text-xs">{column.name}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {column.type}
                                {column.maxLength && `(${column.maxLength})`}
                              </code>
                            </td>
                            <td className="py-2 px-3">
                              <Badge variant={column.nullable ? "secondary" : "outline"} className="text-[10px]">
                                {column.nullable ? "NULL" : "NOT NULL"}
                              </Badge>
                            </td>
                            <td className="py-2 px-3">
                              {column.default ? (
                                <code className="text-xs text-muted-foreground">{column.default}</code>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {column.isPrimaryKey && (
                                  <Badge variant="default" className="text-[10px] gap-1">
                                    <Key className="h-2.5 w-2.5" />
                                    PK
                                  </Badge>
                                )}
                                {column.foreignKey && (
                                  <Badge variant="outline" className="text-[10px] gap-1">
                                    <Link2 className="h-2.5 w-2.5" />
                                    FK: {column.foreignKey.table}
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Table className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Select a table from the sidebar</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="info" className="flex-1 m-0 overflow-auto">
            <div className="p-6 space-y-6">
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
                    <CardTitle className="text-sm font-medium">Environment</CardTitle>
                    <Tag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mode:</span>
                        <Badge variant="outline">{import.meta.env.MODE}</Badge>
                      </div>
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
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
