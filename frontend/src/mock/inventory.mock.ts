export type AssetType = "Consumable" | "Expendable" | "Permanent" | "Fixed Asset";

export interface Item {
    id: string;
    name: string;
    category: string;
    assetType: AssetType;
    unit: string;
    minimumStockLevel: number;
    reorderLevel: number;
    openingBalance: number;
    expiryDate?: string;
    hasBeenUsed: boolean;
    status: string;
    description?: string;
    locationType?: string;
    location?: string;
    lastUpdated?: string;
}

export interface S13Record {
    id: string;
    date: string;
    department: string;
    requestedBy: string;
    items: number;
    status: string;
}

export type DocumentStatus = "Draft" | "Submitted" | "Approved" | "Posted" | "Locked";

export interface S11Record {
    id: string;
    date: string;
    sourceType: "Supplier" | "Internal Store";
    supplier: string;
    storeLocation: string;
    items: number;
    totalValue: string;
    status: DocumentStatus;
    storekeeperSignature?: string;
    signedAt?: string;
}

export interface StoreTransfer {
    id: string;
    date: string;
    from: string;
    to: string;
    items: number;
    status: string;
}

export const MOCK_STORE_TRANSFERS: StoreTransfer[] = [
    { id: "TRF-2024-001", date: "2024-01-15", from: "Main Store", to: "Science Lab Store", items: 5, status: "Completed" },
    { id: "TRF-2024-002", date: "2024-01-14", from: "Main Store", to: "Sports Store", items: 3, status: "In Transit" },
    { id: "TRF-2024-003", date: "2024-01-13", from: "IT Department", to: "Main Store", items: 8, status: "Completed" },
    { id: "TRF-2024-004", date: "2024-01-12", from: "Main Store", to: "Library Store", items: 12, status: "Pending Approval" },
    { id: "TRF-2024-005", date: "2024-01-10", from: "Science Lab Store", to: "Main Store", items: 2, status: "Completed" },
];

export interface StockBalanceItem {
    id: string;
    name: string;
    category: string;
    unit: string;
    opening: number;
    received: number;
    issued: number;
    closing: number;
    value: string;
}

export const MOCK_STOCK_BALANCES: StockBalanceItem[] = [
    { id: "ITM001", name: "A4 Paper Reams", category: "Stationery", unit: "Ream", opening: 100, received: 50, issued: 30, closing: 120, value: "KES 24,000" },
    { id: "ITM002", name: "Whiteboard Markers", category: "Stationery", unit: "Box", opening: 25, received: 0, issued: 17, closing: 8, value: "KES 4,000" },
    { id: "ITM003", name: "Printer Cartridge HP", category: "IT Supplies", unit: "Unit", opening: 8, received: 0, issued: 5, closing: 3, value: "KES 15,000" },
    { id: "ITM004", name: "Cleaning Detergent", category: "Cleaning", unit: "Liter", opening: 30, received: 40, issued: 25, closing: 45, value: "KES 9,000" },
    { id: "ITM005", name: "Lab Beakers 250ml", category: "Laboratory", unit: "Piece", opening: 60, received: 30, issued: 12, closing: 78, value: "KES 15,600" },
    { id: "ITM006", name: "Football Size 5", category: "Sports", unit: "Piece", opening: 15, received: 0, issued: 3, closing: 12, value: "KES 18,000" },
    { id: "ITM007", name: "Chalk White Box", category: "Stationery", unit: "Box", opening: 50, received: 0, issued: 15, closing: 35, value: "KES 3,500" },
    { id: "ITM008", name: "Test Tubes", category: "Laboratory", unit: "Pack", opening: 18, received: 10, issued: 6, closing: 22, value: "KES 11,000" },
];

export const MOCK_INVENTORY_SETTINGS = {
    categories: ["All Categories", "Stationery", "IT Supplies", "Cleaning", "Laboratory", "Sports"],
    units: ["Ream", "Box", "Unit", "Liter", "Piece", "Pack", "Kg", "Meter"],
    locationTypes: ["Stores", "Library", "Department"],
    storeLocations: ["Main Store", "Sports Store", "Science Store", "Kitchen Store", "Maintenance Store"],
    libraryLocations: ["Main Library", "Junior Library", "Reference Section", "Archives"],
    departmentLocations: ["Administration", "Science Department", "Arts Department", "Technical Department", "Sports Department"],
    assetTypes: ["Consumable", "Permanent", "Fixed Asset"] as AssetType[],
    paymentTermsOptions: [
        { value: "cod", label: "Cash on Delivery" },
        { value: "net30", label: "Net 30 Days" },
        { value: "net60", label: "Net 60 Days" },
        { value: "advance50", label: "50% Advance" },
    ],
    adjustmentReasons: [
        "Count correction",
        "Damaged goods",
        "Breakage",
        "Opening balance error",
        "Expired items",
        "Lost items",
        "Found items",
        "System error correction",
        "Other",
    ]
};

