import { apiConfig } from "./config";
import { apiFetch } from "@/contexts/AuthContext";

const BASE = () => `${apiConfig.baseUrl}/finance`;

async function handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text || `Request failed: ${res.status}`);
    }
    if (res.status === 204) return undefined as unknown as T;
    return res.json();
}

async function list<T>(path: string): Promise<T[]> {
    const res = await apiFetch(`${BASE()}${path}`);
    const data = await handle<any>(res);
    return data.results ?? data;
}

async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await apiFetch(`${BASE()}${path}`, { method: 'POST', body: JSON.stringify(body) });
    return handle<T>(res);
}

async function patch<T>(path: string, id: string, body: unknown): Promise<T> {
    const res = await apiFetch(`${BASE()}${path}${id}/`, { method: 'PATCH', body: JSON.stringify(body) });
    return handle<T>(res);
}

async function del(path: string, id: string): Promise<void> {
    const res = await apiFetch(`${BASE()}${path}${id}/`, { method: 'DELETE' });
    await handle<void>(res);
}

async function get<T>(path: string): Promise<T> {
    const res = await apiFetch(`${BASE()}${path}`);
    return handle<T>(res);
}

async function action<T>(path: string): Promise<T> {
    const res = await apiFetch(`${BASE()}${path}`, { method: 'POST' });
    return handle<T>(res);
}

export const financeService = {
    // ── Financial Years ──────────────────────────────────────────────────────
    getFinancialYears: () => list('/financial-years/'),
    createFinancialYear: (data: unknown) => post('/financial-years/', data),
    updateFinancialYear: (id: string, data: unknown) => patch('/financial-years/', id, data),

    // ── Accounting Periods ───────────────────────────────────────────────────
    getAccountingPeriods: () => list('/periods/'),
    createAccountingPeriod: (data: unknown) => post('/periods/', data),
    setPeriodStatus: (id: number, status: string) =>
        post(`/periods/${id}/set-status/`, { status }),

    // ── Funds ────────────────────────────────────────────────────────────────
    getFunds: () => list('/funds/'),
    createFund: (data: unknown) => post('/funds/', data),
    updateFund: (id: string, data: unknown) => patch('/funds/', id, data),

    // ── Bank Accounts & Cash Points ──────────────────────────────────────────
    getBankAccounts: () => list('/bank-accounts/'),
    createBankAccount: (data: unknown) => post('/bank-accounts/', data),
    getCashPoints: () => list('/cash-points/'),
    createCashPoint: (data: unknown) => post('/cash-points/', data),

    // ── Entities (Subledger parties) ─────────────────────────────────────────
    getEntities: () => list('/entities/'),
    createEntity: (data: unknown) => post('/entities/', data),
    updateEntity: (id: string, data: unknown) => patch('/entities/', id, data),
    deleteEntity: (id: string) => del('/entities/', id),

    // ── Chart of Accounts ────────────────────────────────────────────────────
    getChartOfAccounts: () => list('/accounts/'),
    createChartOfAccount: (data: unknown) => post('/accounts/', data),
    updateChartOfAccount: (id: string, data: unknown) => patch('/accounts/', id, data),
    deleteChartOfAccount: (id: string) => del('/accounts/', id),

    // ── Budgets ──────────────────────────────────────────────────────────────
    getBudgets: () => list('/budgets/'),
    createBudget: (data: unknown) => post('/budgets/', data),
    updateBudget: (id: string, data: unknown) => patch('/budgets/', id, data),
    deleteBudget: (id: string) => del('/budgets/', id),

    // ── Receipts ─────────────────────────────────────────────────────────────
    getReceipts: () => list('/receipts/'),
    createReceipt: (data: unknown) => post('/receipts/', data),
    updateReceipt: (id: string, data: unknown) => patch('/receipts/', id, data),
    deleteReceipt: (id: string) => del('/receipts/', id),
    postReceipt: (id: string) => action(`/receipts/${id}/post/`),
    reverseReceipt: (id: string) => action(`/receipts/${id}/reverse/`),

    // ── Payments ─────────────────────────────────────────────────────────────
    getPayments: () => list('/payments/'),
    createPayment: (data: unknown) => post('/payments/', data),
    updatePayment: (id: string, data: unknown) => patch('/payments/', id, data),
    deletePayment: (id: string) => del('/payments/', id),
    postPayment: (id: string) => action(`/payments/${id}/post/`),
    reversePayment: (id: string) => action(`/payments/${id}/reverse/`),

    // ── Journal Vouchers ──────────────────────────────────────────────────────
    getJournals: () => list('/journals/'),
    createJournal: (data: unknown) => post('/journals/', data),
    updateJournal: (id: string, data: unknown) => patch('/journals/', id, data),
    deleteJournal: (id: string) => del('/journals/', id),
    postJournal: (id: string) => action(`/journals/${id}/post/`),
    reverseJournal: (id: string) => action(`/journals/${id}/reverse/`),

    // ── Contra Vouchers ───────────────────────────────────────────────────────
    getContraVouchers: () => list('/contra/'),
    createContraVoucher: (data: unknown) => post('/contra/', data),
    updateContraVoucher: (id: string, data: unknown) => patch('/contra/', id, data),
    deleteContraVoucher: (id: string) => del('/contra/', id),
    postContraVoucher: (id: string) => action(`/contra/${id}/post/`),

    // ── AP Invoices ───────────────────────────────────────────────────────────
    getAPInvoices: () => list('/ap-invoices/'),
    createAPInvoice: (data: unknown) => post('/ap-invoices/', data),
    updateAPInvoice: (id: string, data: unknown) => patch('/ap-invoices/', id, data),
    deleteAPInvoice: (id: string) => del('/ap-invoices/', id),
    postAPInvoice: (id: string) => action(`/ap-invoices/${id}/post/`),
    getAPAllocations: () => list('/ap-allocations/'),
    createAPAllocation: (data: unknown) => post('/ap-allocations/', data),

    // ── GL Entries ────────────────────────────────────────────────────────────
    getGLEntries: () => list('/gl/entries/'),

    // ── Reports ───────────────────────────────────────────────────────────────
    getGeneralLedger: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return get<unknown>(`/reports/general-ledger/${qs}`);
    },
    getTrialBalance: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return get<unknown>(`/reports/trial-balance/${qs}`);
    },
    getCashFlow: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return get<unknown>(`/reports/cash-flow/${qs}`);
    },
};
