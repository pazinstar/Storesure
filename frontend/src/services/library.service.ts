import { apiConfig, delay, SIMULATE_DELAY } from "./config";
import {
    LibraryBorrower,
    ClassStudent,
    BulkIssueTextbook,
    BulkIssueRecord,
    LibraryBranch,
    BranchTransfer,
    MOCK_LIBRARY_BORROWERS,
    MOCK_CLASS_STUDENTS,
    MOCK_BULK_TEXTBOOKS,
    MOCK_RECENT_BULK_ISSUES,
    MOCK_LIBRARY_BRANCHES,
    MOCK_PENDING_TRANSFERS,
    MOCK_COMPLETED_TRANSFERS,
} from "../mock/data";
import type {
    BookTitle, BookCopy, LoanTransaction, LibraryReceipt,
} from "../contexts/LibraryContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { apiFetch } from "@/contexts/AuthContext";

const BASE = () => `${apiConfig.baseUrl}/librarian/library`;

async function handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text || `Request failed: ${res.status}`);
    }
    // 204 No Content
    if (res.status === 204) return undefined as unknown as T;
    return res.json();
}

// ─── Field mappers (snake_case → camelCase) ────────────────────────────────

function toBookTitle(raw: any): BookTitle {
    return {
        id: raw.id,
        title: raw.title,
        author: raw.author,
        category: raw.category,
        isbn: raw.isbn ?? undefined,
        publisher: raw.publisher ?? undefined,
        subject: raw.subject ?? undefined,
        year: raw.year ?? undefined,
    };
}

function toBookCopy(raw: any): BookCopy {
    return {
        id: raw.id,
        accessionNo: raw.accession_no,
        titleId: raw.title_id ?? "",
        title: raw.book_title,
        author: raw.author,
        category: raw.category,
        isbn: raw.isbn ?? undefined,
        status: raw.status,
        location: raw.location,
        receivedDate: new Date(raw.received_date),
        receiptId: raw.receipt_id ?? "",
        statusRemarks: raw.status_remarks ?? undefined,
        currentBorrowerId: raw.current_borrower_id ?? undefined,
        currentBorrowerName: raw.current_borrower_name ?? undefined,
        currentBorrowerType: raw.current_borrower_type ?? undefined,
        currentBorrowerClass: raw.current_borrower_class ?? undefined,
        issueDate: raw.issue_date ? new Date(raw.issue_date) : undefined,
        dueDate: raw.due_date ? new Date(raw.due_date) : undefined,
    };
}

function toLoan(raw: any): LoanTransaction {
    return {
        id: raw.id,
        transactionNo: raw.transaction_no,
        accessionNo: raw.accession_no,
        bookTitle: raw.book_title,
        bookAuthor: raw.book_author,
        bookCategory: raw.book_category,
        borrowerId: raw.borrower_id,
        borrowerName: raw.borrower_name,
        borrowerType: raw.borrower_type,
        borrowerClass: raw.borrower_class ?? undefined,
        issueDate: new Date(raw.issue_date),
        dueDate: new Date(raw.due_date),
        returnDate: raw.return_date ? new Date(raw.return_date) : undefined,
        returnCondition: raw.return_condition ?? undefined,
        lateDays: raw.late_days ?? 0,
        status: raw.status,
        notes: raw.notes ?? undefined,
    };
}

