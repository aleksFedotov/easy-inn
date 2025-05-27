from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError

from hotel.serializers import RoomShortSerializer
from .models import Booking


from hotel.models import Room

# Get the custom User model
# Получаем пользовательскую модель User
UserModel = get_user_model()

# --- Booking Serializer ---
# Сериализатор для модели Booking
# Booking Model Serializer

class BookingSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели Booking.
    Обрабатывает сериализацию и десериализацию данных бронирований.
    Включает кастомную валидацию с вызовом full_clean().

    Serializer for the Booking model.
    Handles serialization and deserialization of booking data.
    Includes custom validation calling full_clean().
    """

    # Read-only field to display the room number directly
    # Поле только для чтения для прямого отображения номера комнаты
    room = RoomShortSerializer(read_only=True)  # это вложенный сериализатор
    room_id = serializers.PrimaryKeyRelatedField(source='room', queryset=Room.objects.all(), write_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    

    # SerializerMethodField to get the name of the user who created the booking
    # SerializerMethodField для получения имени пользователя, создавшего бронирование
    created_by_name = serializers.SerializerMethodField()
    booking_status_display = serializers.SerializerMethodField()

    def get_created_by_name(self, obj):
        """
        Возвращает полное имя пользователя, создавшего бронирование,
        или его username, если полное имя отсутствует, или None, если created_by равно None.

        Returns the full name of the user who created the booking,
        or their username if the full name is not available, or None if created_by is None.
        """
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None
    def get_booking_status_display(self, obj):
        # obj - текущий экземпляр модели Booking.
        # obj is the current Booking model instance.
        return obj.get_status_display()

    # SerializerMethodField to get the duration of the booking in days
    # SerializerMethodField для получения продолжительности бронирования в днях
    duration_days = serializers.SerializerMethodField()

    def get_duration_days(self, obj):
        """
        Возвращает продолжительность бронирования в днях, используя метод модели duration().

        Returns the duration of the booking in days, using the model's duration() method.
        """
        return obj.duration()

    class Meta:
        """
        Meta options for the BookingSerializer.
        Опции Meta для BookingSerializer.
        """
        model = Booking # The model this serializer is for / Модель, для которой предназначен этот сериализатор
        fields = [
            'id',
            'room',
            'room_id',
            'check_in',
            'check_out',
            'guest_count',
            'notes',
            'status',
            'status_display',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'duration_days',
            'booking_status_display'
        ]

        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'room_number',
            'created_by_name',
            'duration_days',
            'booking_status_display'
        ]

    def validate(self, attrs):
        """
        Кастомная валидация сериализатора, которая вызывает метод clean() модели Booking.
        Это гарантирует выполнение валидации на уровне модели перед сохранением.

        Custom serializer validation that calls the Booking model's clean() method.
        This ensures model-level validation is performed before saving.
        """

        # Get the primary key of the instance if it exists (for updates)
        # Получаем первичный ключ экземпляра, если он существует (для обновлений)
        instance_pk = getattr(self.instance, 'pk', None)

        # Get field values from attrs (for create/update data) or self.instance (for existing data)
        # Получаем значения полей из attrs (для данных создания/обновления) или self.instance (для существующих данных)
        room = attrs.get('room', getattr(self.instance, 'room', None))
        check_in = attrs.get('check_in', getattr(self.instance, 'check_in', None))
        check_out = attrs.get('check_out', getattr(self.instance, 'check_out', None))
        guest_count = attrs.get('guest_count', getattr(self.instance, 'guest_count', None))
        created_by = attrs.get('created_by', getattr(self.instance, 'created_by', None))
        notes = attrs.get('notes', getattr(self.instance, 'notes', None))
        created_at = attrs.get('created_at', getattr(self.instance, 'created_at', None))
        updated_at = attrs.get('updated_at', getattr(self.instance, 'updated_at', None))


        # Create a temporary Booking instance with the data to be validated
        # Создаем временный экземпляр Booking с данными для валидации
        temp_booking = Booking(
            pk=instance_pk,
            room=room,
            check_in=check_in,
            check_out=check_out,
            guest_count=guest_count,
            created_by=created_by,
            notes=notes,
            created_at=created_at,
            updated_at=updated_at,
        )

        try:
            # Call the model's full_clean() method to perform model-level validation
            # Вызываем метод full_clean() модели для выполнения валидации на уровне модели
            # Exclude read_only fields from full_clean validation as they are not in input data
            # Исключаем read_only поля из валидации full_clean, т.к. они не приходят во входных данных
            temp_booking.full_clean(exclude=self.Meta.read_only_fields)
        except DjangoValidationError as e:
            # If full_clean() raises ValidationError, convert it to DRF ValidationError
            # Если full_clean() вызывает ValidationError, преобразуем его в DRF ValidationError
            raise serializers.ValidationError(e.message_dict)

        # Return the original validated data
        # Возвращаем исходные валидированные данные
        return attrs


 

