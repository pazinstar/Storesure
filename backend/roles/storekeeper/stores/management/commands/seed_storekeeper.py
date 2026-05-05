from django.core.management.base import BaseCommand
from django.utils import timezone
from roles.storekeeper.stores.models import (
    InventoryItem,
    Delivery,
    Requisition,
    RequisitionItem,
    IssueHistory,
    ReceivingHistory,
    Supplier,
    PurchaseOrder,
    RoutineIssueAuthority,
    RiaItem,
    InventoryLedger,
    LedgerReceipt,
    LedgerIssue,
    StoreReport
)
from roles.storekeeper.dashboard.models import StorekeeperKPI

class Command(BaseCommand):
    help = 'Seeds the database with initial storekeeper mock data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing existing storekeeper records...')
        
        # Keep deletion order safe for foreign keys
        RequisitionItem.objects.all().delete()
        Requisition.objects.all().delete()
        IssueHistory.objects.all().delete()
        ReceivingHistory.objects.all().delete()
        Delivery.objects.all().delete()
        InventoryItem.objects.all().delete()
        StorekeeperKPI.objects.all().delete()
        StoreReport.objects.all().delete()
        LedgerIssue.objects.all().delete()
        LedgerReceipt.objects.all().delete()
        InventoryLedger.objects.all().delete()
        RiaItem.objects.all().delete()
        RoutineIssueAuthority.objects.all().delete()
        PurchaseOrder.objects.all().delete()
        Supplier.objects.all().delete()

        # Seed KPIs (5)
        self.stdout.write('Seeding Dashboard KPIs...')
        kpi_data = [
            {"title": "Total Store Items", "value": "12,458", "trend": "+5.2% from last quarter", "trendUp": True, "type": "Package"},
            {"title": "Low Stock Alerts", "value": "15", "trend": "+2 from last week", "trendUp": False, "type": "AlertTriangle"},
            {"title": "Pending Deliveries", "value": "8", "trend": "-3 from last week", "trendUp": True, "type": "Truck"},
            {"title": "Pending Requisitions", "value": "24", "trend": "+12% from last month", "trendUp": False, "type": "FileText"},
            {"title": "Total Value (KES)", "value": "4.2M", "trend": "+1.5% from last month", "trendUp": True, "type": "DollarSign"}
        ]
        for k in kpi_data:
            StorekeeperKPI.objects.create(**k)

        # Suppliers (10)
        self.stdout.write('Seeding Suppliers...')
        supplier_data = [
            {"id": "SUP001", "name": "Kenya Office Supplies Ltd", "taxPin": "P051123456A", "contactPerson": "Jane Doe", "email": "sales@kenyaofficesupplies.com", "status": "Active"},
            {"id": "SUP002", "name": "Nairobi Stationers", "taxPin": "P052233445B", "contactPerson": "John Smith", "email": "info@nairobistationers.co.ke", "status": "Active"},
            {"id": "SUP003", "name": "Tech Hub Solutions", "taxPin": "P053344556C", "contactPerson": "Alice Kamau", "email": "contact@techhub.co.ke", "status": "Active"},
            {"id": "SUP004", "name": "Global Lab Equipments", "taxPin": "P054455667D", "contactPerson": "David Ochieng", "email": "sales@globallab.com", "status": "Inactive"},
            {"id": "SUP005", "name": "Pamoja Printers", "taxPin": "P055566778E", "contactPerson": "Mary Wanjiku", "email": "orders@pamojaprinters.com", "status": "Active"},
            {"id": "SUP006", "name": "Elite Furniture Ltd", "taxPin": "P056677889F", "contactPerson": "Peter Mutua", "email": "support@elitefurniture.co.ke", "status": "Active"},
            {"id": "SUP007", "name": "Clean Sweep Janitorial", "taxPin": "P057788990G", "contactPerson": "Sarah Njoroge", "email": "clean@cleansweep.co.ke", "status": "Active"},
            {"id": "SUP008", "name": "Rift Valley Food Distributors", "taxPin": "P058899001H", "contactPerson": "William Ruto", "email": "distro@riftfoods.com", "status": "Active"},
            {"id": "SUP009", "name": "City Sports Gear", "taxPin": "P059900112I", "contactPerson": "Grace Kariuki", "email": "sales@citysports.co.ke", "status": "Inactive"},
            {"id": "SUP010", "name": "Textbook Centre", "taxPin": "P050011223J", "contactPerson": "Michael Kiprono", "email": "schools@tbc.co.ke", "status": "Active"}
        ]
        suppliers = []
        for s in supplier_data:
            suppliers.append(Supplier.objects.create(**s))

        # Purchase Orders (10)
        self.stdout.write('Seeding Purchase Orders...')
        po_data = [
            {"id": f"LPO0{i:02}", "lpoNumber": f"LPO-2024-0{i:02}", "supplierName": suppliers[i%10].name, "status": "Sent to Supplier" if i%2==0 else "Delivered"}
            for i in range(1, 11)
        ]
        for p in po_data:
            PurchaseOrder.objects.create(**p)

        # Inventory Items (10)
        self.stdout.write('Seeding Inventory Items...')
        inventory_data = [
            {"id": "ITM001", "name": "A4 Paper Reams", "category": "Stationery", "assetType": "Consumable", "unit": "Ream", "minimumStockLevel": 20, "reorderLevel": 50, "openingBalance": 120, "hasBeenUsed": True, "status": "In Stock", "description": "Standard A4 white paper", "location": "Shelf A1"},
            {"id": "ITM002", "name": "Blue Pens / Box", "category": "Stationery", "assetType": "Consumable", "unit": "Box", "minimumStockLevel": 10, "reorderLevel": 30, "openingBalance": 80, "hasBeenUsed": True, "status": "In Stock", "description": "Blue ballpoint pens, box of 50", "location": "Shelf A2"},
            {"id": "ITM003", "name": "Whiteboard Markers", "category": "Stationery", "assetType": "Consumable", "unit": "Pack", "minimumStockLevel": 15, "reorderLevel": 40, "openingBalance": 15, "hasBeenUsed": True, "status": "Low Stock", "description": "Assorted colors, pack of 4", "location": "Shelf A3"},
            {"id": "ITM004", "name": "Staplers", "category": "Office Equipment", "assetType": "Non-Consumable", "unit": "Pcs", "minimumStockLevel": 5, "reorderLevel": 10, "openingBalance": 25, "hasBeenUsed": True, "status": "In Stock", "description": "Heavy duty staplers", "location": "Shelf B1"},
            {"id": "ITM005", "name": "Beakers 500ml", "category": "Lab Equipment", "assetType": "Consumable", "unit": "Pcs", "minimumStockLevel": 10, "reorderLevel": 20, "openingBalance": 50, "hasBeenUsed": False, "status": "In Stock", "description": "Glass beakers 500ml", "location": "Shelf L2"},
            {"id": "ITM006", "name": "Microscopes", "category": "Lab Equipment", "assetType": "Asset", "unit": "Pcs", "minimumStockLevel": 2, "reorderLevel": 5, "openingBalance": 15, "hasBeenUsed": True, "status": "In Stock", "description": "Student light microscopes", "location": "Shelf L1"},
            {"id": "ITM007", "name": "Basketballs", "category": "Sports", "assetType": "Asset", "unit": "Pcs", "minimumStockLevel": 5, "reorderLevel": 15, "openingBalance": 20, "hasBeenUsed": True, "status": "In Stock", "description": "Size 7 indoor/outdoor basketballs", "location": "Store Room B"},
            {"id": "ITM008", "name": "Maize Flour", "category": "Food", "assetType": "Consumable", "unit": "Bale", "minimumStockLevel": 50, "reorderLevel": 100, "openingBalance": 150, "hasBeenUsed": True, "status": "In Stock", "description": "Premium maize flour", "location": "Kitchen Store"},
            {"id": "ITM009", "name": "Sugar", "category": "Food", "assetType": "Consumable", "unit": "Bag (50kg)", "minimumStockLevel": 10, "reorderLevel": 25, "openingBalance": 8, "hasBeenUsed": True, "status": "Low Stock", "description": "White sugar", "location": "Kitchen Store"},
            {"id": "ITM010", "name": "Cooking Oil", "category": "Food", "assetType": "Consumable", "unit": "Jerrican (20L)", "minimumStockLevel": 5, "reorderLevel": 15, "openingBalance": 22, "hasBeenUsed": True, "status": "In Stock", "description": "Vegetable cooking oil", "location": "Kitchen Store"}
        ]
        items_objs = {}
        for d in inventory_data:
            items_objs[d['id']] = InventoryItem.objects.create(**d)

        # Inventory Ledger (10)
        self.stdout.write('Seeding Inventory Ledger...')
        ledger_objs = {}
        for i, d in enumerate(inventory_data):
            l = InventoryLedger.objects.create(
                itemCode=d['id'],
                itemName=d['name'],
                unit=d['unit'],
                openingQty=d['openingBalance'],
                openingValue=(d['openingBalance'] * (500.0 if i%2==0 else 200.0)),
                totalReceiptsQty=100,
                totalReceiptsValue=50000.0,
                totalIssuesQty=50,
                totalIssuesValue=25000.0,
                closingQty=d['openingBalance'] + 100 - 50,
                closingValue=(d['openingBalance'] * (500.0 if i%2==0 else 200.0)) + 50000.0 - 25000.0
            )
            ledger_objs[d['id']] = l
            
            # Add some ledger receipts and issues
            LedgerReceipt.objects.create(
                ledger=l, date=f"2024-01-0{i%9+1}", grnNo=f"GRN-2024-001{i}", qty=100, unitCost=500.0, totalCost=50000.0
            )
            LedgerIssue.objects.create(
                ledger=l, date=f"2024-01-1{i%9+1}", s13No=f"S13-2024-004{i}", qty=50, dept="Various", unitCost=500.0, totalCost=25000.0, riaNo=f"RIA/2025/00{i}" if i%3==0 else None
            )

        # Deliveries (10)
        self.stdout.write('Seeding Deliveries...')
        for i in range(1, 11):
            Delivery.objects.create(
                id=f"DEL0{i:02}",
                deliveryId=f"DLV-2024-0{i:02}",
                dateTime=timezone.now(),
                supplierName=suppliers[i%10].name,
                lpoReference=f"LPO-2024-0{i:02}",
                deliveryPerson=f"Driver {i}",
                vehicleNumber=f"KCD 12{i}X",
                deliveryNote=f"DN-{8800+i}",
                packages=f"{i*2} Boxes",
                condition="Good condition" if i%3 != 0 else "Slightly damaged",
                receivedBy="Mary Wanjiku",
                receivedAt=timezone.now(),
                storageLocation=f"Receiving Area {'A' if i%2==0 else 'B'}",
                status="Awaiting Inspection" if i > 5 else "Inspected",
                remarks="Received successfully",
                signatures=[{"memberRole": "Storekeeper", "signed": True if i <= 5 else False, "memberId": "1", "memberName": "Mary Wanjiku", "confirmed": True}]
            )

        # Requisitions (10)
        self.stdout.write('Seeding Requisitions...')
        reqs = []
        depts = ["Science", "Math", "English", "Kitchen", "Admin", "IT", "Sports", "Library", "Maintenance", "Transport"]
        for i in range(1, 11):
            r = Requisition.objects.create(
                id=f"RQ0{i:02}",
                s12Number=f"S12-2024-0{i:02}",
                requestDate=timezone.now().date(),
                requestingDepartment=f"{depts[i%10]} Department",
                requestedBy=f"Staff Member {i}",
                purpose=f"Monthly Restock {i}",
                status="Pending Approval" if i > 7 else "Approved",
                receiverSignature=True if i <= 7 else False,
                issuerSignature=True if i <= 7 else False,
            )
            reqs.append(r)
            
            # Requisition Items (1 for each Req)
            itm_id = f"ITM0{(i%10)+1:02}"
            RequisitionItem.objects.create(
                id=f"RQI0{i:02}",
                requisition=r,
                itemCode=items_objs[itm_id],
                description=items_objs[itm_id].name,
                unit=items_objs[itm_id].unit,
                quantityRequested=10 * i,
                quantityApproved=10 * i if i <= 7 else 0,
                quantityIssued=10 * i if i <= 7 else 0,
                unitPrice=200.00
            )

        # Issue History (10)
        self.stdout.write('Seeding Issue History...')
        for i in range(1, 11):
            IssueHistory.objects.create(
                id=f"S13-2024-0{i:02}",
                date=timezone.now().date(),
                department=f"{depts[i%10]} Department",
                requestedBy=f"Staff {i}",
                items=i*2,
                status="Issued" if i%2==0 else "Pending Issue"
            )

        # Receiving History (10)
        self.stdout.write('Seeding Receiving History...')
        for i in range(1, 11):
            ReceivingHistory.objects.create(
                id=f"S11-2024-0{i:02}",
                date=timezone.now().date(),
                sourceType="Supplier",
                supplier=suppliers[i%10].name,
                storeLocation="Main Store",
                items=i,
                totalValue=f"KES {10000*i:,}",
                status="Posted" if i%2!=0 else "Pending Review",
                storekeeperSignature="J. Kamau",
                signedAt=f"2024-01-15 10:3{i%10}"
            )

        # Routine Issue Authorities (10)
        self.stdout.write('Seeding Routine Issue Authorities...')
        for i in range(1, 11):
            ria = RoutineIssueAuthority.objects.create(
                id=str(i),
                number=f"RIA/2025/0{i:02}",
                department=f"{depts[i%10]} Department",
                costCenter=f"COST-0{i}",
                responsibleOfficer=f"Officer {i}",
                startDate="2025-01-01",
                endDate="2025-01-31",
                notes=f"Monthly rations for {depts[i%10]}",
                status="active" if i > 2 else "expired"
            )
            # RIA items
            itm = items_objs[f"ITM0{(i%10)+1:02}"]
            RiaItem.objects.create(
                ria=ria,
                itemCode=itm.id,
                itemName=itm.name,
                unit=itm.unit,
                approvedQty=100 * i,
                usedQty=80 * i
            )

        # Store Reports (10)
        self.stdout.write('Seeding Store Reports...')
        report_types = ["Monthly", "Weekly", "Annual", "Daily", "Ad-Hoc"]
        icons = ["FileText", "BarChart", "PieChart", "TrendingUp", "Activity"]
        for i in range(1, 11):
            StoreReport.objects.create(
                id=i,
                title=f"Inventory Report {i}",
                description=f"Detailed view of inventory status for period {i}",
                type=report_types[i%5],
                iconName=icons[i%5]
            )
        
        self.stdout.write(self.style.SUCCESS('Storekeeper database successfully seeded!'))
