import { apiConfig } from "./config";
import type { ClientSchool, SchoolModule, SchoolHeadteacher } from "@/contexts/ClientSetupContext";
import { availableModules } from "@/contexts/ClientSetupContext";
import { apiFetch } from "@/contexts/AuthContext";

const BASE = () => `${apiConfig.baseUrl}/admin/schools`;

async function handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text || `Request failed: ${res.status}`);
    }
    if (res.status === 204) return undefined as unknown as T;
    return res.json();
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toClientSchool(raw: any): ClientSchool {
    // Restore modules from setup.modules_enabled, falling back to all-disabled defaults
    let modules: SchoolModule[];
    const stored = raw.setup?.modules_enabled;
    if (Array.isArray(stored) && stored.length > 0 && typeof stored[0] === 'string') {
        // Backend stores as plain string IDs — map against availableModules
        const enabledIds = new Set(stored as string[]);
        modules = availableModules.map(m => ({
            ...m,
            enabled: enabledIds.has(m.id),
            links: m.links.map(l => ({ ...l, enabled: enabledIds.has(m.id) })),
        }));
    } else if (Array.isArray(stored) && stored.length > 0) {
        // Already full SchoolModule objects (saved via updateModules)
        modules = stored as SchoolModule[];
    } else {
        modules = availableModules.map(m => ({
            ...m,
            enabled: false,
            links: m.links.map(l => ({ ...l, enabled: false })),
        }));
    }

    const headteacher: SchoolHeadteacher | undefined =
        raw.headteacher_name
            ? {
                id: raw.id,
                name: raw.headteacher_name,
                email: raw.headteacher_email ?? "",
                phone: raw.headteacher_phone ?? "",
            }
            : undefined;

    return {
        id: raw.id,
        name: raw.name,
        code: raw.code,
        address: raw.address ?? "",
        email: raw.email ?? "",
        phone: raw.phone ?? "",
        website: raw.website ?? undefined,
        type: raw.type ?? undefined,
        category: raw.category ?? undefined,
        county: raw.county ?? undefined,
        status: raw.status as ClientSchool["status"],
        subscriptionPlan: (raw.subscription_plan ?? "standard") as ClientSchool["subscriptionPlan"],
        expiryDate: raw.expiry_date ?? "",
        createdAt: raw.created_at ?? "",
        modules,
        headteacher,
    };
}

function toPayload(school: Partial<ClientSchool>): Record<string, any> {
    const out: Record<string, any> = {};
    if (school.name !== undefined) out.name = school.name;
    if (school.code !== undefined) out.code = school.code;
    if (school.address !== undefined) out.address = school.address;
    if (school.email !== undefined) out.email = school.email;
    if (school.phone !== undefined) out.phone = school.phone;
    if (school.website !== undefined) out.website = school.website || null;
    if (school.type !== undefined) out.type = school.type;
    if (school.category !== undefined) out.category = school.category;
    if (school.county !== undefined) out.county = school.county;
    if (school.status !== undefined) out.status = school.status;
    if (school.subscriptionPlan !== undefined) out.subscription_plan = school.subscriptionPlan;
    if (school.expiryDate !== undefined) out.expiry_date = school.expiryDate || null;
    if (school.headteacher !== undefined) {
        out.headteacher_name = school.headteacher?.name ?? null;
        out.headteacher_email = school.headteacher?.email ?? null;
        out.headteacher_phone = school.headteacher?.phone ?? null;
    }
    return out;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const clientSetupService = {
    async getSchools(): Promise<ClientSchool[]> {
        const data = await handle<any[]>(await apiFetch(`${BASE()}/`));
        return (Array.isArray(data) ? data : (data as any).results ?? []).map(toClientSchool);
    },

    async createSchool(school: Omit<ClientSchool, "id" | "createdAt">): Promise<ClientSchool> {
        const raw = await handle<any>(await apiFetch(`${BASE()}/`, {
            method: "POST",
            body: JSON.stringify(toPayload(school)),
        }));
        const created = toClientSchool(raw);
        // Persist initial modules to setup
        await clientSetupService.updateModules(created.id, school.modules);
        return { ...created, modules: school.modules };
    },

    async updateSchool(id: string, updates: Partial<ClientSchool>): Promise<ClientSchool> {
        const raw = await handle<any>(await apiFetch(`${BASE()}/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(toPayload(updates)),
        }));
        return toClientSchool(raw);
    },

    async deleteSchool(id: string): Promise<void> {
        await handle<void>(await apiFetch(`${BASE()}/${id}/`, { method: "DELETE" }));
    },

    async updateModules(schoolId: string, modules: SchoolModule[]): Promise<void> {
        await handle<any>(await apiFetch(`${BASE()}/${schoolId}/setup/`, {
            method: "PATCH",
            body: JSON.stringify({ modules_enabled: modules }),
        }));
    },

    async updateHeadteacher(schoolId: string, headteacher: SchoolHeadteacher): Promise<void> {
        await handle<any>(await apiFetch(`${BASE()}/${schoolId}/`, {
            method: "PATCH",
            body: JSON.stringify({
                headteacher_name: headteacher.name,
                headteacher_email: headteacher.email,
                headteacher_phone: headteacher.phone,
            }),
        }));
    },
};
