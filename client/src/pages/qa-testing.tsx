import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  XCircle, 
  Circle, 
  ChevronDown, 
  ChevronRight,
  RotateCcw,
  Download
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type TestStatus = "pending" | "passed" | "failed";

interface TestCase {
  id: string;
  name: string;
  steps: string;
  expected: string;
  status: TestStatus;
}

interface TestSection {
  id: string;
  title: string;
  tests: TestCase[];
}

const initialTestData: TestSection[] = [
  {
    id: "nav",
    title: "1. Application Launch & Navigation",
    tests: [
      { id: "NAV-001", name: "App loads without login", steps: "Open the application URL", expected: "Dashboard displays immediately without login prompt", status: "pending" },
      { id: "NAV-002", name: "Sidebar displays correctly", steps: "Observe sidebar after load", expected: "All menu items visible: Dashboard, Contacts, Companies, Deals, Tasks, Email, AI Assistant, Billing, Settings", status: "pending" },
      { id: "NAV-003", name: "UAT indicator shows", steps: "Check sidebar footer", expected: "'UAT Testing Mode' text visible at bottom", status: "pending" },
      { id: "NAV-004", name: "Logo and title display", steps: "Check sidebar header", expected: "App logo and 'Simple & Fast CRM' title visible", status: "pending" },
      { id: "NAV-005", name: "Navigate to Contacts", steps: "Click 'Contacts' in sidebar", expected: "Contacts page loads, menu item highlighted", status: "pending" },
      { id: "NAV-006", name: "Navigate to Companies", steps: "Click 'Companies' in sidebar", expected: "Companies page loads, menu item highlighted", status: "pending" },
      { id: "NAV-007", name: "Navigate to Deals", steps: "Click 'Deals' in sidebar", expected: "Deals page loads with Kanban/Table view", status: "pending" },
      { id: "NAV-008", name: "Navigate to Tasks", steps: "Click 'Tasks' in sidebar", expected: "Tasks page loads", status: "pending" },
      { id: "NAV-009", name: "Navigate to Email", steps: "Click 'Email' in sidebar", expected: "Email page loads", status: "pending" },
      { id: "NAV-010", name: "Navigate to AI Assistant", steps: "Click 'AI Assistant' in sidebar", expected: "Chat page loads", status: "pending" },
      { id: "NAV-011", name: "Navigate to Billing", steps: "Click 'Billing' in sidebar", expected: "Billing page loads", status: "pending" },
      { id: "NAV-012", name: "Navigate to Settings", steps: "Click 'Settings' in sidebar", expected: "Settings page loads", status: "pending" },
      { id: "NAV-013", name: "Sidebar collapse/expand", steps: "Click sidebar toggle button", expected: "Sidebar collapses to icon-only mode", status: "pending" },
    ],
  },
  {
    id: "dash",
    title: "2. Dashboard",
    tests: [
      { id: "DASH-001", name: "Total Contacts metric", steps: "View dashboard", expected: "Shows count of all contacts", status: "pending" },
      { id: "DASH-002", name: "Total Companies metric", steps: "View dashboard", expected: "Shows count of all companies", status: "pending" },
      { id: "DASH-003", name: "Active Deals metric", steps: "View dashboard", expected: "Shows count of active deals", status: "pending" },
      { id: "DASH-004", name: "Pipeline Value metric", steps: "View dashboard", expected: "Shows total value in RM format (e.g., 'RM 50,000')", status: "pending" },
      { id: "DASH-005", name: "Loading state", steps: "Refresh dashboard", expected: "Skeleton/loading state appears before data loads", status: "pending" },
    ],
  },
  {
    id: "contacts",
    title: "3. Contacts Management",
    tests: [
      { id: "CON-001", name: "View contacts list", steps: "Navigate to Contacts", expected: "Table displays with columns: Name, Email, Phone, Company, Status", status: "pending" },
      { id: "CON-002", name: "Empty state", steps: "With no contacts", expected: "'No contacts found' or similar message displays", status: "pending" },
      { id: "CON-003", name: "Open create dialog", steps: "Click 'Add Contact' button", expected: "Modal/dialog opens with form", status: "pending" },
      { id: "CON-004", name: "Create with all fields", steps: "Fill all fields, submit", expected: "Contact created, appears in list", status: "pending" },
      { id: "CON-005", name: "Create with minimal data", steps: "Leave all fields empty, submit", expected: "Contact created (all fields optional in UAT)", status: "pending" },
      { id: "CON-006", name: "Open edit dialog", steps: "Click edit button on contact row", expected: "Edit dialog opens with pre-filled data", status: "pending" },
      { id: "CON-007", name: "Update contact", steps: "Change fields, save", expected: "Changes reflected in list", status: "pending" },
      { id: "CON-008", name: "Delete contact", steps: "Click delete button, confirm", expected: "Contact removed from list", status: "pending" },
      { id: "CON-009", name: "Cancel operations", steps: "Open dialog, click Cancel", expected: "Dialog closes, no changes made", status: "pending" },
    ],
  },
  {
    id: "companies",
    title: "4. Companies Management",
    tests: [
      { id: "COM-001", name: "View companies list", steps: "Navigate to Companies", expected: "Table displays with company information", status: "pending" },
      { id: "COM-002", name: "Create company", steps: "Fill form, submit", expected: "Company created, appears in list", status: "pending" },
      { id: "COM-003", name: "Create with minimal data", steps: "Submit with empty fields", expected: "Company created (UAT - fields optional)", status: "pending" },
      { id: "COM-004", name: "Edit company", steps: "Update fields, save", expected: "Changes reflected", status: "pending" },
      { id: "COM-005", name: "Delete company", steps: "Delete, confirm", expected: "Company removed", status: "pending" },
    ],
  },
  {
    id: "deals",
    title: "5. Deals Management",
    tests: [
      { id: "DEAL-001", name: "View Kanban board", steps: "Navigate to Deals", expected: "Kanban board with pipeline stages visible", status: "pending" },
      { id: "DEAL-002", name: "View Table mode", steps: "Toggle to table view", expected: "Table displays deal information", status: "pending" },
      { id: "DEAL-003", name: "Pipeline stages visible", steps: "View Kanban", expected: "All stages: Lead, Qualified, Proposal, Negotiation, Won, Lost", status: "pending" },
      { id: "DEAL-004", name: "Create deal", steps: "Fill form, submit", expected: "Deal created, appears in correct stage", status: "pending" },
      { id: "DEAL-005", name: "Deal value in RM", steps: "Enter value, save", expected: "Displays as RM currency", status: "pending" },
      { id: "DEAL-006", name: "Drag deal to new stage", steps: "Drag card between columns", expected: "Deal stage updates", status: "pending" },
      { id: "DEAL-007", name: "Edit deal", steps: "Update fields, save", expected: "Changes saved", status: "pending" },
      { id: "DEAL-008", name: "Delete deal", steps: "Delete, confirm", expected: "Deal removed from board", status: "pending" },
    ],
  },
  {
    id: "tasks",
    title: "6. Tasks Management",
    tests: [
      { id: "TASK-001", name: "View tasks", steps: "Navigate to Tasks", expected: "Task list displays", status: "pending" },
      { id: "TASK-002", name: "Priority indicators", steps: "View tasks with priorities", expected: "Visual indicators for High/Medium/Low", status: "pending" },
      { id: "TASK-003", name: "Create task", steps: "Fill form, submit", expected: "Task created", status: "pending" },
      { id: "TASK-004", name: "Set priority", steps: "Select High/Medium/Low", expected: "Priority saved", status: "pending" },
      { id: "TASK-005", name: "Set due date", steps: "Pick date", expected: "Due date saved and displayed", status: "pending" },
      { id: "TASK-006", name: "Mark complete", steps: "Click complete checkbox/button", expected: "Task marked as completed", status: "pending" },
      { id: "TASK-007", name: "Edit task", steps: "Update fields, save", expected: "Changes saved", status: "pending" },
      { id: "TASK-008", name: "Delete task", steps: "Delete, confirm", expected: "Task removed", status: "pending" },
    ],
  },
  {
    id: "email",
    title: "7. Email Module",
    tests: [
      { id: "EMAIL-001", name: "View email section", steps: "Navigate to Email", expected: "Email interface loads", status: "pending" },
      { id: "EMAIL-002", name: "Add email account", steps: "Add new account", expected: "Account added to list", status: "pending" },
      { id: "EMAIL-003", name: "Create template", steps: "Create new template", expected: "Template saved", status: "pending" },
      { id: "EMAIL-004", name: "Edit template", steps: "Modify template, save", expected: "Changes saved", status: "pending" },
      { id: "EMAIL-005", name: "Delete template", steps: "Delete template", expected: "Template removed", status: "pending" },
      { id: "EMAIL-006", name: "Schedule email", steps: "Create scheduled email", expected: "Email scheduled", status: "pending" },
    ],
  },
  {
    id: "chat",
    title: "8. AI Chat Assistant",
    tests: [
      { id: "CHAT-001", name: "View chat page", steps: "Navigate to AI Assistant", expected: "Chat interface loads", status: "pending" },
      { id: "CHAT-002", name: "Create conversation", steps: "Click 'New Chat'", expected: "New conversation created", status: "pending" },
      { id: "CHAT-003", name: "Send message", steps: "Type message, send", expected: "Message appears in chat", status: "pending" },
      { id: "CHAT-004", name: "Receive AI response", steps: "After sending message", expected: "AI responds with streaming text", status: "pending" },
      { id: "CHAT-005", name: "Conversation title updates", steps: "After first AI response", expected: "Sidebar shows generated title", status: "pending" },
      { id: "CHAT-006", name: "View conversation history", steps: "Click previous conversation", expected: "Messages load correctly", status: "pending" },
      { id: "CHAT-007", name: "Delete conversation", steps: "Delete conversation", expected: "Removed from sidebar list", status: "pending" },
    ],
  },
  {
    id: "billing",
    title: "9. Billing Page",
    tests: [
      { id: "BILL-001", name: "View billing page", steps: "Navigate to Billing", expected: "Billing page loads", status: "pending" },
      { id: "BILL-002", name: "Subscription plan display", steps: "View available plan", expected: "Shows RM59.99/month plan", status: "pending" },
      { id: "BILL-003", name: "Currency format", steps: "Check price display", expected: "Amount shown in RM (Malaysian Ringgit)", status: "pending" },
    ],
  },
  {
    id: "search",
    title: "10. Search Functionality",
    tests: [
      { id: "SRCH-001", name: "Open search", steps: "Press Cmd+K (Mac) or Ctrl+K (Windows)", expected: "Search dialog opens", status: "pending" },
      { id: "SRCH-002", name: "Search contacts", steps: "Type contact name", expected: "Matching contacts appear", status: "pending" },
      { id: "SRCH-003", name: "Search companies", steps: "Type company name", expected: "Matching companies appear", status: "pending" },
      { id: "SRCH-004", name: "Navigate to result", steps: "Click search result", expected: "Navigates to selected item", status: "pending" },
      { id: "SRCH-005", name: "Close search", steps: "Press Escape", expected: "Search dialog closes", status: "pending" },
    ],
  },
  {
    id: "theme",
    title: "11. Theme Toggle",
    tests: [
      { id: "THEME-001", name: "Toggle to dark mode", steps: "Click theme toggle", expected: "UI switches to dark theme", status: "pending" },
      { id: "THEME-002", name: "Toggle to light mode", steps: "Click theme toggle", expected: "UI switches to light theme", status: "pending" },
      { id: "THEME-003", name: "Theme persistence", steps: "Toggle theme, refresh page", expected: "Theme preference maintained", status: "pending" },
      { id: "THEME-004", name: "All pages respect theme", steps: "Navigate while in dark mode", expected: "All pages display in dark theme", status: "pending" },
    ],
  },
  {
    id: "uat",
    title: "12. UAT-Specific Tests",
    tests: [
      { id: "UAT-001", name: "No login required", steps: "Open app in incognito", expected: "App loads without login prompt", status: "pending" },
      { id: "UAT-002", name: "No logout button", steps: "Check sidebar footer", expected: "Logout button not present", status: "pending" },
      { id: "UAT-003", name: "API calls work without auth", steps: "Perform CRUD operations", expected: "All succeed without auth errors", status: "pending" },
      { id: "UAT-004", name: "No trial banner", steps: "View header area", expected: "No trial countdown banner", status: "pending" },
      { id: "UAT-005", name: "Full CRUD access", steps: "Create/Edit/Delete items", expected: "All operations succeed without subscription", status: "pending" },
    ],
  },
  {
    id: "responsive",
    title: "13. Responsive Design",
    tests: [
      { id: "RESP-001", name: "Sidebar collapses on mobile", steps: "Resize to mobile width", expected: "Sidebar collapses or becomes hamburger menu", status: "pending" },
      { id: "RESP-002", name: "Tables scroll horizontally", steps: "View tables on mobile", expected: "Horizontal scroll enabled", status: "pending" },
      { id: "RESP-003", name: "Forms usable on mobile", steps: "Open create dialogs on mobile", expected: "Forms are accessible and functional", status: "pending" },
    ],
  },
  {
    id: "errors",
    title: "14. Error Handling",
    tests: [
      { id: "ERR-001", name: "Network error handling", steps: "Disconnect network, try action", expected: "Error message displayed", status: "pending" },
      { id: "ERR-002", name: "404 page", steps: "Navigate to invalid URL", expected: "404 page displays", status: "pending" },
    ],
  },
  {
    id: "data",
    title: "15. Data Integrity",
    tests: [
      { id: "DATA-001", name: "Create persists", steps: "Create contact, refresh", expected: "Contact still exists", status: "pending" },
      { id: "DATA-002", name: "Update persists", steps: "Edit contact, refresh", expected: "Changes retained", status: "pending" },
      { id: "DATA-003", name: "Delete persists", steps: "Delete contact, refresh", expected: "Contact gone permanently", status: "pending" },
      { id: "DATA-004", name: "Relationships maintain", steps: "Link contact to company, refresh", expected: "Relationship persists", status: "pending" },
    ],
  },
];

