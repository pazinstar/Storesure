from django.template.defaultfilters import default
from django.db import models
from django.db.models import Q, CheckConstraint
from django.utils import timezone
import uuid

from common.models import AuditMixin, LockedPreventSaveMixin

class ItemTypeChoices(models.TextChoices):
    CONSUMABLE = 'consumable', 'Consumable'
    EXPENDABLE = 'expendable', 'Expendable'
    PERMANENT = 'permanent', 'Permanent'
    FIXED_ASSET = 'fixed_asset', 'Fixed Asset'

class InventoryItem(AuditMixin, LockedPreventSaveMixin, models.Model):
    id = models.CharField(max_length=50, primary_key=True, blank=True) # ITM001
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    category_type = models.CharField(
        max_length=20,
        choices=ItemTypeChoices.choices,
        default=ItemTypeChoices.CONSUMABLE,
        blank=False,
        null=False,
        help_text="Classification type: consumable, expendable, permanent, or fixed_asset"
    )
    assetType = models.CharField(max_length=100)
    unit = models.CharField(max_length=50)
    minimumStockLevel = models.IntegerField(default=0)
    reorderLevel = models.IntegerField(default=0)
    min_useful_life = models.IntegerField(
        default=0,
        blank=True,
        null=False,
        help_text="Minimum useful life in months (for permanent/fixed_asset items)"
    )
    default_custodian_required = models.BooleanField(
        default=False,
        blank=True,
        null=False,
        help_text="Whether a custodian assignment is required for this item"
    )
    openingBalance = models.IntegerField(default=0)
    hasBeenUsed = models.BooleanField(default=False)
    status = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=100)
    expiryDate = models.DateField(blank=True, null=True)
    lastUpdated = models.DateField(auto_now=True)
    createdAt = models.DateTimeField(auto_now_add=True, null=True)
    
    def save(self, *args, **kwargs):
        if not self.id:
            last_item = InventoryItem.objects.order_by('-id').first()
            if last_item and last_item.id.startswith('ITM'):
                try:
                    last_id_num = int(last_item.id[3:])
                    new_id_num = last_id_num + 1
                    self.id = f'ITM{new_id_num:03d}'
                except ValueError:
                    self.id = 'ITM001'
            else:
                self.id = 'ITM001'
        super().save(*args, **kwargs)

    def clean(self):
        """Model-level validation: ensure category_type is one of the allowed ItemTypeChoices."""
        from django.core.exceptions import ValidationError
        if not self.category_type or self.category_type not in [c.value for c in ItemTypeChoices]:
            raise ValidationError({
                'category_type': f"Invalid item type '{self.category_type}'. Must be one of {[c.value for c in ItemTypeChoices]}."
            })

    @property
    def ledger(self):
        """Return ledger identifier for this item based on its classification."""
        if self.category_type == ItemTypeChoices.CONSUMABLE:
            return 'S1'
        if self.category_type in (ItemTypeChoices.EXPENDABLE, ItemTypeChoices.PERMANENT):
            return 'S2'
        if self.category_type == ItemTypeChoices.FIXED_ASSET:
            return 'FixedAssetRegister'
        return 'Unknown'

    @property
    def is_depreciable(self):
        return self.category_type == ItemTypeChoices.FIXED_ASSET

    @property
    def requires_custodian(self):
        return self.category_type in (ItemTypeChoices.EXPENDABLE, ItemTypeChoices.PERMANENT, ItemTypeChoices.FIXED_ASSET)

    def is_capitalizable(self, unit_cost: float = None, quantity: int = 1) -> bool:
        """Decide whether this item should be capitalized.

        Rules:
        - All `fixed_asset` items are capitalizable.
        - `permanent` items are capitalizable when they meet a configurable threshold.
        - Consumables and expendables are not capitalized.
        """
        total = (unit_cost or 0) * (quantity or 1)
        try:
            from django.conf import settings
            threshold = getattr(settings, 'CAPITALIZATION_THRESHOLD', 0)
        except Exception:
            threshold = 0

        if self.category_type == ItemTypeChoices.FIXED_ASSET:
            return True
        if self.category_type == ItemTypeChoices.PERMANENT:
            return total >= threshold
        return False

    def __str__(self):
        return f"{self.id} - {self.name}"

    class Meta:
        constraints = [
            CheckConstraint(check=Q(category_type__in=[c.value for c in ItemTypeChoices]), name='stores_inventoryitem_valid_type')
        ]


class ItemType(models.TextChoices):
    CONSUMABLE = 'consumable', 'Consumable'
    EXPENDABLE = 'expendable', 'Expendable'
    PERMANENT = 'permanent', 'Permanent'
    FIXED_ASSET = 'fixed_asset', 'Fixed Asset'


class Item(AuditMixin, LockedPreventSaveMixin, models.Model):
    """New normalized Item master for strict classification and S2 preparation."""
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    unit = models.CharField(max_length=50, blank=True, default='')
    type = models.CharField(max_length=20, choices=ItemType.choices, default=ItemType.CONSUMABLE)
    category = models.CharField(max_length=100, blank=True, default='')
    base_unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stores_item'
        constraints = [
            CheckConstraint(check=Q(type__in=[c.value for c in ItemType]), name='stores_item_valid_type')
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"


class CapitalizationPolicy(AuditMixin, LockedPreventSaveMixin, models.Model):
    """System-wide capitalization settings and thresholds."""
    id = models.BigAutoField(primary_key=True)
    currency = models.CharField(max_length=10, default='KES')
    capitalization_threshold = models.DecimalField(max_digits=12, decimal_places=2, default=50000)
    bulk_materiality_threshold = models.DecimalField(max_digits=12, decimal_places=2, default=100000)
    min_useful_life_years = models.PositiveSmallIntegerField(default=2)
    default_residual_value_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    depreciation_start_rule = models.CharField(max_length=100, default='deployed')
    asset_classes = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stores_capitalizationpolicy'

    def __str__(self):
        return f"Policy {self.id} - {self.currency} threshold {self.capitalization_threshold}"


class LedgerType(models.TextChoices):
    S1_CONSUMABLE = 's1_consumable', 'S1 - Consumable'
    S2_PERMANENT_EXPENDABLE = 's2_permanent_expendable', 'S2 - Permanent/Expendable'


class StoreLedger(AuditMixin, LockedPreventSaveMixin, models.Model):
    """Represents a logical ledger (S1 or S2) for items in stock."""
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    ledger_type = models.CharField(max_length=50, choices=LedgerType.choices, default=LedgerType.S1_CONSUMABLE)
    item = models.ForeignKey(Item, on_delete=models.PROTECT, related_name='ledgers', blank=True, null=True)
    balance_qty = models.IntegerField(default=0)
    balance_value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stores_storeledger'
        constraints = [
            CheckConstraint(check=Q(ledger_type__in=[c.value for c in LedgerType]), name='stores_storeledger_valid_type')
        ]

    def __str__(self):
        return f"{self.name} ({self.ledger_type})"


class DepreciationMethod(models.TextChoices):
    STRAIGHT_LINE = 'straight_line', 'Straight Line'
    DECLINING = 'declining_balance', 'Declining Balance'


class AssetStatus(models.TextChoices):
    ACTIVE = 'active', 'Active'
    DISPOSED = 'disposed', 'Disposed'
    IN_MAINTENANCE = 'in_maintenance', 'In Maintenance'




class Delivery(models.Model):
    id = models.CharField(max_length=50, primary_key=True) # DEL001
    deliveryId = models.CharField(max_length=100) # DLV-2024-001
    dateTime = models.DateTimeField(blank=True, null=True)
    supplierName = models.CharField(max_length=255)
    supplierId = models.CharField(max_length=50, blank=True, null=True)
    lpoReference = models.CharField(max_length=100)
    lpoId = models.CharField(max_length=50, blank=True, null=True)
    deliveryPerson = models.CharField(max_length=100)
    vehicleNumber = models.CharField(max_length=50)
    deliveryNote = models.CharField(max_length=100)
    packages = models.CharField(max_length=100)
    condition = models.CharField(max_length=255)
    receivedBy = models.CharField(max_length=100)
    receivedAt = models.DateTimeField(blank=True, null=True)
    storageLocation = models.CharField(max_length=100)
    status = models.CharField(max_length=100)
    items = models.JSONField(default=list)
    overallRemarks = models.TextField(blank=True, null=True)
    decision = models.CharField(max_length=100, blank=True, null=True)
    signatures = models.JSONField(default=list) 
    inspectionCompletedAt = models.DateTimeField(blank=True, null=True)
    grnGenerated = models.BooleanField(default=False)
    grnId = models.CharField(max_length=50, blank=True, null=True)
    createdAt = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updatedAt = models.DateTimeField(auto_now=True, blank=True, null=True)
    
    def save(self, *args, **kwargs):
        if not self.id:
            self.id = str(uuid.uuid4())
            
        if not self.deliveryId:
            year = timezone.now().year
            last_del = Delivery.objects.filter(deliveryId__startswith=f'DEL/{year}/').order_by('-deliveryId').first()
            if last_del:
                try:
                    last_num = int(last_del.deliveryId.split('/')[-1])
                    self.deliveryId = f'DEL/{year}/{last_num + 1:03d}'
                except ValueError:
                    self.deliveryId = f'DEL/{year}/001'
            else:
                self.deliveryId = f'DEL/{year}/001'
                
        if not self.status:
            self.status = "Awaiting Inspection"
            
        if not self.signatures or len(self.signatures) == 0:
            self.signatures = [
                { "memberId": "", "memberName": "", "memberRole": "Storekeeper", "signed": False, "confirmed": False },
                { "memberId": "", "memberName": "", "memberRole": "Bursar", "signed": False, "confirmed": False },
                { "memberId": "", "memberName": "", "memberRole": "Headteacher", "signed": False, "confirmed": False }
            ]
            
        super().save(*args, **kwargs)

    def __str__(self):
        return self.id




class Requisition(models.Model):
    id = models.CharField(max_length=50, primary_key=True) # RQ001
    s12Number = models.CharField(max_length=100) # S12-2024-001
    # New Phase 6 fields (backwards-compatible additions)
    req_no = models.CharField(max_length=100, blank=True, default='')
    requestDate = models.DateField()
    requestingDepartment = models.CharField(max_length=255)
    dept_id = models.CharField(max_length=50, blank=True, default='')
    requestedBy = models.CharField(max_length=255)
    required_by = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=30, blank=True, default='normal')
    account = models.CharField(max_length=50, blank=True, default='')
    vote_head = models.CharField(max_length=50, blank=True, default='')
    purpose = models.TextField(blank=True, null=True)
    approval_level = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=100)
    issued_s13 = models.CharField(max_length=100, blank=True, null=True)
    receiverSignature = models.BooleanField(default=False)
    issuerSignature = models.BooleanField(default=False)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    createdBy = models.CharField(max_length=255, blank=True, default='')
    updatedBy = models.CharField(max_length=255, blank=True, default='')
    
    def save(self, *args, **kwargs):
        if not self.id:
            self.id = str(uuid.uuid4())
        if not self.s12Number:
            year = timezone.now().year
            month = timezone.now().month
            last_req = Requisition.objects.filter(s12Number__startswith=f'S12/{year}/{month:02d}/').order_by('-s12Number').first()
            if last_req:
                try:
                    last_id_num = int(last_req.s12Number.split('/')[-1])
                    new_id_num = last_id_num + 1
                    self.s12Number = f'S12/{year}/{month:02d}/{new_id_num:04d}'
                except ValueError:
                    self.s12Number = f'S12/{year}/{month:02d}/0001'
            else:
                self.s12Number = f'S12/{year}/{month:02d}/0001'
        if not self.status:
            self.status = "Draft"
        # Ensure req_no mirrors s12Number if not explicitly set
        if not self.req_no:
            self.req_no = self.s12Number
        super().save(*args, **kwargs)

    def __str__(self):
        return self.id

    def can_transition_to(self, new_status: str) -> bool:
        """Validate allowed status transitions for requisitions."""
        TRANSITIONS = {
            'Draft': ['Pending', 'Rejected'],
            'Pending': ['Approved', 'Partially Approved', 'Rejected', 'Returned'],
            'Approved': ['Issued'],
            'Partially Approved': ['Issued', 'Returned'],
            'Returned': ['Pending', 'Rejected'],
            'Rejected': [],
            'Issued': [],
        }
        current = self.status or 'Draft'
        return new_status == current or new_status in TRANSITIONS.get(current, [])

