import pytest
from django.core.exceptions import ValidationError as DjangoValidationError # Import Django's ValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError # Import DRF's ValidationError for serializer tests
from django.db import IntegrityError # Used for testing unique constraints
from django.contrib.auth import get_user_model # To get the custom User model
from django.utils import timezone # For testing datetime fields
from datetime import datetime, time, date # For constructing datetime/date objects

# Import models from the cleaning app
from cleaning.models import CleaningType, ChecklistTemplate, ChecklistItemTemplate, CleaningTask

# Import models from other apps that cleaning models depend on
# Assuming these are in hotel.models and booking.models
from hotel.models import Room, Zone, RoomType # Import RoomType for Room fixture
from booking.models import Booking # Import the real Booking model
from users.models import User

# Import the serializers from the cleaning app
from cleaning.serializers import (
    CleaningTypeSerializer,
    ChecklistTemplateSerializer,
    ChecklistItemTemplateSerializer,
    CleaningTaskSerializer
)

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
    return UserModel.objects.create_user(username="manager", password="password", role=User.Role.MANAGER)

@pytest.fixture
def housekeeper_user():
    """Fixture to create a housekeeper user."""
    # Assuming User.Role exists and has HOUSEKEEPER / Предполагается, что User.Role существует и имеет HOUSEKEEPER
    return UserModel.objects.create_user(username="housekeeper", password="password", role=User.Role.HOUSEKEEPER)

@pytest.fixture
def room_type_standard():
    """Fixture to create a standard RoomType."""
    return RoomType.objects.create(name="Standard", capacity=2)

@pytest.fixture
def room_instance(room_type_standard):
    """Fixture to create a Room instance."""
    # Creates a Room linked to the standard room type / Создает Room, связанный со стандартным типом номера
    return Room.objects.create(number=101, floor=1, room_type=room_type_standard)

@pytest.fixture
def zone_instance():
    """Fixture to create a Zone instance."""
    return Zone.objects.create(name="Lobby", floor=1)

@pytest.fixture
def cleaning_type_instance():
    """Fixture to create a CleaningType instance."""
    return CleaningType.objects.create(name="Daily")

@pytest.fixture
def checklist_template_instance(cleaning_type_instance):
    """Fixture to create a ChecklistTemplate instance."""
    # Creates a ChecklistTemplate linked to the cleaning type / Создает ChecklistTemplate, связанный с типом уборки
    return ChecklistTemplate.objects.create(name="Room Cleaning", cleaning_type=cleaning_type_instance)

@pytest.fixture
def checklist_item_template_instance(checklist_template_instance):
    """Fixture to create a ChecklistItemTemplate instance."""
    # Creates a ChecklistItemTemplate linked to the checklist template / Создает ChecklistItemTemplate, связанный с шаблоном чек-листа
    return ChecklistItemTemplate.objects.create(
        checklist_template=checklist_template_instance,
        text="Vacuum floor",
        order=1
    )

@pytest.fixture
def booking_instance(room_instance):
    """Fixture to create a Booking instance."""
    # Assuming Booking accepts room and check_in / Предполагается, что Booking принимает room и check_in
    # Check-in time is set to a future time / Время заезда устанавливается на будущее
    return Booking.objects.create(room=room_instance, check_in=timezone.now() + timezone.timedelta(hours=2))

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


# --- CleaningType Serializer Tests ---
# Тесты для сериализатора CleaningType
# Tests for the CleaningType serializer

@pytest.mark.django_db # Mark test to use the database / Отмечаем тест для использования базы данных
def test_cleaningtype_serializer_output(cleaning_type_instance):
    """
    Test that CleaningTypeSerializer correctly serializes a CleaningType object.
    Тест, что CleaningTypeSerializer корректно сериализует объект CleaningType.
    """
    # Instantiate the serializer with the instance / Создаем экземпляр сериализатора с объектом
    serializer = CleaningTypeSerializer(instance=cleaning_type_instance)
    # Get the serialized data (Python dictionary) / Получаем сериализованные данные (словарь Python)
    data = serializer.data

    # Assert that the output data matches the instance data / Проверяем, что выходные данные соответствуют данным объекта
    assert data['id'] == cleaning_type_instance.id
    assert data['name'] == cleaning_type_instance.name
    # Removed assertion for 'description' as it's not in the RoomTypeSerializer fields
    # Удалено утверждение для 'description', так как оно не включено в поля RoomTypeSerializer


@pytest.mark.django_db
def test_cleaningtype_serializer_valid_input_create():
    """
    Test that CleaningTypeSerializer validates and creates a CleaningType object
    with valid input data.
    Тест, что CleaningTypeSerializer валидирует и создает объект CleaningType
    с корректными входными данными.
    """
    # Valid input data for creating a CleaningType / Корректные входные данные для создания CleaningType
    input_data = {
        "name": "Weekly",
        # Removed 'description' from input data as per serializer definition
        # Удалено 'description' из входных данных в соответствии с определением сериализатора
    }
    # Instantiate the serializer with the data / Создаем экземпляр сериализатора с данными
    serializer = CleaningTypeSerializer(data=input_data)
    # Assert that the data is valid and raise exception on failure for detailed errors
    # Проверяем, что данные корректны, и генерируем исключение при сбое для детальных ошибок
    assert serializer.is_valid(raise_exception=True)
    # Save the validated data to create a new object / Сохраняем валидированные данные для создания нового объекта
    instance = serializer.save()

    # Assert that an object was created in the database / Проверяем, что объект был создан в базе данных
    assert CleaningType.objects.count() == 1
    # Assert the created instance attributes match the input data / Проверяем, что атрибуты созданного объекта соответствуют входным данным
    assert instance.name == "Weekly"
    # Removed assertion for description on the instance as it's not set by this serializer
    # Удалено утверждение для description на объекте, так как оно не устанавливается этим сериализатором


