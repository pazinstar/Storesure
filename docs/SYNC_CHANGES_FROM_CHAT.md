# Sync Changes — Chat Session Patch Notes

This document captures every change implemented during the recent chat session so another coding agent (or developer) can update their copy of the project to match the current workspace state. Follow the steps and apply the exact code snippets below where appropriate.

---

## Recent edits (2026-05-11)

The following frontend files were modified in this session and should be checked after pulling changes:

- `frontend/src/services/inventory.service.ts` — added paginated helpers (`getS11RecordsPaginated`, `getS13RecordsPaginated`) and stats helpers (`getS11Stats`, `getS13Stats`) to normalize DRF-style paginated responses and provide stats for UI cards.
- `frontend/src/pages/stores/IssueStock.tsx` — replaced the manual S13 table with `ReusableTable` + `TablePagination`, wired to `api.getS13RecordsPaginated(page)`, and updated cache handling for newly created S13 records.
- `frontend/src/pages/stores/ReceiveStock.tsx` — converted to use `ReusableTable` + `TablePagination` and consume `getS11RecordsPaginated`.
- `frontend/src/pages/assets/SingleClassify.tsx` — UI improvements and use of `ItemCombobox` to lazy-load items and prefill `unitCost` when available.
- `frontend/src/components/stores/ItemCombobox.tsx` — added `onOpen` callback and optional `unitCost` support to `StoreItem`.

If you see a SWC parse error after pulling, inspect `frontend/src/services/inventory.service.ts` for misplaced method declarations — ensure helper functions are properties of the exported `inventoryService` object.


## Summary (high level)
- Backend: Ensure inventory register (`InventoryItem.openingBalance`) is synchronized when receipts (GRNs) are accepted and when issues (S13) are posted via the S12 requisition issuing flow. Also allow issuance processing when `issuerSignature` is applied, guard against duplicate ledger entries.
- Frontend: Show current stock balances next to requisition items in the `IssueStock` UI and prevent issuing more than available (constrained by requisition balance and stock). Add search/filter UI in `StoreDashboard` and fix a runtime ReferenceError.
- Notes: The canonical flow is still to issue via the S12 requisition endpoint; direct POST to `/issue/` was not extended in these changes (see "Optional next steps").

---

## Phased Implementation Plan (apply in order)

This section breaks the changes into small, ordered phases. Apply each phase fully and run the verification steps before moving to the next phase — this prevents overload and makes the work reproducible.

- Phase 1 — Backend: Ledger + Inventory Sync (critical, low-risk)
  - Files: `backend/roles/storekeeper/stores/views.py`
  - Make the ledger receipt processing update `InventoryItem.openingBalance` after `InventoryLedger` rows are updated. See the snippet in the file under "A. Sync InventoryItem after GRN acceptance (DeliverySignDecisionView)".
  - Apply the same inventory sync after `LedgerIssue` saves in the requisition issue flow.
  - Reason: Ensures the single source of truth (ledger) is propagated to the InventoryItem register.

- Phase 2 — Backend: Safe Issuance Triggering
  - Files: `backend/roles/storekeeper/stores/views.py`, `backend/roles/storekeeper/stores/serializers.py`
  - Add the `should_process` guard to `S12RequisitionDetailView.perform_update` so issuance runs when `issuerSignature` is applied (and avoid duplicate processing by checking existing `LedgerIssue` rows for the requisition). See snippet in "B. Allow S12 requisition issuing...".
  - Confirm `IssueHistorySerializer.create()` exists and logs validated payloads (helps debugging duplicates).
  - Reason: Makes issuing tolerant to UI flows while preventing duplicated ledger lines.

- Phase 3 — Frontend: IssueStock UI (show stock & constrain inputs)
  - Files: `frontend/src/pages/stores/IssueStock.tsx`
  - Add `inventoryItemsMap` state and a `useEffect` to fetch `api.getItem(code)` for the selected requisition's item codes.
  - In the requisition table: show `In stock: <openingBalance>` and limit the `max` on the numeric input to `Math.min(requisitionBalance, stockAvailable)`.
  - Fix the `balance` → `reqBalance` ReferenceError in the className condition.
  - Reason: Gives users accurate, real-time visibility of stock before issuing and prevents accidental over-issuing from the UI.