class RequisitionItem(models.Model):
    id = models.CharField(max_length=50, primary_key=True) # RQI001
    requisition = models.ForeignKey(Requisition, related_name='items', on_delete=models.CASCADE)
    itemCode = models.ForeignKey(InventoryItem, on_delete=models.PROTECT)
    description = models.CharField(max_length=255)
    unit = models.CharField(max_length=50)
    quantityRequested = models.IntegerField(default=0)
    req_qty = models.IntegerField(default=0)
    quantityApproved = models.IntegerField(default=0)
    approved_qty = models.IntegerField(default=0)
    quantityIssued = models.IntegerField(default=0)
    issued_qty = models.IntegerField(default=0)
    in_stock = models.IntegerField(default=0)
    available = models.IntegerField(default=0)
    unitPrice = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def save(self, *args, **kwargs):
        if not self.id:
            self.id = str(uuid.uuid4())
        # keep parity fields in sync
        if not self.req_qty:
            self.req_qty = self.quantityRequested
        if not self.approved_qty:
            self.approved_qty = self.quantityApproved
        if not self.issued_qty:
            self.issued_qty = self.quantityIssued
        super().save(*args, **kwargs)

    def __str__(self):
        return self.id

class IssueHistory(models.Model):
    id = models.CharField(max_length=50, primary_key=True, blank=True) # S13-2024-001
    requisition = models.ForeignKey('Requisition', related_name='issues', on_delete=models.SET_NULL, blank=True, null=True)
    date = models.DateField()
    department = models.CharField(max_length=255)
    requestedBy = models.CharField(max_length=255)
    items = models.IntegerField(default=0)
    status = models.CharField(max_length=100)
    createdAt = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    
    def save(self, *args, **kwargs):
        if not self.id:
            year = timezone.now().year
            last_item = IssueHistory.objects.filter(id__startswith=f'S13-{year}').order_by('-id').first()
            if last_item:
                try:
                    last_id_num = int(last_item.id.split('-')[-1])
                    new_id_num = last_id_num + 1
                    self.id = f'S13-{year}-{new_id_num:03d}'
                except ValueError:
                    self.id = f'S13-{year}-001'
            else:
                self.id = f'S13-{year}-001'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.id

