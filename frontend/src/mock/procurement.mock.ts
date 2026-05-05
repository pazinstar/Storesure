import { AssetType, S12Status, S12Item, S12Requisition } from "./inventory.mock";
export type { AssetType };

export type ProcurementCategory = "Works" | "Services" | "Supplies";
export type SupplierStatus = "Active" | "Inactive" | "Blacklisted";

export interface Supplier {
    id: string;
    name: string;
    tradingName?: string;
    taxPin: string;
    registrationNumber?: string;
    category: ProcurementCategory[];
    contactPerson: string;
    phone: string;
    email: string;
    physicalAddress: string;
    postalAddress?: string;
    county: string;
    bankName?: string;
    bankBranch?: string;
    bankAccountNumber?: string;
    status: SupplierStatus;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    rating?: number;
    paymentTerms?: string;
}

export interface LPOItem {
    id: string;
    description: string;
    unit: string;
    assetType: AssetType;
    quantity: number;
    unitPrice: number;
    deliveredQty: number;
}

export type LPOStatus = "Draft" | "Pending Approval" | "Approved" | "Sent to Supplier" | "Partially Delivered" | "Fully Delivered" | "Cancelled";
export type PaymentStatus = "Pending" | "Processing" | "Paid";
export type PurchaseRequisitionStatus = "draft" | "pending_approval" | "approved" | "processed" | "rejected";

export interface PurchaseRequisition {
    id: string;
    date: string;
    department: string;
    requestedBy: string;
    items: number;
    estimatedValue: string;
    status: PurchaseRequisitionStatus;
    priority: string;
    title?: string;
    justification?: string;
    budgetCode?: string;
    approvedBy?: string;
    approvedDate?: string;
    processedBy?: string;
    processedDate?: string;
    rejectionReason?: string;
}

export interface LPO {
    id: string;
    lpoNumber: string;
    date: string;
    supplierId: string;
    supplierName: string;
    supplierAddress: string;
    supplierPhone: string;
    supplierEmail: string;
    supplierTaxPin: string;
    storeLocation: string;
    items: LPOItem[];
    totalValue: number;
    status: LPOStatus;
    paymentStatus: PaymentStatus;
    paymentTerms: string;
    expectedDeliveryDate: string;
    requisitionRef?: string;
    notes?: string;
    preparedBy: string;
    preparedAt: string;
    approvedBy?: string;
    approvedAt?: string;
    linkedGRNs: string[];
    createdAt: string;
    updatedAt: string;
}

export type DeliveryStatus = "Awaiting Inspection" | "Under Inspection" | "Accepted" | "Partially Accepted" | "Rejected";
export type InspectionDecision = "accept_all" | "partial_accept" | "reject_all";

export interface InspectionItem {
    itemId: string;
    description: string;
    unit: string;
    qtyOrdered: number;
    qtyDelivered: number;
    qtyAccepted: number;
    qtyRejected: number;
    unitPrice: number;
    remarks: string;
}

export interface CommitteeSignature {
    memberId: string;
    memberName: string;
    memberRole: string;
    signed: boolean;
    signedAt?: string;
    confirmed: boolean;
}

export interface DeliveryRecord {
    id: string;
    deliveryId: string;
    dateTime: string;
    supplierName: string;
    supplierId?: string;
    lpoId?: string;
    lpoReference: string;
    deliveryPerson: string;
    vehicleNumber: string;
    deliveryNote: string;
    packages: string;
    condition: string;
    receivedBy: string;
    receivedAt: string;
    storageLocation: string;
    status: DeliveryStatus;
    remarks?: string;
    items: InspectionItem[];
    overallRemarks?: string;
    decision?: InspectionDecision;
    signatures: CommitteeSignature[];
    inspectionCompletedAt?: string;
    grnGenerated?: boolean;
    grnId?: string;
    createdAt: string;
    updatedAt: string;
}


