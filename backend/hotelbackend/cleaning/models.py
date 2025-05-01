from django.db import models
from hotel.models import Room
from users.models import User
from booking.models import Booking
from hotel.models import CleaningChecklistTemplate, ChecklistItemTemplate
from django.core.exceptions import ValidationError

# Create your models here.

class CleaningTask(models.Model):
    class Meta:
        ordering = ['due_time']
    STATUS_CHOICES = (
        ('pending', 'Ожидается уборка'),
        ('in_progress', 'В процессе уборки'),
        ('done', 'Готов к проверке'),
        ('checked', 'Проверен'),
    )
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    due_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES,default='pending')
    checklist_template = models.ForeignKey(CleaningChecklistTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Комната {self.room.number} заезд в {self.due_time}'
    
    def clean(self):
        if self.booking and self.booking.room != self.room:
            raise ValidationError("Комната в задаче не совпадает с комнатой в бронировании.")
    
    def save(self, *args, **kwargs):
        if self.booking and not self.due_time:
            self.due_time = self.booking.check_in
        super().save(*args, **kwargs)


class CleaningCheck(models.Model):
    STATUS_CHOICES = (
        ('approved', 'Готов в заселению'),
        ('needs_rework', 'Нужно доработать'),
    )
    cleaning_task = models.ForeignKey(CleaningTask, on_delete=models.CASCADE)
    checked_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    checklist =  models.ForeignKey(CleaningChecklistTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='needs_rework')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Проверка уборки комнаты {self.cleaning_task.room.number} заезд в {self.cleaning_task.due_time}'
    

    def create_check_items_from_template(self):
        if self.checklist:
            for template_item in self.checklist.items.all():
                CleaningCheckItem.objects.create(
                    check=self,
                    template_item=template_item,
                    is_passed=False
                )
                
class ChecklistItemTemplate(models.Model):
    template = models.ForeignKey(CleaningChecklistTemplate, on_delete=models.CASCADE, related_name='items')
    text = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.text


class CleaningCheckItem(models.Model):
    check = models.ForeignKey(CleaningCheck, on_delete=models.CASCADE, related_name='items')
    template_item = models.ForeignKey(ChecklistItemTemplate, on_delete=models.SET_NULL, null=True)
    is_passed = models.BooleanField(default=False)
    comment = models.TextField(blank=True, null=True)

    def __str__(self):
        status = "✓" if self.is_passed else "✗"
        return f'{status} {self.template_item.text if self.template_item else "Пункт удалён"}'

