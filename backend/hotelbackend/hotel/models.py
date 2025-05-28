from django.db import models

# --- RoomType Model ---
# Модель для представления типов номеров в отеле (например, "Стандарт", "Люкс").
# Model for representing types of rooms in the hotel (e.g., "Standard", "Suite").
class RoomType(models.Model):
    # Мета-класс для определения опций модели.
    # Meta class for defining model options.
    class Meta:
        verbose_name = "Тип номера" # Human-readable name for a single object / Человекочитаемое имя для одного объекта
        verbose_name_plural = "Типы номеров" # Human-readable name for multiple objects / Человекочитаемое имя для множества объектов
        ordering = ['name'] # Default ordering for querysets / Сортировка по умолчанию для наборов данных

    # Название типа номера (например, "Стандарт"). Должно быть уникальным.
    # Name of the room type (e.g., "Standard"). Must be unique.
    name = models.CharField(
        max_length=50, 
        unique=True,
        verbose_name="Название типа номера"
        )
    # Описание типа номера (опционально).
    # Description of the room type (optional).
    description = models.TextField(
        blank=True, # Allows the field to be blank in forms / Позволяет полю быть пустым в формах
        verbose_name="Описание"
        )
    # Максимальная вместимость номера данного типа. Положительное целое число.
    # Maximum capacity of a room of this type. Positive integer.
    capacity = models.PositiveIntegerField(
        default=1, # Default value if not specified / Значение по умолчанию, если не указано
        verbose_name="Вместимость"
        )

    # Строковое представление объекта RoomType. Возвращает название типа номера.
    # String representation of the RoomType object. Returns the name of the room type.
    def __str__(self):
        return self.name
    
# --- Room Model ---
# Модель для представления отдельных номеров в отеле.
# Model for representing individual rooms in the hotel.
class Room(models.Model):
    # Мета-класс для определения опций модели.
    # Meta class for defining model options.
    class Meta:
        verbose_name = "Номер" # Human-readable name for a single object / Человекочитаемое имя для одного объекта
        verbose_name_plural = "Номера" # Human-readable name for multiple objects / Человекочитаемое имя для множества объектов
        ordering = ['number'] # Default ordering for querysets / Сортировка по умолчанию для наборов данных
        # Индексы для ускорения поиска по часто используемым полям.
        # Indexes to speed up queries on frequently used fields.
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['room_type']),
            models.Index(fields=['is_active']),
        ]
    
    # Класс для определения возможных статусов номера с человекочитаемыми названиями.
    # Class for defining possible room statuses with human-readable names.
    class Status(models.TextChoices):
        FREE = "free", "Свободен" # Free and available / Свободен и доступен
        OCCUPIED = "occupied", "Занят" # Currently occupied by a guest / В настоящее время занят гостем
        DIRTY = "dirty", "Грязный" # Needs cleaning / Требуется уборка
        ASSIGNED = "assigned", "Назначен" # Task assigned to a cleaner / Задача назначена горничной
        IN_PROGRESS = "in_progress", "В процессе уборки" # Cleaning is currently in progress / Уборка в процессе
        WAITING_INSPECTION = "waiting_inspection", "Ожидает проверки" # Cleaning complete, waiting for inspection / Уборка завершена, ожидает проверки
        CLEAN = "clean", "Чистый (готов к заезду)" # Clean and ready for a new guest / Убран и готов к заселению
        ON_MAINTENANCE = "on_maintenance", "На обслуживании" # Out of service for maintenance / Недоступен из-за обслуживания

    # Уникальный номер комнаты. Положительное целое число.
    # Unique room number. Positive integer.
    number = models.PositiveIntegerField(
        unique=True, # Must be unique across all rooms / Должен быть уникальным среди всех номеров
        verbose_name="Номер комнаты"
        ) 
    # Этаж, на котором находится номер. Положительное целое число.
    # Floor on which the room is located. Positive integer.
    floor = models.PositiveIntegerField(
        verbose_name="Этаж"
    )
    # Связь с типом номера. Если тип номера удаляется, поле устанавливается в NULL.
    # Relationship to the RoomType. If the room type is deleted, the field is set to NULL.
    room_type = models.ForeignKey(
        'RoomType', # String reference to the RoomType model / Строковая ссылка на модель RoomType
        on_delete=models.SET_NULL, # Set ForeignKey to NULL when the referenced object is deleted / Установить ForeignKey в NULL при удалении связанного объекта
        blank=True, # Allows the field to be blank in forms / Позволяет полю быть пустым в формах
        null=True, # Allows the field to be NULL in the database / Позволяет полю быть NULL в базе данных
        verbose_name="Категория номера"
        )
    # Текущий статус номера. Выбирается из предопределенных вариантов.
    # Current status of the room. Chosen from predefined options.
    status = models.CharField(
        max_length=20, # Max length for the status value / Максимальная длина для значения статуса
        choices=Status.choices, # Use choices defined in the Status class / Использование вариантов выбора, определенных в классе Status
        default=Status.FREE, # Default status when a new room is created / Статус по умолчанию при создании нового номера
        verbose_name="Статус номера"
        )
    # Дополнительные заметки о номере (опционально).
    # Additional notes about the room (optional).
    notes = models.TextField(
        blank=True, # Allows the field to be blank in forms / Позволяет полю быть пустым в формах
        null=True, # Allows the field to be NULL in the database / Позволяет полю быть NULL в базе данных
        verbose_name="Заметки"
        )
    # Указывает, активен ли номер (доступен для бронирования/использования).
    # Indicates if the room is active (available for booking/use).
    is_active = models.BooleanField(
        default=True, # Default value is True / Значение по умолчанию True
        verbose_name="Активен"
        )
    
    # Строковое представление объекта Room. Возвращает номер комнаты, этаж и статус.
    # String representation of the Room object. Returns the room number, floor, and status.
    def __str__(self):
        # get_status_display() returns the human-readable label for the status value
        # get_status_display() возвращает человекочитаемую метку для значения статуса
        return f'Комната {self.number} (Этаж {self.floor}, Статус: {self.get_status_display()})'
    
