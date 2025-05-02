from django.db import models
from users.models import User

# Create your models here.
class ShiftNote(models.Model):
    class Meta:
        ordering = ['-pinned', '-created_at']
        verbose_name = "Заметка смены"
        verbose_name_plural = "Заметки смены"
    TYPE_CHOICES=[
        ('info', 'Инфо'),
        ('guest', 'Гость'),
        ('task', 'Задача'),
        ('warning', 'Внимание'),
        ]
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    text = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    is_archived =models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    pinned = models.BooleanField(default=False)


    def __str__(self):
        return f'{self.get_type_display()}: {self.text[:30]}'