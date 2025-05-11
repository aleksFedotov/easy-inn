import pytest
from django.urls import reverse
from rest_framework.exceptions import ValidationError 
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta # Import timedelta
from booking.models import Booking
from hotel.models import RoomType, Room

# Import serializer
from booking.serializers import BookingSerializer

# Получаем кастомную модель User
# Get the custom User model
UserModel = get_user_model()

# --- Fixtures ---
# Фикстуры для создания объектов, необходимых для тестов
# Fixtures for creating objects needed for the tests

@pytest.fixture
def room_type_standard():
    """Фикстура для стандартного типа номера."""
    # Fixture for a standard RoomType.
    return RoomType.objects.create(name="Стандарт", capacity=2)

@pytest.fixture
def room_suite():
    """Фикстура для типа номера "Люкс"."""
    # Fixture for a suite RoomType.
    return RoomType.objects.create(name="Люкс", capacity=3)

@pytest.fixture
def room_mini():
    """Фикстура для типа номера "Мини"."""
    # Fixture for a mini RoomType.
    return RoomType.objects.create(name="Мини", capacity=1)


@pytest.fixture
def room_standard_101(room_type_standard):
    """Фикстура для экземпляра стандартного номера."""
    # Fixture for a standard Room instance.
    return Room.objects.create(number="101", floor=1, room_type=room_type_standard)

@pytest.fixture
def room_suite_203(room_suite):
    """Фикстура для экземпляра номера "Люкс"."""
    # Fixture for a suite Room instance.
    return Room.objects.create(number="203", floor=2, room_type=room_suite)

@pytest.fixture
def room_mini_104(room_mini):
    """Фикстура для экземпляра номера "Мини"."""
    # Fixture for a mini Room instance.
    return Room.objects.create(number="104", floor=1, room_type=room_mini)


@pytest.fixture
def user_admin():
    """Фикстура для пользователя с ролью администратора."""
    # Fixture for an admin user.
    return UserModel.objects.create_user(username="admin", password="testpass123", role="admin")

@pytest.fixture
def user_guest():
    """Фикстура для пользователя с ролью гостя."""
    # Fixture for a guest user.
    return UserModel.objects.create_user(username="guest", password="guestpass")


# --- Booking Serializer Tests ---
# Тесты для сериализатора BookingSerializer
# Tests for the BookingSerializer

@pytest.mark.django_db # Отмечаем тест для работы с базой данных Django / Mark test to work with Django database
def test_booking_serializer_output(room_suite_203, user_admin):
    """
    Тест, что BookingSerializer корректно сериализует объект Booking,
    включая связанные поля и вычисленную продолжительность.
    Test that BookingSerializer correctly serializes a Booking object,
    including related fields and calculated duration.
    """
    check_in = timezone.now()
    check_out = check_in + timedelta(days=2) # Используем timedelta / Use timedelta

    # Создаем экземпляр Booking
    # Create a Booking instance
    booking = Booking.objects.create(
        room=room_suite_203,
        check_in=check_in,
        check_out=check_out,
        guest_count=2,
        notes="Некоторые заметки", # Some notes
        created_by=user_admin
    )

    # Инициализируем сериализатор с экземпляром объекта
    # Instantiate the serializer with the instance
    serializer = BookingSerializer(instance=booking)
    # Получаем сериализованные данные
    # Get the serialized data
    data = serializer.data

    # Проверяем, что выходные данные соответствуют данным экземпляра
    # Assert the output data matches the instance data
    assert data['id'] == booking.id # Проверяем наличие id / Ensure id is present
    assert data['room'] == room_suite_203.id # Проверяем ID комнаты / Check room ID
    assert data['room_number'] == room_suite_203.number # Проверяем номер комнаты (поле source) / Check room_number (source field)
    assert data['check_in'] is not None # Проверяем, что check_in сериализовано / Check check_in is serialized
    assert data['check_out'] is not None # Проверяем, что check_out сериализовано / Check check_out is serialized
    assert data['guest_count'] == 2
    assert data['notes'] == "Некоторые заметки" # Check notes
    assert data['created_by'] == user_admin.id # Проверяем ID создателя / Check created_by ID
    # Предполагаем, что поле created_by_name присутствует и корректно в вашем сериализаторе
    # Assuming created_by_name field is present and correct in your serializer
    assert data['created_by_name'] == user_admin.get_full_name() or user_admin.username # Проверяем имя создателя / Check created_by_name
    # Предполагаем, что поле duration_days присутствует и корректно в вашем сериализаторе
    # Assuming duration_days field is present and correct in your serializer
    assert data['duration_days'] == 2 # Проверяем вычисленную продолжительность / Check calculated duration


