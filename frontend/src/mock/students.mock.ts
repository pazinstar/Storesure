export interface Student {
    id: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female';
    class: string;
    stream?: string;
    admissionDate: string;
    parentName: string;
    parentPhone: string;
    parentEmail?: string;
    address: string;
    status: 'active' | 'inactive' | 'transferred' | 'graduated';
    photoUrl?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export type DistributionStatus = "Draft" | "Submitted" | "Approved" | "Distributed" | "Locked";

export interface DistributionRecord {
    id: string;
    date: string;
    class: string;
    stream: string;
    itemType: string;
    itemName: string;
    quantityIssued: number;
    studentsCount: number;
    issuedBy: string;
    receivedBy: string;
    status: DistributionStatus;
}

export interface DistributionRegisterRecord {
    id: string;
    date: string;
    class: string;
    item: string;
    qty: number;
    teacher: string;
    signature: string;
}

export interface NotCollectedRecord {
    admNo: string;
    name: string;
    class: string;
    item: string;
    reason: string;
    daysOverdue: number;
}

export interface ReplacementRecord {
    id: string;
    date: string;
    admNo: string;
    name: string;
    class: string;
    item: string;
    reason: string;
    approvedBy: string;
    status: string;
}

export const MOCK_STUDENTS: Student[] = [
    {
        id: '1',
        admissionNo: 'ADM-2024-001',
        firstName: 'John',
        lastName: 'Kamau',
        dateOfBirth: '2010-03-15',
        gender: 'male',
        class: 'Grade 10',
        stream: 'East',
        admissionDate: '2024-01-10',
        parentName: 'Peter Kamau',
        parentPhone: '+254 722 123 456',
        parentEmail: 'peter.kamau@email.com',
        address: '123 Nairobi Road, Nairobi',
        status: 'active',
        createdAt: '2024-01-10',
        updatedAt: '2024-01-10',
    },
    {
        id: '2',
        admissionNo: 'ADM-2024-002',
        firstName: 'Mary',
        lastName: 'Wanjiku',
        dateOfBirth: '2009-07-22',
        gender: 'female',
        class: 'Grade 11',
        stream: 'West',
        admissionDate: '2023-01-15',
        parentName: 'Jane Wanjiku',
        parentPhone: '+254 733 234 567',
        address: '456 Mombasa Road, Nairobi',
        status: 'active',
        createdAt: '2023-01-15',
        updatedAt: '2024-06-01',
    },
    {
        id: '3',
        admissionNo: 'ADM-2023-015',
        firstName: 'David',
        lastName: 'Ochieng',
        dateOfBirth: '2008-11-30',
        gender: 'male',
        class: 'Form 3',
        stream: 'North',
        admissionDate: '2022-01-12',
        parentName: 'Samuel Ochieng',
        parentPhone: '+254 711 345 678',
        parentEmail: 'samuel.o@email.com',
        address: '789 Kisumu Road, Kisumu',
        status: 'active',
        createdAt: '2022-01-12',
        updatedAt: '2024-03-15',
    },
    {
        id: '4',
        admissionNo: 'ADM-2022-008',
        firstName: 'Grace',
        lastName: 'Muthoni',
        dateOfBirth: '2007-05-18',
        gender: 'female',
        class: 'Form 4',
        stream: 'South',
        admissionDate: '2021-01-08',
        parentName: 'James Muthoni',
        parentPhone: '+254 700 456 789',
        address: '321 Eldoret Highway, Eldoret',
        status: 'active',
        createdAt: '2021-01-08',
        updatedAt: '2024-01-20',
    },
    {
        id: '5',
        admissionNo: 'ADM-2023-022',
        firstName: 'Brian',
        lastName: 'Kiprop',
        dateOfBirth: '2010-09-05',
        gender: 'male',
        class: 'Grade 10',
        stream: 'West',
        admissionDate: '2024-01-10',
        parentName: 'Robert Kiprop',
        parentPhone: '+254 720 567 890',
        address: '555 Nakuru Road, Nakuru',
        status: 'transferred',
        notes: 'Transferred to Starehe Boys Centre',
        createdAt: '2024-01-10',
        updatedAt: '2024-06-15',
    },
];

export const MOCK_RECENT_DISTRIBUTIONS: DistributionRecord[] = [
    { id: "DIST-2024-001", date: "2024-01-15", class: "Grade 10", stream: "East", itemType: "Exercise Books", itemName: "Counter Book 96 Pages", quantityIssued: 45, studentsCount: 45, issuedBy: "J. Kamau", receivedBy: "Mrs. Wanjiku", status: "Distributed" },
    { id: "DIST-2024-002", date: "2024-01-15", class: "Grade 11", stream: "West", itemType: "Writing Materials", itemName: "Ball Pens (Blue)", quantityIssued: 90, studentsCount: 45, issuedBy: "J. Kamau", receivedBy: "Mr. Omondi", status: "Distributed" },
    { id: "DIST-2024-003", date: "2024-01-14", class: "Form 3", stream: "North", itemType: "Exercise Books", itemName: "Graph Book A4", quantityIssued: 40, studentsCount: 40, issuedBy: "M. Ochieng", receivedBy: "Ms. Achieng", status: "Approved" },
    { id: "DIST-2024-004", date: "2024-01-14", class: "Form 4", stream: "South", itemType: "Exercise Books", itemName: "Science Practical Book", quantityIssued: 38, studentsCount: 38, issuedBy: "J. Kamau", receivedBy: "", status: "Draft" },
    { id: "DIST-2024-005", date: "2024-01-13", class: "Grade 10", stream: "West", itemType: "Writing Materials", itemName: "Mathematical Set", quantityIssued: 42, studentsCount: 42, issuedBy: "J. Kamau", receivedBy: "Mr. Kiprop", status: "Locked" },
];

export const MOCK_DISTRIBUTION_REGISTER: DistributionRegisterRecord[] = [
    { id: "DIST-2024-001", date: "2024-01-15", class: "Grade 10", item: "Counter Book 96 Pages", qty: 45, teacher: "Mrs. Wanjiku", signature: "✓" },
    { id: "DIST-2024-002", date: "2024-01-15", class: "Grade 11", item: "Ball Pens (Blue)", qty: 90, teacher: "Mr. Omondi", signature: "✓" },
    { id: "DIST-2024-003", date: "2024-01-14", class: "Form 3", item: "Graph Book A4", qty: 40, teacher: "Ms. Achieng", signature: "✓" },
    { id: "DIST-2024-004", date: "2024-01-14", class: "Form 4", item: "Science Practical Book", qty: 38, teacher: "Mr. Mutua", signature: "✓" },
    { id: "DIST-2024-005", date: "2024-01-13", class: "Grade 10", item: "Mathematical Set", qty: 42, teacher: "Mr. Kiprop", signature: "✓" },
    { id: "DIST-2024-006", date: "2024-01-12", class: "Grade 11", item: "Ruled Exercise Book 96 Pages", qty: 44, teacher: "Mrs. Njeri", signature: "✓" },
    { id: "DIST-2024-007", date: "2024-01-11", class: "Form 3", item: "Pencils HB", qty: 80, teacher: "Mr. Otieno", signature: "✓" },
];

export const MOCK_NOT_COLLECTED_LIST: NotCollectedRecord[] = [
    { admNo: "2024/001", name: "James Mwangi", class: "Grade 10", item: "Counter Book 96 Pages", reason: "Absent", daysOverdue: 3 },
    { admNo: "2024/015", name: "Faith Wambui", class: "Grade 10", item: "Counter Book 96 Pages", reason: "Medical Leave", daysOverdue: 5 },
    { admNo: "2024/042", name: "Peter Ochieng", class: "Grade 11", item: "Ball Pens (Blue)", reason: "Absent", daysOverdue: 2 },
    { admNo: "2024/078", name: "Grace Akinyi", class: "Form 3", item: "Graph Book A4", reason: "Suspended", daysOverdue: 7 },
    { admNo: "2024/103", name: "David Kimani", class: "Form 4", item: "Science Practical Book", reason: "Absent", daysOverdue: 1 },
];

export const MOCK_REPLACEMENT_HISTORY: ReplacementRecord[] = [
    { id: "RPL-2024-001", date: "2024-01-14", admNo: "2024/023", name: "Mary Njoki", class: "Grade 11", item: "Counter Book 96 Pages", reason: "Lost", approvedBy: "Mrs. Kamau", status: "Issued" },
    { id: "RPL-2024-002", date: "2024-01-13", admNo: "2024/056", name: "John Odhiambo", class: "Form 3", item: "Mathematical Set", reason: "Damaged", approvedBy: "Mr. Wekesa", status: "Issued" },
    { id: "RPL-2024-003", date: "2024-01-12", admNo: "2024/089", name: "Sarah Wanjiru", class: "Grade 10", item: "Graph Book A4", reason: "Stolen", approvedBy: "Mrs. Kamau", status: "Pending" },
    { id: "RPL-2024-004", date: "2024-01-11", admNo: "2024/034", name: "Michael Kipchoge", class: "Form 4", item: "Science Practical Book", reason: "Worn Out", approvedBy: "Mr. Wekesa", status: "Issued" },
    { id: "RPL-2024-005", date: "2024-01-10", admNo: "2024/067", name: "Lucy Chebet", class: "Grade 11", item: "Ball Pens (Blue)", reason: "Lost", approvedBy: "Mrs. Kamau", status: "Rejected" },
];
