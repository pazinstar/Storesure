S2 Ledger (Permanent & Expendable Stores)
========================================

Purpose
-------
The S2 ledger tracks items that retain identity, are assigned to custodians or departments, and are not treated as S1 consumables. This document summarizes the data model, required fields, and available API endpoints for S2 workflows.

Required Ledger Fields (S2Transaction & S2Ledger)

- Date: `date` (S2Transaction)
- Reference No: `ref_no` (S2Transaction)
- Item Name: `item_name` / `itemName`
- Item Category: `category`
- Unit: `unit`
- Quantity Received: `qty_received`
- Quantity Issued: `qty_issued`
- Running Balance: `running_balance_before` / `running_balance_after`
- Unit Cost: `unit_cost`
- Total Value: `total_value`
- Supplier: `supplier_id`, `supplier_name`
- Recipient/Custodian: `custodian_id`, `custodian_name`
- Department: `dept_id`, `dept_name`
- Condition: `condition`
- Remarks: `remarks`
- Created By: `created_by`
- Approved By: `approved_by`, `approved_at`

Models & Files
--------------
- `backend/roles/storekeeper/stores/models.py`
  - `S2Transaction` — transaction-level rows (receipt, issue, transfer, return, damage, etc.)
  - `S2Ledger` — per-item running balance summary updated atomically by posting services

- `backend/roles/storekeeper/stores/serializers.py`
  - `S2TransactionListSerializer`, `S2TransactionDetailSerializer`
  - `S2LedgerSerializer`
  - `S2ReceiptSerializer`, `S2IssueSerializer`, `S2TransferSerializer`, `S2ReturnSerializer`, `S2DamageSerializer`, `S2ReversalSerializer`

- `backend/roles/storekeeper/stores/services.py`
  - `post_s2_receipt`, `post_s2_issue`, `post_s2_transfer`, `post_s2_return`, `post_s2_damage`, `reverse_s2_transaction`
  - `validate_s2_post` performs custodian/department validation for Expendable/Permanent

- `backend/roles/storekeeper/stores/views.py`
  - APIViews: `S2ReceiptView`, `S2IssueView`, `S2TransferView`, `S2ReturnView`, `S2DamageView`, `S2ReversalView`
  - List/detail views: `S2TransactionListView`, `S2TransactionDetailView`, `S2LedgerListView`, `S2LedgerDetailView`

Workflows
---------

Receipt Workflow (GRN → Inspection → S2 Posting)

1. Create a GRN/Receiving entry using existing receiving endpoints.
2. After inspection/approval, POST to `/api/v1/storekeeper/s2/receipt/` with `item_id`, `date`, `qty`, `unit_cost`, and optional supplier/ref metadata.
3. Server `post_s2_receipt` creates a `S2Transaction` (type `receipt`), updates or creates the `S2Ledger` summary row, and syncs `InventoryItem.openingBalance`.

Issue Workflow (Issue Voucher → Recipient/Custodian → S2 Posting)

1. Issue creation/approval in requisitions/RIA flows.
2. POST to `/api/v1/storekeeper/s2/issue/` with `item_id`, `date`, `qty`, `unit_cost`, `custodian_id`, `dept_id`, etc.
3. `post_s2_issue` enforces custodian/department requirements for Expendable/Permanent items and updates S2 ledger.

Transfer Workflow (Department-to-Department)

1. POST to `/api/v1/storekeeper/s2/transfer/` with `from_dept_id`, `to_dept_id`, `qty`, `unit_cost`.
2. Service creates two linked `S2Transaction` entries (transfer-out and transfer-in) and updates `S2Ledger` quantities.

Return Workflow

1. POST to `/api/v1/storekeeper/s2/return/` with `item_id`, `qty`, `unit_cost`, `dept_id`.
2. Service posts a `return` transaction and updates the ledger and item balances.

Damage/Loss/Condemn Workflows

1. POST to `/api/v1/storekeeper/s2/damage/` with `item_id`, `qty`, `unit_cost`, and context.
2. Service creates an audit-locked `S2Transaction` (status `locked`) and decrements ledger quantities/value.
3. Reversal/adjustment handled by POST to `/api/v1/storekeeper/s2/reverse/`.

Audit & Immutability
--------------------
- Posted S2 transactions are protected from direct edits; reversal entries are created via `reverse_s2_transaction` which links and marks original as `reversed`.
- Damage/loss entries are created in `locked` status to enforce audit review.

API Examples
------------

POST /api/v1/storekeeper/s2/receipt/

{
  "item_id": "ITM001",
  "date": "2026-05-07",
  "qty": 10,
  "unit_cost": "1500.00",
  "supplier_name": "Acme Supplies",
  "ref_no": "GRN/2026/001",
  "created_by": "storekeeper1"
}

Response: 201 Created — full `S2Transaction` detail including `running_balance_after`.

Notes & Next Steps
------------------
- The codebase already includes models, services, serializers, views, and tests for S2 workflows (`stores/models.py`, `stores/services.py`, `stores/serializers.py`, `stores/views.py`, `stores/tests_s2.py`).
- Recommended integration work:
  - Wire frontend forms to POST to the S2 endpoints where applicable (receiving/issue/transfer UI flows).
  - Ensure approvals/inspection UI invokes the `/s2/receipt/` endpoint after inspection.
  - Add UI list/table components for `S2Ledger` summary and `S2Transaction` history.
  - Run the `stores.tests_s2` test suite and fix any environment-specific failures.
