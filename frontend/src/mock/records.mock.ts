export type RecordCategory = "Financial" | "Procurement" | "Personnel" | "Academic" | "Correspondence" | "Legal" | "Administrative";
export type RecordStatus = "Active" | "Due_for_Appraisal" | "Pending_Disposal" | "Disposed" | "Archived";
export type AppraisalDecision = "Retain" | "Dispose" | "Archive" | "Extend";

export type FileStatus = "Checked Out" | "Returned" | "Overdue" | "Lost";
export type FileCategory = "Procurement" | "Stores" | "Assets" | "Library" | "Finance" | "Administration" | "Personnel";

export interface FileMovement {
    id: string;
    fileReference: string;
    fileTitle: string;
    category: FileCategory;
    location: string;
    borrowedBy: string;
    borrowerDepartment: string;
    borrowDate: string;
    expectedReturnDate: string;
    actualReturnDate?: string;
    purpose: string;
    status: FileStatus;
    borrowerSignature: boolean;
    returnSignature: boolean;
    notes?: string;
}

export const MAX_BORROW_DAYS = 4;

export const MOCK_FILE_MOVEMENTS_SETTINGS = {
    categories: [
        "Procurement",
        "Stores",
        "Assets",
        "Library",
        "Finance",
        "Administration",
        "Personnel",
    ] as FileCategory[],
    departments: [
        "Administration",
        "Finance",
        "Procurement",
        "ICT",
        "Human Resources",
        "Stores",
        "Library",
        "Maintenance",
        "Academic",
    ],
    locations: [
        "Main Registry",
        "Procurement Office",
        "Finance Office",
        "Stores Office",
        "Library",
        "Principal's Office",
        "Deputy Principal's Office",
        "Accounts Office",
        "Records Room",
    ]
};

export const MOCK_FILE_MOVEMENTS: FileMovement[] = [];

export interface RetentionRecord {
    id: string;
    recordCode: string;
    title: string;
    category: RecordCategory;
    description: string;
    creationDate: string;
    retentionYears: number;
    expiryDate: string;
    status: RecordStatus;
    location: string;
    custodian: string;
    lastReviewDate?: string;
    nextReviewDate?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AppraisalWorkflow {
    id: string;
    recordId: string;
    recordCode: string;
    recordTitle: string;
    initiatedBy: string;
    initiatedDate: string;
    appraisalDate?: string;
    appraisedBy?: string;
    decision?: AppraisalDecision;
    justification?: string;
    authorizedBy?: string;
    authorizationDate?: string;
    status: "Pending" | "Appraised" | "Authorized" | "Completed" | "Rejected";
    comments?: string;
}

export interface DisposalRecord {
    id: string;
    recordId: string;
    recordCode: string;
    recordTitle: string;
    appraisalId: string;
    disposalMethod: "Shredding" | "Burning" | "Digital_Deletion" | "Transfer_to_Archives";
    disposalDate: string;
    disposedBy: string;
    witnessedBy: string;
    authorizationReference: string;
    certificateNumber: string;
    notes?: string;
}

export const MOCK_RETENTION_RECORDS: RetentionRecord[] = [
    {
        id: "REC001", recordCode: "FIN/24/0001", title: "FY2023 Financial Reports", category: "Financial", description: "Annual financial statements and audit reports", creationDate: "2023-12-31", retentionYears: 7, expiryDate: "2030-12-31", location: "Cabinet F1", custodian: "Bursar", status: "Active", createdAt: "2023-12-31T10:00:00Z", updatedAt: "2023-12-31T10:00:00Z"
    },
    {
        id: "REC002", recordCode: "PROC/20/0045", title: "LPO Book 2020", category: "Procurement", description: "Completed LPO copies", creationDate: "2020-01-01", retentionYears: 5, expiryDate: "2025-01-01", location: "Cabinet P3", custodian: "Procurement Officer", status: "Active", createdAt: "2020-01-01T09:00:00Z", updatedAt: "2020-01-01T09:00:00Z"
    }
];

export const MOCK_APPRAISALS: AppraisalWorkflow[] = [];
export const MOCK_DISPOSALS: DisposalRecord[] = [];
