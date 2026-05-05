import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";

export function StoreSelector() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { stores } = useAdmin();
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.getUsers(),
  });

  // Get the managed user to access assignedStores
  const managedUser = useMemo(() => {
    if (!user?.id) return null;
    return users.find(u => u.id === user.id);
  }, [user?.id, users]);

  // Filter stores based on user assignment
  const availableStores = useMemo(() => {
    // Admin and headteacher can see all stores
    if (user?.role === "admin" || user?.role === "headteacher") {
      return stores.filter(s => s.status === "active").map(s => ({
        value: s.id,
        label: s.name,
        location: s.location,
      }));
    }

    // For other roles, filter by assigned stores
    const assignedStoreIds = managedUser?.assignedStores || [];

    // If no stores assigned, return empty (or could show a message)
    if (assignedStoreIds.length === 0) {
      return [];
    }

    return stores
      .filter(s => s.status === "active" && assignedStoreIds.includes(s.id))
      .map(s => ({
        value: s.id,
        label: s.name,
        location: s.location,
      }));
  }, [stores, user?.role, managedUser?.assignedStores]);

  // Default to first available store
  const [value, setValue] = useState(() => availableStores[0]?.value || "");

  const selectedStore = availableStores.find((store) => store.value === value);

  // Don't render if no stores available
  if (availableStores.length === 0) {
    return (
      <div className="px-2 py-3 text-sm text-muted-foreground">
        No stores assigned
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent"
        >
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">
                {selectedStore?.label || "Select store..."}
              </span>
              {selectedStore && (
                <span className="text-xs text-muted-foreground">
                  {selectedStore.location}
                </span>
              )}
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search stores..." />
          <CommandList>
            <CommandEmpty>No store found.</CommandEmpty>
            <CommandGroup heading="Assigned Stores">
              {availableStores.map((store) => (
                <CommandItem
                  key={store.value}
                  value={store.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === store.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{store.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {store.location}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
