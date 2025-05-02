from django.db import models
from hotel.models import Room
from users.models import User


# Create your models here.
class IncidentReport(models.Model):
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Инцидент"
        verbose_name_plural = "Инциденты"
    TYPE_CHOICES = (
        ('broken_item', 'Поломка'),
        ('lost_and_found', 'Забытая вещь'),
    )
    STATUS_CHOICES = (
        ('open', 'Зарегистрирована'),
        ('resolved', 'Решена'),
    )
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='broken_item')
    description = models.TextField(blank=True, null=True)
    reported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=50,choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f'{self.get_type_display()} — комната {self.room.number} ({self.get_status_display()})'
    
    def is_resolved(self):
        return self.status == 'resolved'