export interface AdjustmentRecord {
    id: string;
    date: string;
    item: string;
    type: string;
    qty: number;
    reason: string;
    status: string;
    approvedBy: string;
}

export const MOCK_ADJUSTMENTS: AdjustmentRecord[] = [
    { id: "ADJ-2024-001", date: "2024-01-15", item: "A4 Paper Reams", type: "Addition", qty: 10, reason: "Count correction", status: "Approved", approvedBy: "Principal" },
    { id: "ADJ-2024-002", date: "2024-01-14", item: "Whiteboard Markers", type: "Deduction", qty: 5, reason: "Damaged goods", status: "Approved", approvedBy: "Bursar" },
    { id: "ADJ-2024-003", date: "2024-01-13", item: "Lab Beakers", type: "Deduction", qty: 3, reason: "Breakage", status: "Pending", approvedBy: "-" },
    { id: "ADJ-2024-004", date: "2024-01-12", item: "Cleaning Detergent", type: "Addition", qty: 15, reason: "Opening balance error", status: "Approved", approvedBy: "Principal" },
    { id: "ADJ-2024-005", date: "2024-01-10", item: "Test Tubes", type: "Deduction", qty: 8, reason: "Expired items", status: "Rejected", approvedBy: "Bursar" },
];

export interface StoreItem {
    code: string;
    description: string;
    unit: string;
    assetType: "Consumable" | "Permanent" | "Fixed Asset";
}

export const MOCK_STORE_ITEMS: StoreItem[] = [
    { code: "STN-001", description: "A4 Printing Paper (Ream 500 sheets)", unit: "Ream", assetType: "Consumable" },
    { code: "STN-002", description: "Blue Ballpoint Pens", unit: "Box (50)", assetType: "Consumable" },
    { code: "STN-003", description: "Black Ballpoint Pens", unit: "Box (50)", assetType: "Consumable" },
    { code: "STN-004", description: "Whiteboard Markers (Assorted)", unit: "Pack (12)", assetType: "Consumable" },
    { code: "STN-005", description: "Stapler (Heavy Duty)", unit: "Piece", assetType: "Permanent" },
    { code: "STN-006", description: "Staples (Box 5000)", unit: "Box", assetType: "Consumable" },
    { code: "STN-007", description: "Paper Clips (Box 100)", unit: "Box", assetType: "Consumable" },
    { code: "STN-008", description: "Lever Arch Files", unit: "Piece", assetType: "Consumable" },
    { code: "STN-009", description: "Manila Folders (A4)", unit: "Pack (100)", assetType: "Consumable" },
    { code: "STN-010", description: "Correction Fluid", unit: "Bottle", assetType: "Consumable" },
    { code: "CLN-001", description: "Liquid Soap (5L)", unit: "Jerrycan", assetType: "Consumable" },
    { code: "CLN-002", description: "Toilet Paper (Jumbo Roll)", unit: "Carton (12)", assetType: "Consumable" },
    { code: "CLN-003", description: "Floor Cleaner (5L)", unit: "Jerrycan", assetType: "Consumable" },
    { code: "CLN-004", description: "Disinfectant (5L)", unit: "Jerrycan", assetType: "Consumable" },
    { code: "CLN-005", description: "Brooms (Heavy Duty)", unit: "Piece", assetType: "Permanent" },
    { code: "CLN-006", description: "Mops with Handle", unit: "Piece", assetType: "Permanent" },
    { code: "CLN-007", description: "Dustbins (Plastic 50L)", unit: "Piece", assetType: "Permanent" },
    { code: "LAB-001", description: "Bunsen Burner", unit: "Piece", assetType: "Permanent" },
    { code: "LAB-002", description: "Test Tubes (Pack 50)", unit: "Pack", assetType: "Consumable" },
    { code: "LAB-003", description: "Beakers (250ml)", unit: "Piece", assetType: "Permanent" },
    { code: "LAB-004", description: "Microscope Slides (Box 100)", unit: "Box", assetType: "Consumable" },
    { code: "LAB-005", description: "Litmus Paper (Pack)", unit: "Pack", assetType: "Consumable" },
    { code: "SPT-001", description: "Footballs (Size 5)", unit: "Piece", assetType: "Permanent" },
    { code: "SPT-002", description: "Volleyballs", unit: "Piece", assetType: "Permanent" },
    { code: "SPT-003", description: "Netballs", unit: "Piece", assetType: "Permanent" },
    { code: "SPT-004", description: "Athletic Cones (Set 10)", unit: "Set", assetType: "Permanent" },
    { code: "FRN-001", description: "Student Desk (Single Seater)", unit: "Piece", assetType: "Fixed Asset" },
    { code: "FRN-002", description: "Student Chair (Plastic)", unit: "Piece", assetType: "Fixed Asset" },
    { code: "FRN-003", description: "Teacher's Desk", unit: "Piece", assetType: "Fixed Asset" },
    { code: "FRN-004", description: "Whiteboard (4x6 ft)", unit: "Piece", assetType: "Fixed Asset" },
];

