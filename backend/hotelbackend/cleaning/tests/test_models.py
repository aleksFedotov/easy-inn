import pytest
from django.core.exceptions import ValidationError as DjangoValidationError 
from django.db import IntegrityError 
from django.contrib.auth import get_user_model 
from django.utils import timezone 
from datetime import datetime, time, date 
from cleaning.models import CleaningType, ChecklistTemplate, ChecklistItemTemplate, CleaningTask
from hotel.models import Room, Zone, RoomType
from booking.models import Booking
from users.models import User

# Get the custom User model active in settings.py
# Получаем пользовательскую модель User, активную в settings.py
UserModel = get_user_model()

# --- Fixtures for related objects ---
# Фикстуры для создания связанных объектов, используемых в тестах.
# Fixtures for creating related objects used in tests.

@pytest.fixture
def manager_user():
    """Fixture to create a manager user."""
    # Assuming User.Role exists and has MANAGER / Предполагается, что User.Role существует и имеет MANAGER
    return UserModel.objects.create_user(username="manager_test", password="password", role=User.Role.MANAGER)

@pytest.fixture
def housekeeper_user():
    """Fixture to create a housekeeper user."""
    # Assuming User.Role exists and has HOUSEKEEPER / Предполагается, что User.Role существует и имеет HOUSEKEEPER
    return UserModel.objects.create_user(username="housekeeper_test", password="password", role=User.Role.HOUSEKEEPER)

@pytest.fixture
def room_type_standard():
    """Fixture to create a standard RoomType."""
    return RoomType.objects.create(name="Standard_Test", capacity=2)

@pytest.fixture
def room_instance(room_type_standard):
    """Fixture to create a Room instance."""
    # Creates a Room linked to the standard room type / Создает Room, связанный со стандартным типом номера
    return Room.objects.create(number=201, floor=2, room_type=room_type_standard)

@pytest.fixture
def zone_instance():
    """Fixture to create a Zone instance."""
    return Zone.objects.create(name="Lobby_Test", floor=1)

@pytest.fixture
def cleaning_type_instance():
    """Fixture to create a CleaningType instance."""
    return CleaningType.objects.create(name="Daily_Test")

@pytest.fixture
def checklist_template_instance(cleaning_type_instance):
    """Fixture to create a ChecklistTemplate instance."""
    # Creates a ChecklistTemplate linked to the cleaning type / Создает ChecklistTemplate, связанный с типом уборки
    return ChecklistTemplate.objects.create(name="Room Cleaning Template_Test", cleaning_type=cleaning_type_instance, description="Standard room cleaning items")

@pytest.fixture
def checklist_item_template_instance(checklist_template_instance):
    """Fixture to create a ChecklistItemTemplate instance."""
    # Creates a ChecklistItemTemplate linked to the checklist template / Создает ChecklistItemTemplate, связанный с шаблоном чек-листа
    return ChecklistItemTemplate.objects.create(
        checklist_template=checklist_template_instance,
        text="Vacuum floor_Test",
        order=1
    )

@pytest.fixture
def booking_instance(room_instance):
    """Fixture to create a Booking instance."""
    # Assuming Booking accepts room and check_in / Предполагается, что Booking принимает room и check_in
    # Check-in time is set to a future time / Время заезда устанавливается на будущее
    future_check_in = timezone.now() + timezone.timedelta(hours=2)
    return Booking.objects.create(room=room_instance, check_in=future_check_in)

@pytest.fixture
def cleaning_task_instance(room_instance, cleaning_type_instance, housekeeper_user):
    """Fixture to create a CleaningTask instance."""
    # Creates a CleaningTask with minimal required fields and some relations
    # Создает CleaningTask с минимально необходимыми полями и некоторыми связями
    return CleaningTask.objects.create(
        room=room_instance,
        cleaning_type=cleaning_type_instance,
        status=CleaningTask.Status.ASSIGNED,
        assigned_to=housekeeper_user,
        scheduled_date=date.today(),
        due_time=timezone.now() + timezone.timedelta(hours=1)
    )


# --- CleaningType Model Tests ---
# Тесты для модели CleaningType
# Tests for the CleaningType model

@pytest.mark.django_db # Mark test to use the database / Отмечаем тест для использования базы данных
def test_cleaningtype_creation():
    """
    Test that a CleaningType object can be created.
    Тест, что объект CleaningType может быть создан.
    """
    # Create a CleaningType instance / Создаем экземпляр CleaningType
    cleaning_type = CleaningType.objects.create(name="Test Cleaning Type")

    # Assert that the object was created and has the correct attributes
    # Проверяем, что объект был создан и имеет корректные атрибуты
    assert cleaning_type.pk is not None # Check if a primary key was assigned / Проверяем, был ли присвоен первичный ключ
    assert cleaning_type.name == "Test Cleaning Type"
    assert CleaningType.objects.count() == 1 # Check if one object exists in the database / Проверяем, существует ли один объект в базе данных


