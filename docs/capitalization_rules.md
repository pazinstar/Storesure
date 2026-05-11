PART 6 — Capitalization Decision Rules

Overview
--------
This document describes the capitalization decision rules (A–D) and how they are implemented in the codebase.

Rule A — Consumable
-------------------
If:
- Item is consumed during operations
- Short useful life
- No future service potential

Then:
- Classify as Consumable
- Use S1 ledger (expense on issue)

Implementation
- Engine: `backend/roles/storekeeper/stores/capitalization_engine.py`
- Function: `evaluate_rule_a(...)` checks `InventoryItem.category_type == ItemTypeChoices.CONSUMABLE` and returns `suggested_action='expense'`.
- Logged via `log_classification_prompt(...)` with `approval_status='auto'`.

Rule B — Expendable
--------------------
If:
- Reusable
- Moderate lifespan
- Low value
- Not materially significant

Then:
- Classify as Expendable
- Use S2 ledger
- Assign custodian
- No depreciation

Implementation
- Engine: `evaluate_rule_b(...)` matches `category_type == ItemTypeChoices.EXPENDABLE` and returns `expense` action.

Rule C — Individual Capitalization
----------------------------------
If:
- Useful life > 1 year
- Individual item value ≥ capitalization threshold

Then:
- Capitalize automatically
- Create fixed asset record
- Assign depreciation profile

Implementation
- Engine: `evaluate_rule_c(...)` uses `CapitalizationSetting.threshold` and rule-specific `minCost` / `minUsefulLifeMonths` fields.
- If conditions met returns `suggested_action='capitalize'` (or `prompt` if rule configured to prompt).

Rule D — Bulk Capitalization
----------------------------
If:
- Durable items
- Individually below threshold but aggregate acquisition materially significant

Then:
- Trigger grouped capitalization workflow
- Example: 1000 desks × 5,000 each (aggregate > materiality)

Implementation
- Engine: `evaluate_rule_d(...)` checks quantity and `bulkMateriality` (rule or setting) and returns `is_bulk=True` and `suggested_action='bulk_capitalize'` (or `capitalize` depending on rule config).
- `log_classification_prompt(...)` records `is_bulk` and `bulk_group_ref` to track grouped decisions.

Where to change behavior
------------------------
- Admin: `CapitalizationRule` model (admin UI) — create rules, set `minCost`, `minUsefulLifeMonths`, `bulkThreshold`, `bulkMateriality`, `action` (`capitalize`, `expense`, `prompt`).
- Settings: `CapitalizationSetting` via API (`/capitalization/settings/`) — adjust `threshold`, `bulk_materiality`, `min_useful_life`.
- Engine: `backend/roles/storekeeper/stores/capitalization_engine.py` — modify evaluation order or matching logic.

Notes
-----
- The engine evaluates A → B → C → D and falls back to a `prompt` result when no rule matches.
- Prompts are stored as `CapitalizationPrompt` and require approval when `override_required=True`.
- Frontend hooks: classify calls are made from `frontend/src/pages/stores/ReceiveStock.tsx` and shown in `CapitalizationSummaryDialog.tsx`.

Questions / Next steps
---------------------
- Add a grouped capitalization UI to create a bulk `CapitalizationPrompt` approval with aggregated items.
- Add backend bulk-create endpoint to convert approved bulk prompts into multiple `FixedAsset` records.