- Phase 4 — Frontend: Dashboard polish + safety
  - Files: `frontend/src/pages/stores/StoreDashboard.tsx`
  - Import `useState` and `Input`, add `txSearch` state, and filter `recentTransactions` with a small search box.
  - Use optional chaining for `stats.*` to avoid render crashes when backend fields are absent.
  - Reason: Small UI nicety and stability improvement.

- Phase 5 — Verify, Migrations, and Deploy
  - Run `makemigrations`/`migrate` as needed, restart backend, then run frontend dev server.
  - Run the verification steps in the previous section (GRN -> ledger -> InventoryItem, S12 issue -> LedgerIssue -> InventoryItem sync, and UI behavior check).

- Phase 6 — Optional: Direct POST /issue/ processing (deferred)
  - Files: `backend/roles/storekeeper/stores/views.py`, `frontend/src/services/inventory.service.ts`, `frontend/src/pages/stores/IssueStock.tsx`
  - Implement only if you need ad-hoc S13 POSTs to also create ledger entries and update inventory. This requires careful idempotency guards and `select_for_update()` locking.
  - Reason: Extra feature; higher risk because it duplicates the canonical S12 flow.

Follow each phase in order. If any phase fails verification, stop and fix before continuing.

---

## Files changed (apply these edits / verify they match your repo)

Note: below are the exact changes we made. You can apply them manually or via patches. File paths are workspace-relative.

### 1) backend/roles/storekeeper/stores/views.py

A. Sync InventoryItem after GRN acceptance (DeliverySignDecisionView)

- Where ledger rows were created for receipts (inside `DeliverySignDecisionView` when GRN is generated), we added code to update the corresponding `InventoryItem.openingBalance` to the ledger `closingQty`.

Insert (or ensure presence) the following code immediately after `ledger.save()` in the loop that processes `LedgerReceipt` items:

```py
# Keep InventoryItem.openingBalance in sync with ledger closing quantity
try:
    inv_item = None
    if ledger.item:
        inv_item = ledger.item
    else:
        from .models import InventoryItem
        inv_item = InventoryItem.objects.filter(id=ledger.itemCode).first()
    if inv_item:
        inv_item.openingBalance = ledger.closingQty
        inv_item.save()
except Exception:
    # Do not block the main flow if inventory sync fails
    pass
```

B. Allow S12 requisition issuing when `issuerSignature` is applied and prevent duplicate ledger generation

- In `S12RequisitionDetailView.perform_update`, we added a `should_process` guard so issuance processing occurs when either both signatures are now present (previous behaviour) OR when `issuerSignature` was just applied — but only if there are no existing `LedgerIssue` rows for that requisition (`requisitionNo` check). This prevents double-processing.

Add/replace logic before the issuance loop with the following (ensure `LedgerIssue` is imported from `.models`):

```py
from .models import LedgerIssue
should_process = False
if was_not_fully_signed and is_fully_signed:
    should_process = True
else:
    # issuerSignature newly applied (even if receiverSignature not set)
    if (not instance.issuerSignature) and updated_instance.issuerSignature:
        # Only process if no ledger issues exist for this requisition
        existing = LedgerIssue.objects.filter(requisitionNo=updated_instance.s12Number).exists()
        if not existing:
            should_process = True

if should_process:
    # ... existing issuance/ledger code
```

C. Sync InventoryItem after Issue (LedgerIssue block)

- After each `ledger.save()` when processing issue rows, add the same inventory sync snippet as in (A) to set `InventoryItem.openingBalance = ledger.closingQty`.

Snippet (same as A), placed right after `ledger.save()` inside the issue processing loop.

---

### 2) backend/roles/storekeeper/stores/serializers.py

A. `IssueHistorySerializer.create()`

- Ensure the serializer persists exactly the validated data (helps debugging). The project already contains this method; confirm the pattern exists as:

```py
class IssueHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueHistory
        fields = '__all__'
        read_only_fields = ['id']

    def create(self, validated_data):
        try:
            import logging
            logging.getLogger('django.request').debug(f"Creating IssueHistory with: {validated_data}")
        except Exception:
            pass
        return IssueHistory.objects.create(**validated_data)
```

B. `ReceivingHistorySerializer` — write-only `lpoReference` and `signatureConfirmed`