@pytest.mark.django_db
def test_cleaningtype_unique_name():
    """
    Test that creating a CleaningType with a duplicate name raises IntegrityError.
    Тест, что создание CleaningType с дублирующимся именем вызывает IntegrityError.
    """
    # Create the first instance / Создаем первый экземпляр
    CleaningType.objects.create(name="Unique Name")

    # Attempt to create a second instance with the same name and assert that it raises IntegrityError
    # Пытаемся создать второй экземпляр с тем же именем и проверяем, что это вызывает IntegrityError
    with pytest.raises(IntegrityError):
        CleaningType.objects.create(name="Unique Name")

    # Removed the assertion about object count here, as it causes TransactionManagementError after IntegrityError
    # Удалено утверждение о количестве объектов здесь, так как оно вызывает TransactionManagementError после IntegrityError


@pytest.mark.django_db
def test_cleaningtype_str_representation():
    """
    Test the __str__ method of the CleaningType model.
    Тест метода __str__ модели CleaningType.
    """
    cleaning_type = CleaningType.objects.create(name="Test Type Str")
    # Assert that the string representation is the name of the cleaning type
    # Проверяем, что строковое представление является именем типа уборки
    assert str(cleaning_type) == "Test Type Str"


# --- ChecklistTemplate Model Tests ---
# Тесты для модели ChecklistTemplate
# Tests for the ChecklistTemplate model

@pytest.mark.django_db
def test_checklisttemplate_creation(cleaning_type_instance):
    """
    Test that a ChecklistTemplate object can be created.
    Тест, что объект ChecklistTemplate может быть создан.
    """
    # Create a ChecklistTemplate instance linked to a CleaningType
    # Создаем экземпляр ChecklistTemplate, связанный с CleaningType
    checklist_template = ChecklistTemplate.objects.create(
        name="Test Checklist Template",
        cleaning_type=cleaning_type_instance,
        description="A test template"
    )

    # Assert that the object was created and has correct attributes and relationship
    # Проверяем, что объект был создан и имеет корректные атрибуты и связь
    assert checklist_template.pk is not None
    assert checklist_template.name == "Test Checklist Template"
    assert checklist_template.cleaning_type == cleaning_type_instance
    assert checklist_template.description == "A test template"
    assert ChecklistTemplate.objects.count() == 1


@pytest.mark.django_db
def test_checklisttemplate_unique_name():
    """
    Test that creating a ChecklistTemplate with a duplicate name raises IntegrityError.
    Тест, что создание ChecklistTemplate с дублирующимся именем вызывает IntegrityError.
    """
    # Need a CleaningType instance for the foreign key
    # Нужен экземпляр CleaningType для внешнего ключа
    cleaning_type = CleaningType.objects.create(name="For Template Uniqueness")

    # Create the first instance / Создаем первый экземпляр
    ChecklistTemplate.objects.create(name="Unique Template Name", cleaning_type=cleaning_type)

    # Attempt to create a second instance with the same name and assert IntegrityError
    # Пытаемся создать второй экземпляр с тем же именем и проверяем IntegrityError
    with pytest.raises(IntegrityError):
        ChecklistTemplate.objects.create(name="Unique Template Name", cleaning_type=cleaning_type)

    # Removed the assertion about object count here / Удалено утверждение о количестве объектов здесь


@pytest.mark.django_db
def test_checklisttemplate_on_delete_cascade(cleaning_type_instance):
    """
    Test that deleting a CleaningType cascades and deletes related ChecklistTemplates.
    Тест, что удаление CleaningType каскадно удаляет связанные ChecklistTemplates.
    """
    # Create a ChecklistTemplate linked to the cleaning_type_instance
    # Создаем ChecklistTemplate, связанный с cleaning_type_instance
    ChecklistTemplate.objects.create(name="Template to be deleted", cleaning_type=cleaning_type_instance)
    assert ChecklistTemplate.objects.count() == 1

    # Delete the related CleaningType instance
    # Удаляем связанный экземпляр CleaningType
    cleaning_type_instance.delete()

    # Assert that the ChecklistTemplate was also deleted
    # Проверяем, что ChecklistTemplate также был удален
    assert ChecklistTemplate.objects.count() == 0


