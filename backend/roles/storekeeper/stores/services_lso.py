from django.utils import timezone
from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import LsoRecord, ServiceVerification
from common.messaging.models import DocumentAttachment


def verify_lso(lso_id: str, verifier: str, verifier_role: str = None, remarks: str = '', attachment_ids: list = None, request=None):
    """Verify completion of an LSO. Requires at least one attachment as evidence.

    This function:
    - Validates LSO is in 'Completed' status
    - Creates a ServiceVerification record
    - Attaches provided DocumentAttachment ids
    - Sets LSO.status to 'Verified', locks the LSO, and records verifier
    - Returns the verification instance
    """
    try:
        lso = LsoRecord.objects.select_for_update().get(id=lso_id)
    except LsoRecord.DoesNotExist:
        raise ValidationError('LSO not found')

    if (lso.status or '').lower() != 'completed':
        raise ValidationError('LSO must be in Completed status before verification')

    # require evidence
    if not attachment_ids:
        # If request provided, try to find attachments for this LSO
        if request:
            attachments = DocumentAttachment.objects.filter(entity_type__iexact='lso', entity_id=str(lso.id))
            if not attachments.exists():
                raise ValidationError('Completion verification requires at least one attachment (evidence)')
        else:
            raise ValidationError('Completion verification requires at least one attachment (evidence)')

    with transaction.atomic():
        ver = ServiceVerification.objects.create(
            lso=lso,
            verifier=verifier,
            verifier_role=verifier_role or '',
            remarks=remarks or '',
        )

        # Attach evidence refs if provided
        evidence_list = []
        if attachment_ids:
            for aid in attachment_ids:
                try:
                    att = DocumentAttachment.objects.get(id=aid)
                    att.entity_type = 'lso_verification'
                    att.entity_id = str(ver.id)
                    att.save()
                    evidence_list.append({'id': att.id, 'url': getattr(att, 'fileUrl', '') or ''})
                except Exception:
                    continue
        else:
            # gather existing attachments for LSO
            attachments = DocumentAttachment.objects.filter(entity_type__iexact='lso', entity_id=str(lso.id))
            for att in attachments:
                evidence_list.append({'id': att.id, 'url': getattr(att, 'fileUrl', '') or ''})

        ver.evidence = evidence_list
        ver.save()

        # mark LSO as Verified and lock
        lso.status = 'Verified'
        lso.completion_verified_by_committee = verifier
        lso.locked = True
        lso.save()

    return ver