- Creation logic already extracts `lpoReference` to populate `items` and numeric `totalValue`, and captures signer metadata when `signatureConfirmed` is True. Confirm the `create()` implementation in `ReceivingHistorySerializer` matches the chat changes (it should already in this repo). Key behaviours:
  - If `lpoReference` is provided, load `PurchaseOrder` items and sum quantities to set `items` and use `po.totalValue` for numeric `totalValue`.
  - If `signatureConfirmed` is True and `request.user` present, populate `storekeeperSignature`, `storekeeperId`, and `signedAt`.

---

### 3) frontend/src/pages/stores/StoreDashboard.tsx

Edits made:
- Import `useState` from `react`.
- Import `Input` from `@/components/ui/input` and `Search` icon from `lucide-react`.
- Add `txSearch` local state: `const [txSearch, setTxSearch] = useState<string>('');`
- Use optional chaining for `stats` fields (`stats.totalItems?.value`, etc.) so rendering doesn't crash when fields are missing.
- Add a small search input in Recent Transactions and filter `recentTransactions` by item/type/status/date.

Key snippet (search state + input):

```tsx
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

const [txSearch, setTxSearch] = useState<string>('')

// inside JSX
<div className="relative">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  <Input
    placeholder="Search transactions..."
    value={txSearch}
    onChange={(e) => setTxSearch(e.target.value)}
    className="pl-9 w-full"
  />
</div>

// filter
recentTransactions
  .filter(tx => {
    if (!txSearch) return true
    const q = txSearch.toLowerCase()
    return (
      String(tx.item || '').toLowerCase().includes(q) ||
      String(tx.type || '').toLowerCase().includes(q) ||
      String(tx.status || '').toLowerCase().includes(q) ||
      String(tx.date || '').toLowerCase().includes(q)
    )
  })
  .map(...)
```

---

### 4) frontend/src/pages/stores/IssueStock.tsx

Edits made (important — this is the change that displays stock and prevents over-issuing):

A. New component state to cache inventory items referenced by the selected requisition:

```tsx
const [inventoryItemsMap, setInventoryItemsMap] = useState<Record<string, any>>({});
```

B. Fetch inventory item details when a requisition is selected (new useEffect):

```tsx
useEffect(() => {
  let mounted = true;
  const loadInventoryItems = async () => {
    if (!selectedReq || !selectedReq.items || selectedReq.items.length === 0) {
      setInventoryItemsMap({});
      return;
    }
    try {
      const results = await Promise.all(
        selectedReq.items.map(async (it: any) => {
          const code = it.itemCode && typeof it.itemCode === 'string' ? it.itemCode : (it.itemCode?.id || it.itemCode || it.id);
          try {
            const inv = await api.getItem(code);
            return [code, inv];
          } catch (err) {
            return [code, null];
          }
        })
      );

      if (!mounted) return;
      const map: Record<string, any> = {};
      results.forEach(([code, inv]) => { if (code) map[code] = inv; });
      setInventoryItemsMap(map);
    } catch (e) {
      setInventoryItemsMap({});
    }
  };

  loadInventoryItems();
  return () => { mounted = false; };
}, [selectedReq]);
```

C. In the requisition items table, show both the requisition balance and the current stock; bound the issue input to the lesser of (requisition balance, current stock):

- Compute per-row variables:

```tsx
const approved = item.quantityApproved ?? item.quantityRequested;
const issued = item.quantityIssued ?? 0;
const reqBalance = Math.max(approved - issued, 0);
const inv = (() => {
  const code = item.itemCode && typeof item.itemCode === 'string' ? item.itemCode : (item.itemCode?.id || item.itemCode || item.id);
  return inventoryItemsMap[code];
})();
const stockAvailable = inv ? (inv.openingBalance ?? 0) : Infinity;
const allowedMax = Math.min(reqBalance, stockAvailable);
```

- Display and inputs (note `reqBalance` used for className instead of the previous undefined `balance`):

```tsx
<TableCell className={reqBalance === 0 ? "text-muted-foreground" : ""}>
  {reqBalance} {item.unit}
  {inv && (
    <div className="text-xs text-muted-foreground">In stock: {inv.openingBalance} {inv.unit}</div>
  )}
</TableCell>
<TableCell className="w-40">
  <Input
    type="number"
    min={0}
    max={allowedMax}
    value={val}
    onChange={(e) => setIssuedQuantities(prev => ({ ...prev, [item.id]: Math.max(0, Number(e.target.value)) }))}
  />
  {over && <p className="text-xs text-destructive mt-1">Exceeds allowed (req/stock)</p>}
</TableCell>
```