@pytest.mark.django_db
def test_checklisttemplate_str_representation(checklist_template_instance):
    """
    Test the __str__ method of the ChecklistTemplate model.
    Тест метода __str__ модели ChecklistTemplate.
    """
    # Assert that the string representation is the name of the template
    # Проверяем, что строковое представление является именем шаблона
    assert str(checklist_template_instance) == checklist_template_instance.name


# --- ChecklistItemTemplate Model Tests ---
# Тесты для модели ChecklistItemTemplate
# Tests for the ChecklistItemTemplate model

@pytest.mark.django_db
def test_checklistitemtemplate_creation(checklist_template_instance):
    """
    Test that a ChecklistItemTemplate object can be created.
    Тест, что объект ChecklistItemTemplate может быть создан.
    """
    # Create a ChecklistItemTemplate instance linked to a ChecklistTemplate
    # Создаем экземпляр ChecklistItemTemplate, связанный с ChecklistTemplate
    checklist_item = ChecklistItemTemplate.objects.create(
        checklist_template=checklist_template_instance,
        text="Test Item Text",
        order=5
    )

    # Assert that the object was created and has correct attributes and relationship
    # Проверяем, что объект был создан и имеет корректные атрибуты и связь
    assert checklist_item.pk is not None
    assert checklist_item.checklist_template == checklist_template_instance
    assert checklist_item.text == "Test Item Text"
    assert checklist_item.order == 5
    assert ChecklistItemTemplate.objects.count() == 1


@pytest.mark.django_db
def test_checklistitemtemplate_default_order(checklist_template_instance):
    """
    Test that the 'order' field defaults to 0 if not provided.
    Тест, что поле 'order' по умолчанию равно 0, если не предоставлено.
    """
    # Create a ChecklistItemTemplate without providing the 'order'
    # Создаем ChecklistItemTemplate, не предоставляя поле 'order'
    checklist_item = ChecklistItemTemplate.objects.create(
        checklist_template=checklist_template_instance,
        text="Item with default order"
        # order is omitted / order пропущено
    )

    # Assert that the 'order' field was set to the default value
    # Проверяем, что поле 'order' было установлено в значение по умолчанию
    assert checklist_item.order == 0


@pytest.mark.django_db
def test_checklistitemtemplate_unique_together(checklist_template_instance):
    """
    Test that creating a ChecklistItemTemplate with a duplicate (checklist_template, order)
    combination raises IntegrityError.
    Тест, что создание ChecklistItemTemplate с дублирующейся комбинацией (checklist_template, order)
    вызывает IntegrityError.
    """
    # Create the first item with a specific template and order
    # Создаем первый пункт с определенным шаблоном и порядком
    ChecklistItemTemplate.objects.create(
        checklist_template=checklist_template_instance,
        text="First item",
        order=10
    )

    # Attempt to create a second item with the same template and order
    # Пытаемся создать второй пункт с тем же именем и порядком
    with pytest.raises(IntegrityError):
        ChecklistItemTemplate.objects.create(
            checklist_template=checklist_template_instance,
            text="Second item",
            order=10 # Duplicate order for the same template / Дублирующийся порядок для того же шаблона
        )

    # Removed subsequent database operations that caused TransactionManagementError
    # Удалены последующие операции с базой данных, которые вызывали TransactionManagementError


@pytest.mark.django_db
def test_checklistitemtemplate_on_delete_cascade(checklist_template_instance):
    """
    Test that deleting a ChecklistTemplate cascades and deletes related ChecklistItemTemplates.
    Тест, что удаление ChecklistTemplate каскадно удаляет связанные ChecklistItemTemplates.
    """
    # Create items linked to the checklist_template_instance
    # Создаем пункты, связанные с checklist_template_instance
    ChecklistItemTemplate.objects.create(checklist_template=checklist_template_instance, text="Item 1", order=1)
    ChecklistItemTemplate.objects.create(checklist_template=checklist_template_instance, text="Item 2", order=2)
    assert ChecklistItemTemplate.objects.count() == 2

    # Delete the related ChecklistTemplate instance
    # Удаляем связанный экземпляр ChecklistTemplate
    checklist_template_instance.delete()

    # Assert that the ChecklistItemTemplates were also deleted
    # Проверяем, что ChecklistItemTemplates также были удалены
    assert ChecklistItemTemplate.objects.count() == 0


@pytest.mark.django_db
def test_checklistitemtemplate_str_representation(checklist_item_template_instance):
    """
    Test the __str__ method of the ChecklistItemTemplate model.
    Тест метода __str__ модели ChecklistItemTemplate.
    """
    # Assert that the string representation is the text of the item
    # Проверяем, что строковое представление является текстом пункта
    assert str(checklist_item_template_instance) == checklist_item_template_instance.text


