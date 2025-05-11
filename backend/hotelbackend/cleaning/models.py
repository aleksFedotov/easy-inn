from django.db import models
from hotel.models import Room, Zone
from users.models import User
from booking.models import Booking
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, time

# Create your models here.
# Создайте свои модели здесь.

class CleaningType(models.Model):
    # Мета-параметры модели
    # Model meta options
    class Meta:
        verbose_name = "Тип уборки" # Человекочитаемое имя модели в единственном числе / Human-readable name for the model (singular)
        verbose_name_plural = "Типы уборок" # Человекочитаемое имя модели во множественном числе / Human-readable name for the model (plural)
        ordering = ['name'] # Порядок сортировки по умолчанию / Default ordering

    # Поле для названия типа уборки (например, "Ежедневная", "Генеральная")
    # Field for the cleaning type name (e.g., "Daily", "Deep Clean")
    name = models.CharField(
        max_length=50,
        unique=True, # Название должно быть уникальным / Name must be unique
        verbose_name="Название типа уборки" # Человекочитаемое имя поля / Human-readable field name
        )

    # Строковое представление объекта CleaningType
    # String representation of the CleaningType object
    def __str__(self):
        return self.name

class ChecklistTemplate(models.Model):
    # Мета-параметры модели
    # Model meta options
    class Meta:
        verbose_name = "Шаблон чек-листа" # Человекочитаемое имя модели в единственном числе / Human-readable name for the model (singular)
        verbose_name_plural = "Шаблоны чек-листов" # Человекочитаемое имя модели во множественном числе / Human-readable name for the model (plural)
        ordering = ['name'] # Порядок сортировки по умолчанию / Default ordering

    # Название шаблона чек-листа
    # Name of the checklist template
    name = models.CharField(
        max_length=100,
        unique=True, # Название шаблона должно быть уникальным / Template name must be unique
        verbose_name="Название шаблона чек-листа" # Человекочитаемое имя поля / Human-readable field name
    )

    # Связь с типом уборки (один ко многим)
    # Relationship with CleaningType (one-to-many)
    cleaning_type = models.ForeignKey(
        "CleaningType", # Ссылка на модель CleaningType / Link to the CleaningType model
        on_delete=models.CASCADE, # При удалении типа уборки удаляются все связанные шаблоны / Deleting a CleaningType deletes all related templates
        verbose_name="Тип уборки" # Человекочитаемое имя поля / Human-readable field name
    )

    # Описание шаблона (необязательное)
    # Description of the template (optional)
    description = models.TextField(
        blank=True, # Поле может быть пустым / Field can be blank
        verbose_name="Описание" # Человекочитаемое имя поля / Human-readable field name
    )

    # Строковое представление объекта ChecklistTemplate
    # String representation of the ChecklistTemplate object
    def __str__(self):
        return self.name


class ChecklistItemTemplate(models.Model):
    # Мета-параметры модели
    # Model meta options
    class Meta:
        verbose_name = "Пункт шаблона чек-листа" # Человекочитаемое имя модели в единственном числе / Human-readable name for the model (singular)
        verbose_name_plural = "Пункты шаблона чек-листа" # Человекочитаемое имя модели во множественном числе / Human-readable name for the model (plural)
        ordering = ['order'] # Порядок сортировки по умолчанию по полю 'order' / Default ordering by the 'order' field
        # Ограничение уникальности: комбинация шаблона и порядка должна быть уникальной
        # Unique constraint: the combination of checklist_template and order must be unique
        unique_together = (('checklist_template', 'order'),)

    # Связь с шаблоном чек-листа (один ко многим)
    # Relationship with ChecklistTemplate (one-to-many)
    checklist_template = models.ForeignKey(
        "ChecklistTemplate", # Ссылка на модель ChecklistTemplate / Link to the ChecklistTemplate model
        on_delete=models.CASCADE, # При удалении шаблона удаляются все связанные пункты / Deleting a template deletes all related items
        related_name='items', # Имя обратной связи из ChecklistTemplate / Reverse relationship name from ChecklistTemplate
        verbose_name = "Шаблон чек-листа" # Человекочитаемое имя поля / Human-readable field name
    )

    # Текст пункта чек-листа
    # Text of the checklist item
    text = models.TextField(
        blank=False, # Поле не может быть пустым / Field cannot be blank
        verbose_name="Текст пункта" # Человекочитаемое имя поля / Human-readable field name
    )

    # Порядок отображения пункта в списке (для сортировки)
    # Display order of the item in the list (for sorting)
    order = models.PositiveIntegerField(
        default=0, # Значение по умолчанию / Default value
        verbose_name="Порядок отображения пункта в списке" # Человекочитаемое имя поля / Human-readable field name
    )

    # Строковое представление объекта ChecklistItemTemplate
    # String representation of the ChecklistItemTemplate object
    def __str__(self):
        return self.text

