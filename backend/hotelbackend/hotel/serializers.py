from rest_framework import serializers
from hotel.models import Room, RoomType, Zone

# --- RoomType Serializer ---
# Сериализатор для модели RoomType.
# Обрабатывает преобразование объектов RoomType в JSON и обратно.
# Serializer for the RoomType model.
# Handles conversion of RoomType objects to JSON and back.
class RoomTypeSerializer(serializers.ModelSerializer):

    # Мета-класс для определения опций сериализатора.
    # Meta class for defining serializer options.
    class Meta:
        model = RoomType # Указываем модель, с которой работает сериализатор / Specify the model the serializer works with
        # Поля, которые будут включены в сериализованное представление.
        # Fields to be included in the serialized representation.
        fields = [
            'id',
            'name',
            'description',
            'capacity'
        ]
        # Поля, доступные только для чтения (не принимаются при создании/обновлении).
        # Fields that are read-only (not accepted on create/update).
        read_only_fields = ['id']


# --- Room Serializer ---
# Сериализатор для модели Room.
# Обрабатывает преобразование объектов Room в JSON и обратно.
# Serializer for the Room model.
# Handles conversion of Room objects to JSON and back.
class RoomSerializer(serializers.ModelSerializer):
    # Вложенный сериализатор для отображения полной информации о RoomType (только для чтения).
    # Nested serializer to display full RoomType information (read-only).
    room_type = RoomTypeSerializer(read_only=True)

    # Поле для записи внешнего ключа room_type по его ID.
    # Field for writing the room_type foreign key by its ID.
    room_type_id = serializers.PrimaryKeyRelatedField(queryset=RoomType.objects.all(), source='room_type', write_only=True)
    
    # Поле для отображения только названия типа номера (только для чтения).
    # Использует SerializerMethodField для кастомной логики получения значения.
    # Field to display only the room type name (read-only).
    # Uses SerializerMethodField for custom logic to get the value.
    room_type_name = serializers.SerializerMethodField()
    
    # Поле для отображения человекочитаемого статуса номера (только для чтения).
    # Использует SerializerMethodField для вызова метода модели get_status_display().
    # Field to display the human-readable room status (read-only).
    # Uses SerializerMethodField to call the model's get_status_display() method.
    status_display = serializers.SerializerMethodField()

    # Метод для получения значения поля status_display.
    # Method to get the value for the status_display field.
    def get_status_display(self, obj):
        # obj - текущий экземпляр модели Room.
        # obj is the current Room model instance.
        return obj.get_status_display()

    # Метод для получения значения поля room_type_name.
    # Method to get the value for the room_type_name field.
    def get_room_type_name(self, obj):
        # Проверяем, связан ли номер с типом номера.
        # Check if the room is linked to a room type.
        if obj.room_type:
            return obj.room_type.name # Возвращаем название типа номера / Return the room type name
        return None # Возвращаем None, если тип номера не установлен / Return None if room type is not set

    # Мета-класс для определения опций сериализатора.
    # Meta class for defining serializer options.
    class Meta:
        model = Room # Указываем модель, с которой работает сериализатор / Specify the model the serializer works with
        # Поля, которые будут включены в сериализованное представление.
        # Fields to be included in the serialized representation.
        fields = [
            'id',
            'number', # Номер комнаты / Room number
            'floor', # Этаж / Floor
            'room_type', # Вложенный сериализатор RoomType (только чтение) / Nested RoomTypeSerializer (read-only)
            'room_type_name', # Название типа номера (только чтение) / Room type name (read-only)
            'room_type_id', # Поле для записи ID типа номера (только запись) / Field for writing RoomType ID (write-only)
            'status', # Текущий статус номера (чтение/запись) / Current room status (read/write)
            'status_display', # Человекочитаемый статус (только чтение) / Human-readable status (read-only)
            'notes', # Заметки (чтение/запись) / Notes (read/write)
            'is_active', # Активен ли номер (чтение/запись) / Is the room active (read/write)
        ]
        # Поля, доступные только для чтения.
        # Fields that are read-only.
        read_only_fields = [
            'id', # ID обычно всегда только для чтения / ID is usually always read-only
            'status_display', # Вычисляемое поле / Calculated field
            'room_type_name', # Вычисляемое поле / Calculated field
            # 'room_type' is also read-only because it's a nested serializer
            # 'room_type' также только для чтения, потому что это вложенный сериализатор
        ]


# --- Zone Serializer ---
# Сериализатор для модели Zone.
# Обрабатывает преобразование объектов Zone в JSON и обратно.
# Serializer for the Zone model.
# Handles conversion of Zone objects to JSON and back.
class ZoneSerializer(serializers.ModelSerializer):
    # Мета-класс для определения опций сериализатора.
    # Meta class for defining serializer options.
    class Meta:
        model = Zone # Указываем модель, с которой работает сериализатор / Specify the model the serializer works with
        # Поля, которые будут включены в сериализованное представление.
        # Fields to be included in the serialized representation.
        fields = [
            'id',
            'name', # Название зоны / Zone name
            'description', # Описание зоны / Zone description
            'floor', # Этаж (может быть null) / Floor (can be null)
        ]
        # Поля, доступные только для чтения.
        # Fields that are read-only.
        read_only_fields = ['id'] # ID обычно всегда только для чтения / ID is usually always read-only
