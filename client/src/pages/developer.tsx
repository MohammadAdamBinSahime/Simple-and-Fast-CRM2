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
  Link2, Hash, Type, Calendar, ToggleLeft, Layers, AlertCircle, 
  AlertTriangle, Info, Bug, Trash2, ScrollText, CreditCard, ExternalLink
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface LogEntry {
  id: string;
  level: string;
  message: string;
  source: string | null;
  metadata: string | null;
  userId: string | null;
  requestId: string | null;
  stack: string | null;
  createdAt: string;
}

interface LogsData {
  logs: LogEntry[];
  stats: { level: string; count: number }[];
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

function getLogLevelIcon(level: string) {
  switch (level) {
    case "error":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case "warn":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "info":
      return <Info className="h-4 w-4 text-blue-500" />;
    case "debug":
      return <Bug className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

function getLogLevelColor(level: string) {
  switch (level) {
    case "error":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "warn":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
    case "info":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "debug":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-foreground border-border";
  }
}

export default function Developer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM contacts LIMIT 10;");
  const [sqlResult, setSqlResult] = useState<SqlResult | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("editor");
  const [logFilter, setLogFilter] = useState<string>("all");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const { data: contacts } = useQuery<Contact[]>({ queryKey: ["/api/contacts"] });
  const { data: companies } = useQuery<Company[]>({ queryKey: ["/api/companies"] });
  const { data: deals } = useQuery<Deal[]>({ queryKey: ["/api/deals"] });
  const { data: tasks } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: notes } = useQuery<Note[]>({ queryKey: ["/api/notes"] });

  const { data: schemaData, isLoading: schemaLoading } = useQuery<SchemaData>({
    queryKey: ["/api/developer/schema"],
    enabled: user?.email === DEVELOPER_EMAIL,
  });

  const logsQueryUrl = logFilter !== "all" 
    ? `/api/developer/logs?level=${logFilter}` 
    : "/api/developer/logs";
  
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery<LogsData>({
    queryKey: ["/api/developer/logs", logFilter],
    queryFn: async () => {
      const response = await fetch(logsQueryUrl, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch logs");
      return response.json();
    },
    enabled: user?.email === DEVELOPER_EMAIL,
  });

  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/developer/logs");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/developer/logs"] });
      toast({ title: "Logs cleared", description: "All logs have been deleted." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to clear logs", description: error.message, variant: "destructive" });
    },
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
              <TabsTrigger value="logs" className="gap-2" data-testid="tab-logs">
                <ScrollText className="h-3.5 w-3.5" />
                Logs
                {logsData?.stats && logsData.stats.find(s => s.level === "error")?.count ? (
                  <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">
                    {logsData.stats.find(s => s.level === "error")?.count}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="info" className="gap-2" data-testid="tab-info">
                <Server className="h-3.5 w-3.5" />
                System Info
              </TabsTrigger>
              <TabsTrigger value="stripe" className="gap-2" data-testid="tab-stripe">
                <CreditCard className="h-3.5 w-3.5" />
                Stripe
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

          <TabsContent value="logs" className="flex-1 m-0 p-0 overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-muted/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Select value={logFilter} onValueChange={setLogFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-log-filter">
                    <SelectValue placeholder="Filter by level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Errors</SelectItem>
                    <SelectItem value="warn">Warnings</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>

                {logsData?.stats && (
                  <div className="flex items-center gap-2 text-xs">
                    {logsData.stats.map((stat) => (
                      <Badge
                        key={stat.level}
                        variant="outline"
                        className={cn("text-[10px]", getLogLevelColor(stat.level))}
                      >
                        {stat.level}: {stat.count}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchLogs()}
                  data-testid="button-refresh-logs"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearLogsMutation.mutate()}
                  disabled={clearLogsMutation.isPending || !logsData?.logs.length}
                  data-testid="button-clear-logs"
                >
                  {clearLogsMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                  )}
                  Clear All
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !logsData?.logs.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ScrollText className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm">No logs recorded yet</p>
                  <p className="text-xs mt-1">Logs will appear here when errors or events occur</p>
                </div>
              ) : (
                <div className="divide-y">
                  {logsData.logs.map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        "p-3 text-sm cursor-pointer transition-colors hover-elevate",
                        expandedLog === log.id && "bg-muted/30"
                      )}
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      data-testid={`log-entry-${log.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getLogLevelIcon(log.level)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] uppercase", getLogLevelColor(log.level))}
                            >
                              {log.level}
                            </Badge>
                            {log.source && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {log.source}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1 font-mono text-xs break-all">{log.message}</p>
                          
                          {expandedLog === log.id && (
                            <div className="mt-3 space-y-2 text-xs">
                              {log.userId && (
                                <div className="flex gap-2">
                                  <span className="text-muted-foreground">User ID:</span>
                                  <span className="font-mono">{log.userId}</span>
                                </div>
                              )}
                              {log.requestId && (
                                <div className="flex gap-2">
                                  <span className="text-muted-foreground">Request ID:</span>
                                  <span className="font-mono">{log.requestId}</span>
                                </div>
                              )}
                              {log.metadata && (
                                <div>
                                  <span className="text-muted-foreground">Metadata:</span>
                                  <pre className="mt-1 p-2 bg-muted rounded-md overflow-x-auto text-[10px]">
                                    {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.stack && (
                                <div>
                                  <span className="text-muted-foreground">Stack Trace:</span>
                                  <pre className="mt-1 p-2 bg-muted rounded-md overflow-x-auto text-[10px] text-destructive">
                                    {log.stack}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
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

          <TabsContent value="stripe" className="flex-1 m-0 overflow-auto">
            <div className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Stripe Dashboard
                  </CardTitle>
                  <CardDescription>
                    Access your Stripe dashboard to monitor payments, subscriptions, and customer data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button
                      variant="default"
                      className="w-full justify-start gap-2"
                      onClick={() => window.open("https://dashboard.stripe.com", "_blank")}
                      data-testid="button-stripe-dashboard"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Stripe Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => window.open("https://dashboard.stripe.com/payments", "_blank")}
                      data-testid="button-stripe-payments"
                    >
                      <CreditCard className="h-4 w-4" />
                      View Payments
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => window.open("https://dashboard.stripe.com/subscriptions", "_blank")}
                      data-testid="button-stripe-subscriptions"
                    >
                      <RefreshCw className="h-4 w-4" />
                      View Subscriptions
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => window.open("https://dashboard.stripe.com/customers", "_blank")}
                      data-testid="button-stripe-customers"
                    >
                      <Users className="h-4 w-4" />
                      View Customers
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => window.open("https://dashboard.stripe.com/webhooks", "_blank")}
                      data-testid="button-stripe-webhooks"
                    >
                      <Link2 className="h-4 w-4" />
                      View Webhooks
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => window.open("https://dashboard.stripe.com/logs", "_blank")}
                      data-testid="button-stripe-logs"
                    >
                      <ScrollText className="h-4 w-4" />
                      View Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => window.open("https://dashboard.stripe.com/test/payments", "_blank")}
                    data-testid="button-stripe-test-mode"
                  >
                    <Bug className="h-4 w-4" />
                    Test Mode Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => window.open("https://dashboard.stripe.com/products", "_blank")}
                    data-testid="button-stripe-products"
                  >
                    <Tag className="h-4 w-4" />
                    Manage Products & Prices
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