D. Fixed runtime ReferenceError: replaced `balance === 0` with `reqBalance === 0` for className checks.

E. Behavior: The UI will now show the current `InventoryItem.openingBalance` next to each requisition item (if the backend returns an InventoryItem for the given code via `GET /storekeeper/inventory/<id>`). The issue quantity input is constrained by both requisition balance and stock available.

---

## Behavior notes and constraints

- Canonical flow: Issuance via the S12 requisition endpoint (`PATCH /s12-requisitions/<id>/` with `issuerSignature` applied) is the path that will generate ledger entries and update `InventoryItem` balances. That flow is supported and was patched to be more robust.
- Direct `POST /issue/` (IssueHistoryListView create) in this session was not extended to process ledger lines or inventory updates. If you need direct S13 POSTs to effect inventory deductions, we can implement that (see "Optional next steps").
- All new backend changes are defensive (try/except around the inventory sync) so failures syncing inventory do not block the main GRN/issue processing.

---

## Verification steps (how to test)

1. Apply changes and restart backend server:

```powershell
cd backend
.venv\Scripts\Activate.ps1
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

2. Start frontend dev server and navigate to the Issue Stock page:

```bash
cd frontend
npm run dev
# open http://localhost:8080 (or your configured host)
```

3. Test receipt (GRN) path that generates a ledger receipt and confirm InventoryItem updated:
- Create or use an existing Delivery and call the endpoint to sign/accept the delivery (this generates the GRN and ledger receipts). After acceptance:
  - In Django shell, confirm ledger and inventory:

```py
from roles.storekeeper.stores.models import InventoryLedger, InventoryItem, Delivery
# find ledger row
l = InventoryLedger.objects.filter(itemCode='ITEMCODE').first()
print(l.closingQty)
# inventory item
it = InventoryItem.objects.get(id='ITEMCODE')
print(it.openingBalance)  # should match l.closingQty
```

4. Test issuing via S12 requisition (through UI):
- Approve a requisition, then open it in the Issue UI and mark issuerSignature via the UI flow.
- After issuing, confirm in Django shell:

```py
from roles.storekeeper.stores.models import LedgerIssue, InventoryLedger, InventoryItem
# check ledger issue rows created with requisition number
LedgerIssue.objects.filter(requisitionNo='S12/...')
# check ledger closingQty decreased
l = InventoryLedger.objects.get(itemCode='ITEMCODE')
print(l.closingQty)
# check InventoryItem.openingBalance synced
item = InventoryItem.objects.get(id='ITEMCODE')
print(item.openingBalance == l.closingQty)
```

5. UI validation: On `IssueStock` page, select a requisition and confirm each row shows "In stock: <number>" and the numeric input's `max` disallows values greater than allowed.

---

## Optional next steps (if you want direct POST /issue/ to update inventory)
- Implement server-side processing in `IssueHistoryListView.perform_create()` to accept an `issuedItems` array with objects `{ itemCode, qty, unitPrice? }`. Inside `perform_create`, with `transaction.atomic()` and `select_for_update()` on `InventoryLedger` rows, create `LedgerIssue` rows and update `InventoryLedger` and `InventoryItem.openingBalance`. Add a uniqueness/idempotency guard (e.g., check `s13No` or `requisitionNo`) to avoid duplicate ledger rows.

If you want me to implement Option B now (POST /issue/ processing), reply with "Implement direct POST issue processing" and I'll add safe server-side code and the necessary frontend payload changes.

---

## Rollback notes
- To revert the inventory sync, remove the inserted `inv_item.openingBalance = ledger.closingQty` and `inv_item.save()` blocks in `views.py` in both the GRN and issue sections.
- To revert the `issuerSignature` relaxed processing, remove the `should_process` guard and restore previous `if was_not_fully_signed and is_fully_signed:` behaviour.

---

## Contacts / context
- This file documents changes made during a pair-programming chat session and patches applied via `apply_patch`. If another agent needs more context, point them at these files in the repo and the Django shell verification commands above.


End of document.
