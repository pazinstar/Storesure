"""
Capitalization Rule Engine — Stateless rule evaluation service.
Implements Rules A–D using a policy pattern.
All configurable values are pulled from CapitalizationSetting and CapitalizationRule tables.
No hardcoded KES values.
"""

from decimal import Decimal
from dataclasses import dataclass
from typing import Optional, List, Tuple
from django.utils import timezone
from django.db import transaction

from .models import (
    InventoryItem, ItemTypeChoices, CapitalizationRule,
    CapitalizationSetting, CapitalizationPrompt, S2Transaction,
)


@dataclass
class ClassificationResult:
    """Result of evaluating capitalization rules on an item/transaction."""
    suggested_category_type: str
    suggested_action: str  # 'expense', 'capitalize', 'bulk_capitalize', 'prompt'
    applied_rule: str      # Rule code: A, B, C, D
    rule_label: str        # Human-readable rule description
    is_bulk: bool          # Whether this is a bulk/grouped classification
    override_required: bool  # Whether user override is needed
    errors: List[str]     # Validation errors


def get_cap_settings() -> CapitalizationSetting:
    """Get the active capitalization settings (creates default if none exist)."""
    setting, _ = CapitalizationSetting.objects.get_or_create(
        id=1,
        defaults={
            'threshold': Decimal('50000'),
            'bulk_materiality': Decimal('100000'),
            'min_useful_life': 12,
            'default_residual_pct': Decimal('10.00'),
        }
    )
    return setting


def get_active_rules() -> List[CapitalizationRule]:
    """Get all active rules ordered by priority."""
    return list(
        CapitalizationRule.objects.filter(isActive=True)
        .order_by('priority', 'id')
    )


# ---------------------------------------------------------------------------
# Rule A: Consumable
# ---------------------------------------------------------------------------
def evaluate_rule_a(item: InventoryItem, qty: int, unit_cost: Decimal,
                    rules: List[CapitalizationRule]) -> Optional[ClassificationResult]:
    """
    Rule A — Consumable items.
    If the item is already classified as consumable, it always expenses.
    Matches rule where categoryType = 'consumable'.
    """
    if item.category_type != ItemTypeChoices.CONSUMABLE:
        return None

    for rule in rules:
        if rule.categoryType != ItemTypeChoices.CONSUMABLE:
            continue
        return ClassificationResult(
            suggested_category_type=ItemTypeChoices.CONSUMABLE,
            suggested_action='expense',
            applied_rule=rule.rule_code or 'A',
            rule_label=rule.rule_label or f"Consumable (Rule {rule.rule_code})",
            is_bulk=False,
            override_required=False,
            errors=[],
        )

    # Fallback if no matching rule configured
    return ClassificationResult(
        suggested_category_type=ItemTypeChoices.CONSUMABLE,
        suggested_action='expense',
        applied_rule='A',
        rule_label='Consumable (Default)',
        is_bulk=False,
        override_required=False,
        errors=[],
    )


# ---------------------------------------------------------------------------
# Rule B: Expendable
# ---------------------------------------------------------------------------
def evaluate_rule_b(item: InventoryItem, qty: int, unit_cost: Decimal,
                    rules: List[CapitalizationRule]) -> Optional[ClassificationResult]:
    """
    Rule B — Expendable items.
    If the item is already classified as expendable, it expenses.
    Matches rule where categoryType = 'expendable'.
    """
    if item.category_type != ItemTypeChoices.EXPENDABLE:
        return None

    for rule in rules:
        if rule.categoryType != ItemTypeChoices.EXPENDABLE:
            continue
        return ClassificationResult(
            suggested_category_type=ItemTypeChoices.EXPENDABLE,
            suggested_action='expense',
            applied_rule=rule.rule_code or 'B',
            rule_label=rule.rule_label or f"Expendable (Rule {rule.rule_code})",
            is_bulk=False,
            override_required=False,
            errors=[],
        )

    return ClassificationResult(
        suggested_category_type=ItemTypeChoices.EXPENDABLE,
        suggested_action='expense',
        applied_rule='B',
        rule_label='Expendable (Default)',
        is_bulk=False,
        override_required=False,
        errors=[],
    )


# ---------------------------------------------------------------------------
# Rule C: Individual Capitalization
# ---------------------------------------------------------------------------
def evaluate_rule_c(item: InventoryItem, qty: int, unit_cost: Decimal,
                    rules: List[CapitalizationRule]) -> Optional[ClassificationResult]:
    """
    Rule C — Individual Capitalization.
    Applies to items that are permanent or fixed_asset, or unclassified items
    where unit_cost >= threshold AND useful_life >= min_useful_life.
    """
    settings = get_cap_settings()
    total_value = Decimal(str(qty)) * unit_cost

    # Find matching rule for permanent/fixed_asset
    for rule in rules:
        if rule.categoryType not in (
                ItemTypeChoices.PERMANENT, ItemTypeChoices.FIXED_ASSET):
            continue

        # Check if this item meets capitalization criteria
        meets_threshold = unit_cost >= rule.minCost or total_value >= settings.threshold
        # Item must have a useful life >= the rule's minimum
        meets_life = item.min_useful_life >= rule.minUsefulLifeMonths

        if meets_threshold and meets_life:
            action = rule.action
            override_required = (action == 'prompt')

            return ClassificationResult(
                suggested_category_type=rule.categoryType,
                suggested_action=action,
                applied_rule=rule.rule_code or 'C',
                rule_label=rule.rule_label or f"Individual Cap (Rule {rule.rule_code})",
                is_bulk=False,
                override_required=override_required,
                errors=[],
            )

    # Check against default threshold for items that aren't already classified
    if item.category_type not in (
            ItemTypeChoices.PERMANENT, ItemTypeChoices.FIXED_ASSET):
        meets_threshold = total_value >= settings.threshold
        useful_life = item.min_useful_life or settings.min_useful_life
        meets_life = useful_life >= settings.min_useful_life

        if meets_threshold and meets_life:
            return ClassificationResult(
                suggested_category_type=ItemTypeChoices.FIXED_ASSET,
                suggested_action='capitalize',
                applied_rule='C',
                rule_label=f"Individual Cap >= {settings.threshold}",
                is_bulk=False,
                override_required=False,
                errors=[],
            )

    return None


