import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole =
  | "headteacher" | "bursar" | "storekeeper"
  | "librarian"   | "auditor" | "procurement_officer" | "admin";

export interface ModulePermission {
  moduleId: string;
  moduleName: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** Only enabled links are returned — presence in this list means access is granted */
  links: { href: string; name: string }[];
}

export interface SchoolInfo {
  id: string;
  name: string;
  code: string;
  type?: string;
  category?: string;
  county?: string;
  subscriptionPlan: string;
  expiryDate?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  school?: SchoolInfo;
  /** Role-level CRUD permissions per module */
  permissions: ModulePermission[];
  /** School-level enabled modules (from SystemSetup.modules_enabled) */
  allowedModules: any[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True for auditor (view-only) or any role with no create/edit/delete in any module */
  isReadOnly: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  /** Check if current user's role is in the allowed list */
  hasPermission: (allowedRoles: UserRole[]) => boolean;
  /** Check if the user can perform an action on a module */
  canCreate: (moduleId: string) => boolean;
  canEdit: (moduleId: string) => boolean;
  canDelete: (moduleId: string) => boolean;
  canView: (moduleId: string) => boolean;
  /** Check if a route link is enabled for this user */
  canAccessLink: (href: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE = "/api/v1";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Fetch wrapper that transparently refreshes the access token on 401. */
export async function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  let res = await fetch(input, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });

  if (res.status === 401) {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      const refreshRes = await fetch(`${BASE}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (refreshRes.ok) {
        const { access } = await refreshRes.json();
        localStorage.setItem("access_token", access);
        // Retry original request with new token
        res = await fetch(input, {
          ...init,
          headers: {
            ...authHeaders(),
            ...(init?.headers ?? {}),
            Authorization: `Bearer ${access}`,
          },
        });
      } else {
        // Refresh failed — clear session
        localStorage.removeItem("auth_user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }
  }

  return res;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Drop stale sessions missing the new required fields
        if (!Array.isArray(parsed.permissions)) {
          localStorage.removeItem("auth_user");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setIsLoading(false);
          return;
        }
        // Load cached session immediately so the UI is not blocked
        setUser(parsed);
        // Then refresh permissions in the background so role changes take effect
        // without requiring an explicit logout/login
        const token = localStorage.getItem("access_token");
        if (token) {
          fetch(`${BASE}/auth/me/`, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          })
            .then((res) => {
              if (res.ok) return res.json();
              if (res.status === 401) {
                // Token expired — let apiFetch handle refresh on next real request
              }
              return null;
            })
            .then((data) => {
              if (!data) return;
              const refreshed: User = {
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role as UserRole,
                status: data.user.status,
                school: data.school ?? undefined,
                permissions: data.permissions ?? [],
                allowedModules: data.modules ?? [],
              };
              setUser(refreshed);
              localStorage.setItem("auth_user", JSON.stringify(refreshed));
            })
            .catch(() => { /* network error — keep cached session */ });
        }
      } catch {
        localStorage.removeItem("auth_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const res = await fetch(`${BASE}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Login failed");
    }

    const data = await res.json();

    // Persist tokens
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);

    const fullUser: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role as UserRole,
      status: data.user.status,
      school: data.school ?? undefined,
      permissions: data.permissions ?? [],
      allowedModules: data.modules ?? [],
    };

    setUser(fullUser);
    localStorage.setItem("auth_user", JSON.stringify(fullUser));
    return true;
  };

  const logout = async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      fetch(`${BASE}/auth/logout/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ refresh }),
      }).catch(() => {});
    }
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  };

  // ── Permission helpers ────────────────────────────────────────────────────

  const hasPermission = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role === "headteacher") {
      if (allowedRoles.length === 1 && allowedRoles[0] === "admin") return false;
      return true;
    }
    if (user.role === "auditor") {
      if (allowedRoles.length === 1 && allowedRoles[0] === "admin") return false;
      return true;
    }
    return allowedRoles.includes(user.role);
  };

  const getModulePermission = (moduleId: string): ModulePermission | undefined =>
    (user?.permissions ?? []).find(p => p.moduleId === moduleId);

  const canView = (moduleId: string): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return getModulePermission(moduleId)?.canView ?? false;
  };

  const canCreate = (moduleId: string): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return getModulePermission(moduleId)?.canCreate ?? false;
  };

  const canEdit = (moduleId: string): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return getModulePermission(moduleId)?.canEdit ?? false;
  };

  const canDelete = (moduleId: string): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return getModulePermission(moduleId)?.canDelete ?? false;
  };

  // Module route prefixes — anything outside these is a core page open to all authenticated users
  const MODULE_PREFIXES = ['/stores', '/library', '/procurement', '/students', '/staff', '/admin', '/assets'];

  const canAccessLink = (href: string): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    // Core/utility pages (Dashboard, Settings, etc.) are accessible to all authenticated users
    if (!MODULE_PREFIXES.some(p => href.startsWith(p))) return true;
    // Module routes: backend only returns enabled links — presence means access granted.
    // Exact match, OR prefix-match for sub-paths (2+ segments) so detail pages like
    // /stores/items/123 are covered by the /stores/items link.
    // Root links like /stores intentionally do NOT prefix-match sub-pages.
    for (const perm of (user.permissions ?? [])) {
      const found = perm.links.some(l => {
        if (href === l.href) return true;
        const segments = l.href.split('/').filter(Boolean);
        return segments.length >= 2 && href.startsWith(l.href + '/');
      });
      if (found) return true;
    }
    return false;
  };

  const permissions = user?.permissions ?? [];
  const isReadOnly = user?.role === "auditor"
    || (!!user && permissions.length > 0
        && permissions.every(p => !p.canCreate && !p.canEdit && !p.canDelete));

  if (isLoading) return null;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      isReadOnly,
      login,
      logout,
      hasPermission,
      canCreate,
      canEdit,
      canDelete,
      canView,
      canAccessLink,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