# --- CleaningTask Model Tests ---
# Тесты для модели CleaningTask
# Tests for the CleaningTask model

@pytest.mark.django_db
def test_cleaningtask_creation_room(room_instance, cleaning_type_instance, housekeeper_user, manager_user):
    """
    Test that a CleaningTask object can be created for a Room.
    Тест, что объект CleaningTask может быть создан для Комнаты.
    """
    # Use a specific scheduled date and due time for testing
    # Используем конкретную запланированную дату и срок выполнения для тестирования
    scheduled = date(2025, 7, 1)
    due = datetime(2025, 7, 1, 10, 0, tzinfo=timezone.get_current_timezone())

    # Create a CleaningTask instance for a room
    # Создаем экземпляр CleaningTask для комнаты
    task = CleaningTask.objects.create(
        assigned_to=housekeeper_user,
        assigned_by=manager_user,
        room=room_instance, # Assign to a room / Назначаем комнате
        cleaning_type=cleaning_type_instance,
        status=CleaningTask.Status.ASSIGNED,
        scheduled_date=scheduled,
        due_time=due,
        notes="Clean room before check-in"
    )

    # Assert that the object was created and has correct attributes and relationships
    # Проверяем, что объект был создан и имеет корректные атрибуты и связи
    assert task.pk is not None
    assert task.assigned_to == housekeeper_user
    assert task.assigned_by == manager_user
    assert task.room == room_instance
    assert task.zone is None # Should be None as it's a room task / Должно быть None, так как это задача для комнаты
    assert task.booking is None # Assuming no booking is linked initially / Предполагается, что бронирование изначально не связано
    assert task.cleaning_type == cleaning_type_instance
    assert task.status == CleaningTask.Status.ASSIGNED
    assert task.scheduled_date == scheduled
    assert task.due_time == due
    assert task.notes == "Clean room before check-in"
    assert task.assigned_at is None # Timestamps are initially None / Временные метки изначально None
    assert task.started_at is None
    assert task.completed_at is None
    assert task.checked_at is None
    assert task.checked_by is None
    assert CleaningTask.objects.count() == 1


@pytest.mark.django_db
def test_cleaningtask_creation_zone(zone_instance, cleaning_type_instance, housekeeper_user):
    """
    Test that a CleaningTask object can be created for a Zone.
    Тест, что объект CleaningTask может быть создан для Зоны.
    """
    scheduled = date(2025, 7, 2)
    due = datetime(2025, 7, 2, 11, 30, tzinfo=timezone.get_current_timezone())

    # Create a CleaningTask instance for a zone
    # Создаем экземпляр CleaningTask для зоны
    task = CleaningTask.objects.create(
        assigned_to=housekeeper_user,
        zone=zone_instance, # Assign to a zone / Назначаем зоне
        cleaning_type=cleaning_type_instance,
        status=CleaningTask.Status.IN_PROGRESS,
        scheduled_date=scheduled,
        due_time=due,
        notes="Clean lobby area"
    )

    # Assert that the object was created and has correct attributes and relationships
    # Проверяем, что объект был создан и имеет корректные атрибуты и связи
    assert task.pk is not None
    assert task.assigned_to == housekeeper_user
    assert task.assigned_by is None # Assuming assigned_by is nullable / Предполагается, что assigned_by допускает NULL
    assert task.room is None # Should be None as it's a zone task / Должно быть None, так как это задача для зоны
    assert task.zone == zone_instance
    assert task.booking is None
    assert task.cleaning_type == cleaning_type_instance
    assert task.status == CleaningTask.Status.IN_PROGRESS
    assert task.scheduled_date == scheduled
    assert task.due_time == due
    assert task.notes == "Clean lobby area"
    assert CleaningTask.objects.count() == 1


