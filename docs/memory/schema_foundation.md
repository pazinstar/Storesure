Summary of schema foundation changes

- Added `common.models.AuditMixin` and `LockedPreventSaveMixin` to centralize audit fields and locking behavior.
- Updated `InventoryItem` to inherit audit/lock mixins and added a DB-level CheckConstraint to enforce allowed item types.
- Added a new normalized `Item` master model with strict `ItemType` choices (`consumable`, `expendable`, `permanent`, `fixed_asset`).
- Added `CapitalizationPolicy` model to store system-wide thresholds and defaults (seeded to KES 50,000 threshold).
- Added a management command `seed_store_foundation` to create sample items and the default capitalization policy.
- Added frontend constants file `frontend/src/lib/itemTypes.ts` to provide dropdown options for UI.

Next steps (wait for user "next"):
- Create StoreLedger and FixedAsset models and their migrations.
- Add serializers, admin registrations, and tests.
- Run `python manage.py makemigrations` and `python manage.py migrate` to validate migration plan.
- Reconcile migration drift for depreciation models if tests fail.

Files changed:
- [backend/common/models.py](backend/common/models.py)
- [backend/roles/storekeeper/stores/models.py](backend/roles/storekeeper/stores/models.py)
- [backend/roles/storekeeper/stores/migrations/0039_schema_foundation.py](backend/roles/storekeeper/stores/migrations/0039_schema_foundation.py)
- [backend/roles/storekeeper/stores/management/commands/seed_store_foundation.py](backend/roles/storekeeper/stores/management/commands/seed_store_foundation.py)
- [frontend/src/lib/itemTypes.ts](frontend/src/lib/itemTypes.ts)

If you'd like, I can now run makemigrations and migrate locally, then run the seed command; say "next" to proceed.