class ReceivingHistory(models.Model):
    id = models.CharField(max_length=50, primary_key=True, blank=True) # S11-2024-001
    date = models.DateField()
    sourceType = models.CharField(max_length=100)
    supplier = models.CharField(max_length=255)
    storeLocation = models.CharField(max_length=100)
    items = models.IntegerField(default=0, blank=True, null=True)
    amount = models.CharField(max_length=100, blank=True, null=True) # E.g., KES 45,000 or numeric
    totalValue = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    signaturePlacement = models.JSONField(blank=True, null=True, default=dict)
    status = models.CharField(max_length=100, default='Posted')
    storekeeperSignature = models.CharField(max_length=100, blank=True, null=True)
    signedAt = models.CharField(max_length=100, blank=True, null=True)
    storekeeperId = models.CharField(max_length=100, blank=True, null=True)
    createdAt = models.DateTimeField(auto_now_add=True, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.id:
            year = timezone.now().year
            last_item = ReceivingHistory.objects.filter(id__startswith=f'S11-{year}').order_by('-id').first()
            if last_item:
                try:
                    last_id_num = int(last_item.id.split('-')[-1])
                    new_id_num = last_id_num + 1
                    self.id = f'S11-{year}-{new_id_num:03d}'
                except ValueError:
                    self.id = f'S11-{year}-001'
            else:
                self.id = f'S11-{year}-001'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.id

class Supplier(models.Model):
    id = models.CharField(max_length=50, primary_key=True) # SUP001
    name = models.CharField(max_length=255)
    tradingName = models.CharField(max_length=255, blank=True, null=True)
    taxPin = models.CharField(max_length=50) 
    registrationNumber = models.CharField(max_length=100, blank=True, null=True)
    contactPerson = models.CharField(max_length=255)
    email = models.EmailField()
    status = models.CharField(max_length=50)
    # Procurement specific additions
    phone = models.CharField(max_length=50, blank=True, null=True)
    physicalAddress = models.TextField(blank=True, null=True)
    postalAddress = models.TextField(blank=True, null=True)
    bankName = models.CharField(max_length=255, blank=True, null=True)
    bankBranch = models.CharField(max_length=255, blank=True, null=True)
    bankAccountNumber = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    category = models.JSONField(default=list) # e.g. ["Supplies"]
    paymentTerms = models.CharField(max_length=100, blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    county = models.CharField(max_length=100, blank=True, null=True)
    createdAt = models.DateField(auto_now_add=True, blank=True, null=True)
    updatedAt = models.DateField(auto_now=True, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.id:
            last_supplier = Supplier.objects.all().order_by("-id").first()
            if last_supplier and last_supplier.id.startswith("SUP"):
                try:
                    last_id_num = int(last_supplier.id[3:])
                    self.id = f"SUP{last_id_num + 1:03d}"
                except ValueError:
                    self.id = "SUP001"
            else:
                self.id = "SUP001"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} - {self.name}"

class PurchaseOrder(models.Model):
    id = models.CharField(max_length=50, primary_key=True) # LPO001
    lpoNumber = models.CharField(max_length=100) # LPO-2024-001
    supplierName = models.CharField(max_length=255)
    status = models.CharField(max_length=100)
    # Procurement specific additions
    date = models.DateField(blank=True, null=True)
    supplierId = models.CharField(max_length=50, blank=True, null=True)
    supplierAddress = models.TextField(blank=True, null=True)
    supplierPhone = models.CharField(max_length=50, blank=True, null=True)
    supplierEmail = models.EmailField(blank=True, null=True)
    supplierTaxPin = models.CharField(max_length=50, blank=True, null=True)
    storeLocation = models.CharField(max_length=100, blank=True, null=True)
    totalValue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paymentStatus = models.CharField(max_length=50, blank=True, null=True)
    paymentTerms = models.CharField(max_length=100, blank=True, null=True)
    expectedDeliveryDate = models.DateField(blank=True, null=True)
    requisitionRef = models.CharField(max_length=100, blank=True, null=True)
    preparedBy = models.CharField(max_length=255, blank=True, null=True)
    preparedAt = models.DateTimeField(blank=True, null=True)
    approvedBy = models.CharField(max_length=255, blank=True, null=True)
    approvedAt = models.DateTimeField(blank=True, null=True)
    linkedGRNs = models.JSONField(default=list)
    notes = models.TextField(blank=True, null=True)
    # Phase 6 linkage fields
    delivery_location = models.CharField(max_length=255, blank=True, null=True)
    expected_delivery = models.DateField(blank=True, null=True)
    account = models.CharField(max_length=50, blank=True, null=True)
    vote_head = models.CharField(max_length=50, blank=True, null=True)
    procurement_method = models.CharField(max_length=50, blank=True, null=True)
    quotation_ref = models.CharField(max_length=100, blank=True, null=True)
    vat_type = models.CharField(max_length=50, blank=True, null=True)
    vat_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    valid_until = models.DateField(blank=True, null=True)
    createdAt = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updatedAt = models.DateTimeField(auto_now=True, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = str(uuid.uuid4())
        if not self.lpoNumber:
            year = timezone.now().year
            last_lpo = PurchaseOrder.objects.filter(lpoNumber__startswith=f'LPO-{year}-').order_by('-lpoNumber').first()
            if last_lpo:
                try:
                    last_num = int(last_lpo.lpoNumber.split('-')[-1])
                    self.lpoNumber = f'LPO-{year}-{last_num + 1:04d}'
                except ValueError:
                    self.lpoNumber = f'LPO-{year}-0001'
            else:
                self.lpoNumber = f'LPO-{year}-0001'
        if not self.status:
            self.status = "Draft"
            
        if not self.preparedAt:
            self.preparedAt = timezone.now()
            
        if self.status == "Approved" and not self.approvedAt:
            self.approvedAt = timezone.now()
            
        super().save(*args, **kwargs)

    def __str__(self):
        return self.lpoNumber

class PurchaseOrderItem(models.Model):
    id = models.CharField(max_length=50, primary_key=True) # LPOI001
    purchaseOrder = models.ForeignKey(PurchaseOrder, related_name='items', on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    unit = models.CharField(max_length=50)
    assetType = models.CharField(max_length=50)
    quantity = models.IntegerField(default=0)
    unitPrice = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deliveredQty = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = str(uuid.uuid4())
        super().save(*args, **kwargs)

    def __str__(self):
        return self.id

class RoutineIssueAuthority(models.Model):
    id = models.CharField(max_length=50, primary_key=True) # 1
    number = models.CharField(max_length=100) # RIA/2025/001
    department = models.CharField(max_length=255)
    costCenter = models.CharField(max_length=100)
    responsibleOfficer = models.CharField(max_length=255)
    startDate = models.DateField()
    endDate = models.DateField()
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50)
    createdAt = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            import uuid
            self.id = str(uuid.uuid4())
            
        if not self.number:
            from django.utils import timezone
            year = timezone.now().year
            last_ria = RoutineIssueAuthority.objects.filter(number__startswith=f'RIA/{year}/').order_by('-number').first()
            if last_ria:
                try:
                    last_num = int(last_ria.number.split('/')[-1])
                    self.number = f'RIA/{year}/{last_num + 1:03d}'
                except ValueError:
                    self.number = f'RIA/{year}/001'
            else:
                self.number = f'RIA/{year}/001'
                
        if not self.status:
            self.status = "draft"
            
        super().save(*args, **kwargs)

    def __str__(self):
        return self.number

class RiaItem(models.Model):
    id = models.BigAutoField(primary_key=True)
    ria = models.ForeignKey(RoutineIssueAuthority, related_name='items', on_delete=models.CASCADE)
    itemCode = models.CharField(max_length=100) # FOOD-BEANS
    itemName = models.CharField(max_length=255)
    unit = models.CharField(max_length=50)
    approvedQty = models.IntegerField(default=0)
    usedQty = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.ria.number} - {self.itemName}"

class InventoryLedger(models.Model):
    itemCode = models.CharField(max_length=100, primary_key=True) # STA-001
    # Optional FK to the InventoryItem to make lookups reliable.
    item = models.ForeignKey('InventoryItem', related_name='ledgers', on_delete=models.SET_NULL, null=True, blank=True)
    itemName = models.CharField(max_length=255)
    unit = models.CharField(max_length=50)
    openingQty = models.IntegerField(default=0)
    openingValue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    totalReceiptsQty = models.IntegerField(default=0)
    totalReceiptsValue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    totalIssuesQty = models.IntegerField(default=0)
    totalIssuesValue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    closingQty = models.IntegerField(default=0)
    closingValue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Quantity that has been reserved/committed for approved requisitions but not yet issued
    committedQty = models.IntegerField(default=0)

    def __str__(self):
        return self.itemCode

class LedgerReceipt(models.Model):
    id = models.BigAutoField(primary_key=True)
    ledger = models.ForeignKey(InventoryLedger, related_name='receipts', on_delete=models.CASCADE)
    date = models.DateField()
    grnNo = models.CharField(max_length=100)
    qty = models.IntegerField(default=0)
    unitCost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    totalCost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Government Ledger Mandatory Fields
    supplierName = models.CharField(max_length=255, blank=True, null=True)
    requisitionNo = models.CharField(max_length=100, blank=True, null=True)
    balanceInStock = models.IntegerField(default=0)
    signatures = models.TextField(blank=True, null=True) # To store JSON verification strings

    def clean(self):
        super().clean()
        if self.pk is not None:
            orig = LedgerReceipt.objects.get(pk=self.pk)
            if orig.date != self.date or orig.unitCost != self.unitCost or orig.qty != self.qty:
                from django.core.exceptions import ValidationError
                raise ValidationError("LedgerReceipt entries are immutable after posting.")

    def save(self, *args, **kwargs):
        self.full_clean()
        if self.pk is not None:
            orig = LedgerReceipt.objects.get(pk=self.pk)
            if orig.date != self.date or orig.unitCost != self.unitCost or orig.qty != self.qty:
                from django.core.exceptions import ValidationError
                raise ValidationError("LedgerReceipt entries are immutable after posting. Use reversal workflows.")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.grnNo

class LedgerIssue(models.Model):
    id = models.BigAutoField(primary_key=True)
    ledger = models.ForeignKey(InventoryLedger, related_name='issues', on_delete=models.CASCADE)
    date = models.DateField()
    s13No = models.CharField(max_length=100)
    qty = models.IntegerField(default=0)
    dept = models.CharField(max_length=255)
    unitCost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    totalCost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    riaNo = models.CharField(max_length=100, blank=True, null=True)

    # Government Ledger Mandatory Fields
    requisitionNo = models.CharField(max_length=100, blank=True, null=True)
    balanceInStock = models.IntegerField(default=0)
    signature = models.CharField(max_length=255, blank=True, null=True)

    def clean(self):
        super().clean()
        if self.pk is not None:
            orig = LedgerIssue.objects.get(pk=self.pk)
            if orig.date != self.date or orig.unitCost != self.unitCost or orig.qty != self.qty:
                from django.core.exceptions import ValidationError
                raise ValidationError("LedgerIssue entries are immutable after posting.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.s13No


class RequisitionApproval(models.Model):
    """Records approval actions on a requisition. Stores per-item approvals in `items` JSON."""
    id = models.BigAutoField(primary_key=True)
    requisition = models.ForeignKey(Requisition, related_name='approvals', on_delete=models.CASCADE)
    approver = models.CharField(max_length=255)
    level = models.IntegerField(default=1)
    decision = models.CharField(max_length=30)  # approved | partially_approved | rejected | returned
    comments = models.TextField(blank=True, default='')
    items = models.JSONField(default=list)  # list of {'requisition_item_id': id, 'approved_qty': n, 'decision': 'approved'/'rejected'}
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Approval {self.id} for {self.requisition.s12Number} by {self.approver}"


class RequisitionStatusLog(models.Model):
    id = models.BigAutoField(primary_key=True)
    requisition = models.ForeignKey(Requisition, related_name='status_logs', on_delete=models.CASCADE)
    previous_status = models.CharField(max_length=100)
    new_status = models.CharField(max_length=100)
    changed_by = models.CharField(max_length=255)
    reason = models.TextField(blank=True, default='')
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Status {self.previous_status} → {self.new_status} for {self.requisition.s12Number}"

class StoreReport(models.Model):
    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    date = models.CharField(max_length=100, blank=True, null=True)
    type = models.CharField(max_length=50) # Monthly, weekly, etc.
    iconName = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.title

class StockAdjustment(models.Model):
    id = models.CharField(max_length=50, primary_key=True, blank=True)
    date = models.CharField(max_length=100)
    item = models.CharField(max_length=255)
    type = models.CharField(max_length=50) # Addition or Deduction
    qty = models.IntegerField(default=0)
    reason = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default="Pending")
    approvedBy = models.CharField(max_length=255, default="-")
    remarks = models.TextField(blank=True, null=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            from django.utils import timezone
            year = timezone.now().year
            last_record = StockAdjustment.objects.filter(id__startswith=f'ADJ-{year}-').order_by('-id').first()
            if last_record:
                try:
                    last_num = int(last_record.id.split('-')[-1])
                    self.id = f'ADJ-{year}-{last_num + 1:03d}'
                except ValueError:
                    self.id = f'ADJ-{year}-001'
            else:
                self.id = f'ADJ-{year}-001'
                
        if not self.status:
            self.status = "Pending"
        if not self.approvedBy:
            self.approvedBy = "-"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} - {self.item}"

class StoreTransfer(models.Model):
    id = models.CharField(max_length=50, primary_key=True, blank=True)
    date = models.CharField(max_length=100)
    from_store = models.CharField(max_length=255)
    to_store = models.CharField(max_length=255)
    items = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default="Pending Approval")
    createdAt = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            from django.utils import timezone
            year = timezone.now().year
            last_record = StoreTransfer.objects.filter(id__startswith=f'TRF-{year}-').order_by('-id').first()
            if last_record:
                try:
                    last_num = int(last_record.id.split('-')[-1])
                    self.id = f'TRF-{year}-{last_num + 1:03d}'
                except ValueError:
                    self.id = f'TRF-{year}-001'
            else:
                self.id = f'TRF-{year}-001'
                
        if not self.status:
            self.status = "Pending Approval"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} : {self.from_store} -> {self.to_store}"

