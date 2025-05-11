import pytest
from django.core.exceptions import ValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError 
from django.db import IntegrityError 

from hotel.models import RoomType, Room, Zone 
from hotel.serializers import RoomTypeSerializer, RoomSerializer, ZoneSerializer 


# --- RoomType Model Tests ---
# Тесты для модели RoomType
# Tests for the RoomType model

@pytest.mark.django_db 
def test_roomtype_creation():
    """
    Test that a RoomType object can be created successfully with valid data.
    Тест, что объект RoomType может быть успешно создан с корректными данными.
    """
    # Создаем объект RoomType с тестовыми данными
    # Create a RoomType object with test data
    room_type = RoomType.objects.create(
        name="Standard",
        description="A basic room type",
        capacity=2
    )

    # Проверяем, что объект был создан и сохранен в базе данных
    # Assert that the object was created and saved to the database
    assert room_type.pk is not None
    # Проверяем, что атрибуты объекта соответствуют предоставленным данным
    # Assert that the object's attributes match the provided data
    assert room_type.name == "Standard"
    assert room_type.description == "A basic room type"
    assert room_type.capacity == 2

@pytest.mark.django_db
def test_roomtype_unique_name():
    """
    Test that creating RoomType with a non-unique name raises an IntegrityError.
    Тест, что создание RoomType с неуникальным именем вызывает IntegrityError.
    """
    # Создаем первый объект с уникальным именем
    # Create the first object with a unique name
    RoomType.objects.create(name="Deluxe")

    # Попытка создать еще один объект с тем же именем должна вызвать IntegrityError
    # Attempting to create another object with the same name should raise an IntegrityError
    with pytest.raises(IntegrityError):
        # Attempt to create another RoomType with the same name
        RoomType.objects.create(name="Deluxe")

@pytest.mark.django_db
def test_roomtype_default_capacity():
    """
    Test that the default capacity is set correctly when not provided.
    Тест, что вместимость по умолчанию устанавливается корректно, если не предоставлена.
    """
    # Создаем объект, не указывая вместимость
    # Create an object without specifying capacity
    room_type = RoomType.objects.create(name="Suite")
    # Проверяем, что установилось значение по умолчанию (1)
    # Check that the default value (1) was set
    assert room_type.capacity == 1 # Check against the default=1 in the model

@pytest.mark.django_db
def test_roomtype_str_method():
    """
    Test the __str__ method of the RoomType model.
    Тест метода __str__ модели RoomType.
    """
    # Создаем объект RoomType
    # Create a RoomType object
    room_type = RoomType.objects.create(name="Presidential Suite")
    # Проверяем, что строковое представление объекта совпадает с его именем
    # Assert that the string representation of the object matches its name
    assert str(room_type) == "Presidential Suite"


# --- Room Model Tests ---
# Тесты для модели Room
# Tests for the Room model

@pytest.mark.django_db
def test_room_creation_with_roomtype():
    """
    Test that a Room object can be created successfully with a linked RoomType.
    Тест, что объект Room может быть успешно создан со связанным RoomType.
    """
    # Создаем связанный RoomType
    # Create a related RoomType
    room_type = RoomType.objects.create(name="Single")
    # Создаем объект Room, связывая его с RoomType
    # Create a Room object, linking it to the RoomType
    room = Room.objects.create(
        number=101,
        floor=1,
        room_type=room_type,
        status=Room.Status.FREE, # Используем значение из TextChoices / Use TextChoices value
        notes="Near elevator",
        is_active=True
    )

    # Проверяем, что объект был создан и сохранен
    # Assert that the object was created and saved
    assert room.pk is not None
    # Проверяем атрибуты, включая внешний ключ
    # Assert attributes, including the foreign key
    assert room.number == 101
    assert room.floor == 1
    assert room.room_type == room_type # Проверяем, что связан с правильным RoomType / Check that it's linked to the correct RoomType
    assert room.status == Room.Status.FREE
    assert room.notes == "Near elevator"
    assert room.is_active is True

