from django.db import models
from hotel.models import Room
from users.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError

# Create your models here.
class Booking(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=['check_in']),
            models.Index(fields=['check_out']),
        ]
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    check_in = models.DateTimeField(default=timezone.now)
    check_out = models.DateTimeField(null=True, blank=True)
    guest_count = models.PositiveIntegerField(default=2)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL,null=True, blank=True)
    
    def __str__(self):
        return f'Бронь комнаты {self.room.number} с {self.check_in.date()}'
    
    def clean(self):
        super().clean()
        if self.check_out and self.check_out <= self.check_in:
            raise ValidationError('Дата выезда должна быть позже даты заезда.')
        if self.room and self.guest_count > self.room.room_type.capacity:
            raise ValidationError('Количество гостей превышает вместимость комнаты.')
        
    def duration(self):
        if self.check_in and self.check_out:
            return (self.check_out - self.check_in).days
        return None

