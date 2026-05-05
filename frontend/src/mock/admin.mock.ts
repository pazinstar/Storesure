import { UserRole } from "../contexts/AuthContext";

export interface ManagedUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: "active" | "inactive";
    createdAt: string;
    lastLogin?: string;
    department?: string;
    assignedStores?: string[]; // Array of store IDs
}

export interface Store {
    id: string;
    name: string;
    code: string;
    location: string;
    managerId?: string;
    managerName?: string;
    status: "active" | "inactive";
    createdAt: string;
    description?: string;
}

export interface Library {
    id: string;
    name: string;
    code: string;
    location: string;
    managerId?: string;
    managerName?: string;
    status: "active" | "inactive";
    createdAt: string;
    capacity?: number;
    description?: string;
}

export interface Department {
    id: string;
    name: string;
    code: string;
    headId?: string;
    headName?: string;
    status: "active" | "inactive";
    createdAt: string;
    description?: string;
    parentId?: string;
}

export interface Permission {
    id: string;
    name: string;
    code: string;
    module: string;
    description: string;
}

export interface CommitteeMember {
    userId: string;
    userName: string;
    designation: string;
    order: number;
}

export interface InspectionCommittee {
    members: CommitteeMember[];
    isActive: boolean;
    updatedAt?: string;
}

export interface RolePermission {
    role: UserRole;
    roleLabel: string;
    permissions: string[];
    description: string;
}

export const ADMIN_STORES: Store[] = [
    {
        id: "store-1",
        name: "Main Store",
        code: "MS001",
        location: "Administration Block, Ground Floor",
        managerId: "3",
        managerName: "Mary Wanjiku",
        status: "active",
        createdAt: "2024-01-01T00:00:00.000Z",
        description: "Central storage for all school supplies",
    },
    {
        id: "store-2",
        name: "Science Laboratory Store",
        code: "SLS001",
        location: "Science Block, Room 5",
        status: "active",
        createdAt: "2024-02-15T00:00:00.000Z",
        description: "Storage for laboratory equipment and chemicals",
    },
    {
        id: "store-3",
        name: "Sports Equipment Store",
        code: "SES001",
        location: "Sports Complex",
        status: "active",
        createdAt: "2024-03-01T00:00:00.000Z",
        description: "Storage for sports equipment and uniforms",
    },
];

export const ADMIN_LIBRARIES: Library[] = [
    {
        id: "lib-1",
        name: "Main Library",
        code: "ML001",
        location: "Library Block, First Floor",
        managerId: "4",
        managerName: "John Kamau",
        status: "active",
        createdAt: "2024-01-01T00:00:00.000Z",
        capacity: 500,
        description: "Central library with reading rooms and reference section",
    },
    {
        id: "lib-2",
        name: "Junior Library",
        code: "JL001",
        location: "Junior Block, Ground Floor",
        status: "active",
        createdAt: "2024-02-01T00:00:00.000Z",
        capacity: 150,
        description: "Library for junior students with age-appropriate materials",
    },
];

export const ADMIN_DEPARTMENTS: Department[] = [
    {
        id: "dept-1",
        name: "Administration",
        code: "ADMIN",
        status: "active",
        createdAt: "2024-01-01T00:00:00.000Z",
        description: "School administration and management",
    },
    {
        id: "dept-2",
        name: "Finance",
        code: "FIN",
        status: "active",
        createdAt: "2024-01-01T00:00:00.000Z",
        description: "Financial management and accounting",
    },
    {
        id: "dept-3",
        name: "Academic",
        code: "ACAD",
        status: "active",
        createdAt: "2024-01-01T00:00:00.000Z",
        description: "Teaching and curriculum management",
    },
    {
        id: "dept-4",
        name: "Stores",
        code: "STR",
        status: "active",
        createdAt: "2024-01-01T00:00:00.000Z",
        description: "Inventory and supplies management",
    },
    {
        id: "dept-5",
        name: "Library",
        code: "LIB",
        status: "active",
        createdAt: "2024-01-01T00:00:00.000Z",
        description: "Library services and book management",
    },
    {
        id: "dept-6",
        name: "Procurement",
        code: "PROC",
        status: "active",
        createdAt: "2024-01-01T00:00:00.000Z",
        description: "Purchasing and supplier management",
    },
    {
        id: "dept-7",
        name: "Audit",
        code: "AUD",
        status: "active",
        createdAt: "2024-01-01T00:00:00.000Z",
        description: "Internal audit and compliance",
    },
];

