import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function AuditModeBanner() {
  const { user } = useAuth();
  
  // Only show banner for auditor role
  if (user?.role !== "auditor") {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 bg-amber-500 dark:bg-amber-600 border-b-2 border-amber-600 dark:border-amber-700 px-4 py-3 shadow-md">
      <div className="flex items-center justify-center gap-2 text-white font-semibold">
        <AlertTriangle className="h-5 w-5 animate-pulse" />
        <span className="text-sm uppercase tracking-wide">
          ⚠️ System is currently in Audit Read-Only State — All modifications are disabled
        </span>
        <AlertTriangle className="h-5 w-5 animate-pulse" />
      </div>
    </div>
  );
}

// Hook to check if user is in audit mode (read-only)
export function useAuditMode() {
  const { user } = useAuth();
  return user?.role === "auditor";
}