class FileMovement(models.Model):
    id = models.CharField(max_length=50, primary_key=True, blank=True)
    fileReference = models.CharField(max_length=255)
    fileTitle = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    borrowedBy = models.CharField(max_length=255)
    borrowerDepartment = models.CharField(max_length=100)
    borrowDate = models.CharField(max_length=100)
    expectedReturnDate = models.CharField(max_length=100)
    actualReturnDate = models.CharField(max_length=100, blank=True, null=True)
    purpose = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default="Checked Out")
    borrowerSignature = models.BooleanField(default=False)
    returnSignature = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            last_record = FileMovement.objects.filter(id__startswith='MOV-').order_by('-id').first()
            if last_record:
                try:
                    last_num = int(last_record.id.split('-')[-1])
                    self.id = f'MOV-{last_num + 1:03d}'
                except ValueError:
                    self.id = 'MOV-001'
            else:
                self.id = 'MOV-001'
                
        if not self.status:
            self.status = "Checked Out"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} - {self.fileReference}"

class RetentionRecord(models.Model):
    id = models.CharField(max_length=50, primary_key=True, blank=True)
    recordCode = models.CharField(max_length=255, blank=True)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    description = models.TextField()
    creationDate = models.DateField()
    retentionYears = models.IntegerField(default=7)
    expiryDate = models.DateField(blank=True, null=True)
    location = models.CharField(max_length=100)
    custodian = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default="Active")
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.id:
            last_record = RetentionRecord.objects.filter(id__startswith='REC').order_by('-id').first()
            if last_record:
                try:
                    last_num = int(last_record.id[3:])
                    self.id = f'REC{last_num + 1:03d}'
                except ValueError:
                    self.id = 'REC001'
            else:
                self.id = 'REC001'

        if not self.recordCode:
            self.recordCode = f"DOC/{self.creationDate.year if self.creationDate else 'NA'}/{self.id}"
            
        if self.creationDate and self.retentionYears:
            import datetime
            try:
                self.expiryDate = self.creationDate.replace(year=self.creationDate.year + self.retentionYears)
            except ValueError:
                # Handle leap year edge case mapping February 29 properly to February 28
                self.expiryDate = self.creationDate + (datetime.date(self.creationDate.year + self.retentionYears, 1, 1) - datetime.date(self.creationDate.year, 1, 1))

        if not self.status:
            self.status = "Active"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} - {self.title}"

class AppraisalWorkflow(models.Model):
    id = models.CharField(max_length=50, primary_key=True, blank=True)
    recordId = models.CharField(max_length=50)
    recordCode = models.CharField(max_length=255)
    recordTitle = models.CharField(max_length=255)
    initiatedBy = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default="Pending")
    createdAt = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if not self.id:
            last_record = AppraisalWorkflow.objects.filter(id__startswith='APR').order_by('-id').first()
            if last_record:
                try:
                    last_num = int(last_record.id[3:])
                    self.id = f'APR{last_num + 1:03d}'
                except ValueError:
                    self.id = 'APR001'
            else:
                self.id = 'APR001'
                
        if not self.status:
            self.status = "Pending"
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} ({self.status})"

class DisposalRecord(models.Model):
    id = models.CharField(max_length=50, primary_key=True, blank=True)
    recordId = models.CharField(max_length=50)
    appraisalId = models.CharField(max_length=50)
    disposalMethod = models.CharField(max_length=100)
    certificateNumber = models.CharField(max_length=100, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            last_record = DisposalRecord.objects.filter(id__startswith='DSP').order_by('-id').first()
            if last_record:
                try:
                    last_num = int(last_record.id[3:])
                    self.id = f'DSP{last_num + 1:03d}'
                except ValueError:
                    self.id = 'DSP001'
            else:
                self.id = 'DSP001'

        if not self.certificateNumber:
            from django.utils import timezone
            year = timezone.now().year
            last_cert = DisposalRecord.objects.filter(certificateNumber__startswith=f'CERT-{year}-').order_by('-id').first()
            if last_cert:
                try:
                    last_num = int(last_cert.certificateNumber.split('-')[-1])
                    self.certificateNumber = f'CERT-{year}-{last_num + 1:03d}'
                except ValueError:
                    self.certificateNumber = f'CERT-{year}-001'
            else:
                self.certificateNumber = f'CERT-{year}-001'

        super().save(*args, **kwargs)

    def __str__(self):
        return self.id


class AssetDisposalRecord(models.Model):
    """Record a disposal event tied to a FixedAsset (full or partial)."""
    id = models.BigAutoField(primary_key=True)
    asset = models.ForeignKey('stores.FixedAsset', on_delete=models.CASCADE, related_name='disposals')
    disposed_qty = models.IntegerField(default=0)
    disposal_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    disposal_status = models.CharField(max_length=50, blank=True, default='')
    disposal_date = models.DateField(null=True, blank=True)
    reason = models.TextField(blank=True, default='')
    created_by = models.CharField(max_length=255, blank=True, default='')
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stores_asset_disposal'
        verbose_name = 'Asset Disposal'
        verbose_name_plural = 'Asset Disposals'

    def __str__(self):
        return f"{self.asset.assetCode} - disposed {self.disposed_qty} @ {self.disposal_date}"

    # Approval workflow fields
    approval_status = models.CharField(max_length=20, default='pending', help_text='pending|approved|rejected')
    committee_reference = models.CharField(max_length=255, blank=True, default='')
    proceeds = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    write_off_posted = models.BooleanField(default=False)
    approved_by = models.CharField(max_length=255, blank=True, default='')
    approved_at = models.DateTimeField(null=True, blank=True)

class InventorySetting(models.Model):
    key = models.CharField(max_length=100, primary_key=True)
    value = models.JSONField(default=list)

    def __str__(self):
        return self.key

class PurchaseRequisition(models.Model):
    id = models.CharField(max_length=50, primary_key=True) # REQ-YYYY-XXX
    date = models.DateField()
    department = models.CharField(max_length=255)
    requestedBy = models.CharField(max_length=255)
    items = models.IntegerField(default=0)
    estimatedValue = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default="draft")
    priority = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    justification = models.TextField()
    budgetCode = models.CharField(max_length=100)

    # Workflow properties
    approvedBy = models.CharField(max_length=255, blank=True, null=True)
    approvedDate = models.DateField(blank=True, null=True)
    rejectionReason = models.TextField(blank=True, null=True)
    processedBy = models.CharField(max_length=255, blank=True, null=True)
    processedDate = models.DateField(blank=True, null=True)

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.id:
            year = timezone.now().year
            last_req = PurchaseRequisition.objects.filter(id__startswith=f'REQ-{year}-').order_by('-id').first()
            if last_req:
                try:
                    last_num = int(last_req.id.split('-')[-1])
                    self.id = f'REQ-{year}-{last_num + 1:03d}'
                except ValueError:
                    self.id = f'REQ-{year}-001'
            else:
                self.id = f'REQ-{year}-001'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.id