export const MOCK_REQUISITIONS: S12Requisition[] = [
    {
        id: "RQ001", s12Number: "S12-2024-001", requestDate: "2024-01-20", requestingDepartment: "Science Department", requestedBy: "Mr. Kamau", purpose: "Annual Lab Restock", status: "Pending Approval",
        items: [{ id: "RQI001", itemCode: "ITM005", description: "Beakers 500ml", unit: "Pcs", quantityRequested: 50, quantityApproved: 0, quantityIssued: 0, unitPrice: 200 }],
        receiverSignature: false, issuerSignature: false, createdAt: "2024-01-20T10:00:00Z", updatedAt: "2024-01-20T10:00:00Z"
    },
    {
        id: "RQ002", s12Number: "S12-2024-002", requestDate: "2024-01-22", requestingDepartment: "Administration", requestedBy: "Ms. Wanjiku", purpose: "Office Stationery", status: "Approved",
        items: [{ id: "RQI002", itemCode: "ITM001", description: "A4 Paper", unit: "Reams", quantityRequested: 20, quantityApproved: 20, quantityIssued: 0, unitPrice: 500 }],
        approvedBy: "Mrs. Omondi", approvalDate: "2024-01-23", receiverSignature: false, issuerSignature: false, createdAt: "2024-01-22T09:00:00Z", updatedAt: "2024-01-23T11:00:00Z"
    }
];

export const MOCK_PURCHASE_REQUISITIONS: PurchaseRequisition[] = [
    { id: "REQ-2024-089", date: "2024-12-01", department: "Science Dept", requestedBy: "John Kamau", items: 5, estimatedValue: "KES 245,000", status: "pending_approval", priority: "high", title: "Laboratory Equipment", justification: "Required for Form 4 Chemistry practicals" },
    { id: "REQ-2024-088", date: "2024-11-28", department: "Administration", requestedBy: "Mary Wanjiku", items: 12, estimatedValue: "KES 45,800", status: "approved", priority: "medium", title: "Office Supplies", justification: "Quarterly office supplies replenishment", approvedBy: "Headteacher", approvedDate: "2024-11-29" },
    { id: "REQ-2024-087", date: "2024-11-25", department: "PE Department", requestedBy: "Peter Ochieng", items: 8, estimatedValue: "KES 89,500", status: "draft", priority: "low", title: "Sports Equipment", justification: "For inter-school competitions" },
    { id: "REQ-2024-086", date: "2024-11-22", department: "Library", requestedBy: "Grace Akinyi", items: 25, estimatedValue: "KES 156,000", status: "processed", priority: "medium", title: "Textbooks", justification: "New curriculum textbooks", approvedBy: "Headteacher", approvedDate: "2024-11-23", processedBy: "Storekeeper", processedDate: "2024-11-25" },
    { id: "REQ-2024-085", date: "2024-11-20", department: "ICT Department", requestedBy: "David Mwangi", items: 3, estimatedValue: "KES 520,000", status: "pending_approval", priority: "high", title: "Computer Equipment", justification: "Replacement of outdated lab computers" },
    { id: "REQ-2024-084", date: "2024-11-18", department: "Home Science", requestedBy: "Sarah Njeri", items: 15, estimatedValue: "KES 78,200", status: "rejected", priority: "low", title: "Kitchen Equipment", justification: "For practical lessons", rejectionReason: "Budget allocation exceeded for this quarter" },
];

export const MOCK_LPOS: LPO[] = [
    {
        id: "LPO001", lpoNumber: "LPO-2024-001", date: "2024-01-25", supplierId: "SUP001", supplierName: "Kenya Office Supplies Ltd", supplierAddress: "Industrial Area, Nairobi", supplierPhone: "+254 711 223344", supplierEmail: "sales@kenyaofficesupplies.com", supplierTaxPin: "P051123456A", storeLocation: "Main Store",
        items: [{ id: "LPOI001", description: "A4 Paper Reams", unit: "Ream", assetType: "Consumable", quantity: 100, unitPrice: 500, deliveredQty: 0 }],
        totalValue: 50000, status: "Sent to Supplier", paymentStatus: "Pending", paymentTerms: "Net 30 Days", expectedDeliveryDate: "2024-02-01", preparedBy: "Peter Ochieng", preparedAt: "2024-01-25T10:00:00Z", approvedBy: "Dr. Jane Mwangi", approvedAt: "2024-01-25T14:00:00Z", linkedGRNs: [], createdAt: "2024-01-25T10:00:00Z", updatedAt: "2024-01-25T14:00:00Z"
    }
];

