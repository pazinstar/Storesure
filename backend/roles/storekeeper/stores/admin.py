from django.contrib import admin
from .models import (
    InventoryItem, Delivery, Requisition, RequisitionItem,
    IssueHistory, ReceivingHistory, Supplier,
    PurchaseOrder, PurchaseOrderItem,
    RoutineIssueAuthority, RiaItem,
    InventoryLedger, LedgerReceipt, LedgerIssue,
    StoreReport, StockAdjustment, StoreTransfer,
    FileMovement, RetentionRecord, AppraisalWorkflow, DisposalRecord,
    InventorySetting, PurchaseRequisition, Tender, Quotation,
    ProcurementReference, ProcurementContract, ContractMilestone,
    S2Ledger, FixedAsset, CapitalizationRule, CapitalizationSetting,
    CapitalizationPrompt, LsoRecord, AssetStatusHistory, AssetMaintenance,
)


class RequisitionItemInline(admin.TabularInline):
    model = RequisitionItem
    extra = 0


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 0


class RiaItemInline(admin.TabularInline):
    model = RiaItem
    extra = 0


class LedgerReceiptInline(admin.TabularInline):
    model = LedgerReceipt
    extra = 0


class LedgerIssueInline(admin.TabularInline):
    model = LedgerIssue
    extra = 0


class ContractMilestoneInline(admin.TabularInline):
    model = ContractMilestone
    extra = 0


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'category', 'category_type', 'unit', 'status', 'location']
    list_filter = ['category', 'category_type', 'status']
    search_fields = ['id', 'name', 'category']
    readonly_fields = ['id']


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ['id', 'status', 'packages', 'condition']
    list_filter = ['status']
    search_fields = ['id']
    readonly_fields = ['id']


@admin.register(Requisition)
class RequisitionAdmin(admin.ModelAdmin):
    list_display = ['id', 'status', 'purpose']
    list_filter = ['status']
    search_fields = ['id', 'purpose']
    readonly_fields = ['id']
    inlines = [RequisitionItemInline]


@admin.register(IssueHistory)
class IssueHistoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'date', 'department', 'items', 'status']
    list_filter = ['status']
    search_fields = ['id', 'department']
    readonly_fields = ['id']


@admin.register(ReceivingHistory)
class ReceivingHistoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'date', 'supplier', 'items', 'amount', 'status']
    list_filter = ['status']
    search_fields = ['id', 'supplier']
    readonly_fields = ['id']


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'email', 'status', 'rating', 'county']
    list_filter = ['status']
    search_fields = ['id', 'name', 'email']
    readonly_fields = ['id']


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'status', 'date']
    list_filter = ['status']
    search_fields = ['id']
    readonly_fields = ['id']
    inlines = [PurchaseOrderItemInline]


@admin.register(RoutineIssueAuthority)
class RoutineIssueAuthorityAdmin(admin.ModelAdmin):
    list_display = ['id', 'number', 'department', 'status']
    list_filter = ['status']
    search_fields = ['id', 'number', 'department']
    readonly_fields = ['id']
    inlines = [RiaItemInline]


@admin.register(InventoryLedger)
class InventoryLedgerAdmin(admin.ModelAdmin):
    list_display = ['itemCode', 'itemName', 'unit']
    search_fields = ['itemCode', 'itemName']
    inlines = [LedgerReceiptInline, LedgerIssueInline]


@admin.register(StoreReport)
class StoreReportAdmin(admin.ModelAdmin):
    list_display = ['id']
    search_fields = ['id']
    readonly_fields = ['id']


@admin.register(StockAdjustment)
class StockAdjustmentAdmin(admin.ModelAdmin):
    list_display = ['id']
    search_fields = ['id']
    readonly_fields = ['id']


@admin.register(StoreTransfer)
class StoreTransferAdmin(admin.ModelAdmin):
    list_display = ['id']
    search_fields = ['id']
    readonly_fields = ['id']


@admin.register(FileMovement)
class FileMovementAdmin(admin.ModelAdmin):
    list_display = ['id']
    search_fields = ['id']
    readonly_fields = ['id']


@admin.register(RetentionRecord)
class RetentionRecordAdmin(admin.ModelAdmin):
    list_display = ['id']
    search_fields = ['id']
    readonly_fields = ['id']


@admin.register(DisposalRecord)
class DisposalRecordAdmin(admin.ModelAdmin):
    list_display = ['id']
    search_fields = ['id']
    readonly_fields = ['id']


@admin.register(PurchaseRequisition)
class PurchaseRequisitionAdmin(admin.ModelAdmin):
    list_display = ['id']
    search_fields = ['id']
    readonly_fields = ['id']


@admin.register(Tender)
class TenderAdmin(admin.ModelAdmin):
    list_display = ['id']
    search_fields = ['id']
    readonly_fields = ['id']


@admin.register(ProcurementContract)
class ProcurementContractAdmin(admin.ModelAdmin):
    list_display = ['id']
    search_fields = ['id']
    readonly_fields = ['id']
    inlines = [ContractMilestoneInline]


@admin.register(ProcurementReference)
class ProcurementReferenceAdmin(admin.ModelAdmin):
    list_display = ['id']
    search_fields = ['id']
    readonly_fields = ['id']


@admin.register(S2Ledger)
class S2LedgerAdmin(admin.ModelAdmin):
    list_display = ['id', 'itemCode', 'itemName', 'closingBalance']
    search_fields = ['itemCode', 'itemName']


@admin.register(FixedAsset)
class FixedAssetAdmin(admin.ModelAdmin):
    list_display = ['id', 'assetCode', 'name', 'status', 'location']
    list_filter = ['status']
    search_fields = ['assetCode', 'name']


@admin.register(CapitalizationRule)
class CapitalizationRuleAdmin(admin.ModelAdmin):
    list_display = ['id', 'rule_code', 'categoryType', 'minCost', 'minUsefulLifeMonths', 'action', 'isActive', 'priority']
    list_filter = ['isActive', 'categoryType', 'action']
    search_fields = ['rule_code', 'rule_label']


@admin.register(CapitalizationSetting)
class CapitalizationSettingAdmin(admin.ModelAdmin):
    list_display = ['id', 'threshold', 'bulk_materiality', 'min_useful_life', 'default_residual_pct']
    search_fields = []


@admin.register(CapitalizationPrompt)
class CapitalizationPromptAdmin(admin.ModelAdmin):
    list_display = ['id', 'item_code', 'item_name', 'suggested_action', 'applied_rule', 'approval_status', 'is_bulk']
    list_filter = ['approval_status', 'suggested_action', 'is_bulk']
    search_fields = ['item_code', 'item_name', 'id']


@admin.register(LsoRecord)
class LsoRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'lsoNumber', 'orderType', 'status', 'totalValue']
    list_filter = ['orderType', 'status']
    search_fields = ['lsoNumber', 'supplierName']


@admin.register(AssetStatusHistory)
class AssetStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'asset', 'from_status', 'to_status', 'changed_by', 'createdAt']
    list_filter = ['to_status']
    search_fields = ['asset__assetCode', 'asset__name', 'changed_by']


@admin.register(AssetMaintenance)
class AssetMaintenanceAdmin(admin.ModelAdmin):
    list_display = ['id', 'asset', 'maintenance_type', 'scheduled_date', 'status', 'cost']
    list_filter = ['status', 'maintenance_type']
    search_fields = ['asset__assetCode', 'asset__name', 'vendor']
