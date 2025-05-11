from django.db import models
from hotel.models import Room
from users.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError



# Create your models here.
# Создание моделей здесь.
# Create your models here.
class Booking(models.Model):
    """
    Represents a booking for a room in the hotel.
    Представляет бронирование номера в отеле.
    """
    class Meta:
        """
        Meta options for the Booking model.
        Опции Meta для модели Booking.
        """
        verbose_name = "Бронирование" # Human-readable name for the model / Человекочитаемое имя для модели
        verbose_name_plural = "Бронирования" # Human-readable plural name / Человекочитаемое имя во множественном числе
        ordering = ['check_in'] # Default ordering by check-in date / Сортировка по умолчанию по дате заезда
        indexes = [
            # Indexes to improve query performance on common fields / Индексы для улучшения производительности запросов по часто используемым полям
            models.Index(fields=['check_in']),
            models.Index(fields=['check_out']),
            # Composite index for queries involving room and date range / Составной индекс для запросов, включающих номер и диапазон дат
            models.Index(fields=['room', 'check_in', 'check_out']),
        ]

    room = models.ForeignKey(
        Room,
        on_delete=models.PROTECT, # Prevent deletion of Room if it has associated bookings / Запретить удаление Room, если с ним связаны бронирования
        verbose_name="Номер" # Human-readable name for the field / Человекочитаемое имя для поля
    )

    check_in = models.DateTimeField(
        verbose_name="Дата и время заезда" # Human-readable name for the field / Человекочитаемое имя для поля
    )
    check_out = models.DateTimeField(
        null=True, # Allow the field to be NULL in the database / Разрешить полю быть NULL в базе данных
        blank=True, # Allow the field to be blank in forms / Разрешить полю быть пустым в формах
        verbose_name="Дата и время выезда" # Human-readable name for the field / Человекочитаемое имя для поля
    )
    guest_count = models.PositiveIntegerField(
        default=2, # Default number of guests / Количество гостей по умолчанию
        verbose_name="Количество гостей" # Human-readable name for the field / Человекочитаемое имя для поля
    )
    notes = models.TextField(
        null=True, # Allow the field to be NULL / Разрешить полю быть NULL
        blank=True, # Allow the field to be blank / Разрешить полю быть пустым
        verbose_name="Заметки" # Human-readable name for the field / Человекочитаемое имя для поля
    )
    created_at = models.DateTimeField(
        auto_now_add=True, # Automatically set the field to now when the object is first created / Автоматически устанавливать поле в текущее время при создании объекта
        verbose_name="Дата и время создания" # Human-readable name for the field / Человекочитаемое имя для поля
    )
    updated_at = models.DateTimeField(
        auto_now=True, # Automatically set the field to now every time the object is saved / Автоматически устанавливать поле в текущее время при каждом сохранении объекта
        verbose_name="Дата и время обновления" # Human-readable name for the field / Человекочитаемое имя для поля
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL, # Set the foreign key to NULL if the referenced User is deleted / Установить внешний ключ в NULL, если связанный пользователь удален
        null=True, # Allow the field to be NULL / Разрешить полю быть NULL
        blank=True, # Allow the field to be blank / Разрешить полю быть пустым
        related_name='created_bookings', # Name to use for the relation from the User object back to this model / Имя для обратной связи от объекта User к этой модели
        verbose_name="Создано" # Human-readable name for the field / Человекочитаемое имя для поля
    )

    def __str__(self):
        """
        String representation of the Booking object.
        Строковое представление объекта Booking.
        """
        # Returns a formatted string showing room number and check-in/check-out dates
        # Возвращает отформатированную строку, показывающую номер комнаты и даты заезда/выезда
        return f'Бронь комнаты {self.room.number} с {self.check_in.date()} по {self.check_out.date() if self.check_out else "НЕТ ДАТЫ ВЫЕЗДА"}'

    def clean(self):
        """
        Custom validation for the Booking model.
        Пользовательская валидация для модели Booking.
        """
        super().clean() # Call the parent class's clean method / Вызываем метод clean родительского класса

        # Validate that check_out is after check_in if check_out is set
        # Проверяем, что дата выезда позже даты заезда, если дата выезда установлена
        if self.check_out and self.check_out <= self.check_in:
            raise ValidationError({
                'check_out': 'Дата выезда должна быть позже даты заезда.' # Error message / Сообщение об ошибке
            })

        # Validate that guest_count does not exceed room capacity if room and room_type are available
        # Проверяем, что количество гостей не превышает вместимость номера, если номер и его тип доступны
        if self.room and self.room.room_type and self.guest_count > self.room.room_type.capacity:
            raise ValidationError({
                'guest_count': f'Количество гостей ({self.guest_count}) превышает вместимость номера ({self.room.room_type.capacity}).' # Error message / Сообщение об ошибке
            })

    def duration(self):
        """
        Calculates the duration of the booking in days.
        Вычисляет продолжительность бронирования в днях.
        """
        # Returns the number of days between check_in and check_out dates, or None if check_out is not set
        # Возвращает количество дней между датами заезда и выезда, или None, если дата выезда не установлена
        if self.check_in and self.check_out:
            return (self.check_out.date() - self.check_in.date()).days
        return None
