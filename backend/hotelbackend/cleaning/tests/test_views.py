import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, time, date
from cleaning.models import CleaningType, ChecklistTemplate, ChecklistItemTemplate, CleaningTask
from hotel.models import Room, Zone, RoomType
from booking.models import Booking
from users.models import User

# Get the custom User model
# Получаем пользовательскую модель User
UserModel = get_user_model()

# --- Fixtures ---
# Фикстуры для создания тестовых данных и клиентов API
# Fixtures for creating test data and API clients

@pytest.fixture
def api_client():
    """
    A Django REST Framework API client instance.
    Экземпляр клиента API Django REST Framework.
    """
    return APIClient()

@pytest.fixture
def create_user():
    """
    Fixture to create a user with a specific role.
    Фикстура для создания пользователя с определенной ролью.
    """
    def _create_user(username, password, role, **extra_fields):
        # Use create_user method to ensure password hashing
        # Используем метод create_user для обеспечения хеширования пароля
        return UserModel.objects.create_user(
            username=username,
            password=password,
            role=role,
            **extra_fields
        )
    return _create_user

@pytest.fixture
def manager_user(create_user):
    """
    Fixture to create and return a manager user.
    Фикстура для создания и возврата пользователя с ролью менеджера.
    """
    return create_user("manager_user", "managerpass", User.Role.MANAGER)

@pytest.fixture
def admin_user(create_user):
    """
    Fixture to create and return an admin user.
    Фикстура для создания и возврата пользователя с ролью администратора.
    """
    return create_user("admin_user", "adminpass", User.Role.ADMIN)

@pytest.fixture
def housekeeper_user(create_user):
    """
    Fixture to create and return a housekeeper user.
    Фикстура для создания и возврата пользователя с ролью горничной.
    """
    return create_user("housekeeper_user", "housekeeperpass", User.Role.HOUSEKEEPER)

@pytest.fixture
def another_housekeeper_user(create_user):
    """
    Fixture to create another housekeeper user.
    Фикстура для создания еще одного пользователя с ролью горничной.
    """
    return create_user("another_housekeeper", "anotherpass", User.Role.HOUSEKEEPER)

# Removed guest_user fixture
# Фикстура guest_user удалена


@pytest.fixture
def room_type_standard():
    """
    Fixture for a standard RoomType.
    Фикстура для стандартного типа номера (RoomType).
    """
    return RoomType.objects.create(name="Standard")

@pytest.fixture
def room_instance(room_type_standard):
    """
    Fixture for a Room instance.
    Фикстура для экземпляра номера (Room).
    """
    return Room.objects.create(number=101, floor=1, room_type=room_type_standard)

@pytest.fixture
def zone_instance():
    """
    Fixture for a Zone instance.
    Фикстура для экземпляра зоны (Zone).
    """
    return Zone.objects.create(name="Lobby", floor=1)

@pytest.fixture
def cleaning_type_instance():
    """
    Fixture for a CleaningType instance.
    Фикстура для экземпляра типа уборки (CleaningType).
    """
    return CleaningType.objects.create(name="Daily")

@pytest.fixture
def checklist_template_instance(cleaning_type_instance):
    """
    Fixture for a ChecklistTemplate instance.
    Фикстура для экземпляра шаблона чек-листа (ChecklistTemplate).
    """
    return ChecklistTemplate.objects.create(name="Room Checklist", cleaning_type=cleaning_type_instance)

@pytest.fixture
def checklist_item_template_instance(checklist_template_instance):
    """
    Fixture for a ChecklistItemTemplate instance.
    Фикстура для экземпляра пункта шаблона чек-листа (ChecklistItemTemplate).
    """
    return ChecklistItemTemplate.objects.create(
        checklist_template=checklist_template_instance,
        text="Clean the window",
        order=1
    )

@pytest.fixture
def booking_instance(room_instance):
    """
    Fixture for a Booking instance.
    Фикстура для экземпляра бронирования (Booking).
    """
    return Booking.objects.create(room=room_instance, check_in=timezone.now() + timezone.timedelta(hours=2))

@pytest.fixture
def cleaning_task_unassigned(room_instance, cleaning_type_instance):
    """
    Fixture for an unassigned CleaningTask.
    Фикстура для неназначенной задачи на уборку (CleaningTask).
    """
    return CleaningTask.objects.create(
        room=room_instance,
        cleaning_type=cleaning_type_instance,
        status=CleaningTask.Status.UNASSIGNED,
        scheduled_date=date.today(),
        due_time=timezone.now() + timezone.timedelta(hours=1)
    )

@pytest.fixture
def cleaning_task_assigned_to_housekeeper(room_instance, cleaning_type_instance, housekeeper_user):
    """
    Fixture for a CleaningTask assigned to the housekeeper_user.
    Фикстура для задачи на уборку, назначенной пользователю-горничной.
    """
    return CleaningTask.objects.create(
        room=room_instance,
        cleaning_type=cleaning_type_instance,
        status=CleaningTask.Status.ASSIGNED,
        assigned_to=housekeeper_user,
        scheduled_date=date.today(),
        due_time=timezone.now() + timezone.timedelta(hours=1)
    )

