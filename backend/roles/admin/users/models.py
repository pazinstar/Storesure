from django.db import models
from roles.admin.dashboard.models import School


class SystemUser(models.Model):
    id = models.CharField(max_length=50, primary_key=True, blank=True)  # USR001
    name = models.CharField(max_length=255, blank=True, null=True)
    username = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255, blank=True, null=True)  # stored as Django hash
    role = models.CharField(max_length=100)  # matches Role.id e.g. 'storekeeper'
    school = models.ForeignKey(
        School, on_delete=models.SET_NULL, null=True, blank=True, related_name='users',
    )
    department = models.CharField(max_length=255, blank=True, null=True)
    assignedStores = models.JSONField(default=list, blank=True)
    lastLogin = models.DateTimeField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True, null=True)
    status = models.CharField(max_length=50, default="Active")

    def save(self, *args, **kwargs):
        if not self.id:
            last_user = SystemUser.objects.all().order_by("-id").first()
            if last_user and last_user.id.startswith("USR"):
                try:
                    last_id_num = int(last_user.id[3:])
                    self.id = f"USR{last_id_num + 1:03d}"
                except ValueError:
                    self.id = "USR001"
            else:
                self.id = "USR001"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} - {self.name or self.username}"