class CleaningTask(models.Model):
    # Варианты статуса задачи по уборке
    # Choices for the cleaning task status
    class Status(models.TextChoices):
        UNASSIGNED = "unassigned", "Не назначен" # Задача не назначена / Task is not assigned
        ASSIGNED = "assigned", "Назначен" # Задача назначена горничной / Task is assigned to a cleaner
        IN_PROGRESS = "in_progress", "В процессе уборки" # Уборка начата / Cleaning has started
        COMPLETED = "completed", "Уборка завершена" # Уборка завершена горничной / Cleaning is completed by the cleaner
        WAITING_CHECK = "waiting_check", "Ожидает проверки" # Уборка завершена, ожидает проверки менеджером / Completed, waiting for manager check
        CHECKED = "checked", "Проверено" # Уборка проверена менеджером / Cleaning is checked by the manager
        CANCELED = "canceled", "Отменена" # Задача отменена / Task is canceled

    # Мета-параметры модели
    # Model meta options
    class Meta:
        verbose_name = "Задача по уборке" # Человекочитаемое имя модели в единственном числе / Human-readable name for the model (singular)
        verbose_name_plural = "Задачи по уборке" # Человекочитаемое имя модели во множественном числе / Human-readable name for the model (plural)
        ordering = ['due_time'] # Порядок сортировки по умолчанию по сроку выполнения / Default ordering by due time
        # Индексы для ускорения поиска по часто используемым полям
        # Indexes to speed up lookups on frequently used fields
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['due_time']),
        ]


    # Пользователь (горничная), которому назначена задача
    # The user (cleaner) the task is assigned to
    assigned_to = models.ForeignKey(
        User, # Ссылка на модель User / Link to the User model
        on_delete=models.SET_NULL, # При удалении пользователя, поле устанавливается в NULL / When user is deleted, set field to NULL
        blank=True, # Поле может быть пустым в формах / Field can be blank in forms
        null=True, # Поле может быть NULL в базе данных / Field can be NULL in the database
        related_name='assigned_tasks', # Имя обратной связи из User / Reverse relationship name from User
        verbose_name="Назначена горничная" # Человекочитаемое имя поля / Human-readable field name
    )

    # Пользователь (менеджер), который назначил задачу
    # The user (manager) who assigned the task
    assigned_by = models.ForeignKey(
        User, # Ссылка на модель User / Link to the User model
        on_delete=models.SET_NULL, # При удалении пользователя, поле устанавливается в NULL / When user is deleted, set field to NULL
        blank=True, # Поле может быть пустым в формах / Field can be blank in forms
        null=True, # Поле может быть NULL в базе данных / Field can be NULL in the database
        related_name='created_tasks', # Имя обратной связи из User / Reverse relationship name from User
        verbose_name="Назначил задачу" # Человекочитаемое имя поля / Human-readable field name
    )


    # Связь с номером комнаты (один ко многим, необязательная)
    # Relationship with Room (one-to-many, optional)
    room = models.ForeignKey(
        Room, # Ссылка на модель Room / Link to the Room model
        on_delete=models.SET_NULL, # При удалении комнаты, поле устанавливается в NULL / When room is deleted, set field to NULL
        blank=True, # Поле может быть пустым в формах / Field can be blank in forms
        null=True, # Поле может быть NULL в базе данных / Field can be NULL in the database
        related_name='cleaning_tasks', # Имя обратной связи из Room / Reverse relationship name from Room
        verbose_name="Номер комнаты для уборки" # Человекочитаемое имя поля / Human-readable field name
    )

    # Связь с зоной (один ко многим, необязательная)
    # Relationship with Zone (one-to-many, optional)
    zone = models.ForeignKey(
        Zone, # Ссылка на модель Zone / Link to the Zone model
        on_delete=models.SET_NULL, # При удалении зоны, поле устанавливается в NULL / When zone is deleted, set field to NULL
        blank=True, # Поле может быть пустым в формах / Field can be blank in forms
        null=True, # Поле может быть NULL в базе данных / Field can be NULL in the database
        related_name='cleaning_tasks', # Имя обратной связи из Zone / Reverse relationship name from Zone
        verbose_name="Зона для уборки" # Человекочитаемое имя поля / Human-readable field name
    )

    # Связь с бронированием (один ко многим, необязательная)
    # Relationship with Booking (one-to-many, optional)
    booking = models.ForeignKey(
        Booking, # Ссылка на модель Booking / Link to the Booking model
        on_delete=models.SET_NULL, # При удалении бронирования, поле устанавливается в NULL / When booking is deleted, set field to NULL
        blank=True, # Поле может быть пустым в формах / Field can be blank in forms
        null=True, # Поле может быть NULL в базе данных / Field can be NULL in the database
        related_name='cleaning_tasks', # Имя обратной связи из Booking / Reverse relationship name from Booking
        verbose_name="Связанное бронирование" # Человекочитаемое имя поля / Human-readable field name
    )

    # Связь с типом уборки для этой задачи (один ко многим, необязательная)
    # Relationship with CleaningType for this specific task (one-to-many, optional)
    cleaning_type = models.ForeignKey(
        "CleaningType", # Ссылка на модель CleaningType / Link to the CleaningType model
        on_delete=models.SET_NULL, # При удалении типа уборки, поле устанавливается в NULL / When cleaning type is deleted, set field to NULL
        blank=True, # Поле может быть пустым в формах / Field can be blank in forms
        null=True, # Поле может быть NULL в базе данных / Field can be NULL in the database
        related_name='tasks', # Имя обратной связи из CleaningType / Reverse relationship name from CleaningType
        verbose_name="Тип уборки" # Человекочитаемое имя поля / Human-readable field name
    )

    # Статус задачи (выбирается из предопределенных вариантов)
    # Status of the task (chosen from predefined choices)
    status = models.CharField(
        max_length=20,
        choices=Status.choices, # Используем варианты из внутреннего класса Status / Use choices from the inner Status class
        default=Status.UNASSIGNED, # Статус по умолчанию / Default status
        verbose_name="Статус уборки" # Человекочитаемое имя поля / Human-readable field name
    )

    # Дата, на которую запланирована уборка
    # Date the cleaning is scheduled for
    scheduled_date = models.DateField(
        null=True, # Поле может быть NULL в базе данных / Field can be NULL in the database
        blank=True, # Поле может быть пустым в формах / Field can be blank in forms
        verbose_name="Дата планирования уборки" # Человекочитаемое имя поля / Human-readable field name
    )

    # Срок выполнения задачи (дата и время)
    # Due date and time for the task
    due_time = models.DateTimeField(
        null=True, # Поле может быть NULL в базе данных / Field can be NULL in the database
        blank=True, # Поле может быть пустым в формах / Field can be blank in forms
        verbose_name="Срок выполнения" # Человекочитаемое имя поля / Human-readable field name
    )

    # Время назначения задачи
    # Timestamp when the task was assigned
    assigned_at = models.DateTimeField(
        null=True, # Поле может быть NULL в базе данных / Field can be NULL in the database
        blank=True, # Поле может быть пустым в формах / Field can be blank in forms

        verbose_name="Время назначения" # Человекочитаемое имя поля / Human-readable field name
    )

    # Время начала выполнения задачи
    # Timestamp when the task was started
    started_at = models.DateTimeField(
        null=True, # Поле может быть NULL в базе данных / Field can be NULL in the database
        blank=True, # Поле может быть пустым в формах / Field can be blank in forms
        verbose_name="Время начала уборки" # Человекочитаемое имя поля / Human-readable field name
    )

    # Время завершения выполнения задачи
    # Timestamp when the task was completed
    completed_at = models.DateTimeField( #
        null=True, # Поле может быть NULL в базе данных / Field can be NULL in the database
        blank=True, # Поле может быть пустым в формах / Field can be blank in forms
        verbose_name="Время завершения уборки" # Человекочитаемое имя поля / Human-readable field name
    )

    # Время проверки задачи менеджером
    # Timestamp when the task was checked by a manager
    checked_at = models.DateTimeField(
        null=True, # Поле может быть NULL в базе данных / Field can be NULL in the database
        blank=True, # Поле может быть пустым в формах / Field can be blank in forms
        verbose_name="Время проверки" # Человекочитаемое имя поля / Human-readable field name
    )

    # Пользователь (менеджер), который проверил задачу
    # The user (manager) who checked the task
    checked_by = models.ForeignKey(
        User, # Ссылка на модель User / Link to the User model
        on_delete=models.SET_NULL, # При удалении пользователя, поле устанавливается в NULL / When user is deleted, set field to NULL
        blank=True, # Поле может быть пустым в формах / Field can be blank in forms
        null=True, # Поле может быть NULL в базе данных / Field can be NULL in the database
        related_name='checked_cleaning_tasks', # Имя обратной связи из User / Reverse relationship name from User
        verbose_name="Проверил" # Человекочитаемое имя поля / Human-readable field name
    )

    # Дополнительные заметки к задаче
    # Additional notes for the task
    notes = models.TextField(
        blank=True, # Поле может быть пустым в формах / Field can be blank in forms
        null=True, # Поле может быть NULL в базе данных / Field can be NULL in the database
        verbose_name="Заметки" # Человекочитаемое имя поля / Human-readable field name
    )

    # Метод для пользовательской валидации данных модели
    # Method for custom model data validation
    def clean(self):
        # Проверка, что задача не может быть одновременно для комнаты и для зоны
        # Check that a task cannot be for both a room and a zone simultaneously
        if self.room and self.zone:
            raise ValidationError("Задача не может быть одновременно для комнаты и для зоны.")
        # Проверка, что задача должна быть либо для комнаты, либо для зоны
        # Check that a task must be for either a room or a zone
        if not self.room and not self.zone:
            raise ValidationError("Задача должна быть либо для комнаты, либо для зоны.")
        # Проверка, что дата в due_time совпадает с scheduled_date, если обе даты указаны
        # Check that the date in due_time matches scheduled_date if both are provided
        if self.scheduled_date and self.due_time and self.scheduled_date != self.due_time.date():
            raise ValidationError({
                'due_time': "Дата в 'Срок выполнения' должна совпадать с 'Датой планирования уборки'."
            })
        # Вызов метода clean родительского класса для выполнения стандартной валидации
        # Call the parent class's clean method for standard validation
        super().clean()

    # Переопределение метода save() для установки значений по умолчанию для due_time и scheduled_date
    # Override the save() method to set default values for due_time and scheduled_date
    def save(self, *args, **kwargs):
        # Если due_time не установлено
        # If due_time is not set
        if not self.due_time:
            # Если есть связанное бронирование и у него есть дата заезда
            # If there is a related booking and it has a check_in date
            if self.booking and self.booking.check_in:
                self.due_time = self.booking.check_in # Устанавливаем due_time равным дате заезда бронирования / Set due_time to the booking's check_in date
                # Если scheduled_date не установлено, устанавливаем его равным дате из due_time
                # If scheduled_date is not set, set it to the date from due_time
                if not self.scheduled_date:
                    self.scheduled_date = self.due_time.date()
            else:
                # Если нет связанного бронирования или даты заезда
                # If there is no related booking or check_in date
                # Если scheduled_date не установлено, устанавливаем его равным сегодняшней дате
                # If scheduled_date is not set, set it to today's date
                if not self.scheduled_date:
                    self.scheduled_date = timezone.now().date()

                # Устанавливаем due_time на 14:00 запланированной даты
                # Set due_time to 2:00 PM on the scheduled date
                self.due_time = datetime.combine(
                    self.scheduled_date,
                    time(14, 0), # Время 14:00 (2 PM) / Time 2:00 PM
                    tzinfo=timezone.get_current_timezone() # Или timezone.utc / Or timezone.utc
                )

        # Вызов метода save родительского класса для сохранения объекта
        # Call the parent class's save method to save the object
        super().save(*args, **kwargs)

    # Строковое представление объекта CleaningTask
    # String representation of the CleaningTask object
    def __str__(self):
        target = None
        # Определяем цель уборки (комната или зона)
        # Determine the cleaning target (room or zone)
        if self.room:
            target = f'Комната {self.room.number}' # Если есть комната, используем ее номер / If room exists, use its number
        elif self.zone:
            target = f'Зона {self.zone.name}' # Если есть зона, используем ее название / If zone exists, use its name
        else:
            target = 'Неизвестное место' # Если ни комнаты, ни зоны нет / If neither room nor zone exists

        # Определяем имя горничной, если назначена
        # Determine the cleaner's name if assigned
        assigned_to_name = self.assigned_to.get_full_name() if self.assigned_to and self.assigned_to.get_full_name() else self.assigned_to.username if self.assigned_to else 'Не назначен'

        # Форматируем строку для отображения
        # Format the string for display
        return f'Задача: {target} ({self.get_status_display()}) - Назначена: {assigned_to_name}'