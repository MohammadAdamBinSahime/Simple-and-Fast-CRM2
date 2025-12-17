import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, LogIn, LogOut, UserPlus } from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  username: string;
  role: string;
  createdAt: string;
}

interface Activity {
  id: string;
  userId: string;
  username: string;
  eventType: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function Admin() {
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/admin/activities"],
  });

  const loginActivities = activities?.filter(a => a.eventType === "login") || [];
  const logoutActivities = activities?.filter(a => a.eventType === "logout") || [];
  const registerActivities = activities?.filter(a => a.eventType === "register") || [];

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "login":
        return <LogIn className="h-4 w-4 text-green-500" />;
      case "logout":
        return <LogOut className="h-4 w-4 text-orange-500" />;
      case "register":
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case "login":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Login</Badge>;
      case "logout":
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">Logout</Badge>;
      case "register":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Register</Badge>;
      default:
        return <Badge variant="outline">{eventType}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-admin-title">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users and view activity logs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">
              {usersLoading ? <Skeleton className="h-8 w-12" /> : users?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-logins">
              {activitiesLoading ? <Skeleton className="h-8 w-12" /> : loginActivities.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logouts</CardTitle>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-logouts">
              {activitiesLoading ? <Skeleton className="h-8 w-12" /> : logoutActivities.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registrations</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-registrations">
              {activitiesLoading ? <Skeleton className="h-8 w-12" /> : registerActivities.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">Registered Users</TabsTrigger>
          <TabsTrigger value="logins" data-testid="tab-logins">Login History</TabsTrigger>
          <TabsTrigger value="logouts" data-testid="tab-logouts">Logout History</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">All Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered Users</CardTitle>
              <CardDescription>All accounts registered in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : users?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No users registered</p>
              ) : (
                <div className="space-y-2">
                  {users?.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-md border"
                      data-testid={`row-user-${user.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          {user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-muted-foreground">
                            Joined {format(new Date(user.createdAt), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logins" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <CardDescription>Record of all login events</CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : loginActivities.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No login history</p>
              ) : (
                <div className="space-y-2">
                  {loginActivities.map(activity => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-md border"
                      data-testid={`row-activity-${activity.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {getEventIcon(activity.eventType)}
                        <div>
                          <p className="font-medium">{activity.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {activity.ipAddress && <p>{activity.ipAddress}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logouts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Logout History</CardTitle>
              <CardDescription>Record of all logout events</CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : logoutActivities.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No logout history</p>
              ) : (
                <div className="space-y-2">
                  {logoutActivities.map(activity => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-md border"
                      data-testid={`row-activity-${activity.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {getEventIcon(activity.eventType)}
                        <div>
                          <p className="font-medium">{activity.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {activity.ipAddress && <p>{activity.ipAddress}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Activity</CardTitle>
              <CardDescription>Complete activity log</CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : activities?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No activity recorded</p>
              ) : (
                <div className="space-y-2">
                  {activities?.map(activity => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-md border"
                      data-testid={`row-activity-${activity.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {getEventIcon(activity.eventType)}
                        <div>
                          <p className="font-medium">{activity.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getEventBadge(activity.eventType)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
