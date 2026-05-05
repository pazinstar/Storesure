import datetime
from django.db import models


class Staff(models.Model):
    TYPE_CHOICES = [('teaching', 'Teaching'), ('non-teaching', 'Non-Teaching')]
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive'), ('on_leave', 'On Leave')]
    GENDER_CHOICES = [('male', 'Male'), ('female', 'Female')]

    id = models.CharField(max_length=50, primary_key=True, blank=True)
    tsc_number = models.CharField(max_length=100, null=True, blank=True)       # teaching staff
    staff_number = models.CharField(max_length=100, null=True, blank=True)     # non-teaching staff
    inventory_number = models.CharField(max_length=100, unique=True, blank=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    designation = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    date_joined = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    id_number = models.CharField(max_length=50, null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    subjects = models.JSONField(default=list, blank=True)   # teaching staff only
    notes = models.TextField(null=True, blank=True)
    user_id = models.CharField(max_length=50, null=True, blank=True)  # linked SystemUser id
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def save(self, *args, **kwargs):
        year = datetime.date.today().year
        if not self.id:
            last = Staff.objects.filter(id__startswith=f'STF{year}').order_by('-id').first()
            num = int(last.id[7:]) + 1 if last else 1
            self.id = f'STF{year}{num:04d}'
        if not self.inventory_number:
            last = Staff.objects.filter(inventory_number__startswith=f'INV{year}').order_by('-inventory_number').first()
            try:
                num = int(last.inventory_number[7:]) + 1 if last else 1
            except (ValueError, IndexError):
                num = Staff.objects.count() + 1
            self.inventory_number = f'INV{year}{num:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name} ({self.inventory_number})'