@pytest.mark.django_db
def test_cleaningtype_serializer_missing_name():
    """
    Test that CleaningTypeSerializer fails validation if 'name' is missing.
    'name' is a required field in the model and serializer.
    Тест, что CleaningTypeSerializer завершает валидацию с ошибкой, если отсутствует поле 'name'.
    'name' является обязательным полем в модели и сериализаторе.
    """
    # Input data missing the 'name' field / Входные данные, в которых отсутствует поле 'name'
    input_data = {} # 'name' is the only required field now / 'name' теперь единственное обязательное поле
    serializer = CleaningTypeSerializer(data=input_data)
    # Assert that the data is NOT valid / Проверяем, что данные НЕ корректны
    assert not serializer.is_valid()
    # Assert that the expected error is present for the missing field
    # Проверяем, что ожидаемая ошибка присутствует для отсутствующего поля
    assert 'name' in serializer.errors


@pytest.mark.django_db
def test_cleaningtype_serializer_duplicate_name():
    """
    Test that CleaningTypeSerializer fails validation for a duplicate unique name.
    The 'name' field in the model has unique=True.
    Тест, что CleaningTypeSerializer завершает валидацию с ошибкой при дублировании уникального имени.
    Поле 'name' в модели имеет ограничение unique=True.
    """
    # Create an existing CleaningType with a specific name in the database
    # Создаем существующий объект CleaningType с определенным именем в базе данных
    CleaningType.objects.create(name="Existing Type")
    # Input data with the same unique name / Входные данные с тем же уникальным именем
    input_data = {"name": "Existing Type"}
    serializer = CleaningTypeSerializer(data=input_data)
    # Assert that the data is NOT valid / Проверяем, что данные НЕ корректны
    assert not serializer.is_valid()
    # Assert that the expected error is present for the duplicate field
    # Проверяем, что ожидаемая ошибка присутствует для дублирующегося поля
    assert 'name' in serializer.errors


# --- ChecklistTemplate Serializer Tests ---
# Тесты для сериализатора ChecklistTemplate
# Tests for the ChecklistTemplate serializer

@pytest.mark.django_db
def test_checklisttemplate_serializer_output(checklist_template_instance, cleaning_type_instance):
    """
    Test that ChecklistTemplateSerializer correctly serializes a ChecklistTemplate object.
    Includes the related cleaning_type ID and the cleaning_type_name from source.
    Тест, что ChecklistTemplateSerializer корректно сериализует объект ChecklistTemplate.
    Включает ID связанного cleaning_type и cleaning_type_name из source.
    """
    serializer = ChecklistTemplateSerializer(instance=checklist_template_instance)
    data = serializer.data

    assert data['id'] == checklist_template_instance.id
    assert data['name'] == checklist_template_instance.name
    # ForeignKey fields are serialized to their primary key by default
    # Поля ForeignKey по умолчанию сериализуются в их первичный ключ
    assert data['cleaning_type'] == cleaning_type_instance.id
    # Check the SerializerMethodField 'cleaning_type_name' that uses source
    # Проверяем поле SerializerMethodField 'cleaning_type_name', которое использует source
    assert data['cleaning_type_name'] == cleaning_type_instance.name
    assert data['description'] == checklist_template_instance.description


@pytest.mark.django_db
def test_checklisttemplate_serializer_valid_input_create(cleaning_type_instance):
    """
    Test that ChecklistTemplateSerializer validates and creates a ChecklistTemplate object
    with valid input data, providing the cleaning_type by ID.
    Тест, что ChecklistTemplateSerializer валидирует и создает объект ChecklistTemplate
    с корректными входными данными, предоставляя cleaning_type по ID.
    """
    input_data = {
        "name": "Kitchen Checklist",
        "cleaning_type": cleaning_type_instance.id, # Provide ForeignKey by ID / Предоставляем ForeignKey по ID
        "description": "Items for kitchen cleaning"
    }
    serializer = ChecklistTemplateSerializer(data=input_data)
    assert serializer.is_valid(raise_exception=True)
    instance = serializer.save()

    assert ChecklistTemplate.objects.count() == 1
    assert instance.name == "Kitchen Checklist"
    assert instance.cleaning_type == cleaning_type_instance # Check that the ForeignKey relationship is correctly set / Проверяем, что связь ForeignKey установлена корректно
    assert instance.description == "Items for kitchen cleaning"


@pytest.mark.django_db
def test_checklisttemplate_serializer_missing_required_fields():
    """
    Test that ChecklistTemplateSerializer fails validation if required fields are missing.
    'name' and 'cleaning_type' are required fields in the model.
    Тест, что ChecklistTemplateSerializer завершает валидацию с ошибкой, если отсутствуют обязательные поля.
    'name' и 'cleaning_type' являются обязательными полями в модели.
    """
    # Input data missing 'name' / Входные данные, в которых отсутствует 'name'
    input_data_missing_name = {"cleaning_type": 1} # Provide a dummy ID for cleaning_type / Предоставляем фиктивный ID для cleaning_type
    serializer_missing_name = ChecklistTemplateSerializer(data=input_data_missing_name)
    assert not serializer_missing_name.is_valid()
    assert 'name' in serializer_missing_name.errors

    # Input data missing 'cleaning_type' / Входные данные, в которых отсутствует 'cleaning_type'
    input_data_missing_type = {"name": "Missing Type Checklist"}
    serializer_missing_type = ChecklistTemplateSerializer(data=input_data_missing_type)
    assert not serializer_missing_type.is_valid()
    assert 'cleaning_type' in serializer_missing_type.errors