const STORAGE_KEY = "crm-qa-test-results";

export default function QATestingPage() {
  const [sections, setSections] = useState<TestSection[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialTestData;
      }
    }
    return initialTestData;
  });

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }, [sections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const updateTestStatus = (sectionId: string, testId: string, status: TestStatus) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              tests: section.tests.map((test) =>
                test.id === testId ? { ...test, status } : test
              ),
            }
          : section
      )
    );
  };

  const resetAllTests = () => {
    setSections(initialTestData);
    localStorage.removeItem(STORAGE_KEY);
  };

  const exportResults = () => {
    const results = sections.flatMap((section) =>
      section.tests.map((test) => ({
        section: section.title,
        testId: test.id,
        name: test.name,
        status: test.status,
      }))
    );
    const csv = [
      "Section,Test ID,Test Name,Status",
      ...results.map((r) => `"${r.section}","${r.testId}","${r.name}","${r.status}"`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qa-test-results-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalTests = sections.reduce((sum, s) => sum + s.tests.length, 0);
  const passedTests = sections.reduce(
    (sum, s) => sum + s.tests.filter((t) => t.status === "passed").length,
    0
  );
  const failedTests = sections.reduce(
    (sum, s) => sum + s.tests.filter((t) => t.status === "failed").length,
    0
  );
  const pendingTests = totalTests - passedTests - failedTests;
  const progressPercent = Math.round(((passedTests + failedTests) / totalTests) * 100);

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSectionStats = (section: TestSection) => {
    const passed = section.tests.filter((t) => t.status === "passed").length;
    const failed = section.tests.filter((t) => t.status === "failed").length;
    const total = section.tests.length;
    return { passed, failed, total };
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-qa-title">QA Testing Checklist</h1>
          <p className="text-muted-foreground">UAT Version - Comprehensive Test Suite</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportResults} data-testid="button-export-results">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={resetAllTests} data-testid="button-reset-tests">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressPercent} className="h-3" />
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                {passedTests} Passed
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                {failedTests} Failed
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {pendingTests} Pending
              </Badge>
            </div>
            <div className="ml-auto text-muted-foreground">
              {progressPercent}% Complete ({passedTests + failedTests}/{totalTests})
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {sections.map((section) => {
          const stats = getSectionStats(section);
          const isExpanded = expandedSections.has(section.id);

          return (
            <Collapsible key={section.id} open={isExpanded} onOpenChange={() => toggleSection(section.id)}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover-elevate py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <CardTitle className="text-base font-medium">{section.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {stats.passed > 0 && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
                            {stats.passed}
                          </Badge>
                        )}
                        {stats.failed > 0 && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 text-xs">
                            {stats.failed}
                          </Badge>
                        )}
                        <span className="text-muted-foreground text-xs">
                          {stats.passed + stats.failed}/{stats.total}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="divide-y">
                      {section.tests.map((test) => (
                        <div
                          key={test.id}
                          className="py-3 flex flex-col sm:flex-row sm:items-start gap-3"
                          data-testid={`test-row-${test.id}`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="pt-0.5">{getStatusIcon(test.status)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs text-muted-foreground">{test.id}</span>
                                <span className="font-medium text-sm">{test.name}</span>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                <span className="font-medium">Steps:</span> {test.steps}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Expected:</span> {test.expected}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 sm:flex-shrink-0 ml-8 sm:ml-0">
                            <Button
                              size="sm"
                              variant={test.status === "passed" ? "default" : "outline"}
                              className={test.status === "passed" ? "bg-green-600 hover:bg-green-700" : ""}
                              onClick={() => updateTestStatus(section.id, test.id, "passed")}
                              data-testid={`button-pass-${test.id}`}
                            >
                              Pass
                            </Button>
                            <Button
                              size="sm"
                              variant={test.status === "failed" ? "default" : "outline"}
                              className={test.status === "failed" ? "bg-red-600 hover:bg-red-700" : ""}
                              onClick={() => updateTestStatus(section.id, test.id, "failed")}
                              data-testid={`button-fail-${test.id}`}
                            >
                              Fail
                            </Button>
                            {test.status !== "pending" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateTestStatus(section.id, test.id, "pending")}
                                data-testid={`button-reset-${test.id}`}
                              >
                                Reset
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>UAT Testing Notes:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>All form fields are optional in UAT mode</li>
              <li>Authentication is disabled - no login required</li>
              <li>All users share the same test user identity</li>
              <li>Trial/subscription checks are bypassed</li>
              <li>Currency displays in Malaysian Ringgit (RM)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
