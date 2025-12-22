import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, HandshakeIcon, CheckSquare, DollarSign, TrendingUp, Activity, Phone, Mail, Calendar, FileText } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNow } from "date-fns";
import type { Contact, Company, Deal, Task, Activity as ActivityType } from "@shared/schema";

interface DashboardMetrics {
  totalContacts: number;
  totalCompanies: number;
  totalDeals: number;
  totalTasks: number;
  pipelineValue: number;
  wonDeals: number;
}

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: recentContacts, isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: recentDeals, isLoading: dealsLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: upcomingTasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: recentActivities, isLoading: activitiesLoading } = useQuery<ActivityType[]>({
    queryKey: ["/api/activities"],
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "meeting":
        return <Calendar className="h-4 w-4" />;
      case "note":
        return <FileText className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your CRM activity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Contacts"
          value={metrics?.totalContacts ?? 0}
          icon={<Users className="h-4 w-4" />}
          isLoading={metricsLoading}
          testId="metric-contacts"
        />
        <MetricCard
          title="Companies"
          value={metrics?.totalCompanies ?? 0}
          icon={<Building2 className="h-4 w-4" />}
          isLoading={metricsLoading}
          testId="metric-companies"
        />
        <MetricCard
          title="Active Deals"
          value={metrics?.totalDeals ?? 0}
          icon={<HandshakeIcon className="h-4 w-4" />}
          isLoading={metricsLoading}
          testId="metric-deals"
        />
        <MetricCard
          title="Pipeline Value"
          value={formatCurrency(metrics?.pipelineValue ?? 0)}
          icon={<DollarSign className="h-4 w-4" />}
          isLoading={metricsLoading}
          testId="metric-pipeline"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
            <CardTitle className="text-lg font-medium">Recent Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {contactsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentContacts && recentContacts.length > 0 ? (
              <div className="space-y-4">
                {recentContacts.slice(0, 5).map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-4"
                    data-testid={`recent-contact-${contact.id}`}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {contact.firstName[0]}{contact.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.email}
                      </p>
                    </div>
                    <StatusBadge status={contact.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                No contacts yet. Add your first contact to get started.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
            <CardTitle className="text-lg font-medium">Active Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dealsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : recentDeals && recentDeals.length > 0 ? (
              <div className="space-y-4">
                {recentDeals
                  .filter((d) => d.stage !== "closed_won" && d.stage !== "closed_lost")
                  .slice(0, 5)
                  .map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between gap-4"
                      data-testid={`recent-deal-${deal.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{deal.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(Number(deal.value))}
                        </p>
                      </div>
                      <StatusBadge status={deal.stage} />
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                No active deals. Create your first deal to track opportunities.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
            <CardTitle className="text-lg font-medium">Upcoming Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-5 w-5 rounded bg-muted animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingTasks && upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {upcomingTasks
                  .filter((t) => t.completed !== "true")
                  .slice(0, 5)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 py-2"
                      data-testid={`upcoming-task-${task.id}`}
                    >
                      <div className="h-5 w-5 rounded border flex items-center justify-center">
                        {task.completed === "true" && (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        {task.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            Due {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={task.priority} />
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                No upcoming tasks. Create tasks to stay organized.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
            <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities && recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3"
                    data-testid={`activity-${activity.id}`}
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                No activity yet. Activities will appear as you work with your CRM.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
