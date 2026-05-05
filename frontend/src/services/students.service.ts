import { apiConfig, delay, SIMULATE_DELAY } from "./config";
import {
    DistributionRecord,
    DistributionRegisterRecord,
    NotCollectedRecord,
    ReplacementRecord,
    MOCK_STUDENTS,
    MOCK_RECENT_DISTRIBUTIONS,
    MOCK_DISTRIBUTION_REGISTER,
    MOCK_NOT_COLLECTED_LIST,
    MOCK_REPLACEMENT_HISTORY,
} from "../mock/students.mock";
import type { Student } from "../contexts/StudentContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE = () => `${apiConfig.baseUrl}/students`;

import { apiFetch } from "@/contexts/AuthContext";

async function handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text || `Request failed: ${res.status}`);
    }
    if (res.status === 204) return undefined as unknown as T;
    return res.json();
}

// ─── Field mapper (snake_case → camelCase) ────────────────────────────────────

function toStudent(raw: any): Student {
    return {
        id: raw.id,
        admissionNo: raw.admission_no,
        firstName: raw.first_name,
        middleName: raw.middle_name || undefined,
        lastName: raw.last_name,
        dateOfBirth: raw.date_of_birth ?? "",
        gender: raw.gender,
        nemisNo: raw.nemis_no ?? undefined,
        pathway: raw.pathway ?? undefined,
        class: raw.class_name,
        stream: raw.stream ?? undefined,
        admissionDate: raw.admission_date ?? "",
        parentName: raw.parent_name ?? "",
        parentPhone: raw.parent_phone ?? "",
        parentEmail: raw.parent_email ?? undefined,
        address: raw.address ?? "",
        status: (raw.status ?? "active").toLowerCase() as Student["status"],
        photoUrl: raw.photo_url ?? undefined,
        notes: raw.notes ?? undefined,
        createdAt: raw.created_at ?? "",
        updatedAt: raw.updated_at ?? "",
    };
}

