export interface KPICardData {
    title: string;
    value: string;
    trend: string;
    trendUp: boolean;
    type: string;
}

export interface ReportItem {
    id: number;
    title: string;
    description: string;
    date: string;
    type: string;
    iconName: string;
}

export interface ReportStat {
    label: string;
    value: string;
    change: string;
}

export const MOCK_REPORTS: ReportItem[] = [
    { id: 1, title: "Monthly Inventory Report", description: "Complete overview of inventory status and movements", date: "January 2024", type: "Monthly", iconName: "FileText" },
    { id: 2, title: "Low Stock Items", description: "Items that need immediate restocking attention", date: "Current", type: "Alert", iconName: "AlertCircle" },
    { id: 3, title: "Category Analysis", description: "Breakdown of inventory by category and usage", date: "Q4 2023", type: "Quarterly", iconName: "Package" },
    { id: 4, title: "Usage Trends", description: "Historical data on item checkouts and returns", date: "2023", type: "Annual", iconName: "TrendingUp" },
];

export const MOCK_QUICK_STATS: ReportStat[] = [
    { label: "Total Items", value: "2,346", change: "+12%" },
    { label: "Value", value: "$127,450", change: "+8%" },
    { label: "Categories", value: "12", change: "0%" },
    { label: "Locations", value: "48", change: "+3%" },
];

export const MOCK_KPIS = {
    storekeeper: [
        { title: "Total Store Items", value: "12,458", trend: "+5.2% from last quarter", trendUp: true, type: "Package" },
        { title: "Low Stock Alerts", value: "23", trend: "5 critical", trendUp: false, type: "AlertTriangle" },
        { title: "Pending Issues", value: "18", trend: "3 urgent S12 requests", trendUp: false, type: "Warehouse" },
        { title: "Today's Transactions", value: "42", trend: "12 received, 30 issued", trendUp: true, type: "ClipboardCheck" }
    ],
    librarian: [
        { title: "Library Holdings", value: "8,234", trend: "+124 new books this term", trendUp: true, type: "BookOpen" },
        { title: "Books on Loan", value: "342", trend: "28 due today", trendUp: false, type: "BookCheck" },
        { title: "Overdue Books", value: "47", trend: "12 over 2 weeks", trendUp: false, type: "AlertTriangle" },
        { title: "Active Borrowers", value: "286", trend: "+15 this week", trendUp: true, type: "Users" }
    ],
    procurement_officer: [
        { title: "Active Requisitions", value: "34", trend: "8 pending approval", trendUp: false, type: "FileText" },
        { title: "Pending My Action", value: "12", trend: "5 awaiting processing", trendUp: false, type: "ClipboardCheck" },
        { title: "This Month's Value", value: "KES 1.2M", trend: "+18% from last month", trendUp: true, type: "ShoppingCart" },
        { title: "Compliance Score", value: "96%", trend: "PPADA 2015 compliant", trendUp: true, type: "TrendingUp" }
    ],
    bursar: [
        { title: "Monthly Expenditure", value: "KES 2.8M", trend: "-12% under budget", trendUp: true, type: "DollarSign" },
        { title: "Pending Approvals", value: "12", trend: "3 urgent", trendUp: false, type: "AlertTriangle" },
        { title: "Active Procurement", value: "34", trend: "8 pending approval", trendUp: false, type: "FileText" },
        { title: "Fixed Assets Value", value: "KES 45.2M", trend: "+2.1% depreciation", trendUp: false, type: "Building2" }
    ],
    auditor: [
        { title: "Total Transactions", value: "1,847", trend: "This quarter", trendUp: true, type: "ClipboardCheck" },
        { title: "Compliance Score", value: "94%", trend: "PPADA 2015 compliant", trendUp: true, type: "TrendingUp" },
        { title: "Flagged Items", value: "7", trend: "Require review", trendUp: false, type: "AlertTriangle" },
        { title: "Audit Coverage", value: "78%", trend: "22% pending review", trendUp: true, type: "FileText" }
    ],
    admin: [
        { title: "Total Store Items", value: "12,458", trend: "+5.2% from last quarter", trendUp: true, type: "Package" },
        { title: "Active Procurement", value: "34", trend: "8 pending approval", trendUp: false, type: "FileText" },
        { title: "Fixed Assets Value", value: "KES 45.2M", trend: "+2.1% depreciation", trendUp: false, type: "Building2" },
        { title: "Library Holdings", value: "8,234", trend: "342 on loan", trendUp: true, type: "BookOpen" },
        { title: "Monthly Expenditure", value: "KES 2.8M", trend: "-12% under budget", trendUp: true, type: "DollarSign" },
        { title: "Compliance Score", value: "94%", trend: "PPADA 2015 compliant", trendUp: true, type: "TrendingUp" },
        { title: "Pending Approvals", value: "12", trend: "3 urgent", trendUp: false, type: "AlertTriangle" },
        { title: "Active Users", value: "28", trend: "6 online now", trendUp: true, type: "Users" }
    ]
};

export const STORE_REPORTS_MOCK = [
    {
        id: 1,
        title: "Stock Balance Report",
        description: "Current stock levels for all items in the selected store",
        icon: "Scale",
        category: "Inventory",
        lastGenerated: "Today",
    },
    {
        id: 2,
        title: "S11 Summary Report",
        description: "Summary of all goods received (S11) within a period",
        icon: "ArrowDownToLine",
        category: "Receipts",
        lastGenerated: "2 days ago",
    },
    {
        id: 3,
        title: "S13 Summary Report",
        description: "Summary of all stock issues (S13) within a period",
        icon: "ArrowUpFromLine",
        category: "Issues",
        lastGenerated: "1 day ago",
    },
    {
        id: 4,
        title: "Transfer Summary",
        description: "All inter-store transfers within the selected period",
        icon: "ArrowLeftRight",
        category: "Transfers",
        lastGenerated: "3 days ago",
    },
    {
        id: 5,
        title: "Low Stock Report",
        description: "Items below reorder level requiring restocking",
        icon: "AlertTriangle",
        category: "Alerts",
        lastGenerated: "Today",
    },
    {
        id: 6,
        title: "Expiring Items Report",
        description: "Items approaching or past expiry date",
        icon: "Clock",
        category: "Alerts",
        lastGenerated: "Weekly",
    },
];