@pytest.mark.django_db
def test_checklisttemplate_serializer_invalid_cleaning_type():
    """
    Test that ChecklistTemplateSerializer fails validation for an invalid cleaning_type ID.
    If the provided ID does not exist in the database, validation should fail.
    Тест, что ChecklistTemplateSerializer завершает валидацию с ошибкой при недопустимом ID cleaning_type.
    Если предоставленный ID не существует в базе данных, валидация должна завершиться с ошибкой.
    """
    input_data = {
        "name": "Invalid Type Checklist",
        "cleaning_type": 999, # Non-existent ID / Несуществующий ID
    }
    serializer = ChecklistTemplateSerializer(data=input_data)
    assert not serializer.is_valid()
    assert 'cleaning_type' in serializer.errors # Error should be on the foreign key field / Ошибка должна быть на поле внешнего ключа


@pytest.mark.django_db
def test_checklisttemplate_serializer_duplicate_name(cleaning_type_instance):
    """
    Test that ChecklistTemplateSerializer fails validation for a duplicate unique name.
    The 'name' field in the model has unique=True.
    Тест, что ChecklistTemplateSerializer завершает валидацию с ошибкой при дублировании уникального имени.
    Поле 'name' в модели имеет ограничение unique=True.
    """
    # Create an existing ChecklistTemplate with a specific name
    # Создаем существующий ChecklistTemplate с определенным именем
    ChecklistTemplate.objects.create(name="Existing Template", cleaning_type=cleaning_type_instance)
    # Input data with the same unique name / Входные данные с тем же уникальным именем
    input_data = {"name": "Existing Template", "cleaning_type": cleaning_type_instance.id}
    serializer = ChecklistTemplateSerializer(data=input_data)
    assert not serializer.is_valid()
    # Assert that the expected error is present for the duplicate field
    # Проверяем, что ожидаемая ошибка присутствует для дублирующегося поля
    assert 'name' in serializer.errors


# --- ChecklistItemTemplate Serializer Tests ---
# Тесты для сериализатора ChecklistItemTemplate
# Tests for the ChecklistItemTemplate serializer

@pytest.mark.django_db
def test_checklistitemtemplate_serializer_output(checklist_item_template_instance, checklist_template_instance):
    """
    Test that ChecklistItemTemplateSerializer correctly serializes a ChecklistItemTemplate object.
    Includes the related checklist_template ID.
    Тест, что ChecklistItemTemplateSerializer корректно сериализует объект ChecklistItemTemplate.
    Включает ID связанного checklist_template.
    """
    serializer = ChecklistItemTemplateSerializer(instance=checklist_item_template_instance)
    data = serializer.data

    assert data['id'] == checklist_item_template_instance.id
    # ForeignKey fields are serialized to their primary key by default
    # Поля ForeignKey по умолчанию сериализуются в их первичный ключ
    assert data['checklist_template'] == checklist_template_instance.id
    assert data['text'] == checklist_item_template_instance.text
    assert data['order'] == checklist_item_template_instance.order


@pytest.mark.django_db
def test_checklistitemtemplate_serializer_valid_input_create(checklist_template_instance):
    """
    Test that ChecklistItemTemplateSerializer validates and creates a ChecklistItemTemplate object
    with valid input data, providing the checklist_template by ID.
    Тест, что ChecklistItemTemplateSerializer валидирует и создает объект ChecklistItemTemplate
    с корректными входными данными, предоставляя checklist_template по ID.
    """
    input_data = {
        "checklist_template": checklist_template_instance.id, # Provide ForeignKey by ID / Предоставляем ForeignKey по ID
        "text": "Wipe surfaces",
        "order": 2
    }
    serializer = ChecklistItemTemplateSerializer(data=input_data)
    assert serializer.is_valid(raise_exception=True)
    instance = serializer.save()

    assert ChecklistItemTemplate.objects.count() == 1
    assert instance.checklist_template == checklist_template_instance # Check ForeignKey relationship / Проверяем связь ForeignKey
    assert instance.text == "Wipe surfaces"
    assert instance.order == 2


@pytest.mark.django_db
def test_checklistitemtemplate_serializer_default_order(checklist_template_instance):
    """
    Test that ChecklistItemTemplateSerializer sets default order if not provided.
    The 'order' field in the model has default=0.
    Тест, что ChecklistItemTemplateSerializer устанавливает порядок по умолчанию, если он не предоставлен.
    Поле 'order' в модели имеет default=0.
    """
    input_data = {
        "checklist_template": checklist_template_instance.id,
        "text": "Item with default order",
        # order is omitted / order пропущено
    }
    serializer = ChecklistItemTemplateSerializer(data=input_data)
    assert serializer.is_valid(raise_exception=True)
    instance = serializer.save()

    assert instance.order == 0 # Check against model default / Проверяем значение по умолчанию модели