export const MOCK_INVENTORY: Item[] = [
    { id: "ITM001", name: "A4 Paper Reams", category: "Stationery", assetType: "Consumable", unit: "Ream", minimumStockLevel: 20, reorderLevel: 50, openingBalance: 120, hasBeenUsed: true, status: "In Stock", description: "Standard A4 white paper", location: "Shelf A1", lastUpdated: "2024-01-15" },
    { id: "ITM002", name: "Whiteboard Markers", category: "Stationery", assetType: "Consumable", unit: "Box", minimumStockLevel: 10, reorderLevel: 30, openingBalance: 8, hasBeenUsed: true, status: "Low Stock", description: "Assorted colors", location: "Shelf A2", lastUpdated: "2024-01-14" },
    { id: "ITM003", name: "Printer Cartridge HP", category: "IT Supplies", assetType: "Consumable", unit: "Unit", minimumStockLevel: 3, reorderLevel: 10, openingBalance: 3, expiryDate: "2025-06-30", hasBeenUsed: false, status: "Critical", description: "HP LaserJet compatible", location: "Cabinet B1", lastUpdated: "2024-01-13" },
    { id: "ITM004", name: "Cleaning Detergent", category: "Cleaning", assetType: "Consumable", unit: "Liter", minimumStockLevel: 10, reorderLevel: 20, openingBalance: 45, expiryDate: "2025-12-31", hasBeenUsed: true, status: "In Stock", description: "Multi-purpose cleaner", location: "Store Room", lastUpdated: "2024-01-12" },
    { id: "ITM005", name: "Lab Beakers 250ml", category: "Laboratory", assetType: "Permanent", unit: "Piece", minimumStockLevel: 10, reorderLevel: 25, openingBalance: 78, hasBeenUsed: false, status: "In Stock", description: "Borosilicate glass", location: "Lab Cabinet", lastUpdated: "2024-01-11" },
    { id: "ITM006", name: "Football Size 5", category: "Sports", assetType: "Permanent", unit: "Piece", minimumStockLevel: 5, reorderLevel: 10, openingBalance: 12, hasBeenUsed: true, status: "In Stock", description: "Official match ball", location: "Sports Store", lastUpdated: "2024-01-10" },
    { id: "ITM007", name: "Chalk White Box", category: "Stationery", assetType: "Consumable", unit: "Box", minimumStockLevel: 15, reorderLevel: 40, openingBalance: 35, hasBeenUsed: false, status: "Low Stock", description: "Dustless chalk", location: "Shelf A3", lastUpdated: "2024-01-09" },
    { id: "ITM008", name: "Desktop Computer", category: "IT Supplies", assetType: "Fixed Asset", unit: "Unit", minimumStockLevel: 2, reorderLevel: 5, openingBalance: 22, hasBeenUsed: true, status: "In Stock", description: "Dell OptiPlex workstation", location: "IT Store", lastUpdated: "2024-01-08" },
    { id: "ITM009", name: "Biology Textbook", category: "Books", quantity: 8, location: "Room 305", status: "Low Stock", lastUpdated: "2024-01-09", openingBalance: 8, assetType: "Permanent", unit: "Book", minimumStockLevel: 10, reorderLevel: 20, hasBeenUsed: true } as Item,
    { id: "ITM010", name: "Dell Laptop", category: "Technology", quantity: 23, location: "Tech Lab", status: "Available", lastUpdated: "2024-01-14", openingBalance: 23, assetType: "Fixed Asset", unit: "Unit", minimumStockLevel: 5, reorderLevel: 10, hasBeenUsed: true } as Item,
];

