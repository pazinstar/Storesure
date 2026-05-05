import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";

export function UserLocationDisplay() {
  const { user } = useAuth();
  const { stores } = useAdmin();
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.getUsers(),
  });

  const managedUser = useMemo(() => {
    if (!user?.id) return null;
    return users.find((u) => u.id === user.id);
  }, [user?.id, users]);

  const storeNames = useMemo(() => {
    const activeStores = stores.filter((s) => s.status === "active");

    // Admin and headteacher see all stores
    if (user?.role === "admin" || user?.role === "headteacher") {
      return activeStores.map((s) => s.name);
    }

    const assignedIds = managedUser?.assignedStores || [];
    if (assignedIds.length === 0) return [];

    return activeStores
      .filter((s) => assignedIds.includes(s.id))
      .map((s) => s.name);
  }, [stores, user?.role, managedUser?.assignedStores]);

  if (storeNames.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <MapPin className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate max-w-[250px]">
        Location: <span className="font-medium">{storeNames.join(", ")}</span>
      </span>
    </div>
  );
}
