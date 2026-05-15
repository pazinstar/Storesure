from django.db import models
from django.core.exceptions import ValidationError


class AuditMixin(models.Model):
    created_by = models.CharField(max_length=255, blank=True, default='')
    updated_by = models.CharField(max_length=255, blank=True, default='')
    approved_by = models.CharField(max_length=255, blank=True, default='')
    locked = models.BooleanField(default=False)

    class Meta:
        abstract = True


class LockedPreventSaveMixin(models.Model):
    """Mixin that prevents updates to locked records.

    If an instance exists (pk present) and `locked` is True, any save
    attempting to change core fields will raise ValidationError. Use
    in models where audit locking is desired.
    """

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if getattr(self, 'pk', None):
            try:
                orig = self.__class__.objects.get(pk=self.pk)
            except self.__class__.DoesNotExist:
                orig = None
            if orig and getattr(orig, 'locked', False):
                # Disallow any direct edits when locked is True
                raise ValidationError('Record is locked for editing. Use reversal/override workflows.')
        super().save(*args, **kwargs)