class Tender(models.Model):
    id = models.CharField(max_length=50, primary_key=True) # TND-YYYY-XXX
    title = models.CharField(max_length=255)
    method = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    budget = models.CharField(max_length=100)
    closingDate = models.DateField()
    bids = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default="open")
    createdAt = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            year = timezone.now().year
            last_tender = Tender.objects.filter(id__startswith=f'TND-{year}-').order_by('-id').first()
            if last_tender:
                try:
                    last_num = int(last_tender.id.split('-')[-1])
                    self.id = f'TND-{year}-{last_num + 1:03d}'
                except ValueError:
                    self.id = f'TND-{year}-001'
            else:
                self.id = f'TND-{year}-001'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.id

class Quotation(models.Model):
    id = models.CharField(max_length=50, primary_key=True) # RFQ-YYYY-XXX
    title = models.CharField(max_length=255)
    vendor = models.CharField(max_length=255)
    submittedDate = models.DateField()
    value = models.CharField(max_length=100)
    validUntil = models.DateField()
    status = models.CharField(max_length=50, default="pending_review")
    createdAt = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            year = timezone.now().year
            last_rfq = Quotation.objects.filter(id__startswith=f'RFQ-{year}-').order_by('-id').first()
            if last_rfq:
                try:
                    last_num = int(last_rfq.id.split('-')[-1])
                    self.id = f'RFQ-{year}-{last_num + 1:03d}'
                except ValueError:
                    self.id = f'RFQ-{year}-001'
            else:
                self.id = f'RFQ-{year}-001'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.id

class ProcurementReference(models.Model):
    id = models.CharField(max_length=50, primary_key=True, blank=True) # e.g. bbda2...
    referenceNumber = models.CharField(max_length=100) # SCH/Suppls/24/25/00001
    entityCode = models.CharField(max_length=50) # SCH
    procurementType = models.CharField(max_length=100) # Supplies
    description = models.TextField(blank=True, null=True)
    department = models.CharField(max_length=100)
    requestedBy = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default="Active")
    createdAt = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            import uuid
            self.id = str(uuid.uuid4())
            
        if not self.referenceNumber:
            from django.utils import timezone
            year = timezone.now().year
            # Simplified generated logic matching the payload schemas flexibly elegantly intuitively brilliantly
            # Next year parsing: 24/25 etc... e.g 24/25
            curr_yr_short = str(year)[-2:]
            next_yr_short = str(year + 1)[-2:]
            prefix = f"{self.entityCode}/{self.procurementType}/{curr_yr_short}/{next_yr_short}/"
            
            last_ref = ProcurementReference.objects.filter(referenceNumber__startswith=prefix).order_by('-referenceNumber').first()
            if last_ref:
                try:
                    last_num = int(last_ref.referenceNumber.split('/')[-1])
                    self.referenceNumber = f"{prefix}{last_num + 1:05d}"
                except ValueError:
                    self.referenceNumber = f"{prefix}00001"
            else:
                self.referenceNumber = f"{prefix}00001"
                
        if not self.status:
            self.status = "Active"
            
        super().save(*args, **kwargs)

    def __str__(self):
        return self.referenceNumber

class ProcurementContract(models.Model):
    id = models.CharField(max_length=50, primary_key=True, blank=True)
    contractNumber = models.CharField(max_length=100, blank=True)
    contractName = models.CharField(max_length=255)
    contractType = models.CharField(max_length=100)
    contractorName = models.CharField(max_length=255)
    contractorAddress = models.CharField(max_length=255, null=True, blank=True)
    contractorContact = models.CharField(max_length=255, null=True, blank=True)
    tenderReference = models.CharField(max_length=100, null=True, blank=True)
    awardDate = models.DateTimeField(null=True, blank=True)
    commencementDate = models.DateTimeField(null=True, blank=True)
    completionDate = models.DateTimeField(null=True, blank=True)
    actualCompletionDate = models.DateTimeField(null=True, blank=True)
    totalValue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    accountCharged = models.CharField(max_length=100, null=True, blank=True)
    performanceGuarantee = models.CharField(max_length=100, null=True, blank=True)
    guaranteeExpiry = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, default="Active")
    remarks = models.TextField(null=True, blank=True)
    createdBy = models.CharField(max_length=100, default="Unknown", null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            import uuid
            self.id = str(uuid.uuid4())
            
        if not self.contractNumber:
            from django.utils import timezone
            year = timezone.now().year
            
            last_contract = ProcurementContract.objects.filter(contractNumber__startswith=f'CNT/{year}/').order_by('-contractNumber').first()
            if last_contract:
                try:
                    last_num = int(last_contract.contractNumber.split('/')[-1])
                    self.contractNumber = f"CNT/{year}/{last_num + 1:03d}"
                except ValueError:
                    self.contractNumber = f"CNT/{year}/001"
            else:
                self.contractNumber = f"CNT/{year}/001"
                
        if not self.status:
            self.status = "Active"
            
        super().save(*args, **kwargs)

    def __str__(self):
        return self.contractNumber

class ContractMilestone(models.Model):
    id = models.CharField(max_length=50, primary_key=True, blank=True)
    contract = models.ForeignKey(ProcurementContract, related_name='paymentMilestones', on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    dueDate = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=50, default="Pending")
    paidDate = models.DateTimeField(blank=True, null=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            import uuid
            self.id = str(uuid.uuid4())
            
        if not self.status:
            self.status = "Pending"
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.contract.contractNumber} - {self.description}"


# =============================================================================
# Phase 2 — S2 Ledger & Core Stores Workflows
# =============================================================================

TRANSACTION_TYPE_CHOICES = [
    ('receipt', 'Receipt (GRN → Store)'),
    ('issue', 'Issue (Store → Dept)'),
    ('transfer', 'Department Transfer'),
    ('return', 'Return to Store'),
    ('damage', 'Damage / Loss'),
    ('condemn', 'Condemn / Write-off'),
    ('adjustment', 'Stock Adjustment'),
]

ENTRY_STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('posted', 'Posted'),
    ('reversed', 'Reversed'),
    ('locked', 'Audit Locked'),
]