function toPayload(s: Omit<Student, "id" | "createdAt" | "updatedAt"> | Partial<Student>) {
    const out: Record<string, any> = {};
    if ("admissionNo" in s && s.admissionNo !== undefined) out.admission_no = s.admissionNo;
    if ("firstName" in s && s.firstName !== undefined) out.first_name = s.firstName;
    if ("middleName" in s) out.middle_name = s.middleName || "";
    if ("lastName" in s && s.lastName !== undefined) out.last_name = s.lastName;
    if ("dateOfBirth" in s) out.date_of_birth = s.dateOfBirth || null;
    if ("gender" in s && s.gender !== undefined) out.gender = s.gender;
    if ("nemisNo" in s) out.nemis_no = s.nemisNo || null;
    if ("pathway" in s) out.pathway = s.pathway || null;
    if ("class" in s && s.class !== undefined) out.class_name = s.class;
    if ("stream" in s) out.stream = s.stream ?? null;
    if ("admissionDate" in s) out.admission_date = s.admissionDate || null;
    if ("parentName" in s) out.parent_name = s.parentName ?? "";
    if ("parentPhone" in s) out.parent_phone = s.parentPhone ?? "";
    if ("parentEmail" in s) out.parent_email = s.parentEmail ?? null;
    if ("address" in s) out.address = s.address ?? "";
    if ("status" in s && s.status !== undefined) out.status = s.status;
    if ("photoUrl" in s) out.photo_url = s.photoUrl ?? null;
    if ("notes" in s) out.notes = s.notes ?? null;
    return out;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const studentsService = {
    async getStudents(): Promise<Student[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_STUDENTS];
        }
        const data = await handle<any>(await apiFetch(`${BASE()}/`));
        return (data.results ?? data).map(toStudent);
    },

    async createStudent(student: Omit<Student, "id" | "createdAt" | "updatedAt">): Promise<Student> {
        const raw = await handle<any>(await apiFetch(`${BASE()}/`, {
            method: "POST", body: JSON.stringify(toPayload(student)),
        }));
        return toStudent(raw);
    },

    async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
        const raw = await handle<any>(await apiFetch(`${BASE()}/${id}/`, {
            method: "PATCH", body: JSON.stringify(toPayload(updates)),
        }));
        return toStudent(raw);
    },

    async deleteStudent(id: string): Promise<void> {
        await handle<void>(await apiFetch(`${BASE()}/${id}/`, { method: "DELETE" }));
    },

    async getLastThreeStudents(): Promise<{ admission_no: string }[]> {
        const data = await handle<any>(await apiFetch(`${BASE()}/last-three/`));
        return data ?? [];
    },

    async getRecentDistributions(): Promise<DistributionRecord[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return [...MOCK_RECENT_DISTRIBUTIONS]; }
        const data = await handle<any>(await apiFetch(`${apiConfig.baseUrl}/students/distributions/recent/`));
        return (data.results ?? data);
    },

    async getDistributionRegister(): Promise<DistributionRegisterRecord[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return [...MOCK_DISTRIBUTION_REGISTER]; }
        const data = await handle<any>(await apiFetch(`${apiConfig.baseUrl}/students/distributions/register/`));
        return (data.results ?? data).map((r: any): DistributionRegisterRecord => ({
            id: r.id,
            date: r.date,
            class: r.class_name,
            item: r.item_name,
            qty: r.quantity_issued,
            teacher: r.received_by,
            signature: r.received_by ? "Signed" : "-",
        }));
    },

    async getNotCollectedList(): Promise<NotCollectedRecord[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return [...MOCK_NOT_COLLECTED_LIST]; }
        const data = await handle<any>(await apiFetch(`${apiConfig.baseUrl}/students/distributions/not-collected/`));
        return (data.results ?? data).map((r: any): NotCollectedRecord => ({
            admNo: r.adm_no,
            name: r.name,
            class: r.class_name,
            item: r.item,
            reason: r.reason,
            daysOverdue: r.days_overdue,
        }));
    },

    async getReplacementHistory(): Promise<ReplacementRecord[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return [...MOCK_REPLACEMENT_HISTORY]; }
        const data = await handle<any>(await apiFetch(`${apiConfig.baseUrl}/students/distributions/replacements/`));
        return (data.results ?? data).map((r: any): ReplacementRecord => ({
            id: r.id,
            date: r.date,
            admNo: r.adm_no,
            name: r.name,
            class: r.class_name,
            item: r.item,
            reason: r.reason,
            approvedBy: r.approved_by,
            status: r.status,
        }));
    },

    // ─── Fee Structures ─────────────────────────────────────────────────────

    async getFeeStructures(params?: Record<string, string>): Promise<any[]> {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        const data = await handle<any>(await apiFetch(`${BASE()}/fee-structures/${qs}`));
        return data.results ?? data;
    },

    async getFeeStructure(id: string): Promise<any> {
        return handle<any>(await apiFetch(`${BASE()}/fee-structures/${id}/`));
    },

    async createFeeStructure(payload: any): Promise<any> {
        return handle<any>(await apiFetch(`${BASE()}/fee-structures/`, {
            method: "POST", body: JSON.stringify(payload),
        }));
    },

    async updateFeeStructure(id: string, payload: any): Promise<any> {
        return handle<any>(await apiFetch(`${BASE()}/fee-structures/${id}/`, {
            method: "PUT", body: JSON.stringify(payload),
        }));
    },

    async deleteFeeStructure(id: string): Promise<void> {
        await handle<void>(await apiFetch(`${BASE()}/fee-structures/${id}/`, { method: "DELETE" }));
    },

    // ─── Billing ────────────────────────────────────────────────────────────

    async getBills(params?: Record<string, string>): Promise<any[]> {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        const data = await handle<any>(await apiFetch(`${BASE()}/billing/${qs}`));
        return data.results ?? data;
    },

    async getBill(id: string): Promise<any> {
        return handle<any>(await apiFetch(`${BASE()}/billing/${id}/`));
    },

    async generateBillingRun(payload: { term: string; year: string; fee_structure_id: string }): Promise<any> {
        return handle<any>(await apiFetch(`${BASE()}/billing/generate/`, {
            method: "POST", body: JSON.stringify(payload),
        }));
    },

    async postBillingRun(payload: { term: string; year: string }): Promise<any> {
        return handle<any>(await apiFetch(`${BASE()}/billing/post/`, {
            method: "POST", body: JSON.stringify(payload),
        }));
    },

    // ─── Student Statement ──────────────────────────────────────────────────

    async getStudentBalances(params?: Record<string, string>): Promise<any> {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return handle<any>(await apiFetch(`${BASE()}/balances/${qs}`));
    },

    async getStudentStatement(studentId: string, params?: Record<string, string>): Promise<any> {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return handle<any>(await apiFetch(`${BASE()}/${studentId}/statement/${qs}`));
    },

    // ─── Bursaries ──────────────────────────────────────────────────────────

    async getBursaries(params?: Record<string, string>): Promise<any[]> {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        const data = await handle<any>(await apiFetch(`${BASE()}/bursaries/${qs}`));
        return data.results ?? data;
    },

    async createBursary(payload: any): Promise<any> {
        return handle<any>(await apiFetch(`${BASE()}/bursaries/`, {
            method: "POST", body: JSON.stringify(payload),
        }));
    },

    async updateBursary(id: string, payload: any): Promise<any> {
        return handle<any>(await apiFetch(`${BASE()}/bursaries/${id}/`, {
            method: "PUT", body: JSON.stringify(payload),
        }));
    },

    async deleteBursary(id: string): Promise<void> {
        await handle<void>(await apiFetch(`${BASE()}/bursaries/${id}/`, { method: "DELETE" }));
    },
};
