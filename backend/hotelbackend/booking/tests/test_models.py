import pytest
from django.core.exceptions import ValidationError 
from django.db.models import ProtectedError 
from django.contrib.auth import get_user_model 
from django.utils import timezone 
from booking.models import Booking
from hotel.models import Room, RoomType
from users.models import User 

# Получаем кастомную модель User
# Get the custom User model
UserModel = get_user_model()

# --- Fixtures for related objects ---
# Фикстуры для создания связанных объектов, необходимых для тестов
# Fixtures for creating related objects needed for tests

@pytest.fixture
def room_type_standard():
    """Фикстура для создания стандартного типа номера."""
    # Fixture to create a standard RoomType.
    return RoomType.objects.create(name="Стандарт", capacity=2)

@pytest.fixture
def room_suite():
    """Фикстура для создания номера типа "Люкс" с большей вместимостью."""
    # Fixture to create a Room instance (e.g., a suite with higher capacity).
    # Create a RoomType with higher capacity for guest_count tests
    suite_type = RoomType.objects.create(name="Люкс", capacity=4)
    return Room.objects.create(number=201, floor=2, room_type=suite_type)

@pytest.fixture
def room_standard(room_type_standard):
    """Фикстура для создания стандартного номера."""
    # Fixture to create a standard Room instance.
    return Room.objects.create(number=101, floor=1, room_type=room_type_standard)


@pytest.fixture
def manager_user():
    """Фикстура для создания пользователя с ролью менеджера (для created_by)."""
    # Fixture to create a manager user (for created_by).
    # Assuming User.Role exists and has MANAGER
    return UserModel.objects.create_user(username="manager", password="password", role=User.Role.MANAGER)


# --- Booking Model Tests ---
# Тесты для модели Booking
# Tests for the Booking model

@pytest.mark.django_db # Отмечаем тест для работы с базой данных Django / Mark test to work with Django database
def test_booking_creation_basic(room_standard):
    """
    Тест базового создания объекта Booking с обязательными полями.
    Test basic creation of a Booking object with required fields.
    """
    check_in_time = timezone.now()
    booking = Booking.objects.create(
        room=room_standard,
        check_in=check_in_time,
    )

    # Проверяем, что объект создан и поля установлены корректно
    # Assert that the object is created and fields are set correctly
    assert booking.pk is not None
    assert booking.room == room_standard
    assert booking.check_in == check_in_time
    assert booking.check_out is None # Должно быть None по умолчанию / Should be None by default
    assert booking.guest_count == 2 # Проверка значения по умолчанию / Check default value
    assert booking.notes is None # Должно быть None по умолчанию / Should be None by default
    assert booking.created_at is not None # Должно устанавливаться автоматически / Should be set automatically
    assert booking.updated_at is not None # Должно устанавливаться автоматически / Should be set automatically
    assert booking.created_by is None # Должно быть None по умолчанию (null=True) / Should be None by default (null=True)


@pytest.mark.django_db
def test_booking_creation_with_all_fields(room_suite, manager_user):
    """
    Тест создания объекта Booking со всеми опциональными полями.
    Test creation of a Booking object with all optional fields provided.
    """
    check_in_time = timezone.now() + timezone.timedelta(days=7)
    check_out_time = check_in_time + timezone.timedelta(days=3)

    booking = Booking.objects.create(
        room=room_suite,
        check_in=check_in_time,
        check_out=check_out_time,
        guest_count=3,
        notes="Гость требует дополнительную кровать", # Guest requires extra bed
        created_by=manager_user
    )

    # Проверяем, что все поля установлены корректно
    # Assert that all fields are set correctly
    assert booking.pk is not None
    assert booking.room == room_suite
    assert booking.check_in == check_in_time
    assert booking.check_out == check_out_time
    assert booking.guest_count == 3
    assert booking.notes == "Гость требует дополнительную кровать"
    assert booking.created_at is not None
    assert booking.updated_at is not None
    assert booking.created_by == manager_user


