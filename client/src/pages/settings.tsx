import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Mail, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface UserInfo {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export default function Settings() {
  const { theme, setTheme } = useTheme();

  const { data: user, isLoading: userLoading } = useQuery<UserInfo>({
    queryKey: ["/api/me"],
  });

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
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
            <CardTitle className="text-lg font-medium">Email Account</CardTitle>
            <CardDescription>
              Your connected email account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : user?.email ? (
              <div
                className="flex items-center justify-between gap-2 p-3 rounded-md border"
                data-testid="email-account-primary"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Primary account</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  Connected
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No email associated with your account
              </p>
            )}
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}