export const MOCK_S13_RECORDS: S13Record[] = [
    { id: "S13-2024-001", date: "2024-01-15", department: "Science Department", requestedBy: "Mr. John Kamau", items: 4, status: "Issued" },
    { id: "S13-2024-002", date: "2024-01-15", department: "Administration", requestedBy: "Ms. Sarah Wanjiku", items: 6, status: "Pending" },
    { id: "S13-2024-003", date: "2024-01-14", department: "Sports Department", requestedBy: "Mr. David Ochieng", items: 3, status: "Issued" },
    { id: "S13-2024-004", date: "2024-01-13", department: "Languages Dept", requestedBy: "Mrs. Grace Muthoni", items: 8, status: "Partial" },
    { id: "S13-2024-005", date: "2024-01-12", department: "Mathematics Dept", requestedBy: "Mr. Peter Njoroge", items: 2, status: "Issued" },
];

export const MOCK_S11_RECORDS: S11Record[] = [
    { id: "S11-2024-001", date: "2024-01-15", sourceType: "Supplier", supplier: "Kenya Office Supplies Ltd", storeLocation: "Main Store", items: 5, totalValue: "KES 45,000", status: "Posted", storekeeperSignature: "J. Kamau", signedAt: "2024-01-15 10:30" },
    { id: "S11-2024-002", date: "2024-01-14", sourceType: "Supplier", supplier: "Lab Equipment Kenya", storeLocation: "Science Lab Store", items: 3, totalValue: "KES 120,000", status: "Approved" },
    { id: "S11-2024-003", date: "2024-01-13", sourceType: "Internal Store", supplier: "Main Store Transfer", storeLocation: "Sports Store", items: 8, totalValue: "KES 35,000", status: "Locked", storekeeperSignature: "M. Ochieng", signedAt: "2024-01-13 14:15" },
    { id: "S11-2024-004", date: "2024-01-12", sourceType: "Supplier", supplier: "TechWorld Kenya", storeLocation: "Main Store", items: 2, totalValue: "KES 85,000", status: "Draft" },
    { id: "S11-2024-005", date: "2024-01-10", sourceType: "Supplier", supplier: "Mombasa Cleaning Services", storeLocation: "Main Store", items: 12, totalValue: "KES 22,000", status: "Submitted" },
    { id: "S11-2024-005", date: "2024-01-10", sourceType: "Supplier", supplier: "Mombasa Cleaning Services", storeLocation: "Main Store", items: 12, totalValue: "KES 22,000", status: "Submitted" },
];

export interface ConsumableLedgerReceipt {
    date: string;
    grnNo: string | null;
    qty: number;
    unitCost: number;
    totalCost: number;
}

export interface ConsumableLedgerIssue {
    date: string;
    s13No: string | null;
    riaNo: string | null;
    dept: string;
    qty: number;
    unitCost: number;
    totalCost: number;
}

export interface ConsumableLedgerItem {
    itemCode: string;
    itemName: string;
    unit: string;
    openingQty: number;
    openingValue: number;
    receipts: ConsumableLedgerReceipt[];
    issues: ConsumableLedgerIssue[];
    totalReceiptsQty: number;
    totalReceiptsValue: number;
    totalIssuesQty: number;
    totalIssuesValue: number;
    closingQty: number;
    closingValue: number;
}

// S2 Permanent & Expendable Stores Ledger — backend-sourced row shape
export type S2TxnType = "RECEIPT" | "ISSUE" | "TRANSFER" | "RETURN" | "DAMAGE_LOSS";
export type S2Condition = "NEW" | "GOOD" | "FAIR" | "POOR" | "DAMAGED" | "LOST" | "OBSOLETE" | "CONDEMNED";
export type S2LossReason = "DAMAGED" | "LOST" | "OBSOLETE" | "CONDEMNED";

export interface S2LedgerEntry {
    id: number;
    date: string;
    refNo: string;
    txnType: S2TxnType;
    itemCode: string;
    itemName: string;
    category: string;
    unit: string;
    qtyReceived: number;
    qtyIssued: number;
    runningBalance: number;
    unitCost: number | string;
    totalValue: number | string;
    supplier: string;
    recipient: string;
    department: string;
    fromDept?: string;
    toDept?: string;
    lossReason?: S2LossReason | "";
    condition: S2Condition;
    remarks: string;
    createdBy: string;
    approvedBy: string;
    createdAt?: string;
}

