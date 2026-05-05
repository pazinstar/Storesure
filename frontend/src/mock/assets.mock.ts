export interface Asset {
    id: string;
    name: string;
    category: string;
    location: string;
    assignedTo: string;
    purchaseDate: string;
    value: string;
    status: string;
    condition: string;
}

export interface AssetMovementRecord {
    id: string;
    date: string;
    asset: string;
    assetId: string;
    from: string;
    to: string;
    type: string;
    status: string;
    by: string;
}

export interface AssetDetailData extends Asset {
    subcategory: string;
    serialNumber: string;
    model: string;
    manufacturer: string;
    custodian: string;
    warrantyExpiry: string;
    purchaseValue: string;
    currentValue: string;
    depreciationRate: string;
    lastVerified: string;
    description: string;
}

export interface MaintenanceRecord {
    date: string;
    type: string;
    description: string;
    cost: string;
    status: string;
}

export interface SurveyRecord {
    id: string;
    date: string;
    title: string;
    type: string;
    assets: number;
    verified: number;
    missing: number;
    damaged: number;
    status: string;
    committee: string;
}

export interface AssetDisposalRecord {
    id: string;
    date: string;
    asset: string;
    assetId: string;
    method: string;
    reason: string;
    originalValue: string;
    disposalValue: string;
    status: string;
    approvedBy: string;
}

export const MOCK_ASSET_CATEGORIES = ["All Categories", "IT Equipment", "Lab Equipment", "Vehicles", "Furniture", "Equipment"];
export const MOCK_ASSET_STATUSES = ["All Status", "In Use", "Available", "Under Repair", "Disposed"];

export const MOCK_ASSETS: Asset[] = [
    { id: "AST-001", name: "Dell Laptop Latitude 5520", category: "IT Equipment", location: "IT Lab 1", assignedTo: "Computer Lab", purchaseDate: "2022-03-15", value: "KES 85,000", status: "In Use", condition: "Good" },
    { id: "AST-002", name: "HP LaserJet Pro M404n", category: "IT Equipment", location: "Admin Office", assignedTo: "Administration", purchaseDate: "2021-08-20", value: "KES 45,000", status: "In Use", condition: "Good" },
    { id: "AST-003", name: "Science Lab Microscope", category: "Lab Equipment", location: "Biology Lab", assignedTo: "Science Dept", purchaseDate: "2020-01-10", value: "KES 120,000", status: "In Use", condition: "Fair" },
    { id: "AST-004", name: "Toyota Hiace School Bus", category: "Vehicles", location: "Parking Lot", assignedTo: "Transport", purchaseDate: "2019-06-25", value: "KES 3,500,000", status: "In Use", condition: "Good" },
    { id: "AST-005", name: "Office Desk Executive", category: "Furniture", location: "Principal Office", assignedTo: "Administration", purchaseDate: "2021-02-14", value: "KES 35,000", status: "In Use", condition: "Good" },
    { id: "AST-006", name: "Projector Epson EB-X51", category: "IT Equipment", location: "Conference Room", assignedTo: "Administration", purchaseDate: "2023-01-08", value: "KES 75,000", status: "In Use", condition: "Excellent" },
    { id: "AST-007", name: "Air Conditioner LG 24000BTU", category: "Equipment", location: "Server Room", assignedTo: "IT Dept", purchaseDate: "2022-11-30", value: "KES 95,000", status: "In Use", condition: "Good" },
    { id: "AST-008", name: "Generator 50KVA", category: "Equipment", location: "Generator House", assignedTo: "Maintenance", purchaseDate: "2018-04-12", value: "KES 850,000", status: "Under Repair", condition: "Poor" },
];

export const MOCK_ASSET_LOCATIONS = [
    "Main Store", "IT Lab 1", "IT Lab 2", "Science Lab", "Biology Lab", "Chemistry Lab",
    "Admin Office", "Principal Office", "Conference Room", "Library", "Sports Store",
];

export const MOCK_ASSET_MOVEMENT_TYPES = ["Transfer", "Issue", "Return", "Temporary", "Disposal"];

export const MOCK_ASSET_MOVEMENTS: AssetMovementRecord[] = [
    { id: "MOV-2024-001", date: "2024-01-15", asset: "Dell Laptop Latitude 5520", assetId: "AST-001", from: "IT Lab 1", to: "Admin Office", type: "Transfer", status: "Completed", by: "Mr. Kamau" },
    { id: "MOV-2024-002", date: "2024-01-14", asset: "HP Printer LaserJet", assetId: "AST-002", from: "Store", to: "Science Lab", type: "Issue", status: "Completed", by: "Admin" },
    { id: "MOV-2024-003", date: "2024-01-13", asset: "Projector Epson", assetId: "AST-006", from: "Conference Room", to: "Hall", type: "Temporary", status: "Pending Return", by: "Mr. Ochieng" },
    { id: "MOV-2024-004", date: "2024-01-12", asset: "Office Chair", assetId: "AST-015", from: "Principal Office", to: "Store", type: "Return", status: "Completed", by: "Admin" },
    { id: "MOV-2024-005", date: "2024-01-10", asset: "Microscope Set", assetId: "AST-003", from: "Biology Lab", to: "Chemistry Lab", type: "Transfer", status: "In Transit", by: "Ms. Wanjiku" },
];