@pytest.mark.django_db
def test_cleaningtask_status_choices(room_instance, cleaning_type_instance):
    """
    Test that the 'status' field correctly uses TextChoices and raises ValidationError for invalid choices.
    Тест, что поле 'status' корректно использует TextChoices и вызывает ValidationError для недопустимых вариантов.
    """
    # Get the choices from the model / Получаем варианты из модели
    status_choices = CleaningTask.Status.choices

    # Assert that the choices are as expected
    # Проверяем, что варианты соответствуют ожиданиям
    expected_choices = [
        ("unassigned", "Не назначен"),
        ("assigned", "Назначен"),
        ("in_progress", "В процессе уборки"),
        ("completed", "Уборка завершена"),
        ("waiting_check", "Ожидает проверки"),
        ("checked", "Проверено"),
        ("canceled", "Отменена"),
    ]
    assert list(status_choices) == expected_choices

    # Attempt to create a task instance with an invalid status and call full_clean()
    # Пытаемся создать экземпляр задачи с недопустимым статусом и вызываем full_clean()
    task = CleaningTask(
        room=room_instance, # Need a room or zone to pass clean() validation / Нужна комната или зона для прохождения валидации clean()
        cleaning_type=cleaning_type_instance,
        status="invalid_status", # Invalid status value / Недопустимое значение статуса
        scheduled_date=date.today(),
        due_time=timezone.now()
    )

    # Call full_clean() and assert that it raises ValidationError
    # Вызываем full_clean() и проверяем, что это вызывает ValidationError
    with pytest.raises(DjangoValidationError) as excinfo:
        task.full_clean() # Use full_clean() to trigger field validation / Используем full_clean() для запуска валидации поля

    # Check that the error is related to the 'status' field
    # Проверяем, что ошибка связана с полем 'status'
    assert 'status' in excinfo.value.message_dict
    # The exact error message might vary slightly by Django version, check for a substring
    # Точное сообщение об ошибке может немного отличаться в разных версиях Django, проверяем подстроку
    assert 'Value \'invalid_status\' is not a valid choice.' in str(excinfo.value.message_dict['status'][0])


@pytest.mark.django_db
def test_cleaningtask_clean_room_and_zone_error(room_instance, zone_instance, cleaning_type_instance):
    """
    Test that the clean method raises ValidationError if both room and zone are provided.
    Тест, что метод clean вызывает ValidationError, если предоставлены одновременно room и zone.
    """
    # Create a task instance with both room and zone set
    # Создаем экземпляр задачи с установленными room и zone
    task = CleaningTask(
        room=room_instance,
        zone=zone_instance,
        cleaning_type=cleaning_type_instance,
        status=CleaningTask.Status.UNASSIGNED,
        scheduled_date=date.today(),
        due_time=timezone.now()
    )

    # Call the clean method and assert that it raises ValidationError
    # Вызываем метод clean и проверяем, что он вызывает ValidationError
    with pytest.raises(DjangoValidationError) as excinfo:
        task.clean()

    # Check the error message / Проверяем сообщение об ошибке
    assert "Задача не может быть одновременно для комнаты и для зоны." in excinfo.value.messages


@pytest.mark.django_db
def test_cleaningtask_clean_room_or_zone_required_error(cleaning_type_instance):
    """
    Test that the clean method raises ValidationError if neither room nor zone is provided.
    Тест, что метод clean вызывает ValidationError, если не предоставлены ни room, ни zone.
    """
    # Create a task instance with neither room nor zone set
    # Создаем экземпляр задачи, у которой не установлены ни room, ни zone
    task = CleaningTask(
        room=None,
        zone=None,
        cleaning_type=cleaning_type_instance,
        status=CleaningTask.Status.UNASSIGNED,
        scheduled_date=date.today(),
        due_time=timezone.now()
    )

    # Call the clean method and assert that it raises ValidationError
    # Вызываем метод clean и проверяем, что он вызывает ValidationError
    with pytest.raises(DjangoValidationError) as excinfo:
        task.clean()

    # Check the error message / Проверяем сообщение об ошибке
    assert "Задача должна быть либо для комнаты, либо для зоны." in excinfo.value.messages


@pytest.mark.django_db
def test_cleaningtask_clean_due_time_date_mismatch(room_instance, cleaning_type_instance):
    """
    Test that the clean method raises ValidationError if due_time date does not match scheduled_date.
    Тест, что метод clean вызывает ValidationError, если дата в due_time не совпадает с scheduled_date.
    """
    scheduled = date(2025, 8, 1)
    # due_time is on a different date / due_time имеет другую дату
    due = datetime(2025, 8, 2, 10, 0, tzinfo=timezone.get_current_timezone())

    task = CleaningTask(
        room=room_instance,
        cleaning_type=cleaning_type_instance,
        status=CleaningTask.Status.UNASSIGNED,
        scheduled_date=scheduled,
        due_time=due
    )

    # Call the clean method and assert that it raises ValidationError
    # Вызываем метод clean и проверяем, что он вызывает ValidationError
    with pytest.raises(DjangoValidationError) as excinfo:
        task.clean()

    # Check the error message for the 'due_time' field
    # Проверяем сообщение об ошибке для поля 'due_time'
    assert 'due_time' in excinfo.value.message_dict
    assert "Дата в 'Срок выполнения' должна совпадать с 'Датой планирования уборки'." in excinfo.value.message_dict['due_time'][0]

    # Test that it passes validation if dates match
    # Тест, что валидация проходит, если даты совпадают
    task.due_time = datetime(2025, 8, 1, 10, 0, tzinfo=timezone.get_current_timezone())
    try:
        task.clean() # Should not raise error / Не должно вызвать ошибку
    except DjangoValidationError:
        pytest.fail("ValidationError raised unexpectedly when dates match.")


