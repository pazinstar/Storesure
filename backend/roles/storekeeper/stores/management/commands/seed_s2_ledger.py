"""
Seed sample data into the S2 Permanent & Expendable Stores Ledger.

Usage:
    python manage.py seed_s2_ledger              # appends sample rows
    python manage.py seed_s2_ledger --clear      # clears the table first
    python manage.py seed_s2_ledger --count      # just prints current row count
"""
from datetime import date

from django.core.management.base import BaseCommand

from roles.storekeeper.stores.models import S2LedgerEntry


SEED_ROWS = [
    {
        "date": date(2024, 7, 2),  "refNo": "GRN-S2-001", "txnType": "RECEIPT",
        "itemCode": "S2-001", "itemName": "Steel Filing Cabinet",
        "category": "FURNITURE", "unit": "Pcs",
        "qtyReceived": 6, "qtyIssued": 0, "runningBalance": 6,
        "unitCost": 18500, "totalValue": 111000,
        "supplier": "Office Mart Ltd", "recipient": "Main Stores",
        "department": "Administration", "condition": "NEW",
        "remarks": "Inspection passed",
        "createdBy": "Storekeeper - J. Kiprotich",
        "approvedBy": "Bursar - S. Muriungi",
    },
    {
        "date": date(2024, 7, 4),  "refNo": "ISV-S2-001", "txnType": "ISSUE",
        "itemCode": "S2-001", "itemName": "Steel Filing Cabinet",
        "category": "FURNITURE", "unit": "Pcs",
        "qtyReceived": 0, "qtyIssued": 2, "runningBalance": 4,
        "unitCost": 18500, "totalValue": 37000,
        "supplier": "Office Mart Ltd", "recipient": "Mr. Mwangi",
        "department": "Administration", "condition": "NEW",
        "remarks": "Office allocation",
        "createdBy": "Storekeeper - J. Kiprotich",
        "approvedBy": "Bursar - S. Muriungi",
    },
    {
        "date": date(2024, 7, 5),  "refNo": "GRN-S2-002", "txnType": "RECEIPT",
        "itemCode": "S2-003", "itemName": "Microscope (Compound)",
        "category": "LAB EQUIP", "unit": "Pcs",
        "qtyReceived": 12, "qtyIssued": 0, "runningBalance": 12,
        "unitCost": 22500, "totalValue": 270000,
        "supplier": "Sci-Equip Kenya", "recipient": "Main Stores",
        "department": "Science Department", "condition": "NEW",
        "remarks": "Sealed cartons",
        "createdBy": "Storekeeper - J. Kiprotich",
        "approvedBy": "Bursar - S. Muriungi",
    },
    {
        "date": date(2024, 7, 8),  "refNo": "ISV-S2-002", "txnType": "ISSUE",
        "itemCode": "S2-003", "itemName": "Microscope (Compound)",
        "category": "LAB EQUIP", "unit": "Pcs",
        "qtyReceived": 0, "qtyIssued": 8, "runningBalance": 4,
        "unitCost": 22500, "totalValue": 180000,
        "supplier": "Sci-Equip Kenya", "recipient": "Mrs. Kamau",
        "department": "Science Department", "condition": "NEW",
        "remarks": "Lab kit-out",
        "createdBy": "Storekeeper - J. Kiprotich",
        "approvedBy": "Bursar - S. Muriungi",
    },
    {
        "date": date(2024, 7, 12), "refNo": "TRF-S2-001", "txnType": "TRANSFER",
        "itemCode": "S2-006", "itemName": "Mattress (Single)",
        "category": "BOARDING", "unit": "Pcs",
        "qtyReceived": 0, "qtyIssued": 5, "runningBalance": 0,
        "unitCost": 4200, "totalValue": 21000,
        "supplier": "Foam Direct", "recipient": "Mrs. Wanjiku",
        "department": "Boarding Department",
        "fromDept": "Science Department", "toDept": "Boarding Department",
        "condition": "GOOD", "remarks": "Form 1 dorm fit-out",
        "createdBy": "Storekeeper - J. Kiprotich",
        "approvedBy": "Bursar - S. Muriungi",
    },
    {
        "date": date(2024, 7, 15), "refNo": "RTN-S2-001", "txnType": "RETURN",
        "itemCode": "S2-003", "itemName": "Microscope (Compound)",
        "category": "LAB EQUIP", "unit": "Pcs",
        "qtyReceived": 1, "qtyIssued": 0, "runningBalance": 5,
        "unitCost": 22500, "totalValue": 22500,
        "supplier": "Sci-Equip Kenya", "recipient": "Main Stores",
        "department": "Science Department", "condition": "FAIR",
        "remarks": "Returned after term - minor scratch",
        "createdBy": "Mrs. Kamau",
        "approvedBy": "Storekeeper - J. Kiprotich",
    },
    {
        "date": date(2024, 7, 22), "refNo": "DMG-S2-001", "txnType": "DAMAGE_LOSS",
        "itemCode": "S2-003", "itemName": "Microscope (Compound)",
        "category": "LAB EQUIP", "unit": "Pcs",
        "qtyReceived": 0, "qtyIssued": 1, "runningBalance": 4,
        "unitCost": 22500, "totalValue": 22500,
        "supplier": "Sci-Equip Kenya", "recipient": "-",
        "department": "Science Department", "condition": "DAMAGED",
        "lossReason": "DAMAGED",
        "remarks": "Lens cracked during practical",
        "createdBy": "Mrs. Kamau",
        "approvedBy": "Principal - D. Ndolo",
    },
]


class Command(BaseCommand):
    help = "Seeds the S2 Permanent & Expendable Stores Ledger with sample rows."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing S2 ledger entries before seeding.",
        )
        parser.add_argument(
            "--count",
            action="store_true",
            help="Just report the current row count and exit.",
        )

    def handle(self, *args, **opts):
        if opts["count"]:
            n = S2LedgerEntry.objects.count()
            self.stdout.write(self.style.NOTICE(f"S2LedgerEntry rows in DB: {n}"))
            return

        if opts["clear"]:
            deleted, _ = S2LedgerEntry.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Cleared {deleted} existing S2 ledger row(s)."))

        created = 0
        skipped = 0
        for row in SEED_ROWS:
            obj, was_created = S2LedgerEntry.objects.get_or_create(
                refNo=row["refNo"],
                defaults=row,
            )
            if was_created:
                created += 1
            else:
                skipped += 1

        total = S2LedgerEntry.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f"S2 ledger seed complete: {created} created, {skipped} skipped (already existed). Total rows: {total}."
        ))