class S2Transaction(models.Model):
    """
    Individual S2 ledger line entry — each row is a single transaction event
    (receipt, issue, transfer, return, damage, etc.) with full audit trail.
    """
    id = models.CharField(max_length=50, primary_key=True, blank=True)
    transaction_type = models.CharField(
        max_length=20, choices=TRANSACTION_TYPE_CHOICES, db_index=True
    )
    status = models.CharField(
        max_length=20, choices=ENTRY_STATUS_CHOICES, default='posted', db_index=True
    )

    # Reference / Linking
    ref_no = models.CharField(max_length=100, blank=True, default='', db_index=True)
    date = models.DateField(db_index=True)
    item = models.ForeignKey(
        InventoryItem, on_delete=models.PROTECT, null=True, blank=True,
        related_name='s2_transactions'
    )
    item_code = models.CharField(max_length=100, blank=True, default='', db_index=True)
    item_name = models.CharField(max_length=255, blank=True, default='')
    category = models.CharField(max_length=100, blank=True, default='')
    category_type = models.CharField(
        max_length=20, choices=ItemTypeChoices.choices, blank=True, default=''
    )
    unit = models.CharField(max_length=50, blank=True, default='')

    # Quantities & Values
    qty_received = models.IntegerField(default=0)
    qty_issued = models.IntegerField(default=0)
    running_balance_before = models.IntegerField(default=0)
    running_balance_after = models.IntegerField(default=0)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Foreign references
    supplier_id = models.CharField(max_length=100, blank=True, default='')
    supplier_name = models.CharField(max_length=255, blank=True, default='')
    custodian_id = models.CharField(max_length=100, blank=True, default='')
    custodian_name = models.CharField(max_length=255, blank=True, default='')
    dept_id = models.CharField(max_length=100, blank=True, default='')
    dept_name = models.CharField(max_length=255, blank=True, default='')

    # Condition & Notes
    condition = models.CharField(max_length=100, blank=True, default='')
    remarks = models.TextField(blank=True, default='')

    # Approval / Audit
    created_by = models.CharField(max_length=255, blank=True, default='')
    approved_by = models.CharField(max_length=255, blank=True, default='')
    approved_at = models.DateTimeField(null=True, blank=True)

    # Reversal linking
    reversed_by = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reversal_entries'
    )
    reversal_reason = models.TextField(blank=True, default='')

    # Timestamps
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stores_s2_transaction'
        verbose_name = 'S2 Transaction'
        verbose_name_plural = 'S2 Transactions'
        ordering = ['-date', '-createdAt']

    def save(self, *args, **kwargs):
        if not self.id:
            from django.utils import timezone
            year = timezone.now().year
            last_txn = S2Transaction.objects.filter(id__startswith=f'S2-{year}-').order_by('-id').first()
            if last_txn:
                try:
                    last_num = int(last_txn.id.split('-')[-1])
                    self.id = f'S2-{year}-{last_num + 1:05d}'
                except (ValueError, IndexError):
                    self.id = f'S2-{year}-00001'
            else:
                self.id = f'S2-{year}-00001'
        # Prevent direct edits to core posting fields for already-posted entries.
        if self.pk:
            try:
                orig = S2Transaction.objects.get(pk=self.pk)
            except S2Transaction.DoesNotExist:
                orig = None
            protected_fields = {
                'transaction_type', 'item_id', 'item_code', 'item_name',
                'qty_received', 'qty_issued', 'unit_cost', 'total_value',
                'running_balance_before', 'running_balance_after', 'date', 'ref_no'
            }
            # Allow certain update-only operations (reversal/status updates) to proceed
            update_fields = kwargs.get('update_fields')
            allowed_meta_updates = {'status', 'reversed_by', 'reversal_reason', 'approved_by', 'approved_at'}
            if orig and orig.status == 'posted':
                # If caller specified update_fields and it's only meta fields, allow it.
                if update_fields and set(update_fields).issubset(allowed_meta_updates):
                    pass
                else:
                    # Otherwise prevent edits to core posting fields.
                    changed = False
                    for field in protected_fields:
                        attr = field
                        if hasattr(orig, attr) and getattr(orig, attr) != getattr(self, attr):
                            changed = True
                            break
                    if changed:
                        from django.core.exceptions import ValidationError
                        raise ValidationError("Editing posted S2 transactions is not allowed. Use reversal/adjustment workflows.")

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} ({self.get_transaction_type_display()})"


class S2Ledger(models.Model):
    """
    S2 (Storekeeper) Ledger — Running balance summary per item.
    Updated atomically whenever a S2Transaction is posted.
    """
    id = models.CharField(max_length=50, primary_key=True, blank=True)
    item = models.ForeignKey(
        InventoryItem, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='s2_ledgers'
    )
    itemCode = models.CharField(max_length=100, unique=True, db_index=True)
    itemName = models.CharField(max_length=255, blank=True, default='')
    category = models.CharField(max_length=100, blank=True, default='')
    category_type = models.CharField(
        max_length=20, choices=ItemTypeChoices.choices, blank=True, default=''
    )
    unit = models.CharField(max_length=50, blank=True, default='')
    openingBalance = models.IntegerField(default=0)
    receiptsQty = models.IntegerField(default=0)
    receiptsValue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    issuesQty = models.IntegerField(default=0)
    issuesValue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    transfersOutQty = models.IntegerField(default=0)
    transfersOutValue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    transfersInQty = models.IntegerField(default=0)
    transfersInValue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    returnsQty = models.IntegerField(default=0)
    returnsValue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    damagesQty = models.IntegerField(default=0)
    damagesValue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    closingBalance = models.IntegerField(default=0)
    closingValue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    lastTransactionDate = models.DateField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stores_s2_ledger'
        verbose_name = 'S2 Ledger'
        verbose_name_plural = 'S2 Ledgers'

    def save(self, *args, **kwargs):
        if not self.id:
            from django.utils import timezone
            year = timezone.now().year
            last_ledger = S2Ledger.objects.filter(id__startswith=f'SL-{year}-').order_by('-id').first()
            if last_ledger:
                try:
                    last_num = int(last_ledger.id.split('-')[-1])
                    self.id = f'SL-{year}-{last_num + 1:05d}'
                except (ValueError, IndexError):
                    self.id = f'SL-{year}-00001'
            else:
                self.id = f'SL-{year}-00001'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.itemCode} (S2 Bal: {self.closingBalance})"


ASSET_STATUS_CHOICES = [
    ('procured', 'Procured'),
    ('in_stores', 'In Stores'),
    ('deployed', 'Deployed'),
    ('active', 'Active'),
    ('maintenance', 'Under Maintenance'),
    ('damaged', 'Damaged'),
    ('lost', 'Lost'),
    ('obsolete', 'Obsolete'),
    ('disposed', 'Disposed'),
]

ASSET_STATUS_TRANSITIONS = {
    'procured': ['in_stores', 'damaged', 'lost', 'disposed'],
    'in_stores': ['deployed', 'damaged', 'lost', 'obsolete', 'disposed'],
    'deployed': ['active', 'maintenance', 'damaged', 'lost', 'obsolete', 'disposed'],
    'active': ['maintenance', 'damaged', 'lost', 'obsolete', 'disposed'],
    'maintenance': ['active', 'damaged', 'lost', 'obsolete', 'disposed'],
    'damaged': ['maintenance', 'obsolete', 'disposed'],
    'lost': ['disposed'],
    'obsolete': ['disposed'],
    'disposed': [],
}

DEPRECIATION_METHOD_CHOICES = [
    ('straight_line', 'Straight Line'),
    ('declining_balance', 'Declining Balance'),
    ('sum_of_years', 'Sum of Years Digits'),
    ('units_of_production', 'Units of Production'),
    ('none', 'No Depreciation'),
]


