from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError

# Create your models here.
class User(AbstractUser):
    ROLE_CHOICES = (
        ('maid', 'Горничная'),
        ('admin', 'Администратор'),
        ('manager', 'Управляющий'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    def clean(self):
        if self.role not in dict(self.ROLE_CHOICES):
            raise ValidationError(f"Invalid role: {self.role}")