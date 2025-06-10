from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

# Create your models here.

# Custom User model extending Django's AbstractUser
# Кастомная модель пользователя, расширяющая AbstractUser Django
class User(AbstractUser):
    # Defines user roles using TextChoices
    # Определяет роли пользователей с использованием TextChoices
    class Role(models.TextChoices):
        HOUSEKEEPER = 'housekeeper', 'Горничная'    
        MANAGER = 'manager', 'Управляющий'
        FRONT_DESK = 'front-desk', 'Ресепшн'

    # Meta class for model options
    # Класс Meta для опций модели
    class Meta:
        verbose_name = "Пользователь" # Human-readable name for the model
        verbose_name_plural = "Пользователи" # Human-readable plural name
        ordering = ['username'] # Default ordering for querysets

    # Role field to store the user's role
    # Поле роли для хранения роли пользователя
    role = models.CharField(
        max_length=20,
        choices=Role.choices, # Use choices defined in Role class
        verbose_name="Роль", # Human-readable name for the field
        blank=False,
        null=False
    )
    

    # Custom clean method for model-level validation
    # Кастомный метод clean для валидации на уровне модели
    def clean(self):
        super().clean() # Call the parent class's clean method

    # String representation of the user object
    # Строковое представление объекта пользователя
    def __str__(self):
        # Get the user's full name
        # Получаем полное имя пользователя
        full_name = self.get_full_name()
        # If full name exists, return it with the role display
        # Если полное имя существует, возвращаем его вместе с отображаемым значением роли
        if full_name:
            return f"{full_name} ({self.get_role_display()})"
        # Otherwise, return the username with the role display
        # В противном случае возвращаем username вместе с отображаемым значением роли
        return f"{self.username} ({self.get_role_display()})"
    
# Model for storing push tokens associated with users
# Модель для хранения push-токенов, связанных с пользователями

class PushToken(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='push_tokens',
        verbose_name="Пользователь"
    )
    
    
    token = models.CharField(
        max_length=255, 
        unique=True,
        verbose_name="Push-токен"
    )
    
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    
    
    last_registered_at = models.DateTimeField(
        auto_now=True, 
        verbose_name="Последняя регистрация"
    )

    platform = models.CharField(
        max_length=20,
        blank=True,  
        null=True,   
        verbose_name="Платформа"
    )

    class Meta:
        verbose_name = "Push-токен"
        verbose_name_plural = "Push-токены"
    
    def __str__(self):
        return f"{self.user.username} - {self.token[:10]}... ({self.platform or 'N/A'})"