class FixedAsset(AuditMixin, LockedPreventSaveMixin, models.Model):
    """
    Fixed Asset Register — tracks school fixed assets with full lifecycle management.
    Supports grouped assets (parent/child), status state machine, partial disposal,
    maintenance scheduling, and depreciation tracking.
    """
    id = models.CharField(max_length=50, primary_key=True, blank=True)
    assetCode = models.CharField(max_length=100, unique=True, blank=True)
    tag_no = models.CharField(max_length=100, blank=True, default='')
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True, default='')
    category_type = models.CharField(
        max_length=20, choices=ItemTypeChoices.choices, blank=True, default=''
    )
    asset_type = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    serial_no = models.CharField(max_length=255, blank=True, default='')
    unit = models.CharField(max_length=50, blank=True, default='')

    # Quantity & Cost
    qty = models.IntegerField(default=1)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    purchaseDate = models.DateField(null=True, blank=True)
    acq_date = models.DateField(null=True, blank=True)
    purchaseCost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currentValue = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Supplier & Funding
    supplier_id = models.CharField(max_length=100, blank=True, default='')
    supplier_name = models.CharField(max_length=255, blank=True, default='')
    funding_source = models.CharField(max_length=255, blank=True, default='')

    # Department & Custodian
    dept_id = models.CharField(max_length=100, blank=True, default='')
    dept_name = models.CharField(max_length=255, blank=True, default='')
    custodian_id = models.CharField(max_length=100, blank=True, default='')
    custodian = models.CharField(max_length=255, blank=True, default='')
    location_id = models.CharField(max_length=100, blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')

    # Depreciation
    useful_life = models.IntegerField(default=0, help_text='Useful life in months')
    usefulLifeMonths = models.IntegerField(default=0)
    residual_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    depreciation_method = models.CharField(
        max_length=30, choices=DEPRECIATION_METHOD_CHOICES,
        default='straight_line',
    )
    depreciation_start_date = models.DateField(null=True, blank=True, help_text='Date when depreciation begins')
    accumulated_depreciation = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    nbv = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text='Net Book Value'
    )

    # Lifecycle
    status = models.CharField(
        max_length=50, choices=ASSET_STATUS_CHOICES, default='procured'
    )
    warranty_expiry = models.DateField(null=True, blank=True)
    next_maintenance = models.DateField(null=True, blank=True)

    # Disposal
    disposal_status = models.CharField(max_length=50, blank=True, default='')
    disposal_date = models.DateField(null=True, blank=True)
    disposal_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    disposal_reason = models.TextField(blank=True, default='')

    # Grouped Asset Support
    parent_asset = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='child_assets',
    )

    # Source Links
    source_item = models.ForeignKey(
        InventoryItem, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='fixed_assets',
    )
    source_prompt = models.ForeignKey(
        'CapitalizationPrompt', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='fixed_assets',
    )

    # Audit
    notes = models.TextField(blank=True, default='')
    created_by = models.CharField(max_length=255, blank=True, default='')
    locked = models.BooleanField(default=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stores_fixed_asset'
        verbose_name = 'Fixed Asset'
        verbose_name_plural = 'Fixed Assets'

    def save(self, *args, **kwargs):
        if not self.id:
            from django.utils import timezone
            year = timezone.now().year
            last_asset = FixedAsset.objects.filter(
                id__startswith=f'FA-{year}-'
            ).order_by('-id').first()
            if last_asset:
                try:
                    last_num = int(last_asset.id.split('-')[-1])
                    self.id = f'FA-{year}-{last_num + 1:05d}'
                except (ValueError, IndexError):
                    self.id = f'FA-{year}-00001'
            else:
                self.id = f'FA-{year}-00001'

        if not self.assetCode:
            self.assetCode = self.id

        # Auto-calculate NBV
        if self.total_cost and self.accumulated_depreciation:
            self.nbv = self.total_cost - self.accumulated_depreciation
        elif self.total_cost:
            self.nbv = self.total_cost

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.assetCode or self.id} - {self.name}"

    def can_transition_to(self, new_status: str) -> bool:
        """Check if status transition is valid per state machine."""
        allowed = ASSET_STATUS_TRANSITIONS.get(self.status, [])
        return new_status in allowed

    def get_allowed_transitions(self) -> list:
        """Return list of valid next statuses."""
        return ASSET_STATUS_TRANSITIONS.get(self.status, [])

    def calculate_nbv_after_partial_disposal(self, disposed_qty: int) -> dict:
        """
        Calculate proportional NBV adjustment for partial disposal.
        Returns dict with adjustment details.
        """
        if disposed_qty <= 0 or disposed_qty >= self.qty:
            return {
                'error': 'disposed_qty must be between 1 and qty-1 for partial disposal',
            }
        ratio = disposed_qty / self.qty
        nbv_reduction = round(self.nbv * ratio, 2)
        cost_reduction = round(self.total_cost * ratio, 2)
        remaining_qty = self.qty - disposed_qty
        remaining_nbv = round(self.nbv - nbv_reduction, 2)
        remaining_cost = round(self.total_cost - cost_reduction, 2)

        return {
            'disposed_qty': disposed_qty,
            'remaining_qty': remaining_qty,
            'nbv_reduction': nbv_reduction,
            'remaining_nbv': remaining_nbv,
            'cost_reduction': cost_reduction,
            'remaining_cost': remaining_cost,
            'ratio': round(ratio, 4),
        }


class AssetStatusHistory(models.Model):
    """
    Audit trail for every asset status change.
    Records from/to status, who changed it, and why.
    """
    id = models.BigAutoField(primary_key=True)
    asset = models.ForeignKey(
        FixedAsset, on_delete=models.CASCADE,
        related_name='status_history',
    )
    from_status = models.CharField(max_length=50, blank=True, default='')
    to_status = models.CharField(max_length=50)
    changed_by = models.CharField(max_length=255, blank=True, default='')
    reason = models.TextField(blank=True, default='')
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stores_asset_status_history'
        verbose_name = 'Asset Status History'
        verbose_name_plural = 'Asset Status Histories'
        ordering = ['-createdAt']

    def __str__(self):
        return f"{self.asset.assetCode}: {self.from_status} → {self.to_status}"


class AssetMaintenance(models.Model):
    """
    Maintenance scheduling and tracking for fixed assets.
    """
    id = models.BigAutoField(primary_key=True)
    asset = models.ForeignKey(
        FixedAsset, on_delete=models.CASCADE,
        related_name='maintenance_records',
    )
    maintenance_type = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    scheduled_date = models.DateField(null=True, blank=True)
    completed_date = models.DateField(null=True, blank=True)
    cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    vendor = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=50, default='scheduled')
    notes = models.TextField(blank=True, default='')
    created_by = models.CharField(max_length=255, blank=True, default='')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stores_asset_maintenance'
        verbose_name = 'Asset Maintenance'
        verbose_name_plural = 'Asset Maintenances'
        ordering = ['-scheduled_date']

    def __str__(self):
        return f"{self.asset.assetCode} - {self.maintenance_type} ({self.status})"


class CapitalizationRule(models.Model):
    """
    Capitalization threshold rules — determines when an item is capitalized.
    Rules are evaluated in order (A, B, C, D) by the rule engine.
    """
    id = models.BigAutoField(primary_key=True)
    rule_code = models.CharField(
        max_length=10, unique=True, blank=True,
        help_text="Rule identifier: A, B, C, or D"
    )
    categoryType = models.CharField(
        max_length=20,
        choices=ItemTypeChoices.choices,
        default=ItemTypeChoices.FIXED_ASSET,
        help_text="Item type this rule applies to"
    )
    rule_label = models.CharField(
        max_length=100, blank=True, default='',
        help_text="Human-readable rule description"
    )
    minCost = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Minimum unit cost to trigger capitalization"
    )
    minUsefulLifeMonths = models.IntegerField(
        default=12,
        help_text="Minimum useful life in months"
    )
    bulkThreshold = models.IntegerField(
        default=1,
        help_text="Quantity threshold for bulk/grouped treatment (Rule D)"
    )
    bulkMateriality = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total value threshold for bulk materiality"
    )
    action = models.CharField(
        max_length=30, default='expense',
        choices=[
            ('expense', 'Expense Immediately'),
            ('capitalize', 'Capitalize as Asset'),
            ('prompt', 'Prompt for Decision'),
        ],
        help_text="Action to take when rule matches"
    )
    description = models.TextField(blank=True, default='')
    priority = models.IntegerField(
        default=0,
        help_text="Evaluation priority (lower = evaluated first)"
    )
    isActive = models.BooleanField(default=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stores_capitalization_rule'
        verbose_name = 'Capitalization Rule'
        verbose_name_plural = 'Capitalization Rules'
        ordering = ['priority', 'id']

    def save(self, *args, **kwargs):
        if not self.rule_code:
            last_rule = CapitalizationRule.objects.order_by('-id').first()
            if last_rule and last_rule.rule_code:
                try:
                    last_code = last_rule.rule_code
                    next_num = ord(last_code[-1]) + 1
                    self.rule_code = chr(next_num)
                except (ValueError, IndexError):
                    self.rule_code = 'A'
            else:
                self.rule_code = 'A'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Rule {self.rule_code}: {self.get_categoryType_display()} >= {self.minCost} / {self.minUsefulLifeMonths}m"


class CapitalizationSetting(models.Model):
    """
    Global capitalization settings — thresholds, defaults, and asset classes.
    Values are pulled from this singleton settings table by the rule engine.
    """
    id = models.BigAutoField(primary_key=True)
    threshold = models.DecimalField(
        max_digits=12, decimal_places=2, default=50000,
        help_text="Default capitalization threshold in KES"
    )
    bulk_materiality = models.DecimalField(
        max_digits=12, decimal_places=2, default=100000,
        help_text="Bulk/grouped materiality threshold in KES"
    )
    min_useful_life = models.IntegerField(
        default=12,
        help_text="Default minimum useful life in months for capitalization"
    )
    depreciation_start_rule = models.CharField(
        max_length=30, default='month_after_acquisition',
        choices=[
            ('date_of_acquisition', 'Date of Acquisition'),
            ('month_after_acquisition', 'Month After Acquisition'),
            ('quarter_after_acquisition', 'Quarter After Acquisition'),
        ],
        help_text="When depreciation begins"
    )
    default_residual_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=10.00,
        help_text="Default residual value as percentage of cost"
    )
    asset_classes = models.JSONField(
        default=list, blank=True,
        help_text="List of asset class definitions as JSON"
    )
    updated_by = models.CharField(max_length=255, blank=True, default='')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stores_capitalization_setting'
        verbose_name = 'Capitalization Setting'
        verbose_name_plural = 'Capitalization Settings'

    def __str__(self):
        return f"Cap Settings: threshold={self.threshold}, bulk={self.bulk_materiality}"