export const MOCK_DELIVERIES: DeliveryRecord[] = [
    {
        id: "del-1",
        deliveryId: "DEL/2025/089",
        dateTime: "2025-01-26T09:15",
        supplierName: "Kenya Office Supplies Ltd",
        lpoReference: "LPO-2025-0001",
        lpoId: "demo-1",
        deliveryPerson: "John Kamau (Driver)",
        vehicleNumber: "KCA 123X",
        deliveryNote: "DN-2025-789",
        packages: "5 boxes",
        condition: "Sealed, intact",
        receivedBy: "Mary Wanjiru",
        receivedAt: "2025-01-26T09:15:00Z",
        storageLocation: "Receiving Area A",
        status: "Accepted",
        items: [
            { itemId: "item-1", description: "A4 Printing Paper (Ream)", unit: "Ream", qtyOrdered: 100, qtyDelivered: 100, qtyAccepted: 100, qtyRejected: 0, unitPrice: 450, remarks: "" },
            { itemId: "item-2", description: "Box Files - Blue", unit: "Pcs", qtyOrdered: 50, qtyDelivered: 50, qtyAccepted: 50, qtyRejected: 0, unitPrice: 150, remarks: "" },
            { itemId: "item-3", description: "Stapler Heavy Duty", unit: "Pcs", qtyOrdered: 10, qtyDelivered: 10, qtyAccepted: 10, qtyRejected: 0, unitPrice: 800, remarks: "" },
        ],
        overallRemarks: "All items in good condition",
        decision: "accept_all",
        signatures: [
            { memberId: "user-1", memberName: "Mary Wanjiru", memberRole: "Storekeeper", signed: true, signedAt: "2025-01-26T10:00:00Z", confirmed: true },
            { memberId: "user-2", memberName: "James Ochieng", memberRole: "Bursar", signed: true, signedAt: "2025-01-26T10:30:00Z", confirmed: true },
            { memberId: "user-3", memberName: "Principal Omondi", memberRole: "Headteacher", signed: true, signedAt: "2025-01-26T11:00:00Z", confirmed: true },
        ],
        inspectionCompletedAt: "2025-01-26T11:00:00Z",
        grnGenerated: true,
        grnId: "S11-2025-001",
        createdAt: "2025-01-26T09:15:00Z",
        updatedAt: "2025-01-26T11:00:00Z"
    },
    {
        id: "del-2",
        deliveryId: "DEL/2025/090",
        dateTime: "2025-01-25T14:30",
        supplierName: "Lab Equipment Kenya",
        lpoReference: "LPO-2025-0002",
        lpoId: "demo-2",
        deliveryPerson: "Peter Ochieng (Driver)",
        vehicleNumber: "KBZ 456Y",
        deliveryNote: "DN-2025-790",
        packages: "3 cartons",
        condition: "Good condition",
        receivedBy: "James Mwangi",
        receivedAt: "2025-01-25T14:30:00Z",
        storageLocation: "Receiving Area B",
        status: "Under Inspection",
        items: [
            { itemId: "item-4", description: "Microscope - Student Grade", unit: "Pcs", qtyOrdered: 10, qtyDelivered: 6, qtyAccepted: 0, qtyRejected: 0, unitPrice: 8500, remarks: "" },
            { itemId: "item-5", description: "Test Tubes (Pack of 50)", unit: "Pack", qtyOrdered: 20, qtyDelivered: 20, qtyAccepted: 0, qtyRejected: 0, unitPrice: 2500, remarks: "" },
        ],
        overallRemarks: "",
        decision: undefined,
        signatures: [
            { memberId: "user-1", memberName: "James Mwangi", memberRole: "Storekeeper", signed: true, signedAt: "2025-01-25T15:00:00Z", confirmed: true },
            { memberId: "user-2", memberName: "Jane Wanjiku", memberRole: "Bursar", signed: false, signedAt: undefined, confirmed: false },
            { memberId: "user-3", memberName: "Principal Omondi", memberRole: "Headteacher", signed: false, signedAt: undefined, confirmed: false },
        ],
        createdAt: "2025-01-25T14:30:00Z",
        updatedAt: "2025-01-25T15:00:00Z"
    },
    {
        id: "del-3",
        deliveryId: "DEL/2025/091",
        dateTime: "2025-01-26T11:00",
        supplierName: "Sports Gear Africa",
        lpoReference: "LPO-2025-0003",
        lpoId: "demo-3",
        deliveryPerson: "Samuel Njoroge (Courier)",
        vehicleNumber: "KDG 789Z",
        deliveryNote: "DN-2025-791",
        packages: "8 bags",
        condition: "Sealed, intact",
        receivedBy: "Mary Wanjiru",
        receivedAt: "2025-01-26T11:00:00Z",
        storageLocation: "Loading Bay",
        status: "Awaiting Inspection",
        items: [
            { itemId: "item-6", description: "Football Size 5", unit: "Pcs", qtyOrdered: 20, qtyDelivered: 20, qtyAccepted: 0, qtyRejected: 0, unitPrice: 1500, remarks: "" },
            { itemId: "item-7", description: "Volleyball Net", unit: "Pcs", qtyOrdered: 4, qtyDelivered: 4, qtyAccepted: 0, qtyRejected: 0, unitPrice: 3500, remarks: "" },
            { itemId: "item-8", description: "Badminton Rackets (Pair)", unit: "Pair", qtyOrdered: 10, qtyDelivered: 10, qtyAccepted: 0, qtyRejected: 0, unitPrice: 2000, remarks: "" },
        ],
        overallRemarks: "",
        decision: undefined,
        signatures: [
            { memberId: "", memberName: "", memberRole: "Storekeeper", signed: false, signedAt: undefined, confirmed: false },
            { memberId: "", memberName: "", memberRole: "Bursar", signed: false, signedAt: undefined, confirmed: false },
            { memberId: "", memberName: "", memberRole: "Headteacher", signed: false, signedAt: undefined, confirmed: false },
        ],
        createdAt: "2025-01-26T11:00:00Z",
        updatedAt: "2025-01-26T11:00:00Z"
    },
    {
        id: "del-4",
        deliveryId: "DEL/2025/092",
        dateTime: "2025-01-24T10:00",
        supplierName: "TechWorld Kenya",
        lpoReference: "LPO-2025-0004",
        lpoId: "demo-4",
        deliveryPerson: "David Mutua (Driver)",
        vehicleNumber: "KAB 222M",
        deliveryNote: "DN-2025-792",
        packages: "2 boxes",
        condition: "Sealed, intact",
        receivedBy: "Mary Wanjiru",
        receivedAt: "2025-01-24T10:00:00Z",
        storageLocation: "Receiving Area A",
        status: "Awaiting Inspection",
        items: [
            { itemId: "item-9", description: "USB Flash Drive 32GB", unit: "Pcs", qtyOrdered: 50, qtyDelivered: 50, qtyAccepted: 0, qtyRejected: 0, unitPrice: 650, remarks: "" },
            { itemId: "item-10", description: "HDMI Cable 2m", unit: "Pcs", qtyOrdered: 20, qtyDelivered: 20, qtyAccepted: 0, qtyRejected: 0, unitPrice: 450, remarks: "" },
        ],
        overallRemarks: "",
        decision: undefined,
        signatures: [
            { memberId: "", memberName: "", memberRole: "Storekeeper", signed: false, signedAt: undefined, confirmed: false },
            { memberId: "", memberName: "", memberRole: "Bursar", signed: false, signedAt: undefined, confirmed: false },
            { memberId: "", memberName: "", memberRole: "Headteacher", signed: false, signedAt: undefined, confirmed: false },
        ],
        createdAt: "2025-01-24T10:00:00Z",
        updatedAt: "2025-01-24T10:00:00Z"
    },
];