@pytest.mark.django_db
def test_checklistitemtemplate_serializer_missing_required_fields():
    """
    Test that ChecklistItemTemplateSerializer fails validation if required fields are missing.
    'checklist_template' and 'text' are required fields in the model.
    Тест, что ChecklistItemTemplateSerializer завершает валидацию с ошибкой, если отсутствуют обязательные поля.
    'checklist_template' и 'text' являются обязательными полями в модели.
    """
    # Input data missing 'checklist_template' / Входные данные, в которых отсутствует 'checklist_template'
    input_data_missing_template = {"text": "Missing template item"}
    serializer_missing_template = ChecklistItemTemplateSerializer(data=input_data_missing_template)
    assert not serializer_missing_template.is_valid()
    assert 'checklist_template' in serializer_missing_template.errors

    # Input data missing 'text' / Входные данные, в которых отсутствует 'text'
    input_data_missing_text = {"checklist_template": 1} # Provide a dummy ID / Предоставляем фиктивный ID
    serializer_missing_text = ChecklistItemTemplateSerializer(data=input_data_missing_text)
    assert not serializer_missing_text.is_valid()
    assert 'text' in serializer_missing_text.errors


@pytest.mark.django_db
def test_checklistitemtemplate_serializer_invalid_checklist_template():
    """
    Test that ChecklistItemTemplateSerializer fails validation for an invalid checklist_template ID.
    If the provided ID does not exist, validation should fail.
    Тест, что ChecklistItemTemplateSerializer завершает валидацию с ошибкой при недопустимом ID checklist_template.
    Если предоставленный ID не существует, валидация должна завершиться с ошибкой.
    """
    input_data = {
        "checklist_template": 999, # Non-existent ID / Несуществующий ID
        "text": "Invalid template item",
    }
    serializer = ChecklistItemTemplateSerializer(data=input_data)
    assert not serializer.is_valid()
    assert 'checklist_template' in serializer.errors # Error should be on the foreign key field / Ошибка должна быть на поле внешнего ключа


@pytest.mark.django_db
def test_checklistitemtemplate_serializer_unique_together(checklist_template_instance):
    """
    Test that ChecklistItemTemplateSerializer fails validation for duplicate unique_together.
    The model has unique_together = (('checklist_template', 'order'),).
    Тест, что ChecklistItemTemplateSerializer завершает валидацию с ошибкой при дублировании уникальной комбинации полей.
    Модель имеет unique_together = (('checklist_template', 'order'),).
    """
    # Create an existing item with a specific template and order
    # Создаем существующий пункт с определенным шаблоном и порядком
    ChecklistItemTemplate.objects.create(
        checklist_template=checklist_template_instance,
        text="Existing item",
        order=1
    )
    # Attempt to create another item with the same template and order via serializer
    # Попытка создать другой пункт с тем же шаблоном и порядком через сериализатор
    input_data = {
        "checklist_template": checklist_template_instance.id,
        "text": "Another item",
        "order": 1,
    }
    serializer = ChecklistItemTemplateSerializer(data=input_data)
    assert not serializer.is_valid()
    # The error for unique_together is typically placed in non_field_errors by DRF
    # Ошибка для unique_together обычно помещается DRF в non_field_errors
    assert 'non_field_errors' in serializer.errors
    # Assert the expected English default error message for unique_together
    # Проверяем ожидаемое стандартное сообщение об ошибке на английском для unique_together
    expected_error_message = 'The fields checklist_template, order must make a unique set.'
    assert expected_error_message in serializer.errors['non_field_errors']


# --- CleaningTask Serializer Tests ---
# Тесты для сериализатора CleaningTask
# Tests for the CleaningTask serializer