class CapitalizationPrompt(models.Model):
    """
    Audit log for capitalization override decisions.
    Every auto-suggestion, user override, and approval is recorded here.
    """
    id = models.CharField(max_length=50, primary_key=True, blank=True)
    transaction = models.ForeignKey(
        S2Transaction, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='capitalization_prompts'
    )
    item = models.ForeignKey(
        InventoryItem, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='capitalization_prompts'
    )
    item_code = models.CharField(max_length=100, blank=True, default='')
    item_name = models.CharField(max_length=255, blank=True, default='')
    category_type = models.CharField(
        max_length=20, choices=ItemTypeChoices.choices, blank=True, default=''
    )
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantity = models.IntegerField(default=1)
    total_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Rule evaluation results
    applied_rule = models.CharField(max_length=10, blank=True, default='')
    suggested_action = models.CharField(
        max_length=30, blank=True, default='',
        choices=[
            ('expense', 'Expense Immediately'),
            ('capitalize', 'Capitalize as Asset'),
            ('bulk_capitalize', 'Bulk/Grouped Capitalize'),
            ('prompt', 'Awaiting Decision'),
        ],
    )
    suggested_category_type = models.CharField(
        max_length=20, blank=True, default='',
        help_text="Auto-suggested category type"
    )

    # Override workflow
    override_decision = models.CharField(
        max_length=30, blank=True, default='',
        choices=[
            ('', 'No Override'),
            ('expense', 'Override → Expense'),
            ('capitalize', 'Override → Capitalize'),
            ('reclassify', 'Override → Reclassify'),
        ],
    )
    override_reason = models.TextField(blank=True, default='')
    override_by = models.CharField(max_length=255, blank=True, default='')
    override_at = models.DateTimeField(null=True, blank=True)

    # Approval
    approval_status = models.CharField(
        max_length=20, default='auto',
        choices=[
            ('auto', 'Auto-Approved (Rule Match)'),
            ('pending', 'Pending Approval'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
        ],
    )
    approved_by = models.CharField(max_length=255, blank=True, default='')
    approved_at = models.DateTimeField(null=True, blank=True)
    approval_notes = models.TextField(blank=True, default='')

    is_bulk = models.BooleanField(default=False, help_text="Flag for bulk/grouped items")
    bulk_group_ref = models.CharField(
        max_length=100, blank=True, default='',
        help_text="Reference grouping bulk items together"
    )

    created_by = models.CharField(max_length=255, blank=True, default='')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stores_capitalization_prompt'
        verbose_name = 'Capitalization Prompt'
        verbose_name_plural = 'Capitalization Prompts'
        ordering = ['-createdAt']

    def save(self, *args, **kwargs):
        if not self.id:
            from django.utils import timezone
            year = timezone.now().year
            last_prompt = CapitalizationPrompt.objects.filter(
                id__startswith=f'CAP-{year}-'
            ).order_by('-id').first()
            if last_prompt:
                try:
                    last_num = int(last_prompt.id.split('-')[-1])
                    self.id = f'CAP-{year}-{last_num + 1:05d}'
                except (ValueError, IndexError):
                    self.id = f'CAP-{year}-00001'
            else:
                self.id = f'CAP-{year}-00001'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} ({self.item_code}) -> {self.suggested_action}"


class BulkCreationJob(models.Model):
    """Background job for materializing child assets for a bulk group."""
    JOB_STATUS = [
        ('queued', 'Queued'),
        ('processing', 'Processing'),
        ('done', 'Done'),
        ('failed', 'Failed'),
    ]

    id = models.BigAutoField(primary_key=True)
    bulk_group_ref = models.CharField(max_length=100)
    options = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=JOB_STATUS, default='queued')
    attempts = models.IntegerField(default=0)
    last_error = models.TextField(blank=True, default='')
    created_by = models.CharField(max_length=255, blank=True, default='')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stores_bulk_creation_job'
        verbose_name = 'Bulk Creation Job'
        verbose_name_plural = 'Bulk Creation Jobs'

    def __str__(self):
        return f"Job {self.id} - {self.bulk_group_ref} ({self.status})"


class OverrideLog(models.Model):
    """Audit log for manual override actions on capitalization prompts."""
    id = models.BigAutoField(primary_key=True)
    prompt = models.ForeignKey(CapitalizationPrompt, on_delete=models.CASCADE, related_name='override_logs')
    original_recommendation = models.CharField(max_length=100, blank=True, default='')
    final_decision = models.CharField(max_length=100, blank=True, default='')
    reason = models.TextField(blank=True, default='')
    override_by = models.CharField(max_length=255, blank=True, default='')
    approved_by = models.CharField(max_length=255, blank=True, default='')
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stores_override_log'

    def __str__(self):
        return f"Override {self.id} on {self.prompt.id} by {self.override_by} -> {self.final_decision}"


class LsoRecord(models.Model):
    """
    Local Service Order (LSO) / Local Purchase Order (LPO) records.
    Migrations-only table; workflows implemented in later phases.
    """
    id = models.CharField(max_length=50, primary_key=True, blank=True)
    lsoNumber = models.CharField(max_length=100, unique=True, blank=True)
    orderType = models.CharField(
        max_length=20,
        choices=[('lso', 'Local Service Order'), ('lpo', 'Local Purchase Order')],
        default='lpo'
    )
    # Core fields
    description = models.TextField(blank=True, default='')
    supplierName = models.CharField(max_length=255, blank=True, default='')
    totalValue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=50, default='Draft')
    # Link to originating requisition (optional)
    requisition = models.ForeignKey('Requisition', null=True, blank=True, on_delete=models.SET_NULL, related_name='lsos')

    # Header / procurement refs
    date = models.DateField(blank=True, null=True)
    procurement_method = models.CharField(max_length=50, blank=True, null=True)
    quotation_ref = models.CharField(max_length=100, blank=True, null=True)

    # Provider information
    provider_name = models.CharField(max_length=255, blank=True, null=True)
    provider_kra_pin = models.CharField(max_length=100, blank=True, null=True)
    provider_address = models.TextField(blank=True, null=True)
    provider_phone = models.CharField(max_length=50, blank=True, null=True)
    provider_email = models.EmailField(blank=True, null=True)

    # Service details
    service_description = models.TextField(blank=True, null=True)
    service_location = models.CharField(max_length=255, blank=True, null=True)
    service_start_date = models.DateField(blank=True, null=True)
    service_completion_date = models.DateField(blank=True, null=True)

    # Financial classification
    account = models.CharField(max_length=50, blank=True, null=True)
    vote_head = models.CharField(max_length=50, blank=True, null=True)
    # cost_lines: list of dicts {unit, qty, unit_cost, total}
    cost_lines = models.JSONField(default=list)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    vat = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Authorization / signatures
    prepared_by = models.CharField(max_length=255, blank=True, null=True)
    authorized_by_bursar = models.CharField(max_length=255, blank=True, null=True)
    principal = models.CharField(max_length=255, blank=True, null=True)
    prepared_at = models.DateTimeField(blank=True, null=True)
    authorized_at = models.DateTimeField(blank=True, null=True)

    # Completion certification
    completed_by = models.CharField(max_length=255, blank=True, null=True)
    completion_verified_by_committee = models.CharField(max_length=255, blank=True, null=True)
    completion_date = models.DateField(blank=True, null=True)
    completion_remarks = models.TextField(blank=True, null=True)

    # Provider acknowledgement
    provider_ack_name = models.CharField(max_length=255, blank=True, null=True)
    provider_ack_signature = models.TextField(blank=True, null=True)
    provider_ack_date = models.DateField(blank=True, null=True)

    # System footer
    generated_by = models.CharField(max_length=255, blank=True, null=True)
    print_date = models.DateTimeField(blank=True, null=True)
    system_ref_id = models.CharField(max_length=100, blank=True, null=True)

    # Locking / audit
    locked = models.BooleanField(default=False)
    createdBy = models.CharField(max_length=255, blank=True, default='')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stores_lso_record'
        verbose_name = 'LSO/LPO Record'
        verbose_name_plural = 'LSO/LPO Records'

    def __str__(self):
        return f"{self.lsoNumber or self.id}"

    def can_transition_to(self, new_status: str) -> bool:
        TRANSITIONS = {
            'Draft': ['Authorized', 'In Progress', 'Cancelled'],
            'Authorized': ['In Progress', 'Cancelled'],
            'In Progress': ['Completed', 'Cancelled'],
            'Completed': ['Verified'],
            'Verified': ['Paid'],
            'Paid': [],
            'Cancelled': [],
        }
        current = (self.status or 'Draft')
        return new_status == current or new_status in TRANSITIONS.get(current, [])


class ServiceVerification(models.Model):
    id = models.BigAutoField(primary_key=True)
    lso = models.ForeignKey(LsoRecord, related_name='verifications', on_delete=models.CASCADE)
    verifier = models.CharField(max_length=255)
    verifier_role = models.CharField(max_length=255, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    evidence = models.JSONField(default=list, blank=True)  # list of attachment refs
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stores_service_verification'

    def __str__(self):
        return f"Verification {self.id} for {self.lso.lsoNumber or self.lso.id}"
