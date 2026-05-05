import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { api } from "@/services/api";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { UserRole } from "./AuthContext";

// Store types
export interface Store {
  id: string;
  name: string;
  code: string;
  location: string;
  managerId?: string;
  managerName?: string;
  status: "active" | "inactive";
  createdAt: Date;
  description?: string;
}

// Library types
export interface Library {
  id: string;
  name: string;
  code: string;
  location: string;
  managerId?: string;
  managerName?: string;
  status: "active" | "inactive";
  createdAt: Date;
  capacity?: number;
  description?: string;
}

// Department types
export interface Department {
  id: string;
  name: string;
  code: string;
  headId?: string;
  headName?: string;
  status: "active" | "inactive";
  createdAt: Date;
  description?: string;
  parentId?: string;
}

// Stream types
export interface Stream {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive";
  createdAt: Date;
  description?: string;
}

// Permission types
export interface Permission {
  id: string;
  name: string;
  code: string;
  module: string;
  description: string;
}

// Role with permissions
export interface RolePermission {
  role: UserRole;
  roleLabel: string;
  permissions: string[];
  description: string;
}

interface AdminContextType {
  // Stores
  stores: Store[];
  addStore: (store: Omit<Store, "id" | "createdAt">) => void;
  updateStore: (id: string, updates: Partial<Store>) => void;
  deleteStore: (id: string) => void;
  getStoreById: (id: string) => Store | undefined;

  // Libraries
  libraries: Library[];
  addLibrary: (library: Omit<Library, "id" | "createdAt">) => void;
  updateLibrary: (id: string, updates: Partial<Library>) => void;
  deleteLibrary: (id: string) => void;
  getLibraryById: (id: string) => Library | undefined;

  // Departments
  departments: Department[];
  addDepartment: (department: Omit<Department, "id" | "createdAt">) => void;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  getDepartmentById: (id: string) => Department | undefined;

  // Streams
  streams: Stream[];
  addStream: (stream: Omit<Stream, "id" | "createdAt">) => void;
  updateStream: (id: string, updates: Partial<Stream>) => void;
  deleteStream: (id: string) => void;
  getStreamById: (id: string) => Stream | undefined;

  // Permissions
  permissions: Permission[];
  rolePermissions: RolePermission[];
  updateRolePermissions: (role: UserRole, permissions: string[]) => void;
  getRolePermissions: (role: UserRole) => string[];

}

const AdminContext = createContext<AdminContextType | undefined>(undefined);