@pytest.mark.django_db
def test_cleaningtask_serializer_output(cleaning_task_instance, room_instance, cleaning_type_instance, housekeeper_user):
    """
    Test that CleaningTaskSerializer correctly serializes a CleaningTask object.
    Includes related fields and method fields.
    Тест, что CleaningTaskSerializer корректно сериализует объект CleaningTask.
    Включает связанные поля и поля методов.
    """
    # Ensure the task instance has related objects for source fields to be non-None
    # Убеждаемся, что объект задачи имеет связанные объекты для полей source, чтобы они не были None
    cleaning_task_instance.assigned_by = UserModel.objects.create_user(username="creator", password="p", role=User.Role.MANAGER)
    cleaning_task_instance.checked_by = UserModel.objects.create_user(username="checker", password="p", role=User.Role.MANAGER)
    cleaning_task_instance.zone = Zone.objects.create(name="Test Zone")
    # Need a room for the booking instance / Нужна комната для объекта бронирования
    room_for_booking = Room.objects.create(number=999, floor=9)
    cleaning_task_instance.booking = Booking.objects.create(room=room_for_booking, check_in=timezone.now())
    # Set status to something with a display value / Устанавливаем статус с отображаемым значением
    cleaning_task_instance.status = CleaningTask.Status.WAITING_CHECK
    cleaning_task_instance.save() # Save changes to the instance / Сохраняем изменения в объекте

    serializer = CleaningTaskSerializer(instance=cleaning_task_instance)
    data = serializer.data

    assert data['id'] == cleaning_task_instance.id
    # Check ForeignKey fields are serialized to their primary key
    # Проверяем, что поля ForeignKey сериализуются в их первичный ключ
    assert data['assigned_to'] == housekeeper_user.id
    # Check SerializerMethodField for assigned_to_name
    # Проверяем SerializerMethodField для assigned_to_name
    assigned_to_name = housekeeper_user.get_full_name() or housekeeper_user.username
    assert data['assigned_to_name'] == assigned_to_name
    assert data['assigned_by'] == cleaning_task_instance.assigned_by.id
    # Check SerializerMethodField for assigned_by_name
    # Проверяем SerializerMethodField для assigned_by_name
    assigned_by_name = cleaning_task_instance.assigned_by.get_full_name() or cleaning_task_instance.assigned_by.username
    assert data['assigned_by_name'] == assigned_by_name
    assert data['room'] == room_instance.id
    # Check source field 'room_number' - it accesses room.number
    # Проверяем поле source 'room_number' - оно обращается к room.number
    assert data['room_number'] == str(room_instance.number) # Check source field / Проверяем поле source
    assert data['zone'] == cleaning_task_instance.zone.id
    assert data['zone_name'] == cleaning_task_instance.zone.name # Check source field / Проверяем поле source
    assert data['booking'] == cleaning_task_instance.booking.id
    assert data['cleaning_type'] == cleaning_type_instance.id
    assert data['cleaning_type_name'] == cleaning_type_instance.name # Check source field / Проверяем поле source
    assert data['status'] == CleaningTask.Status.WAITING_CHECK
    assert data['status_display'] == cleaning_task_instance.get_status_display() # Check method field / Проверяем поле метода
    # Dates are serialized as YYYY-MM-DD strings by default
    # Даты по умолчанию сериализуются как строки в формате YYYY-MM-DD
    assert data['scheduled_date'] == cleaning_task_instance.scheduled_date.strftime('%Y-%m-%d')
    # Datetimes are serialized as ISO 8601 strings by default
    # Datetimes по умолчанию сериализуются как строки в формате ISO 8601
    # Compare start of string up to seconds to avoid issues with microseconds
    # Сравниваем начало строки до секунд, чтобы избежать проблем с микросекундами
    assert data['due_time'].startswith(cleaning_task_instance.due_time.isoformat(timespec='seconds')[:19])
    assert data['assigned_at'] is None # Assuming these are None initially / Предполагается, что изначально они None
    assert data['started_at'] is None
    assert data['completed_at'] is None
    assert data['checked_at'] is None
    assert data['checked_by'] == cleaning_task_instance.checked_by.id
    # Check SerializerMethodField for checked_by_name
    # Проверяем SerializerMethodField для checked_by_name
    checked_by_name = cleaning_task_instance.checked_by.get_full_name() or cleaning_task_instance.checked_by.username
    assert data['checked_by_name'] == checked_by_name
    assert data['notes'] == cleaning_task_instance.notes

    # Check read_only_fields are in output / Проверяем, что поля read_only_fields присутствуют в выводе
    assert 'id' in data
    assert 'assigned_to_name' in data
    assert 'assigned_by_name' in data
    assert 'room_number' in data
    assert 'zone_name' in data
    assert 'cleaning_type_name' in data
    assert 'checked_by_name' in data
    assert 'status_display' in data
    assert 'assigned_at' in data
    assert 'started_at' in data
    assert 'completed_at' in data
    assert 'checked_at' in data


@pytest.mark.django_db
def test_cleaningtask_serializer_output_nullable_fields(cleaning_type_instance):
    """
    Test serialization when nullable fields (assigned_to, room, zone, booking, etc.) are None.
    Ensures SerializerMethodFields and source fields handle None gracefully.
    Тест сериализации, когда поля, допускающие NULL (assigned_to, room, zone, booking и т.д.), равны None.
    Проверяет, что SerializerMethodFields и поля source корректно обрабатывают None.
    """
    # Create a CleaningTask instance with many nullable fields set to None
    # Создаем экземпляр CleaningTask со многими полями, допускающими NULL, установленными в None
    task = CleaningTask.objects.create(
        cleaning_type=cleaning_type_instance, # cleaning_type is required by the model (not null=True)
        status=CleaningTask.Status.UNASSIGNED,
        scheduled_date=date.today(),
        # All nullable fields are None / Все поля, допускающие NULL, равны None
        assigned_to=None,
        assigned_by=None,
        room=None,
        zone=None,
        booking=None,
        notes=None,
        checked_by=None,
        assigned_at=None,
        started_at=None,
        completed_at=None,
        checked_at=None,
    )
    # The save method will set due_time and scheduled_date if not provided,
    # so we need to fetch the instance after save to get those values.
    # Метод save установит due_time и scheduled_date, если они не были предоставлены,
    # поэтому нам нужно получить экземпляр после сохранения, чтобы получить эти значения.
    task.refresh_from_db()

    serializer = CleaningTaskSerializer(instance=task)
    data = serializer.data

    # Assert that nullable fields are serialized as None
    # Проверяем, что поля, допускающие NULL, сериализуются как None
    assert data['assigned_to'] is None
    assert data['assigned_to_name'] is None # Should be None with SerializerMethodField / Должно быть None с SerializerMethodField
    assert data['assigned_by'] is None
    assert data['assigned_by_name'] is None # Should be None with SerializerMethodField / Должно быть None с SerializerMethodField
    assert data['room'] is None
    assert data['room_number'] is None # Source field should be None when the related object is None / Поле source должно быть None, когда связанный объект равен None
    assert data['zone'] is None
    assert data['zone_name'] is None # Source field should be None / Поле source должно быть None
    assert data['booking'] is None
    assert data['cleaning_type'] == cleaning_type_instance.id # cleaning_type is not null=True in model / cleaning_type не null=True в модели
    assert data['cleaning_type_name'] == cleaning_type_instance.name
    assert data['status'] == CleaningTask.Status.UNASSIGNED
    assert data['status_display'] == task.get_status_display()
    assert data['scheduled_date'] == task.scheduled_date.strftime('%Y-%m-%d')
    assert data['due_time'].startswith(task.due_time.isoformat(timespec='seconds')[:19])
    assert data['assigned_at'] is None
    assert data['started_at'] is None
    assert data['completed_at'] is None
    assert data['checked_at'] is None
    assert data['checked_by'] is None
    assert data['checked_by_name'] is None # Should be None with SerializerMethodField / Должно быть None с SerializerMethodField
    assert data['notes'] is None


