from django.db import models
from users.models import User

class RoomType(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    capacity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return self.name
    
class Room(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['room_type']),
            models.Index(fields=['is_active']),
        ]
    STATUS_CHOICES = (
        ('free', 'Свободен'),
        ('occupied', 'Занят'),
        ('needs_cleaning', 'Требуется уборка'),
        ('cleaned', 'Убран'),
    )

    number = models.PositiveIntegerField(unique=True)  
    floor = models.PositiveIntegerField()
    room_type = models.ForeignKey(RoomType, on_delete=models.SET_NULL, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='free')
    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    cleaning_required  = models.BooleanField(default=False)



    def __str__(self):
        return f'Комната {self.number} (Этаж {self.floor})'
    
    def save(self, *args, **kwargs):
        self.cleaning_required = self.status == 'needs_cleaning'
        super().save(*args, **kwargs)
    
class CleaningChecklistTemplate(models.Model):
    name = models.CharField(max_length=100)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
    

class ChecklistItemTemplate(models.Model):
    class Meta:
        ordering = ['order']
    template = models.ForeignKey(CleaningChecklistTemplate, on_delete=models.CASCADE, related_name='items')
    text = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.text