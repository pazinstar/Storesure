import { apiConfig, delay, SIMULATE_DELAY } from "./config";
import {
    Store,
    Library,
    Department,
    Permission,
    RolePermission,
    ADMIN_STORES,
    ADMIN_LIBRARIES,
    ADMIN_DEPARTMENTS,
    ADMIN_PERMISSIONS,
    ADMIN_ROLE_PERMISSIONS,
} from "../mock/data";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommitteeMemberPayload {
    user_id: string;
    user_name: string;
    designation: string;
    order: number;
}

export interface CommitteeData {
    id?: number | null;
    members: CommitteeMemberPayload[];
    is_active: boolean;
    updated_at?: string | null;
}

export interface RoleModuleLink {
    name: string;
    href: string;
    enabled: boolean;
}

export interface RoleModulePermission {
    /** Frontend uses module_id as the identity key */
    id: string;
    name: string;
    enabled: boolean;
    crud: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    links: RoleModuleLink[];
}

export interface Role {
    id: string;
    name: string;
    description: string;
    type: "system" | "custom";
    is_deletable: boolean;
    module_count?: number;
    permissions: RoleModulePermission[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { apiFetch } from "@/contexts/AuthContext";

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text || `Request failed: ${res.status}`);
    }
    return res.json();
}

/** Map backend role response → frontend Role shape */
function toRole(raw: any): Role {
    return {
        id: raw.id,
        name: raw.name,
        description: raw.description ?? "",
        type: raw.type ?? "system",
        is_deletable: raw.is_deletable ?? true,
        module_count: raw.module_count,
        permissions: (raw.permissions ?? []).map((p: any) => ({
            id: p.module_id,
            name: p.module_name,
            enabled: p.enabled,
            crud: p.crud ?? { view: false, create: false, edit: false, delete: false },
            links: (p.links ?? []).map((l: any) => ({
                name: l.name,
                href: l.href,
                enabled: l.enabled,
            })),
        })),
    };
}