// Re-added mock dashboard and reporting interfaces & data correctly

export interface ProcurementDashboardData {
    kpis: any[];
    monthlyProcurement: any[];
    workflowStatus: any[];
    pendingApprovals: any[];
}
export interface Tender { id: string;[key: string]: any; }
export interface Quotation { id: string;[key: string]: any; }
export interface ProcurementReportMonthlySpend { [key: string]: any; }
export interface ProcurementCategoryBreakdown { [key: string]: any; }
export interface VendorPerformance { [key: string]: any; }
export interface StandardReport { [key: string]: any; }

export type ProcurementType = "Works" | "Services" | "Supplies";
export interface ProcurementReference {
    id: string;
    referenceNumber: string;
    entityCode: string;
    procurementType: ProcurementType;
    budgetYear: string;
    serialNumber: number;
    description: string;
    department: string;
    requestedBy: string;
    issuedDate: string;
    status: "Active" | "Cancelled" | "Completed";
}

export type ContractStatus = "Active" | "Completed" | "Terminated" | "On Hold" | "Expired";
export type ContractType = "Works" | "Services" | "Supplies";

export interface PaymentMilestone {
    id: string;
    description: string;
    amount: number;
    dueDate: string;
    paidDate?: string;
    status: "Pending" | "Paid" | "Overdue";
}

