import { apiConfig, delay, SIMULATE_DELAY } from "./config";
import type { Staff } from "../contexts/StaffContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE = () => `${apiConfig.baseUrl}/staff`;

import { apiFetch } from "@/contexts/AuthContext";

async function handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text || `Request failed: ${res.status}`);
    }
    if (res.status === 204) return undefined as unknown as T;
    return res.json();
}

// ─── Field mappers ────────────────────────────────────────────────────────────

function toStaff(raw: any): Staff {
    return {
        id: raw.id,
        tscNumber: raw.tsc_number ?? undefined,
        staffNumber: raw.staff_number ?? undefined,
        inventoryNumber: raw.inventory_number,
        name: raw.name,
        email: raw.email ?? "",
        phone: raw.phone ?? "",
        type: raw.type,
        designation: raw.designation,
        department: raw.department,
        dateJoined: new Date(raw.date_joined),
        status: raw.status,
        idNumber: raw.id_number ?? undefined,
        gender: raw.gender ?? undefined,
        subjects: raw.subjects ?? [],
        notes: raw.notes ?? undefined,
        userId: raw.user_id ?? undefined,
    };
}

function toPayload(s: Omit<Staff, "id"> | Partial<Staff>) {
    const out: Record<string, any> = {};
    if ("tscNumber" in s) out.tsc_number = s.tscNumber ?? null;
    if ("staffNumber" in s) out.staff_number = s.staffNumber ?? null;
    if ("inventoryNumber" in s && s.inventoryNumber !== undefined) out.inventory_number = s.inventoryNumber;
    if ("name" in s && s.name !== undefined) out.name = s.name;
    if ("email" in s) out.email = s.email ?? "";
    if ("phone" in s) out.phone = s.phone ?? "";
    if ("type" in s && s.type !== undefined) out.type = s.type;
    if ("designation" in s && s.designation !== undefined) out.designation = s.designation;
    if ("department" in s && s.department !== undefined) out.department = s.department;
    if ("dateJoined" in s && s.dateJoined !== undefined) {
        const d = s.dateJoined instanceof Date ? s.dateJoined : new Date(s.dateJoined);
        out.date_joined = d.toISOString().split("T")[0];
    }
    if ("status" in s && s.status !== undefined) out.status = s.status;
    if ("idNumber" in s) out.id_number = s.idNumber ?? null;
    if ("gender" in s) out.gender = s.gender ?? null;
    if ("subjects" in s) out.subjects = s.subjects ?? [];
    if ("notes" in s) out.notes = s.notes ?? null;
    return out;
}

// ─── Mock seed data (used when useMockData=true) ──────────────────────────────

const MOCK_STAFF: Staff[] = [
    { id: "staff-1", tscNumber: "TSC001234", inventoryNumber: "INV001", name: "John Mwangi", email: "j.mwangi@school.ac.ke", phone: "0722000001", type: "teaching", designation: "Senior Teacher", department: "Mathematics", dateJoined: new Date("2020-01-15"), status: "active", idNumber: "12345678", gender: "male", subjects: ["Mathematics", "Physics"] },
    { id: "staff-2", tscNumber: "TSC002345", inventoryNumber: "INV002", name: "Mary Wanjiru", email: "m.wanjiru@school.ac.ke", phone: "0722000002", type: "teaching", designation: "Teacher", department: "Languages", dateJoined: new Date("2021-05-10"), status: "active", idNumber: "23456789", gender: "female", subjects: ["English", "Literature"] },
    { id: "staff-3", staffNumber: "NTS001", inventoryNumber: "INV003", name: "Grace Akinyi", email: "g.akinyi@school.ac.ke", phone: "0722000004", type: "non-teaching", designation: "Secretary", department: "Administration", dateJoined: new Date("2019-03-20"), status: "active", idNumber: "45678901", gender: "female" },
];

// ─── Service ──────────────────────────────────────────────────────────────────

export const staffService = {
    async getStaff(): Promise<Staff[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return [...MOCK_STAFF]; }
        const data = await handle<any>(await apiFetch(`${BASE()}/`));
        return (data.results ?? data).map(toStaff);
    },

    async createStaff(staff: Omit<Staff, "id">): Promise<Staff> {
        const raw = await handle<any>(await apiFetch(`${BASE()}/`, {
            method: "POST", body: JSON.stringify(toPayload(staff)),
        }));
        return toStaff(raw);
    },

    async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff> {
        const raw = await handle<any>(await apiFetch(`${BASE()}/${id}/`, {
            method: "PATCH", body: JSON.stringify(toPayload(updates)),
        }));
        return toStaff(raw);
    },

    async deleteStaff(id: string): Promise<void> {
        await handle<void>(await apiFetch(`${BASE()}/${id}/`, { method: "DELETE" }));
    },
};
