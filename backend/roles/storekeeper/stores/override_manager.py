from typing import Optional
from django.db import transaction
from django.utils import timezone

from .models import CapitalizationPrompt, OverrideLog, CapitalizationSetting
from .capitalization_engine import apply_override, ClassificationResult


class OverrideManager:
    """Service to handle override requests, approval routing, and audit logging."""

    def __init__(self):
        self.settings = CapitalizationSetting.objects.order_by('id').first()

    def requires_approval(self, override_decision: str) -> bool:
        """Decide whether an override requires additional approval.

        Policy: if settings contain 'override_requires_approval' bool in asset_classes
        or defaults to True for capitalization decisions.
        """
        try:
            cfg = (self.settings.asset_classes or {}) if self.settings else {}
            req = cfg.get('override_requires_approval')
            if isinstance(req, bool):
                return req
        except Exception:
            pass
        # default rule: approving a capitalization override requires approval
        return override_decision == 'capitalize'

    def request_override(self, prompt_id: str, override_decision: str, reason: str, override_by: str,
                         approved_by: Optional[str] = '', approval_notes: Optional[str] = '') -> CapitalizationPrompt:
        """Handle an override request: enforce reason, set prompt fields and create an OverrideLog.

        If approval is required, mark prompt as pending and return. If no approval required,
        apply the override immediately and create log.
        """
        if not reason or not reason.strip():
            raise ValueError('Override reason is mandatory')

        with transaction.atomic():
            prompt = CapitalizationPrompt.objects.select_for_update().get(id=prompt_id)
            original = prompt.suggested_action or ''

            needs_approval = self.requires_approval(override_decision)

            prompt.override_decision = override_decision
            prompt.override_reason = reason
            prompt.override_by = override_by
            prompt.override_at = timezone.now()
            prompt.approval_status = 'pending' if needs_approval else 'approved'
            prompt.approved_by = approved_by if not needs_approval else ''
            prompt.approved_at = timezone.now() if not needs_approval else None
            prompt.approval_notes = approval_notes or ''
            prompt.save()

            # Create override audit log
            OverrideLog.objects.create(
                prompt=prompt,
                original_recommendation=original,
                final_decision=override_decision,
                reason=reason,
                override_by=override_by,
                approved_by=approved_by or '',
            )

            # If no approval required and decision is to capitalize, perform apply_override
            if not needs_approval:
                # reuse apply_override to set item category if needed
                apply_override(prompt_id=prompt.id, override_decision=override_decision,
                               reason=reason, override_by=override_by,
                               approval_status='approved', approved_by=approved_by or override_by,
                               approval_notes=approval_notes)

            return prompt