@pytest.mark.django_db
def test_booking_clean_method_checkout_before_checkin_error(room_standard):
    """
    Тест, что метод clean() вызывает ValidationError, если check_out раньше или совпадает с check_in.
    Test clean() method raises ValidationError if check_out is before or same as check_in.
    """
    check_in_time = timezone.now()
    check_out_time_invalid = check_in_time - timezone.timedelta(days=1) # Раньше check_in / Before check_in

    booking = Booking(
        room=room_standard,
        check_in=check_in_time,
        check_out=check_out_time_invalid
    )

    # Проверяем, что full_clean() вызывает ValidationError
    # Assert that full_clean() raises ValidationError
    with pytest.raises(ValidationError) as excinfo:
        booking.full_clean() # Вручную запускаем валидацию модели / Manually trigger model validation

    # Проверяем, что ошибка связана с полем check_out и содержит ожидаемое сообщение
    # Check that the error is related to the 'check_out' field and contains the expected message
    assert 'check_out' in excinfo.value.message_dict
    assert 'Дата выезда должна быть позже даты заезда.' in excinfo.value.message_dict['check_out']

    # Тест с check_out, совпадающим с check_in
    # Test with check_out same as check_in
    booking_same_time = Booking(
        room=room_standard,
        check_in=check_in_time,
        check_out=check_in_time
    )
    with pytest.raises(ValidationError) as excinfo:
        booking_same_time.full_clean()
    assert 'check_out' in excinfo.value.message_dict
    assert 'Дата выезда должна быть позже даты заезда.' in excinfo.value.message_dict['check_out']


@pytest.mark.django_db
def test_booking_clean_method_guest_count_exceeds_capacity_error(room_standard):
    """
    Тест, что метод clean() вызывает ValidationError, если guest_count превышает вместимость номера.
    Test clean() method raises ValidationError if guest_count exceeds room capacity.
    """
    # room_standard имеет вместимость 2 / room_standard has capacity 2
    booking = Booking(
        room=room_standard,
        check_in=timezone.now(),
        guest_count=3 # Превышает вместимость / Exceeds capacity
    )

    # Проверяем, что full_clean() вызывает ValidationError
    # Assert that full_clean() raises ValidationError
    with pytest.raises(ValidationError) as excinfo:
        booking.full_clean() # Вручную запускаем валидацию модели / Manually trigger model validation

    # Проверяем, что ошибка связана с полем guest_count и содержит ожидаемое сообщение
    # Check that the error is related to the 'guest_count' field and contains the expected message
    assert 'guest_count' in excinfo.value.message_dict
    assert 'Количество гостей (3) превышает вместимость номера (2).' in excinfo.value.message_dict['guest_count']


@pytest.mark.django_db
def test_booking_on_delete_protect_room(room_standard):
    """
    Тест поведения on_delete=models.PROTECT для внешнего ключа room.
    Удаление номера, связанного с бронированием, должно вызвать ProtectedError.
    Test on_delete=models.PROTECT for the room foreign key.
    Deleting a Room with a linked Booking should raise a ProtectedError.
    """
    # Создаем бронирование, связанное с номером
    # Create a booking linked to the room
    Booking.objects.create(room=room_standard, check_in=timezone.now())

    # Проверяем, что попытка удалить номер вызывает ProtectedError
    # Assert that attempting to delete the room raises ProtectedError
    with pytest.raises(ProtectedError):
        # Попытка удалить номер, который имеет бронирование
        # Attempt to delete the room that has a booking
        room_standard.delete()

@pytest.mark.django_db
def test_booking_on_delete_set_null_created_by(manager_user, room_standard):
    """
    Тест поведения on_delete=models.SET_NULL для внешнего ключа created_by.
    Удаление пользователя, создавшего бронирование, должно установить created_by в NULL.
    Test on_delete=models.SET_NULL for the created_by foreign key.
    Deleting the User who created a booking should set created_by to NULL.
    """
    # Создаем бронирование, созданное менеджером
    # Create a booking created by the manager
    booking = Booking.objects.create(
        room=room_standard,
        check_in=timezone.now(),
        created_by=manager_user
    )
    booking_pk = booking.pk # Сохраняем PK бронирования / Save the booking's PK

    # Удаляем пользователя-менеджера
    # Delete the manager user
    manager_user.delete()

    # Обновляем объект бронирования из базы данных
    # Refresh the booking object from the database
    booking.refresh_from_db()

    # Проверяем, что поле created_by теперь None
    # Assert that the created_by field is now None
    assert booking.created_by is None
    # Проверяем, что само бронирование не было удалено
    # Assert that the booking itself was not deleted
    assert Booking.objects.filter(pk=booking_pk).exists()


@pytest.mark.django_db
def test_booking_duration_method():
    """
    Тест метода duration() корректно вычисляет количество дней.
    Test the duration() method calculates the number of days correctly.
    """
    # Создаем datetime с учетом времени, но duration() использует только дату
    # Create datetime with time, but duration() uses only the date
    check_in_time = timezone.now().replace(hour=12, minute=0, second=0, microsecond=0)
    check_out_time = check_in_time + timezone.timedelta(days=5, hours=10) # Разница в 5 полных дней / 5 full days difference

    # Создаем временный номер и бронирование
    # Create a temporary room and booking
    booking = Booking.objects.create(
        room=Room.objects.create(number=998, floor=9), # Создаем временный номер для бронирования / Create a temporary room for the booking
        check_in=check_in_time,
        check_out=check_out_time
    )

    # duration() должен основываться на датах, поэтому 5 дней
    # duration() should be based on dates, so 5 days
    assert booking.duration() == 5