export interface Contract {
    id: string;
    contractNumber: string;
    contractName: string;
    contractType: ContractType;
    contractorName: string;
    contractorAddress: string;
    contractorContact: string;
    tenderReference: string;
    awardDate: string;
    commencementDate: string;
    completionDate: string;
    actualCompletionDate?: string;
    totalValue: number;
    accountCharged: string;
    paymentMilestones: PaymentMilestone[];
    performanceGuarantee?: string;
    guaranteeExpiry?: string;
    status: ContractStatus;
    remarks?: string;
    createdBy: string;
    createdAt: string;
}

export const MOCK_PROCUREMENT_KPIS: any[] = [
    { title: "Active Requisitions", value: "34", change: "8 pending approval", color: "text-blue-500", iconName: "FileText" },
    { title: "Pending POs", value: "12", change: "5 awaiting dispatch", color: "text-orange-500", iconName: "ClipboardList" },
    { title: "This Month Value", value: "KES 1.2M", change: "+18% from last month", color: "text-green-500", iconName: "ShoppingCart" },
    { title: "Compliance Score", value: "96%", change: "PPADA compliant", color: "text-purple-500", iconName: "CheckCircle" },
];

export const MOCK_MONTHLY_PROCUREMENT: any[] = [
    { month: "Jan", requisitions: 45, lpos: 30 },
    { month: "Feb", requisitions: 52, lpos: 38 },
    { month: "Mar", requisitions: 38, lpos: 25 },
    { month: "Apr", requisitions: 65, lpos: 42 },
    { month: "May", requisitions: 48, lpos: 35 },
    { month: "Jun", requisitions: 55, lpos: 40 },
];

export const MOCK_WORKFLOW_STATUS: any[] = [
    { name: "Draft", value: 15, color: "#94a3b8" },
    { name: "Pending Approval", value: 25, color: "#f59e0b" },
    { name: "Approved", value: 45, color: "#10b981" },
    { name: "Processed", value: 15, color: "#3b82f6" },
];

export const MOCK_PENDING_APPROVALS: any[] = [
    { id: "REQ-001", type: "Requisition", department: "Science", amount: "KES 45,000", date: "2024-03-15", status: "Urgent" },
    { id: "LPO-089", type: "LPO", department: "Admin", amount: "KES 120,000", date: "2024-03-14", status: "Normal" },
    { id: "REQ-002", type: "Requisition", department: "Sports", amount: "KES 850,000", date: "2024-03-12", status: "High" },
];