@pytest.mark.django_db
def test_booking_serializer_duration_none(room_standard_101, user_admin):
    """
    Тест, что продолжительность равна None, когда check_out не установлен.
    Test that the duration is None when check_out is not set.
    """
    # Создаем бронирование без даты выезда
    # Create a booking without a check-out date
    booking = Booking.objects.create(
        room=room_standard_101,
        check_in=timezone.now(),
        check_out=None, # check_out is None
        guest_count=1,
        created_by=user_admin
    )

    # Инициализируем сериализатор и получаем данные
    # Instantiate the serializer and get data
    serializer = BookingSerializer(instance=booking)
    data = serializer.data

    # Предполагаем, что поле duration_days присутствует и корректно в вашем сериализаторе
    # Assuming duration_days field is present and correct in your serializer
    assert data['duration_days'] is None # Продолжительность должна быть None / Duration should be None


@pytest.mark.django_db
def test_booking_serializer_valid_input_create(room_suite_203, user_admin):
    """
    Тест, что BookingSerializer валидирует и создает объект Booking
    с корректными входными данными.
    Test that BookingSerializer validates and creates a Booking object
    with valid input data.
    """
    check_in = timezone.now().isoformat() # Используем формат ISO для входных данных сериализатора / Use ISO format for serializer input
    check_out = (timezone.now() + timedelta(days=3)).isoformat()

    # Корректные входные данные
    # Valid input data
    data = {
        'room': room_suite_203.id, # Передаем ID комнаты / Pass Room ID
        'check_in': check_in,
        'check_out': check_out,
        'guest_count': 3,
        'notes': 'Корректные данные бронирования', # Valid booking data
        'created_by': user_admin.id, # Передаем ID пользователя / Pass User ID
    }

    # Инициализируем сериализатор с входными данными
    # Instantiate the serializer with input data
    serializer = BookingSerializer(data=data)

    # Проверяем, что данные валидны, с выбросом исключения при ошибке
    # Assert that the data is valid, raising exception on error
    assert serializer.is_valid(raise_exception=True) # Данные должны быть валидны / Data should be valid

    # Сохраняем валидированные данные для создания нового объекта
    # Save the validated data to create a new object
    booking_instance = serializer.save()

    # Проверяем, что объект создан в базе данных
    # Assert that an object was created in the database
    assert Booking.objects.count() == 1
    # Проверяем атрибуты созданного экземпляра
    # Assert the created instance attributes
    assert booking_instance.room == room_suite_203
    assert booking_instance.guest_count == 3
    assert booking_instance.notes == 'Корректные данные бронирования' # Check notes
    assert booking_instance.created_by == user_admin # Check created_by


@pytest.mark.django_db
def test_booking_serializer_missing_required_fields(room_standard_101):
    """
    Тест, что BookingSerializer не проходит валидацию, если отсутствуют обязательные поля.
    'room' и 'check_in' являются обязательными.
    Test that BookingSerializer fails validation if required fields are missing.
    'room' and 'check_in' are required.
    """
    # Отсутствует 'room'
    # Missing 'room'
    data_missing_room = {
        'check_in': timezone.now().isoformat(),
        'guest_count': 1,
    }
    serializer_missing_room = BookingSerializer(data=data_missing_room)
    assert not serializer_missing_room.is_valid()
    assert 'room' in serializer_missing_room.errors # Проверяем наличие ошибки для поля 'room' / Check for error on 'room' field

    # Отсутствует 'check_in'
    # Missing 'check_in'
    data_missing_checkin = {
        'room': room_standard_101.id,
        'guest_count': 1,
    }
    serializer_missing_checkin = BookingSerializer(data=data_missing_checkin)
    assert not serializer_missing_checkin.is_valid()
    assert 'check_in' in serializer_missing_checkin.errors # Проверяем наличие ошибки для поля 'check_in' / Check for error on 'check_in' field