export const generateLedgerData = (month: string, store: string): ConsumableLedgerItem[] => {
    const items = [
        {
            itemCode: "STA-001",
            itemName: "A4 Paper Reams",
            unit: "Ream",
            openingQty: 45,
            openingValue: 22500,
            receipts: [
                { date: "2024-01-05", grnNo: "GRN-2024-0012", qty: 100, unitCost: 520, totalCost: 52000 },
                { date: "2024-01-18", grnNo: "GRN-2024-0028", qty: 50, unitCost: 530, totalCost: 26500 },
            ],
            issues: [
                { date: "2024-01-08", s13No: "S13-2024-0045", qty: 20, dept: "Admin", unitCost: 500, totalCost: 10000, riaNo: null },
                { date: "2024-01-15", s13No: "S13-2024-0067", qty: 35, dept: "Academics", unitCost: 500, totalCost: 17500, riaNo: "RIA/2025/001" },
                { date: "2024-01-25", s13No: "S13-2024-0089", qty: 25, dept: "Exams", unitCost: 520, totalCost: 13000, riaNo: null },
            ],
        },
        {
            itemCode: "STA-002",
            itemName: "Blue Ballpoint Pens",
            unit: "Box",
            openingQty: 120,
            openingValue: 18000,
            receipts: [
                { date: "2024-01-10", grnNo: "GRN-2024-0015", qty: 50, unitCost: 160, totalCost: 8000 },
            ],
            issues: [
                { date: "2024-01-12", s13No: "S13-2024-0052", qty: 30, dept: "Staff", unitCost: 150, totalCost: 4500, riaNo: null },
                { date: "2024-01-20", s13No: "S13-2024-0078", qty: 40, dept: "Academics", unitCost: 150, totalCost: 6000, riaNo: "RIA/2025/001" },
            ],
        },
        {
            itemCode: "STA-003",
            itemName: "Manila Paper (Assorted)",
            unit: "Sheet",
            openingQty: 500,
            openingValue: 7500,
            receipts: [
                { date: "2024-01-08", grnNo: "GRN-2024-0014", qty: 1000, unitCost: 18, totalCost: 18000 },
            ],
            issues: [
                { date: "2024-01-10", s13No: "S13-2024-0048", qty: 200, dept: "Art", unitCost: 15, totalCost: 3000, riaNo: null },
                { date: "2024-01-22", s13No: "S13-2024-0082", qty: 350, dept: "Academics", unitCost: 15, totalCost: 5250, riaNo: null },
            ],
        },
        {
            itemCode: "CLN-001",
            itemName: "Toilet Paper Rolls",
            unit: "Roll",
            openingQty: 200,
            openingValue: 10000,
            receipts: [
                { date: "2024-01-03", grnNo: "GRN-2024-0010", qty: 500, unitCost: 55, totalCost: 27500 },
            ],
            issues: [
                { date: "2024-01-05", s13No: "S13-2024-0040", qty: 100, dept: "Boarding", unitCost: 50, totalCost: 5000, riaNo: "RIA/2025/001" },
                { date: "2024-01-15", s13No: "S13-2024-0065", qty: 150, dept: "Boarding", unitCost: 50, totalCost: 7500, riaNo: "RIA/2025/001" },
                { date: "2024-01-28", s13No: "S13-2024-0095", qty: 120, dept: "Boarding", unitCost: 50, totalCost: 6000, riaNo: null },
            ],
        },
        {
            itemCode: "CLN-002",
            itemName: "Liquid Soap (5L)",
            unit: "Bottle",
            openingQty: 25,
            openingValue: 8750,
            receipts: [
                { date: "2024-01-12", grnNo: "GRN-2024-0020", qty: 30, unitCost: 380, totalCost: 11400 },
            ],
            issues: [
                { date: "2024-01-14", s13No: "S13-2024-0058", qty: 10, dept: "Kitchen", unitCost: 350, totalCost: 3500, riaNo: "RIA/2025/001" },
                { date: "2024-01-25", s13No: "S13-2024-0088", qty: 15, dept: "Boarding", unitCost: 350, totalCost: 5250, riaNo: null },
            ],
        },
        {
            itemCode: "LAB-001",
            itemName: "HCL Acid (500ml)",
            unit: "Bottle",
            openingQty: 15,
            openingValue: 9000,
            receipts: [],
            issues: [
                { date: "2024-01-18", s13No: "S13-2024-0072", qty: 5, dept: "Science Lab", unitCost: 600, totalCost: 3000, riaNo: "RIA/2025/002" },
            ],
        },
    ];

    return items.map(item => {
        const totalReceiptsQty = item.receipts.reduce((sum, r) => sum + r.qty, 0);
        const totalReceiptsValue = item.receipts.reduce((sum, r) => sum + r.totalCost, 0);
        const totalIssuesQty = item.issues.reduce((sum, i) => sum + i.qty, 0);
        const totalIssuesValue = item.issues.reduce((sum, i) => sum + i.totalCost, 0);
        const closingQty = item.openingQty + totalReceiptsQty - totalIssuesQty;
        const closingValue = item.openingValue + totalReceiptsValue - totalIssuesValue;

        return {
            ...item,
            totalReceiptsQty,
            totalReceiptsValue,
            totalIssuesQty,
            totalIssuesValue,
            closingQty,
            closingValue,
        };
    });
};