function toReceipt(raw: any): LibraryReceipt {
    return {
        id: raw.id,
        receiptNo: raw.receipt_no,
        sourceType: raw.source_type,
        sourceName: raw.source_name,
        reference: raw.reference ?? "",
        dateReceived: new Date(raw.date_received),
        libraryBranch: raw.library_branch,
        items: (raw.items ?? []).map((item: any) => ({
            id: String(item.id),
            title: item.title,
            author: item.author,
            category: item.category,
            isbn: item.isbn ?? undefined,
            quantityReceived: item.quantity_received,
            accessionNumbers: item.accession_numbers ?? [],
        })),
        signedBy: raw.signed_by,
        signedAt: new Date(raw.signed_at),
        notes: raw.notes ?? undefined,
    };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const libraryService = {

    // ── Book Titles ────────────────────────────────────────────────────────────

    async getBookTitles(): Promise<BookTitle[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return []; }
        const data = await handle<any>(await apiFetch(`${BASE()}/titles/`));
        return (data.results ?? data).map(toBookTitle);
    },

    async createBookTitle(payload: Omit<BookTitle, "id">): Promise<BookTitle> {
        const raw = await handle<any>(await apiFetch(`${BASE()}/titles/`, {
            method: "POST", body: JSON.stringify(payload),
        }));
        return toBookTitle(raw);
    },

    async updateBookTitle(id: string, payload: Partial<Omit<BookTitle, "id">>): Promise<BookTitle> {
        const raw = await handle<any>(await apiFetch(`${BASE()}/titles/${id}/`, {
            method: "PATCH", body: JSON.stringify(payload),
        }));
        return toBookTitle(raw);
    },

    async deleteBookTitle(id: string): Promise<void> {
        await handle<void>(await apiFetch(`${BASE()}/titles/${id}/`, { method: "DELETE" }));
    },

    // ── Book Copies ────────────────────────────────────────────────────────────

    async getBookCopies(): Promise<BookCopy[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return []; }
        const data = await handle<any>(await apiFetch(`${BASE()}/copies/`));
        return (data.results ?? data).map(toBookCopy);
    },

    async createBookCopy(payload: {
        accession_no: string; title_id?: string; book_title: string;
        author: string; category: string; isbn?: string;
        location: string; received_date: string; receipt_id?: string;
    }): Promise<BookCopy> {
        const raw = await handle<any>(await apiFetch(`${BASE()}/copies/`, {
            method: "POST", body: JSON.stringify(payload),
        }));
        return toBookCopy(raw);
    },

    async updateBookCopyStatus(id: string, status: string, remarks?: string): Promise<BookCopy> {
        const raw = await handle<any>(await apiFetch(`${BASE()}/copies/${id}/status/`, {
            method: "PATCH",
            body: JSON.stringify({ status, status_remarks: remarks ?? "" }),
        }));
        return toBookCopy(raw);
    },

    async deleteBookCopy(id: string): Promise<void> {
        await handle<void>(await apiFetch(`${BASE()}/copies/${id}/`, { method: "DELETE" }));
    },

    // ── Loans ──────────────────────────────────────────────────────────────────

    async getLoans(): Promise<LoanTransaction[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return []; }
        const data = await handle<any>(await apiFetch(`${BASE()}/loans/`));
        return (data.results ?? data).map(toLoan);
    },

    async issueBook(payload: {
        accession_no: string;
        borrower_id: string;
        borrower_name: string;
        borrower_type: string;
        borrower_class?: string;
        issue_date: string;
        due_date: string;
    }): Promise<{ transaction: LoanTransaction; copy: BookCopy }> {
        const raw = await handle<any>(await apiFetch(`${BASE()}/loans/issue/`, {
            method: "POST", body: JSON.stringify(payload),
        }));
        return { transaction: toLoan(raw.transaction), copy: toBookCopy(raw.copy) };
    },

    async returnBook(id: string, payload: {
        return_condition: string;
        notes?: string;
    }): Promise<LoanTransaction> {
        const raw = await handle<any>(await apiFetch(`${BASE()}/loans/${id}/return/`, {
            method: "PATCH", body: JSON.stringify(payload),
        }));
        return toLoan(raw);
    },

    // ── Receipts ───────────────────────────────────────────────────────────────

    async getReceipts(): Promise<LibraryReceipt[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return []; }
        const data = await handle<any>(await apiFetch(`${BASE()}/receipts/`));
        return (data.results ?? data).map(toReceipt);
    },

    async createReceipt(payload: any): Promise<LibraryReceipt> {
        const raw = await handle<any>(await apiFetch(`${BASE()}/receipts/`, {
            method: "POST", body: JSON.stringify(payload),
        }));
        return toReceipt(raw);
    },

    async getReceiptById(id: string): Promise<LibraryReceipt> {
        const raw = await handle<any>(await apiFetch(`${BASE()}/receipts/${id}/`));
        return toReceipt(raw);
    },

    // ── Accession numbers ──────────────────────────────────────────────────────

    async getNextAccession(): Promise<string> {
        if (apiConfig.useMockData) {
            const year = new Date().getFullYear();
            return `ACC/${year}/0001`;
        }
        const data = await handle<any>(await apiFetch(`${BASE()}/accession/next/`));
        return data.next;
    },

    async generateAccessions(count: number): Promise<string[]> {
        if (apiConfig.useMockData) {
            const year = new Date().getFullYear();
            return Array.from({ length: count }, (_, i) => `ACC/${year}/${String(i + 1).padStart(4, "0")}`);
        }
        const data = await handle<any>(await apiFetch(`${BASE()}/accession/generate/`, {
            method: "POST", body: JSON.stringify({ count }),
        }));
        return data.accession_numbers;
    },

    // ── Legacy mock-only methods (used by BulkIssue, BranchTransfers) ──────────

    async getBorrowers(): Promise<LibraryBorrower[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return [...MOCK_LIBRARY_BORROWERS]; }
        const data = await handle<any>(await apiFetch(`${BASE()}/borrowers/`));
        return data.results ?? data;
    },

    async getClassStudents(className: string): Promise<ClassStudent[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return [...MOCK_CLASS_STUDENTS]; }
        const data = await handle<any>(await apiFetch(`${BASE()}/students/${className}/`));
        return data.results ?? data;
    },

    async getBulkIssueTextbooks(): Promise<BulkIssueTextbook[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return [...MOCK_BULK_TEXTBOOKS]; }
        const data = await handle<any>(await apiFetch(`${BASE()}/bulk-issue/textbooks/`));
        return data.results ?? data;
    },

    async getRecentBulkIssues(): Promise<BulkIssueRecord[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return [...MOCK_RECENT_BULK_ISSUES]; }
        const data = await handle<any>(await apiFetch(`${BASE()}/bulk-issue/recent/`));
        return data.results ?? data;
    },

    async getLibraryBranches(): Promise<LibraryBranch[]> {
        if (apiConfig.useMockData) { await delay(SIMULATE_DELAY); return [...MOCK_LIBRARY_BRANCHES]; }
        const data = await handle<any>(await apiFetch(`${BASE()}/branches/`));
        return data.results ?? data;
    },

    async getBranchTransfers(): Promise<BranchTransfer[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_PENDING_TRANSFERS, ...MOCK_COMPLETED_TRANSFERS];
        }
        const data = await handle<any>(await apiFetch(`${BASE()}/transfers/`));
        return data.results ?? data;
    },
};