# ---------------------------------------------------------------------------
# Rule D: Bulk/Grouped Capitalization
# ---------------------------------------------------------------------------
def evaluate_rule_d(item: InventoryItem, qty: int, unit_cost: Decimal,
                    rules: List[CapitalizationRule]) -> Optional[ClassificationResult]:
    """
    Rule D — Bulk/Grouped Capitalization.
    When multiple identical low-value items collectively exceed the bulk materiality threshold.
    """
    settings = get_cap_settings()
    total_value = Decimal(str(qty)) * unit_cost

    if qty < 2:
        return None  # Not bulk if only 1 item

    for rule in rules:
        if qty >= rule.bulkThreshold and total_value >= (rule.bulkMateriality or settings.bulk_materiality):
            action = rule.action if rule.action != 'prompt' else 'bulk_capitalize'
            return ClassificationResult(
                suggested_category_type=rule.categoryType or ItemTypeChoices.FIXED_ASSET,
                suggested_action=action,
                applied_rule=rule.rule_code or 'D',
                rule_label=rule.rule_label or f"Bulk Cap (Rule {rule.rule_code})",
                is_bulk=True,
                override_required=(action == 'bulk_capitalize'),
                errors=[],
            )

    # Default bulk check
    if qty >= 5 and total_value >= settings.bulk_materiality:
        return ClassificationResult(
            suggested_category_type=ItemTypeChoices.FIXED_ASSET,
            suggested_action='bulk_capitalize',
            applied_rule='D',
            rule_label=f"Bulk Cap >= {settings.bulk_materiality} total",
            is_bulk=True,
            override_required=True,
            errors=[],
        )

    return None


# ---------------------------------------------------------------------------
# Main Evaluation Entry Point
# ---------------------------------------------------------------------------
def classify_item(item: InventoryItem, qty: int = 1,
                  unit_cost: Decimal = Decimal('0'),
                  created_by: str = '') -> ClassificationResult:
    """
    Evaluate an item against Rules A → D in order.
    Returns the first matching rule's classification result.
    """
    rules = get_active_rules()

    # Rule A: Consumable
    result = evaluate_rule_a(item, qty, unit_cost, rules)
    if result:
        return result

    # Rule B: Expendable
    result = evaluate_rule_b(item, qty, unit_cost, rules)
    if result:
        return result

    # Rule C: Individual Capitalization
    result = evaluate_rule_c(item, qty, unit_cost, rules)
    if result:
        return result

    # Rule D: Bulk/Grouped
    result = evaluate_rule_d(item, qty, unit_cost, rules)
    if result:
        return result

    # Fallback: Prompt for decision
    return ClassificationResult(
        suggested_category_type=item.category_type or 'consumable',
        suggested_action='prompt',
        applied_rule='',
        rule_label='No matching rule — manual decision required',
        is_bulk=False,
        override_required=True,
        errors=[],
    )


# ---------------------------------------------------------------------------
# Prompt Logging
# ---------------------------------------------------------------------------
def log_classification_prompt(*, item: InventoryItem, qty: int = 1,
                               unit_cost: Decimal = Decimal('0'),
                               total_value: Decimal = Decimal('0'),
                               classification: ClassificationResult,
                               transaction: Optional[S2Transaction] = None,
                               created_by: str = '',
                               bulk_group_ref: str = '') -> CapitalizationPrompt:
    """Log a capitalization evaluation result to the audit prompt table."""
    prompt = CapitalizationPrompt.objects.create(
        transaction=transaction,
        item=item,
        item_code=item.id,
        item_name=item.name,
        category_type=item.category_type,
        unit_cost=unit_cost,
        quantity=qty,
        total_value=total_value or (Decimal(str(qty)) * unit_cost),
        applied_rule=classification.applied_rule,
        suggested_action=classification.suggested_action,
        suggested_category_type=classification.suggested_category_type,
        is_bulk=classification.is_bulk,
        bulk_group_ref=bulk_group_ref,
        approval_status='auto' if not classification.override_required else 'pending',
        created_by=created_by,
    )
    return prompt


def apply_override(prompt_id: str, override_decision: str,
                   reason: str, override_by: str,
                   approval_status: str = 'approved',
                   approved_by: str = '',
                   approval_notes: str = '') -> CapitalizationPrompt:
    """
    Apply a user override to a capitalization prompt.
    Records decision, reason, and approval.
    """
    with transaction.atomic():
        prompt = CapitalizationPrompt.objects.select_for_update().get(id=prompt_id)

        prompt.override_decision = override_decision
        prompt.override_reason = reason
        prompt.override_by = override_by
        prompt.override_at = timezone.now()
        prompt.approval_status = approval_status
        prompt.approved_by = approved_by or override_by
        prompt.approved_at = timezone.now()
        prompt.approval_notes = approval_notes
        prompt.save()

        # If override is capitalize, update the item's category type
        if override_decision == 'capitalize' and prompt.item:
            item = prompt.item
            item.category_type = ItemTypeChoices.FIXED_ASSET
            item.save(update_fields=['category_type'])

        return prompt