export const ADMIN_PERMISSIONS: Permission[] = [
    { id: "p1", name: "View Dashboard", code: "dashboard.view", module: "Dashboard", description: "Access the main dashboard" },
    { id: "p2", name: "View Procurement", code: "procurement.view", module: "Procurement", description: "View procurement module" },
    { id: "p3", name: "Create Requisitions", code: "procurement.requisitions.create", module: "Procurement", description: "Create new requisitions" },
    { id: "p4", name: "Approve Requisitions", code: "procurement.requisitions.approve", module: "Procurement", description: "Approve requisitions" },
    { id: "p5", name: "Manage LPOs", code: "procurement.lpo.manage", module: "Procurement", description: "Create and manage LPOs" },
    { id: "p6", name: "Manage Contracts", code: "procurement.contracts.manage", module: "Procurement", description: "Manage contracts" },
    { id: "p7", name: "View Stores", code: "stores.view", module: "Stores", description: "View stores module" },
    { id: "p8", name: "Receive Stock", code: "stores.receive", module: "Stores", description: "Receive stock into stores" },
    { id: "p9", name: "Issue Stock", code: "stores.issue", module: "Stores", description: "Issue stock from stores" },
    { id: "p10", name: "Manage Items", code: "stores.items.manage", module: "Stores", description: "Add and edit store items" },
    { id: "p11", name: "View Stock Balances", code: "stores.balances.view", module: "Stores", description: "View stock balances" },
    { id: "p12", name: "Make Adjustments", code: "stores.adjustments", module: "Stores", description: "Make stock adjustments" },
    { id: "p13", name: "View Assets", code: "assets.view", module: "Assets", description: "View assets module" },
    { id: "p14", name: "Manage Assets", code: "assets.manage", module: "Assets", description: "Add and edit assets" },
    { id: "p15", name: "Asset Movement", code: "assets.movement", module: "Assets", description: "Record asset movements" },
    { id: "p16", name: "Approve Disposal", code: "assets.disposal.approve", module: "Assets", description: "Approve asset disposal" },
    { id: "p17", name: "View Library", code: "library.view", module: "Library", description: "View library module" },
    { id: "p18", name: "Manage Catalogue", code: "library.catalogue.manage", module: "Library", description: "Manage book catalogue" },
    { id: "p19", name: "Issue/Return Books", code: "library.circulation", module: "Library", description: "Issue and return books" },
    { id: "p20", name: "Branch Transfers", code: "library.transfers", module: "Library", description: "Transfer books between branches" },
    { id: "p21", name: "User Management", code: "admin.users", module: "Admin", description: "Manage system users" },
    { id: "p22", name: "System Settings", code: "admin.settings", module: "Admin", description: "Configure system settings" },
    { id: "p23", name: "View Audit Logs", code: "admin.audit", module: "Admin", description: "View system audit logs" },
    { id: "p24", name: "Manage Stores/Libraries", code: "admin.entities", module: "Admin", description: "Manage stores, libraries, departments" },
    { id: "p25", name: "View Reports", code: "reports.view", module: "Reports", description: "View all reports" },
    { id: "p26", name: "Export Reports", code: "reports.export", module: "Reports", description: "Export reports to files" },
];