@pytest.fixture
def cleaning_task_in_progress(room_instance, cleaning_type_instance, housekeeper_user):
    """
    Fixture for a CleaningTask in IN_PROGRESS status.
    Фикстура для задачи на уборку в статусе "В процессе уборки".
    """
    return CleaningTask.objects.create(
        room=room_instance,
        cleaning_type=cleaning_type_instance,
        status=CleaningTask.Status.IN_PROGRESS,
        assigned_to=housekeeper_user,
        scheduled_date=date.today(),
        due_time=timezone.now() + timezone.timedelta(hours=1),
        started_at=timezone.now() - timezone.timedelta(minutes=30) # Set started_at / Устанавливаем started_at
    )

@pytest.fixture
def cleaning_task_waiting_check(room_instance, cleaning_type_instance, housekeeper_user):
    """
    Fixture for a CleaningTask in WAITING_CHECK status.
    Фикстура для задачи на уборку в статусе "Ожидает проверки".
    """
    return CleaningTask.objects.create(
        room=room_instance,
        cleaning_type=cleaning_type_instance,
        status=CleaningTask.Status.WAITING_CHECK,
        assigned_to=housekeeper_user,
        scheduled_date=date.today(),
        due_time=timezone.now() + timezone.timedelta(hours=1),
        started_at=timezone.now() - timezone.timedelta(hours=1),
        completed_at=timezone.now() - timezone.timedelta(minutes=10) # Set completed_at / Устанавливаем completed_at
    )

@pytest.fixture
def cleaning_task_checked(room_instance, cleaning_type_instance, housekeeper_user, manager_user):
    """
    Fixture for a CleaningTask in CHECKED status.
    Фикстура для задачи на уборку в статусе "Проверено".
    """
    return CleaningTask.objects.create(
        room=room_instance,
        cleaning_type=cleaning_type_instance,
        status=CleaningTask.Status.CHECKED,
        assigned_to=housekeeper_user,
        scheduled_date=date.today(),
        due_time=timezone.now() + timezone.timedelta(hours=1),
        started_at=timezone.now() - timezone.timedelta(hours=2),
        completed_at=timezone.now() - timezone.timedelta(hours=1),
        checked_at=timezone.now() - timezone.timedelta(minutes=5), # Set checked_at / Устанавливаем checked_at
        checked_by=manager_user # Set checked_by / Устанавливаем checked_by
    )

@pytest.fixture
def cleaning_task_canceled(room_instance, cleaning_type_instance, housekeeper_user):
    """
    Fixture for a CleaningTask in CANCELED status.
    Фикстура для задачи на уборку в статусе "Отменена".
    """
    return CleaningTask.objects.create(
        room=room_instance,
        cleaning_type=cleaning_type_instance,
        status=CleaningTask.Status.CANCELED,
        assigned_to=housekeeper_user,
        scheduled_date=date.today(),
        due_time=timezone.now() + timezone.timedelta(hours=1),
        # Timestamps might or might not be set depending on when it was canceled
        # Временные метки могут быть установлены или нет, в зависимости от того, когда задача была отменена
    )

# --- CleaningType ViewSet Tests ---
# Тесты для ViewSet CleaningType
# Tests for CleaningType ViewSet