export function AdminProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  useEffect(() => {
    // Note: mapping dates from strings if necessary based on API responses
    api.getStores().then(data => setStores(data.map(d => ({ ...d, createdAt: new Date(d.createdAt) }))));
    api.getLibraries().then(data => setLibraries(data.map(d => ({ ...d, createdAt: new Date(d.createdAt) }))));
    api.getDepartments().then(data => setDepartments(data.map(d => ({ ...d, createdAt: new Date(d.createdAt) }))));
    api.getStreams().then(data => setStreams(data.map(d => ({ ...d, createdAt: new Date(d.createdAt) }))));
    api.getPermissions().then(setPermissions);
    api.getRolePermissions().then(setRolePermissions);
  }, []);

  // ── helpers ────────────────────────────────────────────────────────────────
  const toDate = (v: string | Date | undefined): Date =>
    v ? (v instanceof Date ? v : new Date(v)) : new Date();

  // ── Store operations ────────────────────────────────────────────────────────
  const addStore = (store: Omit<Store, "id" | "createdAt">) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Store = { ...store, id: tempId, createdAt: new Date() };
    setStores((prev) => [...prev, optimistic]);

    adminService.createStore(store as any)
      .then((created) => {
        setStores((prev) =>
          prev.map((s) =>
            s.id === tempId
              ? { ...(created as any), createdAt: toDate((created as any).createdAt) }
              : s
          )
        );
      })
      .catch((err: Error) => {
        setStores((prev) => prev.filter((s) => s.id !== tempId));
        toast.error(err.message || "Failed to create store");
      });
  };

  const updateStore = (id: string, updates: Partial<Store>) => {
    let snapshot: Store | undefined;
    setStores((prev) => {
      snapshot = prev.find((s) => s.id === id);
      return prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
    });

    adminService.updateStore(id, updates as any)
      .then((updated) => {
        setStores((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...(updated as any), createdAt: toDate((updated as any).createdAt ?? s.createdAt) }
              : s
          )
        );
      })
      .catch((err: Error) => {
        if (snapshot) setStores((prev) => prev.map((s) => (s.id === id ? snapshot! : s)));
        toast.error(err.message || "Failed to update store");
      });
  };

  const deleteStore = (id: string) => {
    let snapshot: Store | undefined;
    setStores((prev) => {
      snapshot = prev.find((s) => s.id === id);
      return prev.filter((s) => s.id !== id);
    });

    adminService.deleteStore(id).catch((err: Error) => {
      if (snapshot) setStores((prev) => [...prev, snapshot!]);
      toast.error(err.message || "Failed to delete store");
    });
  };

  const getStoreById = (id: string) => stores.find((store) => store.id === id);

  // ── Library operations ──────────────────────────────────────────────────────
  const addLibrary = (library: Omit<Library, "id" | "createdAt">) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Library = { ...library, id: tempId, createdAt: new Date() };
    setLibraries((prev) => [...prev, optimistic]);

    adminService.createLibrary(library as any)
      .then((created) => {
        setLibraries((prev) =>
          prev.map((l) =>
            l.id === tempId
              ? { ...(created as any), createdAt: toDate((created as any).createdAt) }
              : l
          )
        );
      })
      .catch((err: Error) => {
        setLibraries((prev) => prev.filter((l) => l.id !== tempId));
        toast.error(err.message || "Failed to create library");
      });
  };

  const updateLibrary = (id: string, updates: Partial<Library>) => {
    let snapshot: Library | undefined;
    setLibraries((prev) => {
      snapshot = prev.find((l) => l.id === id);
      return prev.map((l) => (l.id === id ? { ...l, ...updates } : l));
    });

    adminService.updateLibrary(id, updates as any)
      .then((updated) => {
        setLibraries((prev) =>
          prev.map((l) =>
            l.id === id
              ? { ...(updated as any), createdAt: toDate((updated as any).createdAt ?? l.createdAt) }
              : l
          )
        );
      })
      .catch((err: Error) => {
        if (snapshot) setLibraries((prev) => prev.map((l) => (l.id === id ? snapshot! : l)));
        toast.error(err.message || "Failed to update library");
      });
  };

  const deleteLibrary = (id: string) => {
    let snapshot: Library | undefined;
    setLibraries((prev) => {
      snapshot = prev.find((l) => l.id === id);
      return prev.filter((l) => l.id !== id);
    });

    adminService.deleteLibrary(id).catch((err: Error) => {
      if (snapshot) setLibraries((prev) => [...prev, snapshot!]);
      toast.error(err.message || "Failed to delete library");
    });
  };

  const getLibraryById = (id: string) => libraries.find((lib) => lib.id === id);

  // ── Department operations ───────────────────────────────────────────────────
  const addDepartment = (department: Omit<Department, "id" | "createdAt">) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Department = { ...department, id: tempId, createdAt: new Date() };
    setDepartments((prev) => [...prev, optimistic]);

    adminService.createDepartment(department as any)
      .then((created) => {
        setDepartments((prev) =>
          prev.map((d) =>
            d.id === tempId
              ? { ...(created as any), createdAt: toDate((created as any).createdAt) }
              : d
          )
        );
      })
      .catch((err: Error) => {
        setDepartments((prev) => prev.filter((d) => d.id !== tempId));
        toast.error(err.message || "Failed to create department");
      });
  };

  const updateDepartment = (id: string, updates: Partial<Department>) => {
    let snapshot: Department | undefined;
    setDepartments((prev) => {
      snapshot = prev.find((d) => d.id === id);
      return prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
    });

    adminService.updateDepartment(id, updates as any)
      .then((updated) => {
        setDepartments((prev) =>
          prev.map((d) =>
            d.id === id
              ? { ...(updated as any), createdAt: toDate((updated as any).createdAt ?? d.createdAt) }
              : d
          )
        );
      })
      .catch((err: Error) => {
        if (snapshot) setDepartments((prev) => prev.map((d) => (d.id === id ? snapshot! : d)));
        toast.error(err.message || "Failed to update department");
      });
  };

  const deleteDepartment = (id: string) => {
    let snapshot: Department | undefined;
    setDepartments((prev) => {
      snapshot = prev.find((d) => d.id === id);
      return prev.filter((d) => d.id !== id);
    });

    adminService.deleteDepartment(id).catch((err: Error) => {
      if (snapshot) setDepartments((prev) => [...prev, snapshot!]);
      toast.error(err.message || "Failed to delete department");
    });
  };

  const getDepartmentById = (id: string) => departments.find((dept) => dept.id === id);

  // ── Stream operations ─────────────────────────────────────────────────────
  const addStream = (stream: Omit<Stream, "id" | "createdAt">) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Stream = { ...stream, id: tempId, createdAt: new Date() };
    setStreams((prev) => [...prev, optimistic]);

    adminService.createStream(stream as any)
      .then((created) => {
        setStreams((prev) =>
          prev.map((s) =>
            s.id === tempId
              ? { ...(created as any), createdAt: toDate((created as any).createdAt) }
              : s
          )
        );
      })
      .catch((err: Error) => {
        setStreams((prev) => prev.filter((s) => s.id !== tempId));
        toast.error(err.message || "Failed to create stream");
      });
  };

  const updateStream = (id: string, updates: Partial<Stream>) => {
    let snapshot: Stream | undefined;
    setStreams((prev) => {
      snapshot = prev.find((s) => s.id === id);
      return prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
    });

    adminService.updateStream(id, updates as any)
      .then((updated) => {
        setStreams((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...(updated as any), createdAt: toDate((updated as any).createdAt ?? s.createdAt) }
              : s
          )
        );
      })
      .catch((err: Error) => {
        if (snapshot) setStreams((prev) => prev.map((s) => (s.id === id ? snapshot! : s)));
        toast.error(err.message || "Failed to update stream");
      });
  };

  const deleteStream = (id: string) => {
    let snapshot: Stream | undefined;
    setStreams((prev) => {
      snapshot = prev.find((s) => s.id === id);
      return prev.filter((s) => s.id !== id);
    });

    adminService.deleteStream(id).catch((err: Error) => {
      if (snapshot) setStreams((prev) => [...prev, snapshot!]);
      toast.error(err.message || "Failed to delete stream");
    });
  };

  const getStreamById = (id: string) => streams.find((s) => s.id === id);

  // Permission operations
  const updateRolePermissions = (role: UserRole, permissions: string[]) => {
    setRolePermissions((prev) =>
      prev.map((rp) => (rp.role === role ? { ...rp, permissions } : rp))
    );
  };

  const getRolePermissions = (role: UserRole) => {
    const rp = rolePermissions.find((r) => r.role === role);
    return rp?.permissions || [];
  };

  return (
    <AdminContext.Provider
      value={{
        stores,
        addStore,
        updateStore,
        deleteStore,
        getStoreById,
        libraries,
        addLibrary,
        updateLibrary,
        deleteLibrary,
        getLibraryById,
        departments,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        getDepartmentById,
        streams,
        addStream,
        updateStream,
        deleteStream,
        getStreamById,
        permissions,
        rolePermissions,
        updateRolePermissions,
        getRolePermissions,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
