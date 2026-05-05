from django.core.management.base import BaseCommand
from django.utils import timezone
from roles.storekeeper.stores.models import (
    Supplier,
    PurchaseOrder,
    PurchaseOrderItem,
    Requisition,
    Delivery
)
from roles.procurement.dashboard.models import ProcurementKPI

class Command(BaseCommand):
    help = 'Seeds the database with minimal procurement-specific data and KPIs'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing existing procurement KPIs...')
        ProcurementKPI.objects.all().delete()
        
        self.stdout.write('Seeding Procurement KPIs...')
        kpi_data = [
            {"title": "Active Requisitions", "value": "34", "trend": "8 pending approval", "trendUp": False, "type": "FileText"},
            {"title": "Pending LPOs", "value": "12", "trend": "Awaiting supplier confirmation", "trendUp": True, "type": "ShoppingCart"},
            {"title": "Total Suppliers", "value": "45", "trend": "+3 new this month", "trendUp": True, "type": "Users"},
            {"title": "Deliveries Today", "value": "5", "trend": "All inspected", "trendUp": True, "type": "Truck"},
        ]
        
        for k in kpi_data:
            ProcurementKPI.objects.create(**k)

        # Update a few PurchaseOrders with mock procurement data (assuming they exist from storekeeper seed)
        # Note: the `storekeeper` seeder already populates most of the required fields, but we can ensure
        # items are fully fleshed out here if needed. Since `storekeeper` creates it, we will just add `PurchaseOrderItem`s
        
        self.stdout.write('Seeding Purchase Order Items...')
        PurchaseOrderItem.objects.all().delete()
        
        lpos = list(PurchaseOrder.objects.all()[:5])
        for i, lpo in enumerate(lpos):
            PurchaseOrderItem.objects.create(
                id=f"LPOI00{i+1}",
                purchaseOrder=lpo,
                description=f"A4 Paper Reams {i+1}",
                unit="Ream",
                assetType="Consumable",
                quantity=100 + i*10,
                unitPrice=500.00,
                deliveredQty=0 if i%2==0 else 50
            )

        self.stdout.write(self.style.SUCCESS('Procurement database models successfully seeded!'))
