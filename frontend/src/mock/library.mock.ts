import { BookStatus, SourceType, BorrowerType, BookCopy, LibraryReceipt, LibraryReceiptItem, BookTitle, LoanTransaction } from "../contexts/LibraryContext";

export interface LibraryBorrower {
    id: string;
    name: string;
    type: string;
    class: string;
}

export interface ClassStudent {
    admNo: string;
    name: string;
    gender: string;
    hasBook: boolean;
}

export interface BulkIssueTextbook {
    id: string;
    title: string;
    available: number;
    required: number;
}

export interface BulkIssueRecord {
    id: string;
    class: string;
    book: string;
    copies: number;
    date: string;
    issuedBy: string;
}

export interface LibraryBranch {
    id: string;
    name: string;
    titles: number;
    copies: number;
}

export interface BranchTransfer {
    id: string;
    from: string;
    to: string;
    items: number;
    title: string;
    requestDate: string;
    status: string;
    requestedBy: string;
    completedDate?: string;
}

export const MOCK_LIBRARY_BORROWERS: LibraryBorrower[] = [
    { id: "2024/001", name: "John Kamau", type: "Student", class: "Form 3A" },
    { id: "2024/045", name: "Mary Wanjiku", type: "Student", class: "Form 4B" },
    { id: "2024/089", name: "Peter Ochieng", type: "Student", class: "Form 2C" },
    { id: "2024/112", name: "Grace Akinyi", type: "Student", class: "Form 1A" },
    { id: "2024/067", name: "James Mwangi", type: "Student", class: "Form 4A" },
    { id: "STF/001", name: "Mr. David Omondi", type: "Staff", class: "Mathematics Dept" },
    { id: "STF/002", name: "Mrs. Jane Wambui", type: "Staff", class: "Science Dept" },
];

export const MOCK_CLASS_STUDENTS: ClassStudent[] = [
    { admNo: "2024/001", name: "John Kamau", gender: "M", hasBook: false },
    { admNo: "2024/002", name: "Mary Wanjiku", gender: "F", hasBook: true },
    { admNo: "2024/003", name: "Peter Ochieng", gender: "M", hasBook: false },
    { admNo: "2024/004", name: "Grace Akinyi", gender: "F", hasBook: false },
    { admNo: "2024/005", name: "James Mwangi", gender: "M", hasBook: true },
    { admNo: "2024/006", name: "Faith Njeri", gender: "F", hasBook: false },
    { admNo: "2024/007", name: "David Kipchoge", gender: "M", hasBook: false },
    { admNo: "2024/008", name: "Sarah Wambui", gender: "F", hasBook: false },
];

export const MOCK_BULK_TEXTBOOKS: BulkIssueTextbook[] = [
    { id: "ISBN-001", title: "Mathematics Form 3", available: 85, required: 35 },
    { id: "ISBN-002", title: "Biology for Secondary Schools", available: 72, required: 35 },
    { id: "ISBN-004", title: "Kiswahili Fasihi", available: 98, required: 35 },
    { id: "ISBN-005", title: "Physics Practical Guide", available: 38, required: 35 },
];

export const MOCK_RECENT_BULK_ISSUES: BulkIssueRecord[] = [
    { id: "BULK-001", class: "Form 2A", book: "English Grammar", copies: 35, date: "2024-11-25", issuedBy: "Mrs. Omondi" },
    { id: "BULK-002", class: "Form 4B", book: "Chemistry Notes", copies: 32, date: "2024-11-20", issuedBy: "Mr. Karanja" },
];

export const MOCK_LIBRARY_BRANCHES: LibraryBranch[] = [
    { id: "main", name: "Main Library", titles: 2890, copies: 12450 },
    { id: "science", name: "Science Wing", titles: 856, copies: 3200 },
    { id: "junior", name: "Junior Section", titles: 510, copies: 2782 },
];

export const MOCK_PENDING_TRANSFERS: BranchTransfer[] = [
    { id: "TRF-001", from: "Main Library", to: "Science Wing", items: 25, title: "Physics Practical Guide", requestDate: "2024-11-28", status: "Pending Approval", requestedBy: "Mrs. Omondi" },
    { id: "TRF-002", from: "Junior Section", to: "Main Library", items: 15, title: "English Grammar", requestDate: "2024-11-27", status: "In Transit", requestedBy: "Mr. Karanja" },
];

export const MOCK_COMPLETED_TRANSFERS: BranchTransfer[] = [
    { id: "TRF-003", from: "Main Library", to: "Junior Section", items: 30, title: "Mathematics Form 1", requestDate: "2024-11-20", completedDate: "2024-11-22", status: "Completed", requestedBy: "Mrs. Njeri" },
    { id: "TRF-004", from: "Science Wing", to: "Main Library", items: 10, title: "Chemistry Notes", requestDate: "2024-11-15", completedDate: "2024-11-17", status: "Completed", requestedBy: "Mr. Ochieng" },
];