@pytest.mark.django_db
def test_cleaningtask_save_sets_due_time_from_booking(room_instance, cleaning_type_instance, booking_instance):
    """
    Test that the save method sets due_time and scheduled_date from booking.check_in
    if due_time is not initially set.
    Тест, что метод save устанавливает due_time и scheduled_date из booking.check_in,
    если due_time изначально не установлено.
    """
    # Create a task instance linked to a booking, without setting due_time or scheduled_date
    # Создаем экземпляр задачи, связанный с бронированием, не устанавливая due_time или scheduled_date
    task = CleaningTask(
        room=room_instance,
        cleaning_type=cleaning_type_instance,
        booking=booking_instance, # Link to booking / Связываем с бронированием
        status=CleaningTask.Status.UNASSIGNED,
        # due_time and scheduled_date are None
    )

    # Save the task / Сохраняем задачу
    task.save()

    # Refresh from DB to ensure values are persisted and retrieved correctly
    # Обновляем из БД, чтобы убедиться, что значения сохранены и получены корректно
    task.refresh_from_db()

    # Assert that due_time and scheduled_date were set from booking.check_in
    # Проверяем, что due_time и scheduled_date были установлены из booking.check_in
    assert task.due_time == booking_instance.check_in
    assert task.scheduled_date == booking_instance.check_in.date()


@pytest.mark.django_db
def test_cleaningtask_save_sets_default_due_time(room_instance, cleaning_type_instance):
    """
    Test that the save method sets a default due_time (14:00) on the scheduled date
    if neither due_time nor booking is set.
    Тест, что метод save устанавливает due_time по умолчанию (14:00) на запланированную дату,
    если не установлены ни due_time, ни booking.
    """
    scheduled = date(2025, 9, 1)

    # Create a task instance with scheduled_date but no due_time or booking
    # Создаем экземпляр задачи с scheduled_date, но без due_time или booking
    task = CleaningTask(
        room=room_instance,
        cleaning_type=cleaning_type_instance,
        status=CleaningTask.Status.UNASSIGNED,
        scheduled_date=scheduled,
        # due_time and booking are None
    )

    # Get today's date and 2:00 PM today for comparison
    # Получаем сегодняшнюю дату и 14:00 сегодня для сравнения
    # Using the scheduled date for comparison as per the test logic
    # Используем запланированную дату для сравнения согласно логике теста
    expected_due_time = datetime.combine(scheduled, time(14, 0), tzinfo=timezone.get_current_timezone())

    # Save the task / Сохраняем задачу
    task.save()

    # Refresh from DB / Обновляем из БД
    task.refresh_from_db()

    # Assert that due_time was set to 14:00 on the scheduled date
    # Проверяем, что due_time было установлено на 14:00 запланированной даты
    assert task.due_time.replace(microsecond=0) == expected_due_time.replace(microsecond=0)
    # Assert scheduled_date remained the same / Проверяем, что scheduled_date осталась прежней
    assert task.scheduled_date == scheduled


@pytest.mark.django_db
def test_cleaningtask_save_sets_default_scheduled_date_and_due_time(room_instance, cleaning_type_instance):
    """
    Test that the save method sets scheduled_date to today and due_time to 14:00 today
    if neither scheduled_date, due_time, nor booking is set.
    Тест, что метод save устанавливает scheduled_date на сегодня и due_time на 14:00 сегодня,
    если не установлены ни scheduled_date, ни due_time, ни booking.
    """
    # Create a task instance with no scheduled_date, due_time, or booking
    # Создаем экземпляр задачи без scheduled_date, due_time или booking
    task = CleaningTask(
        room=room_instance,
        cleaning_type=cleaning_type_instance,
        status=CleaningTask.Status.UNASSIGNED,
        # scheduled_date, due_time, and booking are None
    )

    # Get today's date and 2:00 PM today for comparison
    # Получаем сегодняшнюю дату и 14:00 сегодня для сравнения
    today = timezone.now().date()
    expected_due_time = datetime.combine(today, time(14, 0), tzinfo=timezone.get_current_timezone())

    # Save the task / Сохраняем задачу
    task.save()

    # Refresh from DB / Обновляем из БД
    task.refresh_from_db()

    # Assert that scheduled_date was set to today
    # Проверяем, что scheduled_date было установлено на сегодня
    assert task.scheduled_date == today
    # Assert that due_time was set to 14:00 today
    # Проверяем, что due_time было установлено на 14:00 сегодня
    assert task.due_time.replace(microsecond=0) == expected_due_time.replace(microsecond=0)