export interface DashboardTransaction {
    id: number;
    type: string;
    item: string;
    qty: number;
    date: string;
    status: string;
}

export interface DashboardLowStockItem {
    id: number;
    name: string;
    current: number;
    minimum: number;
    unit: string;
}

export const MOCK_DASHBOARD_TRANSACTIONS: DashboardTransaction[] = [
    { id: 1, type: "S11", item: "Office Supplies - A4 Paper", qty: 100, date: "2024-01-15", status: "Completed" },
    { id: 2, type: "S13", item: "Cleaning Materials", qty: 25, date: "2024-01-15", status: "Pending" },
    { id: 3, type: "S11", item: "Laboratory Equipment", qty: 10, date: "2024-01-14", status: "Completed" },
    { id: 4, type: "S13", item: "Sports Equipment", qty: 15, date: "2024-01-14", status: "Completed" },
    { id: 5, type: "Transfer", item: "Computer Accessories", qty: 5, date: "2024-01-13", status: "In Transit" },
];

export const MOCK_LOW_STOCK_ITEMS: DashboardLowStockItem[] = [
    { id: 1, name: "A4 Paper Reams", current: 15, minimum: 50, unit: "reams" },
    { id: 2, name: "Whiteboard Markers", current: 8, minimum: 30, unit: "boxes" },
    { id: 3, name: "Printer Cartridges", current: 3, minimum: 10, unit: "units" },
    { id: 4, name: "Cleaning Detergent", current: 5, minimum: 20, unit: "liters" },
];

export interface DashboardStats {
    totalItems: { value: string; trend: string; trendUp: boolean };
    lowStockItems: { value: string; trend: string; trendUp: boolean };
    s11ThisMonth: { value: string; trend: string; trendUp: boolean };
    s13ThisMonth: { value: string; trend: string; trendUp: boolean };
    stockValue: string;
    categories: string;
    pendingIssues: string;
}

export const MOCK_DASHBOARD_STATS: DashboardStats = {
    totalItems: { value: "1,248", trend: "+5% from last month", trendUp: true },
    lowStockItems: { value: "12", trend: "4 critical", trendUp: false },
    s11ThisMonth: { value: "156", trend: "+12% increase", trendUp: true },
    s13ThisMonth: { value: "89", trend: "-3% decrease", trendUp: false },
    stockValue: "KES 2.4M",
    categories: "24",
    pendingIssues: "8"
};

export type S12Status =
    | "Draft"
    | "Pending Approval"
    | "Approved"
    | "Partially Issued"
    | "Fully Issued"
    | "Rejected"
    | "Cancelled";

export interface S12Item {
    id: string;
    itemCode: string;
    description: string;
    unit: string;
    quantityRequested: number;
    quantityApproved: number;
    quantityIssued: number;
    unitPrice: number;
    remarks?: string;
}

export interface S12Requisition {
    id: string;
    s12Number: string;
    requestDate: string;
    requestingDepartment: string;
    requestedBy: string;
    purpose: string;
    items: S12Item[];
    status: S12Status;

    // Approval workflow
    approvedBy?: string;
    approvalDate?: string;
    approvalRemarks?: string;

    // Issue tracking
    issuedBy?: string;
    issueDate?: string;
    receivedBy?: string;
    receiverSignature: boolean;
    issuerSignature: boolean;

    // Audit trail
    createdAt: string;
    updatedAt: string;
}

export const generateS12Number = (): string => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `S12/${year}/${month}/${random}`;
};

