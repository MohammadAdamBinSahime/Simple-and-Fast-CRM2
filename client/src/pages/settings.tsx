import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Monitor, Mail, Trash2, Loader2 } from "lucide-react";
import { SiGmail, SiMicrosoft } from "react-icons/si";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EmailAccount } from "@shared/schema";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const { data: emailAccounts = [], isLoading: accountsLoading } = useQuery<EmailAccount[]>({
    queryKey: ["/api/email-accounts"],
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/email-accounts/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-accounts"] });
      toast({ title: "Email account disconnected" });
    },
    onError: () => {
      toast({ title: "Failed to disconnect account", variant: "destructive" });
    },
  });

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your application preferences
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Appearance</CardTitle>
            <CardDescription>
              Customize how the application looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-3 block">Theme</Label>
              <div className="flex gap-2">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      variant={theme === option.value ? "secondary" : "outline"}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-2 h-auto py-4"
                      )}
                      onClick={() => setTheme(option.value)}
                      data-testid={`button-theme-${option.value}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm">{option.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Email Accounts</CardTitle>
            <CardDescription>
              Connect your email accounts to send and schedule emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {accountsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : emailAccounts.length > 0 ? (
              <div className="space-y-3">
                {emailAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-md border"
                    data-testid={`email-account-${account.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {account.provider === "gmail" ? (
                        <SiGmail className="h-5 w-5 text-red-500" />
                      ) : account.provider === "outlook" ? (
                        <SiMicrosoft className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{account.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{account.provider}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAccount.mutate(account.id)}
                      disabled={deleteAccount.isPending}
                      data-testid={`button-disconnect-${account.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No email accounts connected yet
              </p>
            )}

            <div className="pt-4 border-t">
              <Label className="text-sm font-medium mb-3 block">Connect a new account</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-connect-gmail"
                  disabled
                >
                  <SiGmail className="h-4 w-4 text-red-500" />
                  Gmail
                  <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-connect-outlook"
                  disabled
                >
                  <SiMicrosoft className="h-4 w-4 text-blue-500" />
                  Outlook
                  <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Email integration requires setup. Contact your administrator to enable Gmail or Outlook connections.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">About</CardTitle>
            <CardDescription>
              Information about this CRM application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <p className="text-muted-foreground">Version</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                A modern, Notion-inspired CRM application for managing contacts,
                companies, deals, and tasks. Built with React, TypeScript, and
                PostgreSQL.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Keyboard Shortcuts</CardTitle>
            <CardDescription>
              Quick actions to navigate the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { keys: ["⌘", "K"], description: "Open quick search" },
                { keys: ["⌘", "N"], description: "Create new item" },
                { keys: ["⌘", "/"], description: "Toggle sidebar" },
              ].map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {shortcut.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, j) => (
                      <kbd
                        key={j}
                        className="px-2 py-1 text-xs font-mono bg-muted rounded border"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
