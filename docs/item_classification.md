Item Classification
===================

Overview
--------
Defines four canonical item classifications used across the system and the expected system behaviour for each.

1. Consumables

Examples

- Food
- Fuel
- Paper
- Chemicals
- Soap
- Printing materials

System Behavior

- Quantity tracking
- Consumed through issues
- Uses S1 ledger
- Expensed upon issue
- No depreciation
- No custodian tracking required

2. Expendables

Examples

- Brooms
- Buckets
- Sports balls
- Dust coats
- Small tools
- Extension cables

System Behavior

- Retain identity temporarily
- Assigned to custodian/department
- Uses S2 ledger
- Not depreciated
- Lower-value accountability items
- May not appear in PPE register

3. Permanent Items

Examples

- Desks
- Beds
- Cabinets
- Computers
- Projectors

System Behavior

- Durable
- Long-term use
- Tracked in S2
- May qualify for capitalization depending on policy (thresholds)
- Requires stronger accountability

4. Fixed Assets

Examples

- Buildings
- Vehicles
- Solar systems
- Generators
- Bulk-capitalized furniture
- Major ICT equipment

System Behavior

- Recorded in Fixed Asset Register
- Depreciated
- Requires lifecycle management
- Requires asset tracking and disposal workflows

Implementation notes
--------------------

- Backend: `InventoryItem.category_type` uses `ItemTypeChoices` values: `consumable`, `expendable`, `permanent`, `fixed_asset`.
- Derived properties should be exposed via API: ledger mapping (`S1` / `S2` / `FixedAssetRegister`), `is_depreciable`, and `requires_custodian`.
- Capitalization policy: fixed assets are always capitalizable; permanent items may be capitalizable depending on a configurable `CAPITALIZATION_THRESHOLD` and/or `min_useful_life`.
- Frontend: must send `category_type` using the exact backend enum values.

Next steps
----------

- Expose derived fields on the `InventoryItem` API representation.
- Enforce `min_useful_life` for permanent/fixed assets during create/update.
- Wire ledger assignment and capitalization decision points into procurement/receiving flows.