export const MOCK_TENDERS: Tender[] = [
    {
        id: "TND-2024-001",
        title: "Construction of New Science Lab",
        method: "open",
        category: "works",
        closingDate: "2024-04-15",
        budget: "KES 5,000,000",
        bids: 12,
        status: "evaluation",
        daysLeft: 0
    },
    {
        id: "TND-2024-002",
        title: "Supply of 50 Desktop Computers",
        method: "restricted",
        category: "goods",
        closingDate: "2024-03-25",
        budget: "KES 2,500,000",
        bids: 3,
        status: "open",
        daysLeft: 5
    }
];

export const MOCK_QUOTATIONS: Quotation[] = [
    {
        id: "RFQ-2024-101",
        title: "Printing of Term 1 Exams",
        vendor: "Elite Printers Ltd",
        submittedDate: "2024-03-10",
        value: "KES 150,000",
        validUntil: "2024-04-10",
        status: "pending_review"
    },
    {
        id: "RFQ-2024-102",
        title: "Maintenance of School Bus",
        vendor: "Auto Masters Garage",
        submittedDate: "2024-03-08",
        value: "KES 45,000",
        validUntil: "2024-04-08",
        status: "approved"
    }
];
export const MOCK_REPORTS_KPI = {
    totalValue: 9050000,
    utilization: 78.5,
    processingTime: 8.2,
    compliance: 96.8
};

export const MOCK_REPORTS_MONTHLY_SPEND: ProcurementReportMonthlySpend[] = [
    { month: "Jul", planned: 850000, actual: 820000 },
    { month: "Aug", planned: 900000, actual: 950000 },
    { month: "Sep", planned: 1100000, actual: 1050000 },
    { month: "Oct", planned: 950000, actual: 880000 },
    { month: "Nov", planned: 1200000, actual: 1350000 },
    { month: "Dec", planned: 800000, actual: 750000 },
];

export const MOCK_REPORTS_CATEGORY_BREAKDOWN: ProcurementCategoryBreakdown[] = [
    { name: "Stationery", value: 2500000, color: "#3b82f6" },
    { name: "Lab Equipment", value: 3200000, color: "#10b981" },
    { name: "Furniture", value: 1800000, color: "#f59e0b" },
    { name: "Sports Gear", value: 950000, color: "#8b5cf6" },
    { name: "IT Equipment", value: 1550000, color: "#ec4899" },
];

export const MOCK_REPORTS_VENDOR_PERFORMANCE: VendorPerformance[] = [
    { vendor: "Kenya Office Supplies Ltd", orders: 45, value: "KES 2.1M", onTime: 95, quality: 98 },
    { vendor: "TechWorld Kenya", orders: 28, value: "KES 3.5M", onTime: 88, quality: 95 },
    { vendor: "Furniture Masters Ltd", orders: 15, value: "KES 1.8M", onTime: 82, quality: 90 },
    { vendor: "Lab Equipment Kenya", orders: 12, value: "KES 1.2M", onTime: 92, quality: 96 },
];

export const MOCK_REPORTS_STANDARD: StandardReport[] = [
    { name: "PPADA Quarterly Report", description: "Mandatory quarterly procurement report for PPRA", format: "PDF", icon: "FileText" },
    { name: "Supplier Payment Aging", description: "Analysis of outstanding payments by timeline", format: "Excel", icon: "FileSpreadsheet" },
    { name: "Contract Award Register", description: "Register of all contracts awarded in the period", format: "PDF", icon: "ClipboardList" },
    { name: "Tender Evaluation Report", description: "Summary of tender proceedings and awards", format: "PDF", icon: "BarChart3" },
    { name: "Annual Procurement Plan", description: "Consolidated procurement plan for the fiscal year", format: "Excel", icon: "Calendar" },
    { name: "Market Price Index", description: "Current market rates for commonly procured items", format: "Excel", icon: "TrendingUp" },
];

export const MOCK_PROCUREMENT_REFERENCES: ProcurementReference[] = [];
export const MOCK_CONTRACTS: Contract[] = [];