export const ADMIN_ROLE_PERMISSIONS: RolePermission[] = [
    {
        role: "admin",
        roleLabel: "Administrator",
        permissions: ADMIN_PERMISSIONS.map(p => p.code),
        description: "Full system access - can manage all modules and settings",
    },
    {
        role: "headteacher",
        roleLabel: "Headteacher",
        permissions: [
            "dashboard.view", "procurement.view", "procurement.requisitions.approve", "procurement.lpo.manage",
            "procurement.contracts.manage", "stores.view", "stores.balances.view", "assets.view", "assets.disposal.approve",
            "library.view", "admin.users", "admin.settings", "admin.audit", "admin.entities", "reports.view", "reports.export"
        ],
        description: "School principal with oversight of all departments and approval authority",
    },
    {
        role: "bursar",
        roleLabel: "Bursar",
        permissions: [
            "dashboard.view", "procurement.view", "procurement.requisitions.create", "procurement.lpo.manage",
            "stores.view", "stores.balances.view", "assets.view", "reports.view", "reports.export"
        ],
        description: "Financial officer responsible for budgets and payments",
    },
    {
        role: "storekeeper",
        roleLabel: "Storekeeper",
        permissions: [
            "dashboard.view", "stores.view", "stores.receive", "stores.issue", "stores.items.manage",
            "stores.balances.view", "stores.adjustments", "assets.view", "assets.manage", "assets.movement", "reports.view"
        ],
        description: "Manages store inventory and stock movements",
    },
    {
        role: "librarian",
        roleLabel: "Librarian",
        permissions: [
            "dashboard.view", "library.view", "library.catalogue.manage", "library.circulation",
            "library.transfers", "reports.view"
        ],
        description: "Manages library resources and book circulation",
    },
    {
        role: "auditor",
        roleLabel: "Auditor",
        permissions: [
            "dashboard.view", "procurement.view", "stores.view", "stores.balances.view", "assets.view",
            "library.view", "admin.audit", "reports.view", "reports.export"
        ],
        description: "Reviews transactions and ensures compliance",
    },
    {
        role: "procurement_officer",
        roleLabel: "Procurement Officer",
        permissions: [
            "dashboard.view", "procurement.view", "procurement.requisitions.create", "procurement.lpo.manage",
            "procurement.contracts.manage", "reports.view"
        ],
        description: "Handles purchasing and supplier relationships",
    },
];

export const ADMIN_USERS: ManagedUser[] = [
    {
        id: "0",
        name: "Super Administrator",
        email: "admin@shools.ac.ke",
        role: "admin",
        status: "active",
        createdAt: "2024-01-01T00:00:00.000Z",
        lastLogin: "2025-01-15T00:00:00.000Z",
        department: "Administration",
    },
    {
        id: "1",
        name: "Dr. Jane Mwangi",
        email: "headteacher@school.ac.ke",
        role: "headteacher",
        status: "active",
        createdAt: "2024-01-15T00:00:00.000Z",
        lastLogin: "2025-01-10T00:00:00.000Z",
        department: "Administration",
    },
    {
        id: "2",
        name: "Peter Ochieng",
        email: "bursar@school.ac.ke",
        role: "bursar",
        status: "active",
        createdAt: "2024-02-01T00:00:00.000Z",
        lastLogin: "2025-01-12T00:00:00.000Z",
        department: "Finance",
    },
    {
        id: "3",
        name: "Mary Wanjiku",
        email: "storekeeper@school.ac.ke",
        role: "storekeeper",
        status: "active",
        createdAt: "2024-02-15T00:00:00.000Z",
        lastLogin: "2025-01-11T00:00:00.000Z",
        department: "Stores",
        assignedStores: ["store-1", "store-2"],
    },
    {
        id: "4",
        name: "John Kamau",
        email: "librarian@school.ac.ke",
        role: "librarian",
        status: "active",
        createdAt: "2024-03-01T00:00:00.000Z",
        lastLogin: "2025-01-09T00:00:00.000Z",
        department: "Library",
    },
    {
        id: "5",
        name: "Sarah Njeri",
        email: "auditor@school.ac.ke",
        role: "auditor",
        status: "active",
        createdAt: "2024-03-15T00:00:00.000Z",
        lastLogin: "2025-01-08T00:00:00.000Z",
        department: "Audit",
    },
    {
        id: "6",
        name: "David Kipchoge",
        email: "procurement@school.ac.ke",
        role: "procurement_officer",
        status: "active",
        createdAt: "2024-04-01T00:00:00.000Z",
        lastLogin: "2025-01-07T00:00:00.000Z",
        department: "Procurement",
    },
];
