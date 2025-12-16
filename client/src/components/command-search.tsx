import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  Building2,
  HandshakeIcon,
  CheckSquare,
  Settings,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const pages = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Companies", url: "/companies", icon: Building2 },
  { title: "Deals", url: "/deals", icon: HandshakeIcon },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    setLocation(url);
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:w-64 md:w-80"
        onClick={() => setOpen(true)}
        data-testid="button-command-search"
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search everything...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type to search..." data-testid="input-command-search" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {pages.map((page) => (
              <CommandItem
                key={page.url}
                onSelect={() => handleSelect(page.url)}
                data-testid={`command-item-${page.title.toLowerCase()}`}
              >
                <page.icon className="mr-2 h-4 w-4" />
                <span>{page.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => {
                setOpen(false);
                setLocation("/contacts?new=true");
              }}
              data-testid="command-item-new-contact"
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Create new contact</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpen(false);
                setLocation("/companies?new=true");
              }}
              data-testid="command-item-new-company"
            >
              <Building2 className="mr-2 h-4 w-4" />
              <span>Create new company</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpen(false);
                setLocation("/deals?new=true");
              }}
              data-testid="command-item-new-deal"
            >
              <HandshakeIcon className="mr-2 h-4 w-4" />
              <span>Create new deal</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpen(false);
                setLocation("/tasks?new=true");
              }}
              data-testid="command-item-new-task"
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              <span>Create new task</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