export const MOCK_SUPPLIERS: Supplier[] = [
    {
        id: "demo-supplier-1",
        name: "Kenya Office Supplies Ltd",
        tradingName: "KOS",
        taxPin: "P051234567A",
        registrationNumber: "PVT-2024-001234",
        category: ["Supplies"],
        contactPerson: "James Mwangi",
        phone: "+254 712 345 678",
        email: "info@kenyaoffice.co.ke",
        physicalAddress: "Kijabe Street, Nairobi CBD",
        postalAddress: "P.O. Box 12345, Nairobi",
        county: "Nairobi",
        bankName: "Equity Bank",
        bankBranch: "Westlands",
        bankAccountNumber: "0123456789012",
        status: "Active",
        notes: "Reliable stationery supplier with prompt delivery",
        createdAt: "2024-06-15T08:00:00Z",
        updatedAt: "2024-06-15T08:00:00Z",
    },
    {
        id: "demo-supplier-2",
        name: "Lab Equipment Kenya",
        taxPin: "A051234568B",
        category: ["Supplies"],
        contactPerson: "Grace Wanjiku",
        phone: "+254 723 456 789",
        email: "sales@labequip.co.ke",
        physicalAddress: "Industrial Area, Enterprise Road",
        postalAddress: "P.O. Box 54321, Nairobi",
        county: "Nairobi",
        bankName: "KCB Bank",
        bankBranch: "Industrial Area",
        bankAccountNumber: "1234567890123",
        status: "Active",
        notes: "Certified lab equipment distributor",
        createdAt: "2024-07-10T10:00:00Z",
        updatedAt: "2024-07-10T10:00:00Z",
    },
    {
        id: "demo-supplier-3",
        name: "Sports Gear Africa",
        tradingName: "SGA",
        taxPin: "P051234569C",
        category: ["Supplies"],
        contactPerson: "Peter Ochieng",
        phone: "+254 734 567 890",
        email: "orders@sportsgear.co.ke",
        physicalAddress: "Westlands, Waiyaki Way",
        county: "Nairobi",
        status: "Active",
        createdAt: "2024-08-05T09:00:00Z",
        updatedAt: "2024-08-05T09:00:00Z",
    },
    {
        id: "demo-supplier-4",
        name: "TechWorld Kenya",
        taxPin: "A051234570D",
        category: ["Supplies"],
        contactPerson: "Lucy Akinyi",
        phone: "+254 745 678 901",
        email: "sales@techworld.co.ke",
        physicalAddress: "Kenyatta Avenue, Anniversary Towers",
        postalAddress: "P.O. Box 67890, Nairobi",
        county: "Nairobi",
        bankName: "Co-operative Bank",
        bankBranch: "City Centre",
        bankAccountNumber: "0112233445566",
        status: "Active",
        notes: "Authorized IT equipment dealer",
        createdAt: "2024-09-12T11:00:00Z",
        updatedAt: "2024-09-12T11:00:00Z",
    },
    {
        id: "demo-supplier-5",
        name: "Furniture Masters Ltd",
        taxPin: "P051234571E",
        category: ["Supplies"],
        contactPerson: "David Kamau",
        phone: "+254 756 789 012",
        email: "info@furnituremasters.co.ke",
        physicalAddress: "Mombasa Road, Opposite JKIA",
        postalAddress: "P.O. Box 11223, Nairobi",
        county: "Nairobi",
        bankName: "ABSA Bank",
        bankBranch: "Mombasa Road",
        bankAccountNumber: "9876543210123",
        status: "Active",
        notes: "Custom school furniture manufacturer",
        createdAt: "2024-10-01T08:00:00Z",
        updatedAt: "2024-10-01T08:00:00Z",
    },
    {
        id: "demo-supplier-6",
        name: "Mombasa Cleaning Services",
        taxPin: "P051234572F",
        category: ["Services", "Supplies"],
        contactPerson: "Fatuma Hassan",
        phone: "+254 711 234 567",
        email: "info@mombasaclean.co.ke",
        physicalAddress: "Nyali Road, Mombasa",
        county: "Mombasa",
        status: "Active",
        createdAt: "2024-11-15T14:00:00Z",
        updatedAt: "2024-11-15T14:00:00Z",
    },
];