@pytest.mark.django_db
def test_booking_serializer_invalid_guest_count(room_mini_104, user_guest):
    """
    Тест, что BookingSerializer не проходит валидацию, если guest_count превышает вместимость номера.
    Это должно вызвать ValidationError для поля 'guest_count'.
    Test that BookingSerializer fails validation if guest_count exceeds room capacity.
    This should raise a ValidationError on the 'guest_count' field.
    """
    data = {
        'room': room_mini_104.id,
        'check_in': timezone.now().isoformat(),
        'check_out': (timezone.now() + timedelta(days=1)).isoformat(),
        'guest_count': 3,  # превышает вместимость (1) / exceeds capacity (1)
        'notes': '',
        'created_by': user_guest.id,
    }

    serializer = BookingSerializer(data=data)
    # Ожидаем ValidationError при вызове is_valid(raise_exception=True)
    # Expecting ValidationError when calling is_valid(raise_exception=True)
    with pytest.raises(ValidationError) as exc:
        serializer.is_valid(raise_exception=True)

    # Проверяем, что ошибка связана с полем 'guest_count' и содержит ожидаемое сообщение
    # Check that the error is related to the 'guest_count' field and contains the expected message
    assert 'guest_count' in exc.value.detail # Ожидаем ошибку на поле 'guest_count' / Expecting error on 'guest_count' field
    assert 'превышает вместимость номера' in str(exc.value.detail['guest_count'][0]) # Проверяем текст ошибки / Check error message text


@pytest.mark.django_db
def test_booking_serializer_update(room_standard_101):
    """
    Тест, что BookingSerializer корректно обновляет существующий объект Booking.
    Test that BookingSerializer correctly updates an existing Booking object.
    """
    # Создаем существующее бронирование
    # Create an existing booking
    booking = Booking.objects.create(
        room=room_standard_101,
        check_in=timezone.now(),
        guest_count=1,
        notes="Начальные заметки" # Initial notes
    )

    # Данные для обновления (изменяем check_out, notes, guest_count)
    # Update data (changing check_out, notes, guest_count)
    update_data = {
        'check_out': (timezone.now() + timedelta(days=5)).isoformat(),
        'notes': 'Обновленные заметки', # Updated notes
        'guest_count': 2, # Корректное обновление, если вместимость 2 или более / Valid update if capacity is 2 or more
        # Поля только для чтения должны быть проигнорированы
        # Read-only fields should be ignored
        'id': 999, # Должно быть проигнорировано / Should be ignored
        'room_number': 'Проигнорировано', # Should be ignored
        'created_by_name': 'Проигнорированное имя', # Should be ignored
        'duration_days': 999, # Should be ignored
    }

    # Инициализируем сериализатор с экземпляром объекта и данными для обновления
    # Используем partial=True для частичного обновления (PATCH)
    # Instantiate the serializer with the instance and update data
    # Use partial=True for partial updates (PATCH)
    serializer = BookingSerializer(instance=booking, data=update_data, partial=True) # Use partial=True for PATCH

    # Проверяем, что данные валидны
    # Assert data is valid
    assert serializer.is_valid(raise_exception=True)

    # Сохраняем валидированные данные для обновления объекта
    # Save the validated data to update the object
    updated_booking = serializer.save()

    # Обновляем экземпляр из базы данных, чтобы увидеть изменения
    # Refresh the instance from the database to see changes
    updated_booking.refresh_from_db()

    # Проверяем, что объект был обновлен корректно
    # Assert the object was updated correctly
    assert updated_booking.pk == booking.pk # Убеждаемся, что это тот же объект / Ensure it's the same object
    assert updated_booking.check_out is not None
    assert updated_booking.notes == 'Обновленные заметки' # Check updated notes
    assert updated_booking.guest_count == 2 # Check updated guest count
    # Проверяем, что поля, не входящие в update_data или только для чтения, не были изменены входными данными
    # Assert fields not in update_data or read-only were not changed by input data
    assert updated_booking.room == room_standard_101 # Room should not have changed