@pytest.mark.django_db
def test_cleaningtask_serializer_valid_input_create(room_instance, cleaning_type_instance, housekeeper_user, manager_user, booking_instance):
    """
    Test that CleaningTaskSerializer validates and creates a CleaningTask object
    with valid input data, providing related objects by ID.
    Тест, что CleaningTaskSerializer валидирует и создает объект CleaningTask
    с корректными входными данными, предоставляя связанные объекты по ID.
    """
    # Use a specific scheduled date and due time for testing validation
    # Используем конкретную запланированную дату и срок выполнения для тестирования валидации
    scheduled = date(2025, 6, 1)
    due = datetime(2025, 6, 1, 16, 0, tzinfo=timezone.get_current_timezone())

    input_data = {
        "assigned_to": housekeeper_user.id, # Provide User by ID / Предоставляем User по ID
        "assigned_by": manager_user.id, # Provide User by ID / Предоставляем User по ID
        "room": room_instance.id, # Provide Room by ID / Предоставляем Room по ID
        # "zone": None, # Explicitly None or omit if not needed (model validation handles this)
        # "zone": None, # Явно None или опускаем, если не нужно (валидация модели обрабатывает это)
        "booking": booking_instance.id, # Provide Booking by ID / Предоставляем Booking по ID
        "cleaning_type": cleaning_type_instance.id, # Provide CleaningType by ID / Предоставляем CleaningType по ID
        "status": CleaningTask.Status.ASSIGNED, # Use TextChoices value / Используем значение из TextChoices
        "scheduled_date": scheduled.strftime('%Y-%m-%d'), # Dates as YYYY-MM-DD strings / Даты как строки YYYY-MM-DD
        "due_time": due.isoformat(), # Datetimes as ISO 8601 strings / Datetimes как строки ISO 8601
        "notes": "Task created via API",
        # Timestamp fields and checked_by are read-only in the serializer, should not be in input
        # Поля временных меток и checked_by являются read-only в сериализаторе, не должны быть во входных данных
        # "assigned_at": timezone.now().isoformat(), # Should be ignored / Должно быть проигнорировано
        # "checked_by": manager_user.id, # Should be ignored / Должно быть проигнорировано
    }

    serializer = CleaningTaskSerializer(data=input_data)
    # Using raise_exception=True will show detailed errors if validation fails
    # Использование raise_exception=True покажет детальные ошибки, если валидация завершится с ошибкой
    assert serializer.is_valid(raise_exception=True)
    instance = serializer.save()

    # Refresh the instance from the DB to get values set by model's save method (like default due_time if not provided)
    # Обновляем экземпляр из БД, чтобы получить значения, установленные методом save модели (например, due_time по умолчанию, если не предоставлено)
    instance.refresh_from_db()

    assert CleaningTask.objects.count() == 1
    assert instance.assigned_to == housekeeper_user
    assert instance.assigned_by == manager_user
    assert instance.room == room_instance
    assert instance.zone is None # Should be None as it wasn't provided / Должно быть None, так как не было предоставлено
    assert instance.booking == booking_instance
    assert instance.cleaning_type == cleaning_type_instance
    assert instance.status == CleaningTask.Status.ASSIGNED
    assert instance.scheduled_date == scheduled
    assert instance.due_time == due
    assert instance.notes == "Task created via API"
    # Check that read-only timestamp fields were NOT set by input data
    # Проверяем, что поля временных меток только для чтения НЕ были установлены входными данными
    assert instance.assigned_at is None
    assert instance.started_at is None
    assert instance.completed_at is None
    assert instance.checked_at is None
    assert instance.checked_by is None


@pytest.mark.django_db
def test_cleaningtask_serializer_valid_input_create_zone(zone_instance, cleaning_type_instance, housekeeper_user):
    """
    Test that CleaningTaskSerializer validates and creates a CleaningTask object
    for a Zone.
    Тест, что CleaningTaskSerializer валидирует и создает объект CleaningTask
    для Зоны.
    """
    scheduled = date(2025, 6, 2)
    # due_time will be set by the model's save method (14:00 on scheduled_date) if not provided
    # due_time будет установлено методом save модели (14:00 в scheduled_date), если не предоставлено

    input_data = {
        "assigned_to": housekeeper_user.id,
        # assigned_by is nullable, omitted
        "zone": zone_instance.id, # Provide Zone by ID / Предоставляем Zone по ID
        # room is nullable, omitted
        # booking is nullable, omitted
        "cleaning_type": cleaning_type_instance.id,
        "status": CleaningTask.Status.UNASSIGNED,
        "scheduled_date": scheduled.strftime('%Y-%m-%d'),
        "notes": "Zone task",
    }

    serializer = CleaningTaskSerializer(data=input_data)
    assert serializer.is_valid(raise_exception=True)
    instance = serializer.save()

    instance.refresh_from_db() # Refresh to get due_time set by save method / Обновляем для получения due_time, установленного методом save

    assert CleaningTask.objects.count() == 1
    assert instance.assigned_to == housekeeper_user
    assert instance.assigned_by is None
    assert instance.room is None
    assert instance.zone == zone_instance
    assert instance.booking is None
    assert instance.cleaning_type == cleaning_type_instance
    assert instance.status == CleaningTask.Status.UNASSIGNED
    assert instance.scheduled_date == scheduled
    # Check due_time was set by save method / Проверяем, что due_time было установлено методом save
    expected_due_time = datetime.combine(scheduled, time(14, 0), tzinfo=timezone.get_current_timezone())
    # Comparing datetimes requires careful handling of timezones and microseconds
    # Сравнение datetimes требует осторожного обращения с часовыми поясами и микросекундами
    # Check if the dates and times match, ignoring microseconds
    assert instance.due_time.replace(microsecond=0) == expected_due_time.replace(microsecond=0)
    assert instance.notes == "Zone task"


