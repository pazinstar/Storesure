export type UserRole = "headteacher" | "bursar" | "storekeeper" | "librarian" | "auditor" | "procurement_officer" | "admin";

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    schoolId?: string;
}

export const MOCK_USERS: Record<string, { password: string; user: User }> = {
    "admin@shools.ac.ke": {
        password: "Admin@2026",
        user: { id: "0", name: "Super Administrator", email: "admin@shools.ac.ke", role: "admin" },
    },
    "headteacher@school.ac.ke": {
        password: "demo123",
        user: { id: "1", name: "Dr. Jane Mwangi", email: "headteacher@school.ac.ke", role: "headteacher", schoolId: "1" },
    },
    "bursar@school.ac.ke": {
        password: "demo123",
        user: { id: "2", name: "Peter Ochieng", email: "bursar@school.ac.ke", role: "bursar", schoolId: "1" },
    },
    "storekeeper@school.ac.ke": {
        password: "demo123",
        user: { id: "3", name: "Mary Wanjiku", email: "storekeeper@school.ac.ke", role: "storekeeper", schoolId: "1" },
    },
    "librarian@school.ac.ke": {
        password: "demo123",
        user: { id: "4", name: "John Kamau", email: "librarian@school.ac.ke", role: "librarian", schoolId: "1" },
    },
    "auditor@school.ac.ke": {
        password: "demo123",
        user: { id: "5", name: "Sarah Njeri", email: "auditor@school.ac.ke", role: "auditor", schoolId: "1" },
    },
    "procurement@school.ac.ke": {
        password: "demo123",
        user: { id: "6", name: "David Kipchoge", email: "procurement@school.ac.ke", role: "procurement_officer", schoolId: "1" },
    },
    "admin@school.ac.ke": {
        password: "demo123",
        user: { id: "7", name: "System Admin", email: "admin@school.ac.ke", role: "admin" },
    },
    "head@riverside.edu": {
        password: "demo123",
        user: { id: "8", name: "Mr. Peter Ochieng", email: "head@riverside.edu", role: "headteacher", schoolId: "2" },
    },
};
