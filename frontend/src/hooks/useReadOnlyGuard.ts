import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/** Map URL prefix → moduleId used in permissions */
const PATH_TO_MODULE: Record<string, string> = {
  "/stores":       "stores",
  "/procurement":  "procurement",
  "/library":      "library",
  "/students":     "students",
  "/staff":        "staff",
  "/assets":       "assets",
  "/admin":        "administration",
  "/finance":      "finance",
};

function inferModuleId(pathname: string): string | null {
  for (const [prefix, moduleId] of Object.entries(PATH_TO_MODULE)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return moduleId;
    }
  }
  return null;
}

/**
 * Hook to enforce CRUD permissions for the current module.
 *
 * Automatically infers the module from the current URL and checks the role's
 * canCreate / canEdit / canDelete flags from the backend permissions.
 * Falls back to the global isReadOnly (auditor) check for non-module pages.
 */
export function useReadOnlyGuard() {
  const { isReadOnly: globalReadOnly, canCreate, canEdit, canDelete, user } = useAuth();
  const location = useLocation();

  const moduleId = inferModuleId(location.pathname);

  // Admin with no school has full access everywhere
  const isAdmin = user?.role === "admin" && !user?.school?.id;

  // For module pages: read-only if the role has no write permissions at all for this module
  const isReadOnly = isAdmin
    ? false
    : moduleId
    ? !canCreate(moduleId) && !canEdit(moduleId) && !canDelete(moduleId)
    : globalReadOnly;

  const canWrite = {
    create: isAdmin || (moduleId ? canCreate(moduleId) : !globalReadOnly),
    edit:   isAdmin || (moduleId ? canEdit(moduleId)   : !globalReadOnly),
    delete: isAdmin || (moduleId ? canDelete(moduleId) : !globalReadOnly),
  };

  /**
   * Call before a write action. Returns true (and shows a toast) if blocked.
   * Pass the crud type ("create" | "edit" | "delete") for precise checking.
   */
  const blockAction = (
    actionName: string = "perform this action",
    crudType: "create" | "edit" | "delete" | "write" = "write"
  ): boolean => {
    const allowed =
      crudType === "create" ? canWrite.create :
      crudType === "edit"   ? canWrite.edit   :
      crudType === "delete" ? canWrite.delete  :
      !isReadOnly;

    if (!allowed) {
      toast.error("Permission Denied", {
        description: `You do not have permission to ${actionName}.`,
      });
      return true;
    }
    return false;
  };

  /**
   * Wraps an action function and blocks it if the user lacks write permission.
   */
  const guardAction = <T extends (...args: any[]) => any>(
    action: T,
    actionName: string = "action",
    crudType: "create" | "edit" | "delete" | "write" = "write"
  ): T => {
    return ((...args: Parameters<T>) => {
      if (blockAction(actionName, crudType)) return;
      return action(...args);
    }) as T;
  };

  return {
    isReadOnly,
    canWrite,
    guardAction,
    blockAction,
  };
}