@pytest.mark.django_db
def test_cleaningtask_serializer_missing_required_fields(room_instance, cleaning_type_instance):
    """
    Test that CleaningTaskSerializer fails validation if required fields are missing.
    cleaning_type is required by the model (null=True, blank=True, but not default).
    Also need either room or zone (validated by model's clean).
    This test focuses on the room/zone requirement from the model's clean method.

    Тест, что CleaningTaskSerializer завершает валидацию с ошибкой, если отсутствуют обязательные поля.
    cleaning_type требуется моделью (null=True, blank=True, но без значения по умолчанию).
    Также требуется либо room, либо zone (валидируется методом clean модели).
    Этот тест фокусируется на требовании room/zone из метода clean модели.
    """
    # Missing room AND zone (will fail model's clean)
    # Need cleaning_type to reach the clean() validation, provide a valid ID
    # Отсутствуют room И zone (приведет к ошибке clean модели)
    # Требуется cleaning_type, чтобы достичь валидации clean(), предоставляем корректный ID
    input_data_missing_target = {
        "cleaning_type": cleaning_type_instance.id, # Provide a valid CleaningType ID / Предоставляем корректный ID CleaningType
        "status": CleaningTask.Status.UNASSIGNED,
        "scheduled_date": date.today().strftime('%Y-%m-%d'),
        # room and zone are missing/None / room и zone отсутствуют/равны None
    }
    serializer_missing_target = CleaningTaskSerializer(data=input_data_missing_target)
    assert not serializer_missing_target.is_valid()
    # Error should be a non_field_error from model's clean()
    # Ошибка должна быть non_field_error из метода clean() модели
    assert 'non_field_errors' in serializer_missing_target.errors
    assert "Задача должна быть либо для комнаты, либо для зоны." in serializer_missing_target.errors['non_field_errors']

    # Note: Testing missing cleaning_type is not explicitly needed here as it's nullable in the model,
    # but if it were required, you would add a test for that.
    # Примечание: Тестирование отсутствующего cleaning_type здесь явно не требуется, так как оно допускает NULL в модели,
    # но если бы оно было обязательным, вы бы добавили тест для этого.


@pytest.mark.django_db
def test_cleaningtask_serializer_invalid_status():
    """
    Test that CleaningTaskSerializer fails validation for an invalid status value.
    The 'status' field uses TextChoices for validation.
    Тест, что CleaningTaskSerializer завершает валидацию с ошибкой при недопустимом значении статуса.
    Поле 'status' использует TextChoices для валидации.
    """
    # Provide valid IDs for required fields to reach status validation
    # Предоставляем корректные ID для обязательных полей, чтобы достичь валидации статуса
    input_data = {
        "room": Room.objects.create(number=990, floor=9).id,
        "cleaning_type": CleaningType.objects.create(name="Temp Status Test").id,
        "status": "invalid_status", # Invalid status value / Недопустимое значение статуса
        "scheduled_date": date.today().strftime('%Y-%m-%d'),
    }
    serializer = CleaningTaskSerializer(data=input_data)
    assert not serializer.is_valid()
    assert 'status' in serializer.errors # Error should be on the status field / Ошибка должна быть на поле статуса


@pytest.mark.django_db
def test_cleaningtask_serializer_invalid_foreign_key_ids():
    """
    Test that CleaningTaskSerializer fails validation for non-existent Foreign Key IDs.
    If a provided ID for a related object does not exist, validation should fail.
    Тест, что CleaningTaskSerializer завершает валидацию с ошибкой при несуществующих ID внешних ключей.
    Если предоставленный ID для связанного объекта не существует, валидация должна завершиться с ошибкой.
    """
    input_data = {
        "assigned_to": 999, # Non-existent User ID / Несуществующий ID пользователя
        "assigned_by": 998, # Non-existent User ID / Несуществующий ID пользователя
        "room": 997, # Non-existent Room ID / Несуществующий ID комнаты
        "zone": 996, # Non-existent Zone ID / Несуществующий ID зоны
        "booking": 995, # Non-existent Booking ID / Несуществующий ID бронирования
        "cleaning_type": 994, # Non-existent CleaningType ID / Несуществующий ID типа уборки
        "checked_by": 993, # Non-existent User ID / Несуществующий ID пользователя
        "status": CleaningTask.Status.UNASSIGNED, # Valid status / Корректный статус
        "scheduled_date": date.today().strftime('%Y-%m-%d'), # Valid date / Корректная дата
    }
    serializer = CleaningTaskSerializer(data=input_data)
    assert not serializer.is_valid()
    # Check for errors on each invalid FK field / Проверяем наличие ошибок на каждом недопустимом поле FK
    assert 'assigned_to' in serializer.errors
    assert 'assigned_by' in serializer.errors
    assert 'room' in serializer.errors
    assert 'zone' in serializer.errors
    assert 'booking' in serializer.errors
    assert 'cleaning_type' in serializer.errors
    assert 'checked_by' in serializer.errors


