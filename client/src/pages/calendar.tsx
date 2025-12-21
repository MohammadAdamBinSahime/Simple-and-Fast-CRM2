import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  CalendarPlus,
  Clock,
  MapPin,
  RefreshCw,
  Loader2,
  CheckCircle,
  ExternalLink,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SiGooglecalendar } from "react-icons/si";
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, isToday, isSameDay, isSameMonth } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  htmlLink?: string;
}

export default function CalendarPage() {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start: "",
    end: "",
    allDay: false,
    location: "",
  });

  // Check if Google Calendar is connected
  const { data: statusData, isLoading: statusLoading } = useQuery<{ connected: boolean }>({
    queryKey: ["/api/calendar/status"],
  });

  const isConnected = statusData?.connected ?? false;

  // Fetch events for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: events = [], isLoading: eventsLoading, refetch } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events", monthStart.toISOString(), monthEnd.toISOString()],
    queryFn: async () => {
      const res = await fetch(`/api/calendar/events?timeMin=${monthStart.toISOString()}&timeMax=${monthEnd.toISOString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
    enabled: isConnected,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (event: typeof newEvent) => {
      return apiRequest("POST", "/api/calendar/events", event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({ title: "Appointment added to your calendar!" });
      setIsCreateDialogOpen(false);
      setNewEvent({ title: "", description: "", start: "", end: "", allDay: false, location: "" });
    },
    onError: () => {
      toast({ title: "Failed to add appointment. Please try again.", variant: "destructive" });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest("DELETE", `/api/calendar/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({ title: "Appointment removed from calendar." });
    },
    onError: () => {
      toast({ title: "Failed to remove appointment.", variant: "destructive" });
    },
  });

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
      toast({ title: "Please fill in the title and times.", variant: "destructive" });
      return;
    }
    createEventMutation.mutate(newEvent);
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  // Generate calendar days
  const generateCalendarDays = () => {
    const days: (Date | null)[] = [];
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    // Add empty slots for days before the month starts
    const startDay = start.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.start);
      return isSameDay(eventDate, date);
    });
  };

  // Not connected view
  if (statusLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="p-8 space-y-8 max-w-3xl mx-auto">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
            <SiGooglecalendar className="h-8 w-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Connect Your Calendar
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Sync your Google Calendar to see all your appointments, showings, and meetings in one place.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Get Started</CardTitle>
            <CardDescription>
              Your Google Calendar is not connected yet. Once connected, you'll be able to:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <p className="text-sm">See all your appointments and meetings</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <p className="text-sm">Add new appointments directly from your CRM</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <p className="text-sm">Keep your schedule in sync automatically</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                To connect Google Calendar, use the Integrations panel in your Replit workspace settings.
              </p>
              <Button variant="outline" onClick={() => refetch()} data-testid="button-check-connection">
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Connected view with calendar
  const calendarDays = generateCalendarDays();
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Calendar</h1>
          <p className="text-muted-foreground">Your appointments synced from Google Calendar</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-event">
                <CalendarPlus className="h-4 w-4 mr-2" />
                Add Appointment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Appointment</DialogTitle>
                <DialogDescription>
                  Add a new appointment to your Google Calendar
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Property showing at 123 Main St"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    data-testid="input-event-title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start">Start</Label>
                    <Input
                      id="start"
                      type="datetime-local"
                      value={newEvent.start}
                      onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                      data-testid="input-event-start"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">End</Label>
                    <Input
                      id="end"
                      type="datetime-local"
                      value={newEvent.end}
                      onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                      data-testid="input-event-end"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location (optional)</Label>
                  <Input
                    id="location"
                    placeholder="e.g., 123 Main Street, City"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    data-testid="input-event-location"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Notes (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Any additional details..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    data-testid="textarea-event-description"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="allDay"
                    checked={newEvent.allDay}
                    onCheckedChange={(checked) => setNewEvent({ ...newEvent, allDay: checked })}
                  />
                  <Label htmlFor="allDay">All day event</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateEvent} 
                  disabled={createEventMutation.isPending}
                  data-testid="button-save-event"
                >
                  {createEventMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth} data-testid="button-prev-month">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleToday} data-testid="button-today">
                  Today
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNextMonth} data-testid="button-next-month">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-px mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden">
                  {calendarDays.map((date, i) => {
                    if (!date) {
                      return <div key={`empty-${i}`} className="bg-background h-20" />;
                    }
                    
                    const dayEvents = getEventsForDate(date);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const isCurrentDay = isToday(date);
                    
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => setSelectedDate(date)}
                        className={`bg-background h-20 p-1 text-left transition-colors hover-elevate ${
                          isSelected ? "ring-2 ring-primary ring-inset" : ""
                        } ${!isSameMonth(date, currentMonth) ? "text-muted-foreground" : ""}`}
                        data-testid={`calendar-day-${format(date, "yyyy-MM-dd")}`}
                      >
                        <span className={`inline-flex items-center justify-center w-6 h-6 text-xs ${
                          isCurrentDay ? "bg-primary text-primary-foreground rounded-full" : ""
                        }`}>
                          {format(date, "d")}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className="text-xs truncate px-1 py-0.5 rounded bg-primary/10 text-primary"
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground px-1">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Selected Day Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate ? format(selectedDate, "EEEE, MMM d") : "Select a day"}
            </CardTitle>
            <CardDescription>
              {selectedDate 
                ? `${selectedDateEvents.length} appointment${selectedDateEvents.length !== 1 ? "s" : ""}`
                : "Click on a day to see appointments"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => (
                    <div key={event.id} className="p-3 rounded-md bg-muted/50 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <div className="flex items-center gap-1">
                          {event.htmlLink && (
                            <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                              <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove appointment?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove the appointment from your Google Calendar.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteEventMutation.mutate(event.id)}
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {event.allDay ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>All day</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(parseISO(event.start), "h:mm a")} - {format(parseISO(event.end), "h:mm a")}
                            </span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-2">{event.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No appointments</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    Add one
                  </Button>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click a day to see details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-2">
              {events.slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-2 rounded-md hover-elevate">
                  <div className="text-center w-12">
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(event.start), "MMM")}
                    </div>
                    <div className="text-lg font-semibold">
                      {format(parseISO(event.start), "d")}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.allDay ? "All day" : format(parseISO(event.start), "h:mm a")}
                      {event.location && ` at ${event.location}`}
                    </p>
                  </div>
                  {event.htmlLink && (
                    <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
                      <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No appointments this month</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