@pytest.mark.django_db
def test_room_creation_without_roomtype():
    """
    Test that a Room object can be created successfully without a linked RoomType
    since room_type allows null=True.
    Тест, что объект Room может быть успешно создан без связанного RoomType,
    так как поле room_type допускает null=True.
    """
    # Создаем объект Room, не указывая RoomType
    # Create a Room object without specifying RoomType
    room = Room.objects.create(
        number=102,
        floor=1,
        room_type=None, # Явно устанавливаем в None / Explicitly set to None
        status=Room.Status.OCCUPIED,
        is_active=False
    )

    # Проверяем, что объект создан и room_type равно None
    # Assert that the object is created and room_type is None
    assert room.pk is not None
    assert room.number == 102
    assert room.room_type is None # Проверяем, что room_type равно None / Check that room_type is None
    assert room.status == Room.Status.OCCUPIED
    assert room.is_active is False

@pytest.mark.django_db
def test_room_unique_number():
    """
    Test that creating Room with a non-unique number raises an IntegrityError.
    Тест, что создание Room с неуникальным номером вызывает IntegrityError.
    """
    # Создаем первый номер
    # Create the first room
    Room.objects.create(number=201, floor=2) # room_type and status have defaults/allow null

    # Попытка создать еще один номер с тем же номером должна вызвать IntegrityError
    # Attempting to create another room with the same number should raise an IntegrityError
    with pytest.raises(IntegrityError):
        Room.objects.create(number=201, floor=3)

@pytest.mark.django_db
def test_room_default_status():
    """
    Test that the default status is set correctly when not provided.
    Тест, что статус по умолчанию устанавливается корректно, если не предоставлен.
    """
    # Создаем номер, не указывая статус
    # Create a room without specifying status
    room = Room.objects.create(number=202, floor=2)
    # Проверяем, что установился статус по умолчанию (FREE)
    # Check that the default status (FREE) was set
    assert room.status == Room.Status.FREE # Check against the default=Status.FREE

@pytest.mark.django_db
def test_room_default_is_active():
    """
    Test that the default is_active is set correctly when not provided.
    Тест, что is_active по умолчанию устанавливается корректно, если не предоставлен.
    """
    # Создаем номер, не указывая is_active
    # Create a room without specifying is_active
    room = Room.objects.create(number=203, floor=2)
    # Проверяем, что установилось значение по умолчанию (True)
    # Check that the default value (True) was set
    assert room.is_active is True # Check against the default=True

@pytest.mark.django_db
def test_room_invalid_status_raises_error():
    """
    Test that assigning an invalid status value raises ValidationError.
    Тест, что присвоение недопустимого значения статуса вызывает ValidationError.
    """
    # Создаем экземпляр модели с недопустимым статусом (не сохраняем в БД)
    # Create a model instance with an invalid status (do not save to DB)
    room = Room(number=301, floor=3, status="invalid_status") # Use model constructor / Используем конструктор модели

    # full_clean() запускает валидаторы модели, включая валидацию choices
    # full_clean() triggers model validators, including choices validation
    with pytest.raises(ValidationError) as excinfo:
        room.full_clean() # Manually trigger full model validation / Вручную запускаем полную валидацию модели

    # Проверяем, что ошибка валидации связана с полем 'status'
    # Check if the validation error is related to the 'status' field
    assert 'status' in excinfo.value.message_dict
    # Optional: Check part of the error message text (может зависеть от версии Django)
    # Optional: Check part of the error message text (may depend on Django version)
    # assert 'Value' in str(excinfo.value) and 'is not a valid choice' in str(excinfo.value)


