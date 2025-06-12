from django.db import models
from django.db import models
from django.conf import settings 
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
import json # Для JSONField

class Notification(models.Model):
    """
    Модель для хранения уведомлений пользователей в базе данных.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name="Получатель"
    )
    title = models.CharField(
        max_length=255,
        verbose_name="Заголовок"
    )
    body = models.TextField(
        verbose_name="Сообщение"
    )
    notification_type = models.CharField(
        max_length=50,
        help_text="Тип уведомления (например, 'new_task', 'task_completed')",
        verbose_name="Тип уведомления"
    )
    data = models.JSONField(
        default=dict, 
        blank=True,
        null=True,
        help_text="Дополнительные данные, связанные с уведомлением (например, task_id)",
        verbose_name="Данные"
    )
    is_read = models.BooleanField(
        default=False,
        verbose_name="Прочитано"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Время создания"
    )

    class Meta:
        ordering = ['-created_at'] 
        verbose_name = "Уведомление"
        verbose_name_plural = "Уведомления"

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title} ({'Read' if self.is_read else 'Unread'})"