/** Map frontend permissions → backend payload shape */
function toApiPermissions(permissions: RoleModulePermission[]) {
    return permissions.map((p) => ({
        module_id: p.id,
        module_name: p.name,
        enabled: p.enabled,
        crud: p.crud,
        links: p.links,
    }));
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const adminService = {
    // ── Stores ────────────────────────────────────────────────────────────────
    async getStores(): Promise<Store[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return [...ADMIN_STORES]; }
        const data = await handleResponse<any>(await apiFetch(`${apiConfig.baseUrl}/admin/stores/`));
        return data.results ?? data;
    },
    async createStore(payload: Omit<Store, "id" | "createdAt">): Promise<Store> {
        return handleResponse<Store>(await apiFetch(`${apiConfig.baseUrl}/admin/stores/`, {
            method: "POST", body: JSON.stringify(payload),
        }));
    },
    async updateStore(id: string, payload: Partial<Omit<Store, "id" | "createdAt">>): Promise<Store> {
        return handleResponse<Store>(await apiFetch(`${apiConfig.baseUrl}/admin/stores/${id}/`, {
            method: "PATCH", body: JSON.stringify(payload),
        }));
    },
    async deleteStore(id: string): Promise<void> {
        const res = await apiFetch(`${apiConfig.baseUrl}/admin/stores/${id}/`, { method: "DELETE" });
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
    },

    // ── Libraries ─────────────────────────────────────────────────────────────
    async getLibraries(): Promise<Library[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return [...ADMIN_LIBRARIES]; }
        const data = await handleResponse<any>(await apiFetch(`${apiConfig.baseUrl}/admin/libraries/`));
        return data.results ?? data;
    },
    async createLibrary(payload: Omit<Library, "id" | "createdAt">): Promise<Library> {
        return handleResponse<Library>(await apiFetch(`${apiConfig.baseUrl}/admin/libraries/`, {
            method: "POST", body: JSON.stringify(payload),
        }));
    },
    async updateLibrary(id: string, payload: Partial<Omit<Library, "id" | "createdAt">>): Promise<Library> {
        return handleResponse<Library>(await apiFetch(`${apiConfig.baseUrl}/admin/libraries/${id}/`, {
            method: "PATCH", body: JSON.stringify(payload),
        }));
    },
    async deleteLibrary(id: string): Promise<void> {
        const res = await apiFetch(`${apiConfig.baseUrl}/admin/libraries/${id}/`, { method: "DELETE" });
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
    },

    // ── Departments ───────────────────────────────────────────────────────────
    async getDepartments(): Promise<Department[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return [...ADMIN_DEPARTMENTS]; }
        const data = await handleResponse<any>(await apiFetch(`${apiConfig.baseUrl}/admin/departments/`));
        return data.results ?? data;
    },
    async createDepartment(payload: Omit<Department, "id" | "createdAt">): Promise<Department> {
        return handleResponse<Department>(await apiFetch(`${apiConfig.baseUrl}/admin/departments/`, {
            method: "POST", body: JSON.stringify(payload),
        }));
    },
    async updateDepartment(id: string, payload: Partial<Omit<Department, "id" | "createdAt">>): Promise<Department> {
        return handleResponse<Department>(await apiFetch(`${apiConfig.baseUrl}/admin/departments/${id}/`, {
            method: "PATCH", body: JSON.stringify(payload),
        }));
    },
    async deleteDepartment(id: string): Promise<void> {
        const res = await apiFetch(`${apiConfig.baseUrl}/admin/departments/${id}/`, { method: "DELETE" });
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
    },

    // ── Streams ──────────────────────────────────────────────────────────────
    async getStreams(): Promise<any[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return []; }
        const data = await handleResponse<any>(await apiFetch(`${apiConfig.baseUrl}/admin/streams/`));
        return data.results ?? data;
    },
    async createStream(payload: any): Promise<any> {
        return handleResponse<any>(await apiFetch(`${apiConfig.baseUrl}/admin/streams/`, {
            method: "POST", body: JSON.stringify(payload),
        }));
    },
    async updateStream(id: string, payload: any): Promise<any> {
        return handleResponse<any>(await apiFetch(`${apiConfig.baseUrl}/admin/streams/${id}/`, {
            method: "PATCH", body: JSON.stringify(payload),
        }));
    },
    async deleteStream(id: string): Promise<void> {
        const res = await apiFetch(`${apiConfig.baseUrl}/admin/streams/${id}/`, { method: "DELETE" });
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
    },

    // ── Permissions (legacy) ──────────────────────────────────────────────────
    async getPermissions(): Promise<Permission[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return [...ADMIN_PERMISSIONS]; }
        const data = await handleResponse<any>(await apiFetch(`${apiConfig.baseUrl}/admin/permissions/`));
        return data.results ?? data;
    },

    // ── Role Permissions (legacy JSON) ────────────────────────────────────────
    async getRolePermissions(): Promise<RolePermission[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return [...ADMIN_ROLE_PERMISSIONS]; }
        const data = await handleResponse<any>(await apiFetch(`${apiConfig.baseUrl}/admin/role-permissions/`));
        return data.results ?? data;
    },

    // ── Roles (relational) ────────────────────────────────────────────────────

    async getRoles(): Promise<Role[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return []; }
        const data = await handleResponse<any>(await apiFetch(`${apiConfig.baseUrl}/admin/roles/`));
        const list: any[] = data.results ?? data;
        return list.map(toRole);
    },

    async getRoleById(id: string): Promise<Role> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); throw new Error("Mock not implemented"); }
        const raw = await handleResponse<any>(await apiFetch(`${apiConfig.baseUrl}/admin/roles/${id}/`));
        return toRole(raw);
    },

    async createRole(payload: { id: string; name: string; description: string; permissions?: RoleModulePermission[] }): Promise<Role> {
        const body = {
            id: payload.id,
            name: payload.name,
            description: payload.description,
            type: "custom",
            is_deletable: true,
            permissions: toApiPermissions(payload.permissions ?? []),
        };
        const raw = await handleResponse<any>(
            await apiFetch(`${apiConfig.baseUrl}/admin/roles/`, {
                method: "POST",
                body: JSON.stringify(body),
            })
        );
        return toRole(raw);
    },

    async updateRole(id: string, payload: { name?: string; description?: string; permissions?: RoleModulePermission[] }): Promise<Role> {
        const body: any = {};
        if (payload.name !== undefined) body.name = payload.name;
        if (payload.description !== undefined) body.description = payload.description;
        if (payload.permissions !== undefined) body.permissions = toApiPermissions(payload.permissions);

        const raw = await handleResponse<any>(
            await apiFetch(`${apiConfig.baseUrl}/admin/roles/${id}/`, {
                method: "PATCH",
                body: JSON.stringify(body),
            })
        );
        return toRole(raw);
    },

    // ── Inspection Committee ──────────────────────────────────────────────────

    async getCommittee(): Promise<CommitteeData> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return { id: null, members: [], is_active: false, updated_at: null };
        }
        return handleResponse<CommitteeData>(
            await apiFetch(`${apiConfig.baseUrl}/admin/committee/`)
        );
    },

    async saveCommittee(payload: { members: CommitteeMemberPayload[]; is_active: boolean }): Promise<CommitteeData> {
        return handleResponse<CommitteeData>(
            await apiFetch(`${apiConfig.baseUrl}/admin/committee/`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            })
        );
    },

    async deleteCommittee(): Promise<void> {
        const res = await apiFetch(`${apiConfig.baseUrl}/admin/committee/`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
    },

    async deleteRole(id: string): Promise<void> {
        const res = await apiFetch(`${apiConfig.baseUrl}/admin/roles/${id}/`, { method: "DELETE" });
        if (!res.ok) {
            const text = await res.text().catch(() => res.statusText);
            throw new Error(text || `Delete failed: ${res.status}`);
        }
    },
};