@pytest.mark.django_db
def test_room_on_delete_set_null_roomtype():
    """
    Test that when a RoomType is deleted, the room_type field in related Rooms is set to NULL.
    Тест, что при удалении RoomType поле room_type в связанных Room устанавливается в NULL.
    """
    # Создаем RoomType и связанный с ним Room
    # Create a RoomType and a Room linked to it
    room_type = RoomType.objects.create(name="Double")
    room = Room.objects.create(number=401, floor=4, room_type=room_type)

    # Удаляем RoomType
    # Delete the RoomType
    room_type.delete()

    # Обновляем объект Room из базы данных, чтобы получить последние изменения
    # Refresh the Room object from the database to get the latest changes
    room.refresh_from_db()

    # Проверяем, что поле room_type теперь None
    # Assert that the room_type field is now None
    assert room.room_type is None

@pytest.mark.django_db
def test_room_str_method():
    """
    Test the __str__ method of the Room model.
    Тест метода __str__ модели Room.
    """
    # Создаем RoomType и Room для теста
    # Create a RoomType and a Room for the test
    room_type = RoomType.objects.create(name="Quad")
    room = Room.objects.create(
        number=501,
        floor=5,
        room_type=room_type,
        status=Room.Status.CLEAN # Используем значение из TextChoices / Use TextChoices value
    )
    # Проверяем, что строковое представление объекта соответствует ожидаемому формату
    # Assert that the string representation of the object matches the expected format
    assert str(room) == f'Комната {room.number} (Этаж {room.floor}, Статус: {room.get_status_display()})'


# --- Zone Model Tests ---
# Тесты для модели Zone
# Tests for the Zone model

@pytest.mark.django_db
def test_zone_creation():
    """
    Test that a Zone object can be created successfully with valid data.
    Тест, что объект Zone может быть успешно создан с корректными данными.
    """
    # Создаем объект Zone с тестовыми данными
    # Create a Zone object with test data
    zone = Zone.objects.create(
        name="Lobby",
        description="Main entrance area",
        floor=1
    )

    # Проверяем, что объект был создан и сохранен
    # Assert that the object was created and saved
    assert zone.pk is not None
    # Проверяем атрибуты объекта
    # Assert the object's attributes
    assert zone.name == "Lobby"
    assert zone.description == "Main entrance area"
    assert zone.floor == 1

@pytest.mark.django_db
def test_zone_creation_without_floor():
    """
    Test that a Zone object can be created successfully without a floor
    since floor allows blank=True and null=True.
    Тест, что объект Zone может быть успешно создан без указания этажа,
    так как поле floor допускает blank=True и null=True.
    """
    # Создаем объект Zone, не указывая этаж
    # Create a Zone object without specifying the floor
    zone = Zone.objects.create(
        name="Parking Lot",
        description="Outdoor parking area",
        floor=None # Явно устанавливаем в None / Explicitly set to None
    )

    # Проверяем, что объект создан и floor равно None
    # Assert that the object is created and floor is None
    assert zone.pk is not None
    assert zone.name == "Parking Lot"
    assert zone.description == "Outdoor parking area"
    assert zone.floor is None # Проверяем, что floor равно None / Check that floor is None


@pytest.mark.django_db
def test_zone_unique_name():
    """
    Test that creating Zone with a non-unique name raises an IntegrityError.
    Тест, что создание Zone с неуникальным именем вызывает IntegrityError.
    """
    # Создаем первую зону
    # Create the first zone
    Zone.objects.create(name="Restaurant")

    # Попытка создать еще одну зону с тем же именем должна вызвать IntegrityError
    # Attempting to create another zone with the same name should raise an IntegrityError
    with pytest.raises(IntegrityError):
        Zone.objects.create(name="Restaurant")

@pytest.mark.django_db
def test_zone_str_method():
    """
    Test the __str__ method of the Zone model.
    Тест метода __str__ модели Zone.
    """
    # Создаем объект Zone
    # Create a Zone object
    zone = Zone.objects.create(name="Gym")
    # Проверяем, что строковое представление объекта соответствует ожидаемому формату
    # Assert that the string representation of the object matches the expected format
    assert str(zone) == f'Зона для уборки: {zone.name}'