@pytest.mark.django_db
def test_cleaningtask_serializer_room_and_zone_error(room_instance, zone_instance, cleaning_type_instance):
    """
    Test that CleaningTaskSerializer fails validation if both room and zone are provided
    (due to model's clean method).
    Тест, что CleaningTaskSerializer завершает валидацию с ошибкой, если предоставлены одновременно room и zone
    (из-за метода clean модели).
    """
    input_data = {
        "room": room_instance.id, # Provide Room ID / Предоставляем ID комнаты
        "zone": zone_instance.id, # Provide Zone ID / Предоставляем ID зоны
        "cleaning_type": cleaning_type_instance.id, # Provide CleaningType ID / Предоставляем ID типа уборки
        "status": CleaningTask.Status.UNASSIGNED,
        "scheduled_date": date.today().strftime('%Y-%m-%d'),
    }
    serializer = CleaningTaskSerializer(data=input_data)
    # Assert that validation fails / Проверяем, что валидация завершается с ошибкой
    assert not serializer.is_valid()
    # Error should be a non_field_error from model's clean()
    # Ошибка должна быть non_field_error из метода clean() модели
    assert 'non_field_errors' in serializer.errors
    assert "Задача не может быть одновременно для комнаты и для зоны." in serializer.errors['non_field_errors']


@pytest.mark.django_db
def test_cleaningtask_serializer_update(cleaning_task_instance, housekeeper_user, manager_user, zone_instance):
    """
    Test that CleaningTaskSerializer correctly updates an existing CleaningTask object.
    Тест, что CleaningTaskSerializer корректно обновляет существующий объект CleaningTask.
    """
    # Ensure the initial instance is saved (fixtures create, but save ensures PK is set)
    # Убеждаемся, что начальный экземпляр сохранен (фикстуры создают, но save гарантирует установку PK)
    cleaning_task_instance.save()
    initial_pk = cleaning_task_instance.pk

    # Update data (changing assigned_to, zone, status, notes)
    # Данные для обновления (изменение assigned_to, zone, status, notes)
    update_data = {
        "assigned_to": manager_user.id, # Change assigned_to to manager / Изменяем assigned_to на менеджера
        "zone": zone_instance.id, # Change target from room to zone / Изменяем цель с комнаты на зону
        "room": None, # Set room to None when changing to zone / Устанавливаем room в None при изменении на зону
        "status": CleaningTask.Status.IN_PROGRESS, # Change status / Изменяем статус
        "notes": "Updated task notes", # Update notes / Обновляем заметки
        # Read-only fields in input should be ignored by the serializer's update method
        # Поля только для чтения во входных данных должны быть проигнорированы методом update сериализатора
        "id": 999, # Should be ignored / Должно быть проигнорировано
        "assigned_to_name": "Ignored Name", # Should be ignored / Должно быть проигнорировано
        "status_display": "Ignored Display", # Should be ignored / Должно быть проигнорировано
        "started_at": timezone.now().isoformat(), # Should be ignored by serializer update / Должно быть проигнорировано методом update сериализатора
    }

    # Instantiate serializer with instance and update data
    # Создаем экземпляр сериализатора с объектом и данными для обновления
    serializer = CleaningTaskSerializer(instance=cleaning_task_instance, data=update_data, partial=True) # partial=True for PATCH / partial=True для PATCH запросов

    assert serializer.is_valid(raise_exception=True) # Assert data is valid / Проверяем, что данные корректны
    updated_task = serializer.save() # Save the validated data to update the object / Сохраняем валидированные данные для обновления объекта

    # Refresh the instance from DB to get the latest state after saving
    # Обновляем экземпляр из БД, чтобы получить последнее состояние после сохранения
    updated_task.refresh_from_db()

    # Assert the object was updated correctly
    # Проверяем, что объект был обновлен корректно
    assert updated_task.pk == initial_pk # Ensure it's the same object / Убеждаемся, что это тот же объект
    assert updated_task.assigned_to == manager_user
    assert updated_task.room is None # Should be set to None / Должно быть установлено в None
    assert updated_task.zone == zone_instance # Should be updated / Должно быть обновлено
    assert updated_task.status == CleaningTask.Status.IN_PROGRESS
    assert updated_task.notes == "Updated task notes"

    # Assert fields not in update_data or read-only were not changed by input data
    # Проверяем, что поля, отсутствующие в update_data или являющиеся read-only, не были изменены входными данными
    # assigned_by, cleaning_type, booking, scheduled_date, due_time should retain original values
    # assigned_by, cleaning_type, booking, scheduled_date, due_time должны сохранить исходные значения
    assert updated_task.assigned_by == cleaning_task_instance.assigned_by # Assuming assigned_by was set initially or is None / Предполагается, что assigned_by было установлено изначально или равно None
    assert updated_task.cleaning_type == cleaning_task_instance.cleaning_type
    assert updated_task.booking == cleaning_task_instance.booking
    assert updated_task.scheduled_date == cleaning_task_instance.scheduled_date
    assert updated_task.due_time == cleaning_task_instance.due_time

    # Assert read-only timestamp fields were NOT updated by input data
    # Проверяем, что поля временных меток только для чтения НЕ были обновлены входными данными
    assert updated_task.started_at is None # Should still be None as it's read-only and not set by model logic in this update / Должно остаться None, так как оно read-only и не устанавливается логикой модели в этом обновлении