export const MOCK_ASSET_DETAIL: AssetDetailData = {
    id: "AST-001",
    name: "Dell Laptop Latitude 5520",
    category: "IT Equipment",
    subcategory: "Laptops",
    serialNumber: "SN-DL5520-2022-001",
    model: "Latitude 5520",
    manufacturer: "Dell Inc.",
    location: "IT Lab 1",
    assignedTo: "Computer Lab",
    custodian: "Mr. John Kamau",
    purchaseDate: "2022-03-15",
    warrantyExpiry: "2025-03-15",
    purchaseValue: "KES 85,000",
    currentValue: "KES 60,000",
    value: "KES 60,000",
    depreciationRate: "20%",
    status: "In Use",
    condition: "Good",
    lastVerified: "2024-01-10",
    description: "Dell Latitude 5520 Laptop, 15.6\" FHD, Intel Core i5-1145G7, 16GB RAM, 512GB SSD, Windows 11 Pro",
};

export const MOCK_MAINTENANCE_HISTORY: MaintenanceRecord[] = [
    { date: "2023-11-20", type: "Repair", description: "Keyboard replacement", cost: "KES 5,000", status: "Completed" },
    { date: "2023-06-10", type: "Service", description: "Annual maintenance", cost: "KES 2,000", status: "Completed" },
    { date: "2022-12-05", type: "Upgrade", description: "RAM upgrade to 16GB", cost: "KES 8,000", status: "Completed" },
];

export const MOCK_SURVEYS: SurveyRecord[] = [
    { id: "BOS-2024-001", date: "2024-01-10", title: "Annual Asset Verification Q1", type: "Annual", assets: 125, verified: 120, missing: 3, damaged: 2, status: "Completed", committee: "Mr. Kamau, Ms. Wanjiku, Mr. Ochieng" },
    { id: "BOS-2024-002", date: "2024-01-15", title: "IT Equipment Survey", type: "Category", assets: 85, verified: 70, missing: 0, damaged: 5, status: "In Progress", committee: "Mr. Njoroge, Ms. Akinyi" },
    { id: "BOS-2023-012", date: "2023-12-20", title: "End of Year Survey", type: "Annual", assets: 1248, verified: 1235, missing: 8, damaged: 5, status: "Completed", committee: "Principal, Bursar, HODs" },
    { id: "BOS-2023-011", date: "2023-11-15", title: "Laboratory Equipment Check", type: "Category", assets: 156, verified: 156, missing: 0, damaged: 12, status: "Completed", committee: "Science HOD, Lab Technician" },
];

export const MOCK_SURVEY_TYPES = ["Annual", "Category", "Spot Check", "Disposal Review"];

export const MOCK_ASSET_DISPOSAL_METHODS = ["Auction", "Sale", "Write-off", "Donation", "Trade-in", "Scrap"];

export const MOCK_ASSET_DISPOSAL_REASONS = ["Obsolete/End of Life", "Damaged Beyond Repair", "Upgraded", "Missing", "Surplus", "Other"];

export const MOCK_ASSET_DISPOSALS: AssetDisposalRecord[] = [
    { id: "DSP-2024-001", date: "2024-01-12", asset: "HP Laptop ProBook 450", assetId: "AST-045", method: "Auction", reason: "Obsolete/End of Life", originalValue: "KES 65,000", disposalValue: "KES 8,000", status: "Completed", approvedBy: "Principal" },
    { id: "DSP-2024-002", date: "2024-01-14", asset: "Office Chair (Broken)", assetId: "AST-089", method: "Write-off", reason: "Damaged Beyond Repair", originalValue: "KES 15,000", disposalValue: "KES 0", status: "Pending Approval", approvedBy: "-" },
    { id: "DSP-2023-015", date: "2023-12-20", asset: "Generator 25KVA", assetId: "AST-012", method: "Sale", reason: "Upgraded", originalValue: "KES 450,000", disposalValue: "KES 120,000", status: "Completed", approvedBy: "Board of Directors" },
    { id: "DSP-2023-014", date: "2023-12-15", asset: "Printer Canon LBP", assetId: "AST-078", method: "Donation", reason: "Obsolete", originalValue: "KES 35,000", disposalValue: "KES 0", status: "Completed", approvedBy: "Principal" },
    { id: "DSP-2024-003", date: "2024-01-15", asset: "Lab Equipment Set", assetId: "AST-156", method: "Trade-in", reason: "Upgrade", originalValue: "KES 180,000", disposalValue: "KES 50,000", status: "In Process", approvedBy: "Bursar" },
];