@pytest.mark.django_db
def test_cleaningtask_save_does_not_overwrite_existing_due_time(room_instance, cleaning_type_instance, booking_instance):
    """
    Test that the save method does NOT overwrite an existing due_time.
    Тест, что метод save НЕ перезаписывает существующее due_time.
    """
    scheduled = date(2025, 10, 1)
    # Set an explicit due_time / Устанавливаем явное due_time
    explicit_due_time = datetime(2025, 10, 1, 9, 0, tzinfo=timezone.get_current_timezone())

    # Create a task instance with an explicit due_time and a booking
    # Создаем экземпляр задачи с явным due_time и бронированием
    task = CleaningTask(
        room=room_instance,
        cleaning_type=cleaning_type_instance,
        booking=booking_instance, # Link to booking which has its own check_in time / Связываем с бронированием, у которого есть свое время заезда
        status=CleaningTask.Status.UNASSIGNED,
        scheduled_date=scheduled,
        due_time=explicit_due_time # Explicitly set due_time / Явно устанавливаем due_time
    )

    # Save the task / Сохраняем задачу
    task.save()

    # Refresh from DB / Обновляем из БД
    task.refresh_from_db()

    # Assert that the explicit due_time was NOT overwritten by the booking's check_in
    # Проверяем, что явное due_time НЕ было перезаписано временем заезда бронирования
    assert task.due_time == explicit_due_time
    # Assert scheduled_date was also not overwritten if it matched the explicit due_time's date
    # Проверяем, что scheduled_date также не было перезаписано, если оно совпадало с датой явного due_time
    assert task.scheduled_date == scheduled


@pytest.mark.django_db
def test_cleaningtask_on_delete_set_null(housekeeper_user, manager_user, room_instance, zone_instance, booking_instance, cleaning_type_instance):
    """
    Test that deleting related objects (User, Room, Zone, Booking, CleaningType)
    sets the corresponding ForeignKey fields to NULL.
    Тест, что удаление связанных объектов (User, Room, Zone, Booking, CleaningType)
    устанавливает соответствующие поля ForeignKey в NULL.
    """
    # Ensure the task has all nullable FKs set initially for this test
    # Убеждаемся, что у задачи изначально установлены все FK, допускающие NULL, для этого теста
    task = CleaningTask.objects.create(
        assigned_to=housekeeper_user,
        assigned_by=manager_user,
        room=room_instance,
        # zone=None, # Only one target allowed / Разрешена только одна цель
        booking=booking_instance,
        cleaning_type=cleaning_type_instance,
        status=CleaningTask.Status.ASSIGNED,
        scheduled_date=date.today(),
        due_time=timezone.now(),
        checked_by=manager_user # Assuming manager_user can also check / Предполагается, что manager_user также может проверять
    )
    task_pk = task.pk # Store PK before deletion / Сохраняем PK перед удалением

    # Delete related objects one by one and check the task
    # Удаляем связанные объекты по одному и проверяем задачу

    housekeeper_user.delete()
    task.refresh_from_db()
    assert task.assigned_to is None # Should be set to NULL / Должно быть установлено в NULL

    manager_user.delete() # This user was assigned_by and checked_by
    task.refresh_from_db()
    assert task.assigned_by is None # Should be set to NULL / Должно быть установлено в NULL
    assert task.checked_by is None # Should be set to NULL / Должно быть установлено в NULL

    # Delete the booking instance first to avoid ProtectedError when deleting the room
    # Сначала удаляем экземпляр бронирования, чтобы избежать ProtectedError при удалении комнаты
    booking_instance.delete()

    room_instance.delete()
    task.refresh_from_db()
    assert task.room is None # Should be set to NULL / Должно быть установлено в NULL

    # Create a new task assigned to a zone for zone deletion test
    # Создаем новую задачу, назначенную зоне, для теста удаления зоны
    task_zone = CleaningTask.objects.create(
        zone=zone_instance,
        cleaning_type=cleaning_type_instance,
        status=CleaningTask.Status.UNASSIGNED,
        scheduled_date=date.today()
    )
    zone_instance.delete()
    task_zone.refresh_from_db()
    assert task_zone.zone is None # Should be set to NULL / Должно быть установлено в NULL


    # booking_instance was already deleted / booking_instance уже был удален

    cleaning_type_instance.delete()
    task.refresh_from_db()
    task_zone.refresh_from_db()
    assert task.cleaning_type is None # Should be set to NULL / Должно быть установлено в NULL
    assert task_zone.cleaning_type is None # Should be set to NULL / Должно быть установлено в NULL


    # Ensure the task object itself still exists (it's not deleted, only FKs are nulled)
    # Убеждаемся, что сам объект задачи все еще существует (он не удален, только FK обнулены)
    assert CleaningTask.objects.filter(pk=task_pk).exists()