export function getDemoRequisitions(): S12Requisition[] {
    const now = new Date();
    const fmt = (d: Date) => d.toISOString();
    const makeItem = (id: string, desc: string, unit: string, qty: number, price: number): S12Item => ({
        id,
        itemCode: id.toUpperCase(),
        description: desc,
        unit,
        quantityRequested: qty,
        quantityApproved: 0,
        quantityIssued: 0,
        unitPrice: price,
    });
    const r1: S12Requisition = {
        id: crypto.randomUUID(),
        s12Number: "S12/2025/01/0001",
        requestDate: now.toISOString(),
        requestingDepartment: "Science Department",
        requestedBy: "Mr. John Kamau",
        purpose: "Lab consumables for practicals",
        items: [
            makeItem("LAB-TESTTUBE", "Test Tubes (Pack of 50)", "Pack", 10, 2500),
            makeItem("LAB-BEAKER-250", "Beakers 250ml", "Pcs", 12, 600),
        ],
        status: "Pending Approval",
        approvedBy: undefined,
        approvalDate: undefined,
        approvalRemarks: undefined,
        issuedBy: undefined,
        issueDate: undefined,
        receivedBy: undefined,
        receiverSignature: false,
        issuerSignature: false,
        createdAt: fmt(now),
        updatedAt: fmt(now),
    };
    const r2: S12Requisition = {
        id: crypto.randomUUID(),
        s12Number: "S12/2025/01/0002",
        requestDate: now.toISOString(),
        requestingDepartment: "Administration",
        requestedBy: "Ms. Sarah Wanjiku",
        purpose: "Office stationery for term 1",
        items: [
            makeItem("STN-A4", "A4 Printing Paper (Ream)", "Ream", 30, 450),
            makeItem("STN-PEN", "Blue Pens (Dozen)", "Dozen", 5, 300),
        ],
        status: "Approved",
        approvedBy: "Principal Omondi",
        approvalDate: fmt(now),
        approvalRemarks: "Within budget",
        issuedBy: undefined,
        issueDate: undefined,
        receivedBy: undefined,
        receiverSignature: false,
        issuerSignature: false,
        createdAt: fmt(now),
        updatedAt: fmt(now),
    };
    const r3: S12Requisition = {
        id: crypto.randomUUID(),
        s12Number: "S12/2025/01/0003",
        requestDate: now.toISOString(),
        requestingDepartment: "Sports Department",
        requestedBy: "Mr. David Ochieng",
        purpose: "Games equipment for school teams",
        items: [
            { ...makeItem("SPT-BALL", "Football Size 5", "Pcs", 10, 1500), quantityApproved: 10, quantityIssued: 4 },
            { ...makeItem("SPT-NET", "Volleyball Net", "Pcs", 2, 3500), quantityApproved: 2, quantityIssued: 1 },
        ],
        status: "Partially Issued",
        approvedBy: "Principal Omondi",
        approvalDate: fmt(now),
        approvalRemarks: "Approved for term games",
        issuedBy: "Storekeeper",
        issueDate: fmt(now),
        receivedBy: undefined,
        receiverSignature: false,
        issuerSignature: true,
        createdAt: fmt(now),
        updatedAt: fmt(now),
    };
    const r4: S12Requisition = {
        id: crypto.randomUUID(),
        s12Number: "S12/2025/01/0004",
        requestDate: now.toISOString(),
        requestingDepartment: "Kitchen",
        requestedBy: "Chef Kamau",
        purpose: "Weekly boarding supplies",
        items: [
            makeItem("FOOD-RICE", "Rice", "Kg", 200, 180),
            makeItem("FOOD-BEANS", "Beans", "Kg", 150, 160),
            makeItem("FOOD-SUGAR", "Sugar", "Kg", 40, 175),
        ],
        status: "Pending Approval",
        approvedBy: undefined,
        approvalDate: undefined,
        approvalRemarks: undefined,
        issuedBy: undefined,
        issueDate: undefined,
        receivedBy: undefined,
        receiverSignature: false,
        issuerSignature: false,
        createdAt: fmt(now),
        updatedAt: fmt(now),
    };
    const r5: S12Requisition = {
        id: crypto.randomUUID(),
        s12Number: "S12/2025/01/0005",
        requestDate: now.toISOString(),
        requestingDepartment: "Library",
        requestedBy: "Mrs. Achieng",
        purpose: "Library consumables and accessories",
        items: [
            makeItem("LIB-FILE", "Box Files", "Pcs", 25, 150),
            makeItem("LIB-MARKER", "Marker Pens", "Pcs", 20, 80),
            makeItem("LIB-LAM", "Laminating Pouches (A4)", "Pack", 5, 650),
        ],
        status: "Pending Approval",
        approvedBy: undefined,
        approvalDate: undefined,
        approvalRemarks: undefined,
        issuedBy: undefined,
        issueDate: undefined,
        receivedBy: undefined,
        receiverSignature: false,
        issuerSignature: false,
        createdAt: fmt(now),
        updatedAt: fmt(now),
    };
    return [r1, r2, r3, r4, r5];
}
// RIA Types and Mocks
export type RIAStatus = "active" | "pending" | "expired" | "draft" | "cancelled";

