from django.db import models
from hotel.models import Room
from users.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError
import logging
logger = logging.getLogger(__name__)


# Create your models here.
class Booking(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=['check_in']),
            models.Index(fields=['check_out']),
        ]
        verbose_name = "Бронирование"
        verbose_name_plural = "Бронирования"
        
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
    def checkout(self):
        from cleaning.models import CleaningTask, CleaningChecklistTemplate
        self.check_out = timezone.now()
        self.save()

        self.room.status = "needs_cleaning"
        self.room.save()

        next_booking = Booking.objects.filter(
            room=self.room,
            check_in__gt=self.check_out
        ).order_by('check_in').first()

        if next_booking:
            due_time = next_booking.check_in
        else:
            due_time = timezone.now().replace(hour=14, minute=0, second=0, microsecond=0)

       
        if CleaningChecklistTemplate.objects.exists():
            checklist_template = CleaningChecklistTemplate.objects.first()
        else:
            checklist_template = None

        CleaningTask.objects.create(
            room=self.room,
            due_time=due_time,
            status="pending",
            checklist_template=checklist_template,
            assigned_to=None, 
            booking=self,  
        )

        logger.info(f"Создана задача на уборку комнаты {self.room.number} для бронирования {self.id}")