@pytest.mark.django_db
def test_cleaningtask_str_representation(cleaning_task_instance, zone_instance, cleaning_type_instance):
    """
    Test the __str__ method of the CleaningTask model with different scenarios.
    Тест метода __str__ модели CleaningTask в различных сценариях.
    """
    # Scenario 1: Task for a room, assigned to a user with username
    # Сценарий 1: Задача для комнаты, назначенная пользователю с именем пользователя
    # cleaning_task_instance fixture provides this
    # Фикстура cleaning_task_instance предоставляет этот сценарий
    expected_str_room_assigned = f'Задача: Комната {cleaning_task_instance.room.number} ({cleaning_task_instance.get_status_display()}) - Назначена: {cleaning_task_instance.assigned_to.username}'
    assert str(cleaning_task_instance) == expected_str_room_assigned

    # Scenario 2: Task for a zone, assigned to a user with full name
    # Сценарий 2: Задача для зоны, назначенная пользователю с полным именем
    user_with_full_name = UserModel.objects.create_user(username="fullnametest", password="p", first_name="John", last_name="Doe", role=User.Role.HOUSEKEEPER)
    task_zone_assigned = CleaningTask.objects.create(
        zone=zone_instance,
        cleaning_type=cleaning_type_instance, # Correctly using the fixture instance / Корректно используем экземпляр фикстуры
        status=CleaningTask.Status.WAITING_CHECK,
        assigned_to=user_with_full_name,
        scheduled_date=date.today()
    )
    expected_str_zone_assigned_fullname = f'Задача: Зона {zone_instance.name} ({task_zone_assigned.get_status_display()}) - Назначена: {user_with_full_name.get_full_name()}'
    assert str(task_zone_assigned) == expected_str_zone_assigned_fullname


    # Scenario 3: Task for a room, unassigned
    # Сценарий 3: Задача для комнаты, не назначенная
    task_room_unassigned = CleaningTask.objects.create(
        room=cleaning_task_instance.room, # Use the same room instance / Используем тот же экземпляр комнаты
        cleaning_type=cleaning_type_instance, # Correctly using the fixture instance / Корректно используем экземпляр фикстуры
        status=CleaningTask.Status.UNASSIGNED,
        assigned_to=None, # Unassigned / Не назначена
        scheduled_date=date.today()
    )
    expected_str_room_unassigned = f'Задача: Комната {task_room_unassigned.room.number} ({task_room_unassigned.get_status_display()}) - Назначена: Не назначен'
    assert str(task_room_unassigned) == expected_str_room_unassigned

    # Scenario 4: Task for a zone, unassigned
    # Сценарий 4: Задача для зоны, не назначенная
    task_zone_unassigned = CleaningTask.objects.create(
        zone=zone_instance, # Use the same zone instance / Используем тот же экземпляр зоны
        cleaning_type=cleaning_type_instance, # Correctly using the fixture instance / Корректно используем экземпляр фикстуры
        status=CleaningTask.Status.CANCELED,
        assigned_to=None, # Unassigned / Не назначена
        scheduled_date=date.today()
    )
    expected_str_zone_unassigned = f'Задача: Зона {task_zone_unassigned.zone.name} ({task_zone_unassigned.get_status_display()}) - Назначена: Не назначен'
    assert str(task_zone_unassigned) == expected_str_zone_unassigned

    # Scenario 5: Task with no room or zone (should not happen due to clean, but test __str__ robustness)
    # Сценарий 5: Задача без комнаты или зоны (не должно происходить из-за clean, но тестируем надежность __str__)
    task_no_target = CleaningTask(
        room=None,
        zone=None,
        cleaning_type=cleaning_type_instance, # Correctly using the fixture instance / Корректно используем экземпляр фикстуры
        status=CleaningTask.Status.UNASSIGNED,
        assigned_to=None,
        scheduled_date=date.today()
    )
    # Note: This instance won't be saved due to clean() validation, but __str__ can still be called.
    # Примечание: Этот экземпляр не будет сохранен из-за валидации clean(), но __str__ все равно может быть вызван.
    expected_str_no_target = f'Задача: Неизвестное место ({task_no_target.get_status_display()}) - Назначена: Не назначен'
    assert str(task_no_target) == expected_str_no_target