export interface RIAItem {
    itemCode: string;
    itemName: string;
    unit: string;
    approvedQty: number;
    usedQty: number;
}

export interface RIARecord {
    id: string;
    number: string; // e.g. RIA/2025/003
    department: string;
    costCenter: string;
    responsibleOfficer: string;
    startDate: string; // ISO
    endDate: string;   // ISO
    notes?: string;
    status: RIAStatus;
    items: RIAItem[];
    createdAt: string;
}

export const MOCK_RIAS: RIARecord[] = [
    {
        id: "1",
        number: "RIA/2025/001",
        department: "Kitchen",
        costCenter: "COST-01",
        responsibleOfficer: "Chef Kamau",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().slice(0, 10),
        notes: "Monthly rations for boarding",
        status: "active",
        items: [
            { itemCode: "FOOD-BEANS", itemName: "Beans", unit: "Kg", approvedQty: 200, usedQty: 170 },
            { itemCode: "FOOD-RICE", itemName: "Rice", unit: "Kg", approvedQty: 300, usedQty: 120 },
        ],
        createdAt: new Date().toISOString(),
    },
    {
        id: "2",
        number: "RIA/2025/002",
        department: "Science Lab",
        costCenter: "COST-02",
        responsibleOfficer: "Lab Tech Achieng",
        startDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().slice(0, 10),
        endDate: new Date(new Date().setDate(new Date().getDate() + 32)).toISOString().slice(0, 10),
        notes: "Term 1 lab consumables",
        status: "pending",
        items: [
            { itemCode: "LAB-ACID-HCL", itemName: "HCL Acid", unit: "Bottle", approvedQty: 10, usedQty: 0 },
            { itemCode: "LAB-IND", itemName: "Indicator Paper", unit: "Pack", approvedQty: 5, usedQty: 0 },
        ],
        createdAt: new Date().toISOString(),
    },
    {
        id: "3",
        number: "RIA/2024/014",
        department: "Sanitation",
        costCenter: "COST-03",
        responsibleOfficer: "Matron Wanja",
        startDate: new Date(new Date().setDate(new Date().getDate() - 60)).toISOString().slice(0, 10),
        endDate: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10),
        notes: "Term 3 cleaning supplies",
        status: "expired",
        items: [
            { itemCode: "CLN-002", itemName: "Liquid Soap (5L)", unit: "Bottle", approvedQty: 20, usedQty: 20 },
        ],
        createdAt: new Date().toISOString(),
    },
    {
        id: "4",
        number: "RIA/2025/003",
        department: "Boarding",
        costCenter: "COST-04",
        responsibleOfficer: "Matron Wanja",
        startDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().slice(0, 10),
        endDate: new Date(new Date().setDate(new Date().getDate() + 33)).toISOString().slice(0, 10),
        notes: "Monthly rations for dormitories",
        status: "pending",
        items: [
            { itemCode: "FOOD-MAIZE", itemName: "Maize Flour", unit: "Kg", approvedQty: 400, usedQty: 0 },
            { itemCode: "FOOD-SUGAR", itemName: "Sugar", unit: "Kg", approvedQty: 80, usedQty: 0 },
            { itemCode: "FOOD-TEA", itemName: "Tea Leaves", unit: "Pack", approvedQty: 20, usedQty: 0 },
        ],
        createdAt: new Date().toISOString(),
    },
    {
        id: "5",
        number: "RIA/2025/004",
        department: "Sports",
        costCenter: "COST-05",
        responsibleOfficer: "Coach Otieno",
        startDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().slice(0, 10),
        endDate: new Date(new Date().setDate(new Date().getDate() + 40)).toISOString().slice(0, 10),
        notes: "Training consumables for school teams",
        status: "pending",
        items: [
            { itemCode: "SPT-TAPE", itemName: "Athletic Tape", unit: "Roll", approvedQty: 30, usedQty: 0 },
            { itemCode: "SPT-ICE", itemName: "Ice Packs", unit: "Pack", approvedQty: 10, usedQty: 0 },
        ],
        createdAt: new Date().toISOString(),
    },
];