@pytest.mark.django_db
def test_cleaningtype_list_permission_manager(api_client, manager_user, cleaning_type_instance):
    """
    Manager users should be able to list CleaningTypes.
    Пользователи с ролью менеджера должны иметь возможность просматривать список CleaningTypes.
    """
    url = reverse('cleaningtype-list')
    api_client.force_authenticate(user=manager_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == CleaningType.objects.count() # Ensure all types are listed / Убеждаемся, что перечислены все типы

@pytest.mark.django_db
def test_cleaningtype_list_permission_non_manager(api_client, housekeeper_user, cleaning_type_instance):
    """
    Non-manager users should not be able to list CleaningTypes.
    Пользователи без роли менеджера не должны иметь возможность просматривать список CleaningTypes.
    """
    url = reverse('cleaningtype-list')
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_cleaningtype_create_permission_manager(api_client, manager_user):
    """
    Manager users should be able to create CleaningTypes.
    Пользователи с ролью менеджера должны иметь возможность создавать CleaningTypes.
    """
    url = reverse('cleaningtype-list')
    new_type_data = {"name": "Seasonal Clean"}
    api_client.force_authenticate(user=manager_user)
    response = api_client.post(url, new_type_data)
    assert response.status_code == status.HTTP_201_CREATED
    assert CleaningType.objects.filter(name="Seasonal Clean").exists()

@pytest.mark.django_db
def test_cleaningtype_create_permission_non_manager(api_client, housekeeper_user):
    """
    Non-manager users should not be able to create CleaningTypes.
    Пользователи без роли менеджера не должны иметь возможность создавать CleaningTypes.
    """
    url = reverse('cleaningtype-list')
    new_type_data = {"name": "Forbidden Type"}
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.post(url, new_type_data)
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_cleaningtype_retrieve_permission_manager(api_client, manager_user, cleaning_type_instance):
    """
    Manager users should be able to retrieve a CleaningType.
    Пользователи с ролью менеджера должны иметь возможность получать информацию о CleaningType.
    """
    url = reverse('cleaningtype-detail', args=[cleaning_type_instance.pk])
    api_client.force_authenticate(user=manager_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data['name'] == cleaning_type_instance.name

@pytest.mark.django_db
def test_cleaningtype_retrieve_permission_non_manager(api_client, housekeeper_user, cleaning_type_instance):
    """
    Non-manager users should not be able to retrieve a CleaningType.
    Пользователи без роли менеджера не должны иметь возможность получать информацию о CleaningType.
    """
    url = reverse('cleaningtype-detail', args=[cleaning_type_instance.pk])
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_cleaningtype_update_permission_manager(api_client, manager_user, cleaning_type_instance):
    """
    Manager users should be able to update a CleaningType.
    Пользователи с ролью менеджера должны иметь возможность обновлять CleaningType.
    """
    url = reverse('cleaningtype-detail', args=[cleaning_type_instance.pk])
    update_data = {"name": "Updated Daily"}
    api_client.force_authenticate(user=manager_user)
    response = api_client.patch(url, update_data)
    assert response.status_code == status.HTTP_200_OK
    cleaning_type_instance.refresh_from_db()
    assert cleaning_type_instance.name == "Updated Daily"

@pytest.mark.django_db
def test_cleaningtype_update_permission_non_manager(api_client, housekeeper_user, cleaning_type_instance):
    """
    Non-manager users should not be able to update a CleaningType.
    Пользователи без роли менеджера не должны иметь возможность обновлять CleaningType.
    """
    url = reverse('cleaningtype-detail', args=[cleaning_type_instance.pk])
    update_data = {"name": "Forbidden Update"}
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.patch(url, update_data)
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_cleaningtype_destroy_permission_manager(api_client, manager_user, cleaning_type_instance):
    """
    Manager users should be able to delete a CleaningType.
    Пользователи с ролью менеджера должны иметь возможность удалять CleaningType.
    """
    url = reverse('cleaningtype-detail', args=[cleaning_type_instance.pk])
    api_client.force_authenticate(user=manager_user)
    response = api_client.delete(url)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not CleaningType.objects.filter(pk=cleaning_type_instance.pk).exists()

@pytest.mark.django_db
def test_cleaningtype_destroy_permission_non_manager(api_client, housekeeper_user, cleaning_type_instance):
    """
    Non-manager users should not be able to delete a CleaningType.
    Пользователи без роли менеджера не должны иметь возможность удалять CleaningType.
    """
    url = reverse('cleaningtype-detail', args=[cleaning_type_instance.pk])
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.delete(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN


# --- ChecklistTemplate ViewSet Tests ---
# Тесты для ViewSet ChecklistTemplate
# Tests for ChecklistTemplate ViewSet

@pytest.mark.django_db
def test_checklisttemplate_list_permission_manager(api_client, manager_user, checklist_template_instance):
    """
    Manager users should be able to list ChecklistTemplates.
    Пользователи с ролью менеджера должны иметь возможность просматривать список ChecklistTemplates.
    """
    url = reverse('checklisttemplate-list')
    api_client.force_authenticate(user=manager_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == ChecklistTemplate.objects.count()

@pytest.mark.django_db
def test_checklisttemplate_list_permission_non_manager(api_client, housekeeper_user, checklist_template_instance):
    """
    Non-manager users should not be able to list ChecklistTemplates.
    Пользователи без роли менеджера не должны иметь возможность просматривать список ChecklistTemplates.
    """
    url = reverse('checklisttemplate-list')
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_checklisttemplate_create_permission_manager(api_client, manager_user, cleaning_type_instance):
    """
    Manager users should be able to create ChecklistTemplates.
    Пользователи с ролью менеджера должны иметь возможность создавать ChecklistTemplates.
    """
    url = reverse('checklisttemplate-list')
    new_template_data = {
        "name": "Deep Clean Checklist",
        "cleaning_type": cleaning_type_instance.id,
        "description": "For deep cleaning"
    }
    api_client.force_authenticate(user=manager_user)
    response = api_client.post(url, new_template_data)
    assert response.status_code == status.HTTP_201_CREATED
    assert ChecklistTemplate.objects.filter(name="Deep Clean Checklist").exists()

@pytest.mark.django_db
def test_checklisttemplate_create_permission_non_manager(api_client, housekeeper_user, cleaning_type_instance):
    """
    Non-manager users should not be able to create ChecklistTemplates.
    Пользователи без роли менеджера не должны иметь возможность создавать ChecklistTemplates.
    """
    url = reverse('checklisttemplate-list')
    new_template_data = {
        "name": "Forbidden Checklist",
        "cleaning_type": cleaning_type_instance.id,
        "description": "Forbidden"
    }
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.post(url, new_template_data)
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_checklisttemplate_retrieve_permission_manager(api_client, manager_user, checklist_template_instance):
    """
    Manager users should be able to retrieve a ChecklistTemplate.
    Пользователи с ролью менеджера должны иметь возможность получать информацию о ChecklistTemplate.
    """
    url = reverse('checklisttemplate-detail', args=[checklist_template_instance.pk])
    api_client.force_authenticate(user=manager_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data['name'] == checklist_template_instance.name

@pytest.mark.django_db
def test_checklisttemplate_retrieve_permission_non_manager(api_client, housekeeper_user, checklist_template_instance):
    """
    Non-manager users should not be able to retrieve a ChecklistTemplate.
    Пользователи без роли менеджера не должны иметь возможность получать информацию о ChecklistTemplate.
    """
    url = reverse('checklisttemplate-detail', args=[checklist_template_instance.pk])
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_checklisttemplate_update_permission_manager(api_client, manager_user, checklist_template_instance):
    """
    Manager users should be able to update a ChecklistTemplate.
    Пользователи с ролью менеджера должны иметь возможность обновлять ChecklistTemplate.
    """
    url = reverse('checklisttemplate-detail', args=[checklist_template_instance.pk])
    update_data = {"name": "Updated Room Checklist"}
    api_client.force_authenticate(user=manager_user)
    response = api_client.patch(url, update_data)
    assert response.status_code == status.HTTP_200_OK
    checklist_template_instance.refresh_from_db()
    assert checklist_template_instance.name == "Updated Room Checklist"

@pytest.mark.django_db
def test_checklisttemplate_update_permission_non_manager(api_client, housekeeper_user, checklist_template_instance):
    """
    Non-manager users should not be able to update a ChecklistTemplate.
    Пользователи без роли менеджера не должны иметь возможность обновлять ChecklistTemplate.
    """
    url = reverse('checklisttemplate-detail', args=[checklist_template_instance.pk])
    update_data = {"name": "Forbidden Update"}
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.patch(url, update_data)
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_checklisttemplate_destroy_permission_manager(api_client, manager_user, checklist_template_instance):
    """
    Manager users should be able to delete a ChecklistTemplate.
    Пользователи с ролью менеджера должны иметь возможность удалять ChecklistTemplate.
    """
    url = reverse('checklisttemplate-detail', args=[checklist_template_instance.pk])
    api_client.force_authenticate(user=manager_user)
    response = api_client.delete(url)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not ChecklistTemplate.objects.filter(pk=checklist_template_instance.pk).exists()

@pytest.mark.django_db
def test_checklisttemplate_destroy_permission_non_manager(api_client, housekeeper_user, checklist_template_instance):
    """
    Non-manager users should not be able to delete a ChecklistTemplate.
    Пользователи без роли менеджера не должны иметь возможность удалять ChecklistTemplate.
    """
    url = reverse('checklisttemplate-detail', args=[checklist_template_instance.pk])
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.delete(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN


# --- ChecklistItemTemplate ViewSet Tests ---
# Тесты для ViewSet ChecklistItemTemplate
# Tests for ChecklistItemTemplate ViewSet

@pytest.mark.django_db
def test_checklistitemtemplate_list_permission_manager(api_client, manager_user, checklist_item_template_instance):
    """
    Manager users should be able to list ChecklistItemTemplates.
    Пользователи с ролью менеджера должны иметь возможность просматривать список ChecklistItemTemplates.
    """
    url = reverse('checklistitemtemplate-list')
    api_client.force_authenticate(user=manager_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == ChecklistItemTemplate.objects.count()

@pytest.mark.django_db
def test_checklistitemtemplate_list_permission_non_manager(api_client, housekeeper_user, checklist_item_template_instance):
    """
    Non-manager users should not be able to list ChecklistItemTemplates.
    Пользователи без роли менеджера не должны иметь возможность просматривать список ChecklistItemTemplates.
    """
    url = reverse('checklistitemtemplate-list')
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_checklistitemtemplate_create_permission_manager(api_client, manager_user, checklist_template_instance):
    """
    Manager users should be able to create ChecklistItemTemplates.
    Пользователи с ролью менеджера должны иметь возможность создавать ChecklistItemTemplates.
    """
    url = reverse('checklistitemtemplate-list')
    new_item_data = {
        "checklist_template": checklist_template_instance.id,
        "text": "Sweep floor",
        "order": 2
    }
    api_client.force_authenticate(user=manager_user)
    response = api_client.post(url, new_item_data)
    assert response.status_code == status.HTTP_201_CREATED
    assert ChecklistItemTemplate.objects.filter(text="Sweep floor").exists()

@pytest.mark.django_db
def test_checklistitemtemplate_create_permission_non_manager(api_client, housekeeper_user, checklist_template_instance):
    """
    Non-manager users should not be able to create ChecklistItemTemplates.
    Пользователи без роли менеджера не должны иметь возможность создавать ChecklistItemTemplates.
    """
    url = reverse('checklistitemtemplate-list')
    new_item_data = {
        "checklist_template": checklist_template_instance.id,
        "text": "Forbidden Item",
        "order": 99
    }
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.post(url, new_item_data)
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_checklistitemtemplate_retrieve_permission_manager(api_client, manager_user, checklist_item_template_instance):
    """
    Manager users should be able to retrieve a ChecklistItemTemplate.
    Пользователи с ролью менеджера должны иметь возможность получать информацию о ChecklistItemTemplate.
    """
    url = reverse('checklistitemtemplate-detail', args=[checklist_item_template_instance.pk])
    api_client.force_authenticate(user=manager_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data['text'] == checklist_item_template_instance.text

@pytest.mark.django_db
def test_checklistitemtemplate_retrieve_permission_non_manager(api_client, housekeeper_user, checklist_item_template_instance):
    """
    Non-manager users should not be able to retrieve a ChecklistItemTemplate.
    Пользователи без роли менеджера не должны иметь возможность получать информацию о ChecklistItemTemplate.
    """
    url = reverse('checklistitemtemplate-detail', args=[checklist_item_template_instance.pk])
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_checklistitemtemplate_update_permission_manager(api_client, manager_user, checklist_item_template_instance):
    """
    Manager users should be able to update a ChecklistItemTemplate.
    Пользователи с ролью менеджера должны иметь возможность обновлять ChecklistItemTemplate.
    """
    url = reverse('checklistitemtemplate-detail', args=[checklist_item_template_instance.pk])
    update_data = {"text": "Updated window cleaning"}
    api_client.force_authenticate(user=manager_user)
    response = api_client.patch(url, update_data)
    assert response.status_code == status.HTTP_200_OK
    checklist_item_template_instance.refresh_from_db()
    assert checklist_item_template_instance.text == "Updated window cleaning"

@pytest.mark.django_db
def test_checklistitemtemplate_update_permission_non_manager(api_client, housekeeper_user, checklist_item_template_instance):
    """
    Non-manager users should not be able to update a ChecklistItemTemplate.
    Пользователи без роли менеджера не должны иметь возможность обновлять ChecklistItemTemplate.
    """
    url = reverse('checklistitemtemplate-detail', args=[checklist_item_template_instance.pk])
    update_data = {"text": "Forbidden Update"}
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.patch(url, update_data)
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_checklistitemtemplate_destroy_permission_manager(api_client, manager_user, checklist_item_template_instance):
    """
    Manager users should be able to delete a ChecklistItemTemplate.
    Пользователи с ролью менеджера должны иметь возможность удалять ChecklistItemTemplate.
    """
    url = reverse('checklistitemtemplate-detail', args=[checklist_item_template_instance.pk])
    api_client.force_authenticate(user=manager_user)
    response = api_client.delete(url)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not ChecklistItemTemplate.objects.filter(pk=checklist_item_template_instance.pk).exists()

@pytest.mark.django_db
def test_checklistitemtemplate_destroy_permission_non_manager(api_client, housekeeper_user, checklist_item_template_instance):
    """
    Non-manager users should not be able to delete a ChecklistItemTemplate.
    Пользователи без роли менеджера не должны иметь возможность удалять ChecklistItemTemplate.
    """
    url = reverse('checklistitemtemplate-detail', args=[checklist_item_template_instance.pk])
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.delete(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN


# --- CleaningTask ViewSet Tests ---
# Тесты для ViewSet CleaningTask
# Tests for CleaningTask ViewSet

@pytest.mark.django_db
def test_cleaningtask_list_permission_manager(api_client, manager_user, cleaning_task_unassigned, cleaning_task_assigned_to_housekeeper):
    """
    Manager users should be able to list all CleaningTasks.
    Пользователи с ролью менеджера должны иметь возможность просматривать все задачи на уборку.
    """
    url = reverse('cleaningtask-list')
    api_client.force_authenticate(user=manager_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    # Manager sees all tasks
    # Менеджер видит все задачи
    assert len(response.data) == CleaningTask.objects.count()


@pytest.mark.django_db
def test_cleaningtask_list_permission_housekeeper(api_client, housekeeper_user, cleaning_task_assigned_to_housekeeper, cleaning_task_unassigned):
    """
    Housekeeper users should only be able to list tasks assigned to them.
    Пользователи с ролью горничной должны видеть только задачи, назначенные им.
    """
    url = reverse('cleaningtask-list')
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    # Housekeeper sees only tasks assigned to them
    # Горничная видит только задачи, назначенные ей
    assert len(response.data) == CleaningTask.objects.filter(assigned_to=housekeeper_user).count()
    # Ensure the assigned task is in the list
    # Убеждаемся, что назначенная задача есть в списке
    assigned_task_ids = [task['id'] for task in response.data]
    assert cleaning_task_assigned_to_housekeeper.id in assigned_task_ids
    # Ensure the unassigned task is NOT in the list
    # Убеждаемся, что неназначенной задачи НЕТ в списке
    assert cleaning_task_unassigned.id not in assigned_task_ids


# Removed test_cleaningtask_list_permission_other_authenticated
# Тест test_cleaningtask_list_permission_other_authenticated удален


@pytest.mark.django_db
def test_cleaningtask_list_permission_unauthenticated(api_client, cleaning_task_unassigned):
    """
    Unauthenticated users should not list CleaningTasks.
    Неаутентифицированные пользователи не должны просматривать задачи на уборку.
    """
    url = reverse('cleaningtask-list')
    response = api_client.get(url)
    # Corrected assertion to expect 403 Forbidden for unauthenticated users
    # Исправлено утверждение на ожидание 403 Forbidden для неаутентифицированных пользователей
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_cleaningtask_create_permission_manager(api_client, manager_user, room_instance, cleaning_type_instance):
    """
    Manager users should be able to create CleaningTasks.
    Пользователи с ролью менеджера должны иметь возможность создавать задачи на уборку.
    """
    url = reverse('cleaningtask-list')
    new_task_data = {
        "room": room_instance.id,
        "cleaning_type": cleaning_type_instance.id,
        "status": CleaningTask.Status.UNASSIGNED,
        "scheduled_date": date.today().strftime('%Y-%m-%d'),
        "due_time": timezone.now().strftime('%Y-%m-%dT%H:%M:%S%z'), # Include timezone info / Включаем информацию о часовом поясе
        "notes": "New task from manager"
    }
    api_client.force_authenticate(user=manager_user)
    response = api_client.post(url, new_task_data)
    assert response.status_code == status.HTTP_201_CREATED
    assert CleaningTask.objects.filter(notes="New task from manager").exists()


@pytest.mark.django_db
def test_cleaningtask_create_permission_non_manager(api_client, housekeeper_user, room_instance, cleaning_type_instance):
    """
    Non-manager users should not be able to create CleaningTasks.
    Пользователи без роли менеджера не должны иметь возможность создавать задачи на уборку.
    """
    url = reverse('cleaningtask-list')
    new_task_data = {
        "room": room_instance.id,
        "cleaning_type": cleaning_type_instance.id,
        "status": CleaningTask.Status.UNASSIGNED,
        "scheduled_date": date.today().strftime('%Y-%m-%d'),
        "notes": "Forbidden task"
    }
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.post(url, new_task_data)
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_cleaningtask_retrieve_permission_manager(api_client, manager_user, cleaning_task_unassigned):
    """
    Manager users should be able to retrieve any CleaningTask.
    Пользователи с ролью менеджера должны иметь возможность получать информацию о любой задаче на уборку.
    """
    url = reverse('cleaningtask-detail', args=[cleaning_task_unassigned.pk])
    api_client.force_authenticate(user=manager_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data['id'] == cleaning_task_unassigned.id


@pytest.mark.django_db
def test_cleaningtask_retrieve_permission_housekeeper_assigned(api_client, housekeeper_user, cleaning_task_assigned_to_housekeeper):
    """
    Assigned housekeeper should be able to retrieve their CleaningTask.
    Назначенная горничная должна иметь возможность получать информацию о своей задаче на уборку.
    """
    url = reverse('cleaningtask-detail', args=[cleaning_task_assigned_to_housekeeper.pk])
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data['id'] == cleaning_task_assigned_to_housekeeper.id


@pytest.mark.django_db
def test_cleaningtask_retrieve_permission_housekeeper_not_assigned(api_client, housekeeper_user, cleaning_task_unassigned):
    """
    Housekeeper should not be able to retrieve a task not assigned to them.
    Горничная не должна иметь возможность получать информацию о задаче, не назначенной ей.
    """
    url = reverse('cleaningtask-detail', args=[cleaning_task_unassigned.pk])
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.get(url)
    # This should return 404 Not Found because get_queryset filters it out
    # Должен вернуть 404 Not Found, так как get_queryset отфильтровывает ее
    assert response.status_code == status.HTTP_404_NOT_FOUND


# Removed test_cleaningtask_retrieve_permission_other_authenticated
# Тест test_cleaningtask_retrieve_permission_other_authenticated удален


@pytest.mark.django_db
def test_cleaningtask_retrieve_permission_unauthenticated(api_client, cleaning_task_unassigned):
    """
    Unauthenticated users should not be able to retrieve a CleaningTask.
    Неаутентифицированные пользователи не должны иметь возможность получать информацию о задаче на уборку.
    """
    url = reverse('cleaningtask-detail', args=[cleaning_task_unassigned.pk])
    response = api_client.get(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_cleaningtask_update_permission_manager(api_client, manager_user, cleaning_task_assigned_to_housekeeper, another_housekeeper_user):
    """
    Manager users should be able to update any CleaningTask.
    Пользователи с ролью менеджера должны иметь возможность обновлять любую задачу на уборку.
    """
    url = reverse('cleaningtask-detail', args=[cleaning_task_assigned_to_housekeeper.pk])
    update_data = {
        "assigned_to": another_housekeeper_user.id, # Reassign task / Переназначаем задачу
        "notes": "Manager updated notes" # Manager updated notes / Менеджер обновил заметки
    }
    api_client.force_authenticate(user=manager_user)
    response = api_client.patch(url, update_data)
    assert response.status_code == status.HTTP_200_OK
    cleaning_task_assigned_to_housekeeper.refresh_from_db()
    assert cleaning_task_assigned_to_housekeeper.assigned_to == another_housekeeper_user
    assert cleaning_task_assigned_to_housekeeper.notes == "Manager updated notes"


@pytest.mark.django_db
def test_cleaningtask_update_permission_housekeeper(api_client, housekeeper_user, cleaning_task_assigned_to_housekeeper):
    """
    Housekeeper users should not be able to use standard update (PATCH).
    Пользователи с ролью горничной не должны иметь возможность использовать стандартное обновление (PATCH).
    """
    url = reverse('cleaningtask-detail', args=[cleaning_task_assigned_to_housekeeper.pk])
    update_data = {"notes": "Housekeeper tried to update"}
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.patch(url, update_data)
    assert response.status_code == status.HTTP_403_FORBIDDEN


# Removed test_cleaningtask_update_permission_other_authenticated
# Тест test_cleaningtask_update_permission_other_authenticated удален


@pytest.mark.django_db
def test_cleaningtask_destroy_permission_manager(api_client, manager_user, cleaning_task_unassigned):
    """
    Manager users should be able to delete any CleaningTask.
    Пользователи с ролью менеджера должны иметь возможность удалять любую задачу на уборку.
    """
    url = reverse('cleaningtask-detail', args=[cleaning_task_unassigned.pk])
    api_client.force_authenticate(user=manager_user)
    response = api_client.delete(url)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not CleaningTask.objects.filter(pk=cleaning_task_unassigned.pk).exists()


@pytest.mark.django_db
def test_cleaningtask_destroy_permission_non_manager(api_client, housekeeper_user, cleaning_task_assigned_to_housekeeper):
    """
    Non-manager users should not be able to delete CleaningTasks.
    Пользователи без роли менеджера не должны иметь возможность удалять задачи на уборку.
    """
    url = reverse('cleaningtask-detail', args=[cleaning_task_assigned_to_housekeeper.pk])
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.delete(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN


# --- CleaningTask Custom Action Tests ---
# Тесты для пользовательских действий (actions) модели CleaningTask
# Tests for CleaningTask Custom Actions

# Test 'start' action
# Тест действия 'start'

@pytest.mark.django_db
def test_cleaningtask_action_start_permission_assigned_housekeeper(api_client, housekeeper_user, cleaning_task_assigned_to_housekeeper):
    """
    Assigned housekeeper should be able to start their task.
    Назначенная горничная должна иметь возможность начать свою задачу.
    """
    url = reverse('cleaningtask-start', args=[cleaning_task_assigned_to_housekeeper.pk])
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.patch(url) # PATCH request for action / PATCH запрос для действия
    # Asserting 200 OK as the permission should allow access,
    # the action logic should then proceed.
    # Проверяем 200 OK, так как разрешение должно предоставлять доступ,
    # а логика действия должна выполняться далее.
    assert response.status_code == status.HTTP_200_OK
    cleaning_task_assigned_to_housekeeper.refresh_from_db()
    assert cleaning_task_assigned_to_housekeeper.status == CleaningTask.Status.IN_PROGRESS
    assert cleaning_task_assigned_to_housekeeper.started_at is not None


@pytest.mark.django_db
def test_cleaningtask_action_start_permission_manager(api_client, manager_user, cleaning_task_unassigned):
    """
    Manager should be able to start any task.
    Менеджер должен иметь возможность начать любую задачу.
    """
    url = reverse('cleaningtask-start', args=[cleaning_task_unassigned.pk])
    api_client.force_authenticate(user=manager_user)
    response = api_client.patch(url)
    assert response.status_code == status.HTTP_200_OK
    cleaning_task_unassigned.refresh_from_db()
    assert cleaning_task_unassigned.status == CleaningTask.Status.IN_PROGRESS
    assert cleaning_task_unassigned.started_at is not None


@pytest.mark.django_db
def test_cleaningtask_action_start_permission_other_housekeeper(api_client, another_housekeeper_user, cleaning_task_assigned_to_housekeeper):
    """
    Housekeeper not assigned should not be able to start a task.
    Горничная, которой задача не назначена, не должна иметь возможность ее начать.
    """
    url = reverse('cleaningtask-start', args=[cleaning_task_assigned_to_housekeeper.pk])
    api_client.force_authenticate(user=another_housekeeper_user)
    response = api_client.patch(url)
    assert response.status_code == status.HTTP_404_NOT_FOUND

# Removed test_cleaningtask_action_start_permission_other_authenticated
# Тест test_cleaningtask_action_start_permission_other_authenticated удален


@pytest.mark.django_db
def test_cleaningtask_action_start_permission_unauthenticated(api_client, cleaning_task_unassigned):
    """
    Unauthenticated users should not be able to start a task.
    Неаутентифицированные пользователи не должны иметь возможность начать задачу.
    """
    url = reverse('cleaningtask-start', args=[cleaning_task_unassigned.pk])
    response = api_client.patch(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_cleaningtask_action_start_invalid_status(api_client, housekeeper_user, cleaning_task_in_progress):
    """
    Starting a task that is already IN_PROGRESS should fail with 400 after permission check.
    Попытка начать задачу, которая уже находится в статусе "В процессе уборки", должна завершиться ошибкой 400 после проверки разрешений.
    """
    url = reverse('cleaningtask-start', args=[cleaning_task_in_progress.pk])
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.patch(url)
    # Asserting 400 Bad Request as the permission should allow access,
    # but the action logic prevents the status change.
    # Проверяем 400 Bad Request, так как разрешение должно предоставлять доступ,
    # но логика действия предотвращает изменение статуса.
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Задача не может быть начата из статуса" in response.data['detail']


# Test 'complete' action
# Тест действия 'complete'

@pytest.mark.django_db
def test_cleaningtask_action_complete_permission_assigned_housekeeper(api_client, housekeeper_user, cleaning_task_in_progress):
    """
    Assigned housekeeper should be able to complete their task.
    Назначенная горничная должна иметь возможность завершить свою задачу.
    """
    url = reverse('cleaningtask-complete', args=[cleaning_task_in_progress.pk])
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.patch(url)
    # Asserting 200 OK as the permission should allow access,
    # the action logic should then proceed.
    # Проверяем 200 OK, так как разрешение должно предоставлять доступ,
    # а логика действия должна выполняться далее.
    assert response.status_code == status.HTTP_200_OK
    cleaning_task_in_progress.refresh_from_db()
    assert cleaning_task_in_progress.status == CleaningTask.Status.WAITING_CHECK
    assert cleaning_task_in_progress.completed_at is not None


@pytest.mark.django_db
def test_cleaningtask_action_complete_permission_manager(api_client, manager_user, cleaning_task_in_progress):
    """
    Manager should be able to complete any task.
    Менеджер должен иметь возможность завершить любую задачу.
    """
    url = reverse('cleaningtask-complete', args=[cleaning_task_in_progress.pk])
    api_client.force_authenticate(user=manager_user)
    response = api_client.patch(url)
    assert response.status_code == status.HTTP_200_OK
    cleaning_task_in_progress.refresh_from_db()
    assert cleaning_task_in_progress.status == CleaningTask.Status.WAITING_CHECK
    assert cleaning_task_in_progress.completed_at is not None


@pytest.mark.django_db
def test_cleaningtask_action_complete_permission_other_housekeeper(api_client, another_housekeeper_user, cleaning_task_in_progress):
    """
    Housekeeper not assigned should not be able to complete a task.
    Горничная, которой задача не назначена, не должна иметь возможность ее завершить.
    """
    url = reverse('cleaningtask-complete', args=[cleaning_task_in_progress.pk])
    api_client.force_authenticate(user=another_housekeeper_user)
    response = api_client.patch(url)
    assert response.status_code == status.HTTP_404_NOT_FOUND


# Removed test_cleaningtask_action_complete_permission_other_authenticated
# Тест test_cleaningtask_action_complete_permission_other_authenticated удален


@pytest.mark.django_db
def test_cleaningtask_action_complete_permission_unauthenticated(api_client, cleaning_task_in_progress):
    """
    Unauthenticated users should not be able to complete a task.
    Неаутентифицированные пользователи не должны иметь возможность завершить задачу.
    """
    url = reverse('cleaningtask-complete', args=[cleaning_task_in_progress.pk])
    response = api_client.patch(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_cleaningtask_action_complete_invalid_status(api_client, housekeeper_user, cleaning_task_waiting_check):
    """
    Completing a task not in IN_PROGRESS should fail with 400 after permission check.
    Попытка завершить задачу, которая не находится в статусе "В процессе уборки", должна завершиться ошибкой 400 после проверки разрешений.
    """
    url = reverse('cleaningtask-complete', args=[cleaning_task_waiting_check.pk])
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.patch(url)
    # Asserting 400 Bad Request as the permission should allow access,
    # but the action logic prevents the status change.
    # Проверяем 400 Bad Request, так как разрешение должно предоставлять доступ,
    # но логика действия предотвращает изменение статуса.
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Задача не может быть завершена из статуса" in response.data['detail']


# Test 'check' action
# Тест действия 'check'

@pytest.mark.django_db
def test_cleaningtask_action_check_permission_manager(api_client, manager_user, cleaning_task_waiting_check):
    """
    Manager should be able to check a task.
    Менеджер должен иметь возможность проверить задачу.
    """
    url = reverse('cleaningtask-check', args=[cleaning_task_waiting_check.pk])
    api_client.force_authenticate(user=manager_user)
    response = api_client.patch(url)
    assert response.status_code == status.HTTP_200_OK
    cleaning_task_waiting_check.refresh_from_db()
    assert cleaning_task_waiting_check.status == CleaningTask.Status.CHECKED
    assert cleaning_task_waiting_check.checked_at is not None
    assert cleaning_task_waiting_check.checked_by == manager_user


@pytest.mark.django_db
def test_cleaningtask_action_check_permission_housekeeper(api_client, housekeeper_user, cleaning_task_waiting_check):
    """
    Housekeeper should not be able to check a task.
    Горничная не должна иметь возможность проверить задачу.
    """
    url = reverse('cleaningtask-check', args=[cleaning_task_waiting_check.pk])
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.patch(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN


# Removed test_cleaningtask_action_check_permission_other_authenticated
# Тест test_cleaningtask_action_check_permission_other_authenticated удален


@pytest.mark.django_db
def test_cleaningtask_action_check_permission_unauthenticated(api_client, cleaning_task_waiting_check):
    """
    Unauthenticated users should not be able to check a task.
    Неаутентифицированные пользователи не должны иметь возможность проверить задачу.
    """
    url = reverse('cleaningtask-check', args=[cleaning_task_waiting_check.pk])
    response = api_client.patch(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_cleaningtask_action_check_invalid_status(api_client, manager_user, cleaning_task_in_progress):
    """
    Checking a task not in WAITING_CHECK should fail.
    Попытка проверить задачу, которая не находится в статусе "Ожидает проверки", должна завершиться ошибкой.
    """
    url = reverse('cleaningtask-check', args=[cleaning_task_in_progress.pk])
    api_client.force_authenticate(user=manager_user)
    response = api_client.patch(url)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Задача не может быть проверена из статуса" in response.data['detail']


# Test 'cancel' action
# Тест действия 'cancel'

@pytest.mark.django_db
def test_cleaningtask_action_cancel_permission_manager(api_client, manager_user, cleaning_task_assigned_to_housekeeper):
    """
    Manager should be able to cancel a task.
    Менеджер должен иметь возможность отменить задачу.
    """
    url = reverse('cleaningtask-cancel', args=[cleaning_task_assigned_to_housekeeper.pk])
    api_client.force_authenticate(user=manager_user)
    response = api_client.patch(url)
    assert response.status_code == status.HTTP_200_OK
    cleaning_task_assigned_to_housekeeper.refresh_from_db()
    assert cleaning_task_assigned_to_housekeeper.status == CleaningTask.Status.CANCELED


@pytest.mark.django_db
def test_cleaningtask_action_cancel_permission_housekeeper(api_client, housekeeper_user, cleaning_task_assigned_to_housekeeper):
    """
    Housekeeper should not be able to cancel a task.
    Горничная не должна иметь возможность отменить задачу.
    """
    url = reverse('cleaningtask-cancel', args=[cleaning_task_assigned_to_housekeeper.pk])
    api_client.force_authenticate(user=housekeeper_user)
    response = api_client.patch(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN


# Removed test_cleaningtask_action_cancel_permission_other_authenticated
# Тест test_cleaningtask_action_cancel_permission_other_authenticated удален


@pytest.mark.django_db
def test_cleaningtask_action_cancel_permission_unauthenticated(api_client, cleaning_task_unassigned):
    """
    Unauthenticated users should not be able to cancel a task.
    Неаутентифицированные пользователи не должны иметь возможность отменить задачу.
    """
    url = reverse('cleaningtask-cancel', args=[cleaning_task_unassigned.pk])
    response = api_client.patch(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_cleaningtask_action_cancel_invalid_status(api_client, manager_user, cleaning_task_checked):
    """
    Canceling a task that is already CHECKED should fail.
    Попытка отменить задачу, которая уже находится в статусе "Проверено", должна завершиться ошибкой.
    """
    url = reverse('cleaningtask-cancel', args=[cleaning_task_checked.pk])
    api_client.force_authenticate(user=manager_user)
    response = api_client.patch(url)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Задача не может быть отменена из статуса" in response.data['detail']