@pytest.mark.django_db
def test_booking_duration_method_no_checkout():
    """
    Тест метода duration() возвращает None, если check_out не установлен.
    Test the duration() method returns None if check_out is not set.
    """
    # Создаем временный номер и бронирование без даты выезда
    # Create a temporary room and booking without a check-out date
    booking = Booking.objects.create(
        room=Room.objects.create(number=997, floor=9), # Создаем временный номер / Create a temporary room
        check_in=timezone.now(),
        check_out=None
    )
    # Проверяем, что duration() возвращает None
    # Assert that duration() returns None
    assert booking.duration() is None


@pytest.mark.django_db
def test_booking_str_method_with_checkout(room_standard):
    """
    Тест метода __str__ при установленном check_out.
    Test the __str__ method when check_out is set.
    """
    check_in_time = timezone.now().replace(hour=10, minute=0)
    check_out_time = check_in_time + timezone.timedelta(days=2)

    # Создаем бронирование с датой выезда
    # Create a booking with a check-out date
    booking = Booking.objects.create(
        room=room_standard,
        check_in=check_in_time,
        check_out=check_out_time
    )
    # Ожидаемый формат строки: 'Бронь комнаты {номер} с {дата заезда} по {дата выезда}'
    # Expected string format: 'Бронь комнаты {номер} с {дата заезда} по {дата выезда}'
    expected_str = f'Бронь комнаты {room_standard.number} с {check_in_time.date()} по {check_out_time.date()}'
    # Проверяем, что строковое представление совпадает с ожидаемым
    # Assert that the string representation matches the expected string
    assert str(booking) == expected_str


@pytest.mark.django_db
def test_booking_str_method_without_checkout(room_standard):
    """
    Тест метода __str__ при не установленном check_out.
    Test the __str__ method when check_out is not set.
    """
    check_in_time = timezone.now().replace(hour=10, minute=0)

    # Создаем бронирование без даты выезда
    # Create a booking without a check-out date
    booking = Booking.objects.create(
        room=room_standard,
        check_in=check_in_time,
        check_out=None
    )
    # Ожидаемый формат строки: 'Бронь комнаты {номер} с {дата заезда} по НЕТ ДАТЫ ВЫЕЗДА'
    # Expected string format: 'Бронь комнаты {номер} с {дата заезда} по НЕТ ДАТЫ ВЫЕЗДА'
    expected_str = f'Бронь комнаты {room_standard.number} с {check_in_time.date()} по НЕТ ДАТЫ ВЫЕЗДА'
    # Проверяем, что строковое представление совпадает с ожидаемым
    # Assert that the string representation matches the expected string
    assert str(booking) == expected_str

@pytest.mark.django_db
def test_booking_auto_now_fields():
    """
    Тест, что created_at устанавливается при создании, а updated_at обновляется при сохранении.
    Test that created_at is set on creation and updated_at is updated on save.
    """
    # Создаем бронирование
    # Create a booking
    booking = Booking.objects.create(
        room=Room.objects.create(number=996, floor=9), # Создаем временный номер / Create a temporary room
        check_in=timezone.now()
    )
    created_at_initial = booking.created_at
    updated_at_initial = booking.updated_at

    # created_at и updated_at должны быть установлены при создании
    # created_at and updated_at should be set on creation
    assert created_at_initial is not None
    assert updated_at_initial is not None
    # Изначально updated_at может быть очень близко к created_at или немного позже.
    # Initially updated_at might be very close to created_at or slightly later.

    # Ждем немного (или имитируем течение времени) и обновляем бронирование
    # Wait a little bit (or simulate time passing) and update the booking
    # В реальных тестах можно использовать freezegun или аналогичные библиотеки для точного контроля времени.
    # In real tests, you can use freezegun or similar libraries for precise time control.
    # Для простоты здесь просто сохраняем еще раз.
    # For simplicity here, we just save again.
    import time as time_module
    time_module.sleep(0.01) # Обеспечиваем небольшую задержку / Ensure a small delay

    booking.notes = "Обновленные заметки" # Updated notes
    booking.save()

    # Обновляем объект из базы данных, чтобы получить значение updated_at, установленное auto_now
    # Refresh the object from the database to get the updated_at value set by auto_now
    booking.refresh_from_db()

    # created_at не должен был измениться
    # created_at should NOT have changed
    assert booking.created_at == created_at_initial
    # updated_at должен был измениться (быть позже начального значения)
    # updated_at SHOULD have changed (be later than the initial value)
    assert booking.updated_at > updated_at_initial