# --- Zone Model ---
# Модель для представления зон в отеле, требующих уборки (например, "Лобби", "Ресторан").
# Model for representing zones in the hotel that require cleaning (e.g., "Lobby", "Restaurant").
class Zone(models.Model):

    class Status(models.TextChoices):
        DIRTY = "dirty", "Грязный" # Needs cleaning / Требуется уборка
        ASSIGNED = "assigned", "Назначен" # Task assigned to a cleaner / Задача назначена горничной
        IN_PROGRESS = "in_progress", "В процессе уборки" # Cleaning is currently in progress / Уборка в процессе
        CLEAN = "clean", "Чистый" # Clean and ready for a new guest / Убран и готов к заселению
        

    # Мета-класс для определения опций модели.
    # Meta class for defining model options.
    class Meta:
        verbose_name = "Зона для уборки" # Human-readable name for a single object / Человекочитаемое имя для одного объекта
        verbose_name_plural = "Зоны для уборки" # Human-readable name for multiple objects / Человекочитаемое имя для множества объектов
        ordering = ['name'] # Default ordering for querysets / Сортировка по умолчанию для наборов данных

    # Название зоны (например, "Лобби"). Должно быть уникальным.
    # Name of the zone (e.g., "Lobby"). Must be unique.
    name = models.CharField(
        max_length=50, 
        unique=True, # Must be unique across all zones / Должно быть уникальным среди всех зон
        verbose_name="Название зоны"
        )
    # Описание зоны (опционально).
    # Description of the zone (optional).
    description = models.TextField(
        blank=True, # Allows the field to be blank in forms / Позволяет полю быть пустым в формах
        verbose_name="Описание"
        )
    # Этаж, на котором находится зона (опционально). Положительное целое число.
    # Floor on which the zone is located (optional). Positive integer.
    floor = models.PositiveIntegerField(
        verbose_name="Этаж",
        blank=True, # Allows the field to be blank in forms / Позволяет полю быть пустым в формах
        null=True # Allows the field to be NULL in the database / Позволяет полю быть NULL в базе данных
    )
    # Текущий статус зоны. Выбирается из предопределенных вариантов.
    # Current status of the room. Chosen from predefined options.
    status = models.CharField(
        max_length=20, # Max length for the status value / Максимальная длина для значения статуса
        choices=Status.choices, # Use choices defined in the Status class / Использование вариантов выбора, определенных в классе Status
        default=Status.CLEAN, # Default status when a new room is created / Статус по умолчанию при создании нового номера
        verbose_name="Статус номера"
        )

    # Строковое представление объекта Zone. Возвращает название зоны.
    # String representation of the Zone object. Returns the name of the zone.
    def __str__(self):
        return f'Зона для уборки: {self.name}'
