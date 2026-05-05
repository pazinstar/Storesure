from django.db import models


def _next_id(model_class, prefix):
    """Auto-generate sequential IDs: STR001, STR002, SCH001 …"""
    last = (
        model_class.objects
        .filter(id__startswith=prefix)
        .order_by('-id')
        .first()
    )
    num = 1
    if last:
        try:
            num = int(last.id[len(prefix):]) + 1
        except (ValueError, TypeError):
            num = 1
    return f'{prefix}{num:03d}'


# ─── Admin KPI ────────────────────────────────────────────────────────────────

class AdminKPI(models.Model):
    title = models.CharField(max_length=255)
    value = models.CharField(max_length=100)
    trend = models.CharField(max_length=100)
    trendUp = models.BooleanField(default=True)
    type = models.CharField(max_length=50)

    def __str__(self):
        return self.title


# ─── School ───────────────────────────────────────────────────────────────────

class School(models.Model):
    SCHOOL_TYPES = [
        ('primary', 'Primary'),
        ('secondary', 'Secondary'),
        ('tertiary', 'Tertiary'),
        ('mixed', 'Mixed'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ]
    TERM_CHOICES = [
        ('term_1', 'Term 1'),
        ('term_2', 'Term 2'),
        ('term_3', 'Term 3'),
    ]

    CATEGORY_CHOICES = [
        ('day', 'Day School'),
        ('boarding_a', 'Boarding Category A*'),
        ('boarding_b', 'Boarding Category B*'),
        ('special_needs', 'Special Needs Boarding'),
    ]

    PLAN_CHOICES = [
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
    ]

    id = models.CharField(max_length=50, primary_key=True, blank=True)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    county = models.CharField(max_length=100, blank=True, null=True)
    type = models.CharField(max_length=50, choices=SCHOOL_TYPES, default='secondary')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='day')
    academic_year = models.CharField(max_length=20, blank=True, null=True)
    current_term = models.CharField(max_length=20, choices=TERM_CHOICES, blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    subscription_plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='standard')
    expiry_date = models.DateField(blank=True, null=True)
    headteacher_name = models.CharField(max_length=255, blank=True, null=True)
    headteacher_email = models.EmailField(blank=True, null=True)
    headteacher_phone = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id(School, 'SCH')
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class SchoolBranding(models.Model):
    school = models.OneToOneField(
        School, on_delete=models.CASCADE,
        related_name='branding', primary_key=True,
    )
    logo_url = models.URLField(blank=True, null=True)
    logo_text = models.CharField(max_length=100, blank=True, null=True)
    primary_color = models.CharField(max_length=20, default='#166534')
    secondary_color = models.CharField(max_length=20, default='#15803d')
    tagline = models.CharField(max_length=255, blank=True, null=True)
    motto = models.CharField(max_length=255, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Branding — {self.school.name}'


class SystemSetup(models.Model):
    TERM_CHOICES = [
        ('term_1', 'Term 1'),
        ('term_2', 'Term 2'),
        ('term_3', 'Term 3'),
    ]

    school = models.OneToOneField(
        School, on_delete=models.CASCADE,
        related_name='setup', primary_key=True,
    )
    academic_year = models.CharField(max_length=20, blank=True, null=True)
    current_term = models.CharField(max_length=20, choices=TERM_CHOICES, blank=True, null=True)
    modules_enabled = models.JSONField(default=list)
    require_approval_for_requisitions = models.BooleanField(default=True)
    require_approval_for_lpos = models.BooleanField(default=True)
    max_requisition_value = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
    )
    allow_self_registration = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f'Setup — {self.school.name}'


# ─── Store Location ───────────────────────────────────────────────────────────

class StoreLocation(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    id = models.CharField(max_length=50, primary_key=True, blank=True)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    managerId = models.CharField(max_length=50, blank=True, null=True)
    managerName = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    createdAt = models.DateTimeField(auto_now_add=True, null=True)
    description = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id(StoreLocation, 'STR')
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# ─── Library ──────────────────────────────────────────────────────────────────

class Library(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    id = models.CharField(max_length=50, primary_key=True, blank=True)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    managerId = models.CharField(max_length=50, blank=True, null=True)
    managerName = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    createdAt = models.DateTimeField(auto_now_add=True, null=True)
    capacity = models.IntegerField(default=0)
    description = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id(Library, 'LIB')
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# ─── Department ───────────────────────────────────────────────────────────────

class Department(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    id = models.CharField(max_length=50, primary_key=True, blank=True)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    createdAt = models.DateTimeField(auto_now_add=True, null=True)
    description = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id(Department, 'DEP')
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# ─── Streams ─────────────────────────────────────────────────────────────────

class Stream(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    id = models.CharField(max_length=50, primary_key=True, blank=True)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    createdAt = models.DateTimeField(auto_now_add=True, null=True)
    description = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id(Stream, 'STM')
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# ─── Permission (legacy – retained for compatibility) ─────────────────────────

class Permission(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100)
    module = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


# ─── Role & Module Permissions (relational) ───────────────────────────────────

class Role(models.Model):
    ROLE_TYPES = [('system', 'System'), ('custom', 'Custom')]

    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    type = models.CharField(max_length=20, choices=ROLE_TYPES, default='system')
    is_deletable = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class RoleModulePermission(models.Model):
    role = models.ForeignKey(
        Role, on_delete=models.CASCADE, related_name='module_permissions',
    )
    module_id = models.CharField(max_length=100)
    module_name = models.CharField(max_length=255)
    enabled = models.BooleanField(default=False)
    can_view = models.BooleanField(default=False)
    can_create = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        unique_together = ('role', 'module_id')

    def __str__(self):
        return f'{self.role_id} — {self.module_name}'


class RoleModuleLink(models.Model):
    module_permission = models.ForeignKey(
        RoleModulePermission, on_delete=models.CASCADE, related_name='links',
    )
    name = models.CharField(max_length=255)
    href = models.CharField(max_length=255)
    enabled = models.BooleanField(default=False)

    class Meta:
        unique_together = ('module_permission', 'href')

    def __str__(self):
        return f'{self.module_permission} — {self.name}'


# ─── RolePermission (legacy JSON – retained for compatibility) ────────────────

class RolePermission(models.Model):
    role = models.CharField(max_length=100, primary_key=True)
    roleLabel = models.CharField(max_length=255)
    permissions = models.JSONField(default=list)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.roleLabel


# ─── Inspection Committee ─────────────────────────────────────────────────────

class InspectionCommittee(models.Model):
    """Singleton — only one row ever exists system-wide."""
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return 'Inspection Committee'


class InspectionCommitteeMember(models.Model):
    committee = models.ForeignKey(
        InspectionCommittee, on_delete=models.CASCADE, related_name='members',
    )
    user_id = models.CharField(max_length=50)
    user_name = models.CharField(max_length=255)
    designation = models.CharField(max_length=255, blank=True)
    order = models.IntegerField(default=1)

    class Meta:
        unique_together = ('committee', 'user_id')
        ordering = ['order']

    def __str__(self):
        return f'{self.user_name} ({self.designation})'


# Student model lives in roles.students
