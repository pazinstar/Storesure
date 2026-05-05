import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storesure_backend.settings')
django.setup()

from roles.admin.users.models import SystemUser
from roles.admin.dashboard.models import (
    StoreLocation, Library, Department, Permission, RolePermission
)
from roles.storekeeper.stores.models import InventorySetting

def populate():
    print("Populating Inventory Settings...")
    settings_data = {
        "categories": ["All Categories", "Stationery", "IT Supplies", "Cleaning", "Laboratory", "Sports"],
        "units": ["Ream", "Box", "Unit", "Liter", "Piece", "Pack", "Kg", "Meter"],
        "locationTypes": ["Stores", "Library", "Department"],
        "storeLocations": ["Main Store", "Sports Store", "Science Store", "Kitchen Store", "Maintenance Store"],
        "libraryLocations": ["Main Library", "Junior Library", "Reference Section", "Archives"],
        "departmentLocations": ["Administration", "Science Department", "Arts Department", "Technical Department", "Sports Department"],
        "assetTypes": ["Consumable", "Permanent", "Fixed Asset"],
        "paymentTermsOptions": [
            { "value": "cod", "label": "Cash on Delivery" },
            { "value": "net30", "label": "Net 30 Days" },
            { "value": "net60", "label": "Net 60 Days" },
            { "value": "advance50", "label": "50% Advance" },
        ],
        "adjustmentReasons": [
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
    }
    for key, value in settings_data.items():
        InventorySetting.objects.update_or_create(key=key, defaults={'value': value})

    print("Populating Admin Users...")
    admin_users = [
        {"id": "0", "name": "Super Administrator", "username": "admin", "email": "admin@shools.ac.ke", "role": "admin", "status": "active", "department": "Administration"},
        {"id": "1", "name": "Dr. Jane Mwangi", "username": "headteacher", "email": "headteacher@school.ac.ke", "role": "headteacher", "status": "active", "department": "Administration"},
        {"id": "2", "name": "Peter Ochieng", "username": "bursar", "email": "bursar@school.ac.ke", "role": "bursar", "status": "active", "department": "Finance"},
        {"id": "3", "name": "Mary Wanjiku", "username": "storekeeper", "email": "storekeeper@school.ac.ke", "role": "storekeeper", "status": "active", "department": "Stores", "assignedStores": ["store-1", "store-2"]},
        {"id": "4", "name": "John Kamau", "username": "librarian", "email": "librarian@school.ac.ke", "role": "librarian", "status": "active", "department": "Library"},
        {"id": "5", "name": "Sarah Njeri", "username": "auditor", "email": "auditor@school.ac.ke", "role": "auditor", "status": "active", "department": "Audit"},
        {"id": "6", "name": "David Kipchoge", "username": "procurement", "email": "procurement@school.ac.ke", "role": "procurement_officer", "status": "active", "department": "Procurement"},
    ]
    for u in admin_users:
        SystemUser.objects.update_or_create(id=u['id'], defaults=u)

    print("Populating Stores...")
    admin_stores = [
        {"id": "store-1", "name": "Main Store", "code": "MS001", "location": "Administration Block, Ground Floor", "managerId": "3", "managerName": "Mary Wanjiku", "status": "active", "description": "Central storage for all school supplies"},
        {"id": "store-2", "name": "Science Laboratory Store", "code": "SLS001", "location": "Science Block, Room 5", "status": "active", "description": "Storage for laboratory equipment and chemicals"},
        {"id": "store-3", "name": "Sports Equipment Store", "code": "SES001", "location": "Sports Complex", "status": "active", "description": "Storage for sports equipment and uniforms"},
    ]
    for s in admin_stores:
        StoreLocation.objects.update_or_create(id=s['id'], defaults=s)

    print("Populating Libraries...")
    admin_libraries = [
        {"id": "lib-1", "name": "Main Library", "code": "ML001", "location": "Library Block, First Floor", "managerId": "4", "managerName": "John Kamau", "status": "active", "capacity": 500, "description": "Central library with reading rooms and reference section"},
        {"id": "lib-2", "name": "Junior Library", "code": "JL001", "location": "Junior Block, Ground Floor", "status": "active", "capacity": 150, "description": "Library for junior students with age-appropriate materials"},
    ]
    for l in admin_libraries:
        Library.objects.update_or_create(id=l['id'], defaults=l)

    print("Populating Departments...")
    admin_departments = [
        {"id": "dept-1", "name": "Administration", "code": "ADMIN", "status": "active", "description": "School administration and management"},
        {"id": "dept-2", "name": "Finance", "code": "FIN", "status": "active", "description": "Financial management and accounting"},
        {"id": "dept-3", "name": "Academic", "code": "ACAD", "status": "active", "description": "Teaching and curriculum management"},
        {"id": "dept-4", "name": "Stores", "code": "STR", "status": "active", "description": "Inventory and supplies management"},
        {"id": "dept-5", "name": "Library", "code": "LIB", "status": "active", "description": "Library services and book management"},
        {"id": "dept-6", "name": "Procurement", "code": "PROC", "status": "active", "description": "Purchasing and supplier management"},
        {"id": "dept-7", "name": "Audit", "code": "AUD", "status": "active", "description": "Internal audit and compliance"},
    ]
    for d in admin_departments:
        Department.objects.update_or_create(id=d['id'], defaults=d)

    print("Populating Permissions...")
    admin_permissions = [
        {"id": "p1", "name": "View Dashboard", "code": "dashboard.view", "module": "Dashboard", "description": "Access the main dashboard"},
        {"id": "p2", "name": "View Procurement", "code": "procurement.view", "module": "Procurement", "description": "View procurement module"},
        {"id": "p3", "name": "Create Requisitions", "code": "procurement.requisitions.create", "module": "Procurement", "description": "Create new requisitions"},
        {"id": "p4", "name": "Approve Requisitions", "code": "procurement.requisitions.approve", "module": "Procurement", "description": "Approve requisitions"},
        {"id": "p5", "name": "Manage LPOs", "code": "procurement.lpo.manage", "module": "Procurement", "description": "Create and manage LPOs"},
        {"id": "p6", "name": "Manage Contracts", "code": "procurement.contracts.manage", "module": "Procurement", "description": "Manage contracts"},
        {"id": "p7", "name": "View Stores", "code": "stores.view", "module": "Stores", "description": "View stores module"},
        {"id": "p8", "name": "Receive Stock", "code": "stores.receive", "module": "Stores", "description": "Receive stock into stores"},
        {"id": "p9", "name": "Issue Stock", "code": "stores.issue", "module": "Stores", "description": "Issue stock from stores"},
        {"id": "p10", "name": "Manage Items", "code": "stores.items.manage", "module": "Stores", "description": "Add and edit store items"},
        {"id": "p11", "name": "View Stock Balances", "code": "stores.balances.view", "module": "Stores", "description": "View stock balances"},
        {"id": "p12", "name": "Make Adjustments", "code": "stores.adjustments", "module": "Stores", "description": "Make stock adjustments"},
        {"id": "p13", "name": "View Assets", "code": "assets.view", "module": "Assets", "description": "View assets module"},
        {"id": "p14", "name": "Manage Assets", "code": "assets.manage", "module": "Assets", "description": "Add and edit assets"},
        {"id": "p15", "name": "Asset Movement", "code": "assets.movement", "module": "Assets", "description": "Record asset movements"},
        {"id": "p16", "name": "Approve Disposal", "code": "assets.disposal.approve", "module": "Assets", "description": "Approve asset disposal"},
        {"id": "p17", "name": "View Library", "code": "library.view", "module": "Library", "description": "View library module"},
        {"id": "p18", "name": "Manage Catalogue", "code": "library.catalogue.manage", "module": "Library", "description": "Manage book catalogue"},
        {"id": "p19", "name": "Issue/Return Books", "code": "library.circulation", "module": "Library", "description": "Issue and return books"},
        {"id": "p20", "name": "Branch Transfers", "code": "library.transfers", "module": "Library", "description": "Transfer books between branches"},
        {"id": "p21", "name": "User Management", "code": "admin.users", "module": "Admin", "description": "Manage system users"},
        {"id": "p22", "name": "System Settings", "code": "admin.settings", "module": "Admin", "description": "Configure system settings"},
        {"id": "p23", "name": "View Audit Logs", "code": "admin.audit", "module": "Admin", "description": "View system audit logs"},
        {"id": "p24", "name": "Manage Stores/Libraries", "code": "admin.entities", "module": "Admin", "description": "Manage stores, libraries, departments"},
        {"id": "p25", "name": "View Reports", "code": "reports.view", "module": "Reports", "description": "View all reports"},
        {"id": "p26", "name": "Export Reports", "code": "reports.export", "module": "Reports", "description": "Export reports to files"},
    ]
    for p in admin_permissions:
        Permission.objects.update_or_create(id=p['id'], defaults=p)

    print("Populating Role Permissions...")
    admin_role_permissions = [
        {"role": "admin", "roleLabel": "Administrator", "permissions": ["dashboard.view", "procurement.view", "procurement.requisitions.create", "procurement.requisitions.approve", "procurement.lpo.manage", "procurement.contracts.manage", "stores.view", "stores.receive", "stores.issue", "stores.items.manage", "stores.balances.view", "stores.adjustments", "assets.view", "assets.manage", "assets.movement", "assets.disposal.approve", "library.view", "library.catalogue.manage", "library.circulation", "library.transfers", "admin.users", "admin.settings", "admin.audit", "admin.entities", "reports.view", "reports.export"], "description": "Full system access - can manage all modules and settings"},
        {"role": "headteacher", "roleLabel": "Headteacher", "permissions": ["dashboard.view", "procurement.view", "procurement.requisitions.approve", "procurement.lpo.manage", "procurement.contracts.manage", "stores.view", "stores.balances.view", "assets.view", "assets.disposal.approve", "library.view", "admin.users", "admin.settings", "admin.audit", "admin.entities", "reports.view", "reports.export"], "description": "School principal with oversight of all departments and approval authority"},
        {"role": "bursar", "roleLabel": "Bursar", "permissions": ["dashboard.view", "procurement.view", "procurement.requisitions.create", "procurement.lpo.manage", "stores.view", "stores.balances.view", "assets.view", "reports.view", "reports.export"], "description": "Financial officer responsible for budgets and payments"},
        {"role": "storekeeper", "roleLabel": "Storekeeper", "permissions": ["dashboard.view", "stores.view", "stores.receive", "stores.issue", "stores.items.manage", "stores.balances.view", "stores.adjustments", "assets.view", "assets.manage", "assets.movement", "reports.view"], "description": "Manages store inventory and stock movements"},
        {"role": "librarian", "roleLabel": "Librarian", "permissions": ["dashboard.view", "library.view", "library.catalogue.manage", "library.circulation", "library.transfers", "reports.view"], "description": "Manages library resources and book circulation"},
        {"role": "auditor", "roleLabel": "Auditor", "permissions": ["dashboard.view", "procurement.view", "stores.view", "stores.balances.view", "assets.view", "library.view", "admin.audit", "reports.view", "reports.export"], "description": "Reviews transactions and ensures compliance"},
        {"role": "procurement_officer", "roleLabel": "Procurement Officer", "permissions": ["dashboard.view", "procurement.view", "procurement.requisitions.create", "procurement.lpo.manage", "procurement.contracts.manage", "reports.view"], "description": "Handles purchasing and supplier relationships"},
    ]
    for r in admin_role_permissions:
        RolePermission.objects.update_or_create(role=r['role'], defaults=r)
        
    print("Populating Deliveries...")
    from roles.storekeeper.stores.models import Delivery
    mock_deliveries = [
        {
            "id": "del-1", "deliveryId": "DEL/2025/089", "dateTime": "2025-01-26T09:15:00Z", "supplierName": "Kenya Office Supplies Ltd", "lpoReference": "LPO-2025-0001", "lpoId": "demo-1", "deliveryPerson": "John Kamau (Driver)", "vehicleNumber": "KCA 123X", "deliveryNote": "DN-2025-789", "packages": "5 boxes", "condition": "Sealed, intact", "receivedBy": "Mary Wanjiru", "receivedAt": "2025-01-26T09:15:00Z", "storageLocation": "Receiving Area A", "status": "Accepted", "items": [
                { "itemId": "item-1", "description": "A4 Printing Paper (Ream)", "unit": "Ream", "qtyOrdered": 100, "qtyDelivered": 100, "qtyAccepted": 100, "qtyRejected": 0, "unitPrice": 450, "remarks": "" },
                { "itemId": "item-2", "description": "Box Files - Blue", "unit": "Pcs", "qtyOrdered": 50, "qtyDelivered": 50, "qtyAccepted": 50, "qtyRejected": 0, "unitPrice": 150, "remarks": "" },
                { "itemId": "item-3", "description": "Stapler Heavy Duty", "unit": "Pcs", "qtyOrdered": 10, "qtyDelivered": 10, "qtyAccepted": 10, "qtyRejected": 0, "unitPrice": 800, "remarks": "" },
            ], "overallRemarks": "All items in good condition", "decision": "accept_all", "signatures": [
                { "memberId": "user-1", "memberName": "Mary Wanjiru", "memberRole": "Storekeeper", "signed": True, "signedAt": "2025-01-26T10:00:00Z", "confirmed": True },
                { "memberId": "user-2", "memberName": "James Ochieng", "memberRole": "Bursar", "signed": True, "signedAt": "2025-01-26T10:30:00Z", "confirmed": True },
                { "memberId": "user-3", "memberName": "Principal Omondi", "memberRole": "Headteacher", "signed": True, "signedAt": "2025-01-26T11:00:00Z", "confirmed": True },
            ], "inspectionCompletedAt": "2025-01-26T11:00:00Z", "grnGenerated": True, "grnId": "S11-2025-001", "createdAt": "2025-01-26T09:15:00Z", "updatedAt": "2025-01-26T11:00:00Z"
        },
        {
            "id": "del-2", "deliveryId": "DEL/2025/090", "dateTime": "2025-01-25T14:30:00Z", "supplierName": "Lab Equipment Kenya", "lpoReference": "LPO-2025-0002", "lpoId": "demo-2", "deliveryPerson": "Peter Ochieng (Driver)", "vehicleNumber": "KBZ 456Y", "deliveryNote": "DN-2025-790", "packages": "3 cartons", "condition": "Good condition", "receivedBy": "James Mwangi", "receivedAt": "2025-01-25T14:30:00Z", "storageLocation": "Receiving Area B", "status": "Under Inspection", "items": [
                { "itemId": "item-4", "description": "Microscope - Student Grade", "unit": "Pcs", "qtyOrdered": 10, "qtyDelivered": 6, "qtyAccepted": 0, "qtyRejected": 0, "unitPrice": 8500, "remarks": "" },
                { "itemId": "item-5", "description": "Test Tubes (Pack of 50)", "unit": "Pack", "qtyOrdered": 20, "qtyDelivered": 20, "qtyAccepted": 0, "qtyRejected": 0, "unitPrice": 2500, "remarks": "" },
            ], "overallRemarks": "", "decision": None, "signatures": [
                { "memberId": "user-1", "memberName": "James Mwangi", "memberRole": "Storekeeper", "signed": True, "signedAt": "2025-01-25T15:00:00Z", "confirmed": True },
                { "memberId": "user-2", "memberName": "Jane Wanjiku", "memberRole": "Bursar", "signed": False, "signedAt": None, "confirmed": False },
                { "memberId": "user-3", "memberName": "Principal Omondi", "memberRole": "Headteacher", "signed": False, "signedAt": None, "confirmed": False },
            ], "createdAt": "2025-01-25T14:30:00Z", "updatedAt": "2025-01-25T15:00:00Z"
        },
        {
            "id": "del-3", "deliveryId": "DEL/2025/091", "dateTime": "2025-01-26T11:00:00Z", "supplierName": "Sports Gear Africa", "lpoReference": "LPO-2025-0003", "lpoId": "demo-3", "deliveryPerson": "Samuel Njoroge (Courier)", "vehicleNumber": "KDG 789Z", "deliveryNote": "DN-2025-791", "packages": "8 bags", "condition": "Sealed, intact", "receivedBy": "Mary Wanjiru", "receivedAt": "2025-01-26T11:00:00Z", "storageLocation": "Loading Bay", "status": "Awaiting Inspection", "items": [
                { "itemId": "item-6", "description": "Football Size 5", "unit": "Pcs", "qtyOrdered": 20, "qtyDelivered": 20, "qtyAccepted": 0, "qtyRejected": 0, "unitPrice": 1500, "remarks": "" },
                { "itemId": "item-7", "description": "Volleyball Net", "unit": "Pcs", "qtyOrdered": 4, "qtyDelivered": 4, "qtyAccepted": 0, "qtyRejected": 0, "unitPrice": 3500, "remarks": "" },
                { "itemId": "item-8", "description": "Badminton Rackets (Pair)", "unit": "Pair", "qtyOrdered": 10, "qtyDelivered": 10, "qtyAccepted": 0, "qtyRejected": 0, "unitPrice": 2000, "remarks": "" },
            ], "overallRemarks": "", "decision": None, "signatures": [
                { "memberId": "", "memberName": "", "memberRole": "Storekeeper", "signed": False, "signedAt": None, "confirmed": False },
                { "memberId": "", "memberName": "", "memberRole": "Bursar", "signed": False, "signedAt": None, "confirmed": False },
                { "memberId": "", "memberName": "", "memberRole": "Headteacher", "signed": False, "signedAt": None, "confirmed": False },
            ], "createdAt": "2025-01-26T11:00:00Z", "updatedAt": "2025-01-26T11:00:00Z"
        },
        {
            "id": "del-4", "deliveryId": "DEL/2025/092", "dateTime": "2025-01-24T10:00:00Z", "supplierName": "TechWorld Kenya", "lpoReference": "LPO-2025-0004", "lpoId": "demo-4", "deliveryPerson": "David Mutua (Driver)", "vehicleNumber": "KAB 222M", "deliveryNote": "DN-2025-792", "packages": "2 boxes", "condition": "Sealed, intact", "receivedBy": "Mary Wanjiru", "receivedAt": "2025-01-24T10:00:00Z", "storageLocation": "Receiving Area A", "status": "Awaiting Inspection", "items": [
                { "itemId": "item-9", "description": "USB Flash Drive 32GB", "unit": "Pcs", "qtyOrdered": 50, "qtyDelivered": 50, "qtyAccepted": 0, "qtyRejected": 0, "unitPrice": 650, "remarks": "" },
                { "itemId": "item-10", "description": "HDMI Cable 2m", "unit": "Pcs", "qtyOrdered": 20, "qtyDelivered": 20, "qtyAccepted": 0, "qtyRejected": 0, "unitPrice": 450, "remarks": "" },
            ], "overallRemarks": "", "decision": None, "signatures": [
                { "memberId": "", "memberName": "", "memberRole": "Storekeeper", "signed": False, "signedAt": None, "confirmed": False },
                { "memberId": "", "memberName": "", "memberRole": "Bursar", "signed": False, "signedAt": None, "confirmed": False },
                { "memberId": "", "memberName": "", "memberRole": "Headteacher", "signed": False, "signedAt": None, "confirmed": False },
            ], "createdAt": "2025-01-24T10:00:00Z", "updatedAt": "2025-01-24T10:00:00Z"
        }
    ]
    for d in mock_deliveries:
        Delivery.objects.update_or_create(id=d['id'], defaults=d)

    print("Done populating mocks.")

if __name__ == '__main__':
    populate()
