import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status 
from hotel.models import RoomType, Room 
from users.models import User 
from booking.models import Booking 
from django.utils import timezone 
from datetime import timedelta 


# Получаем кастомную модель User
# Get the custom User model
UserModel = get_user_model()

# --- Fixtures ---
# Фикстуры для создания объектов, необходимых для тестов
# Fixtures for creating objects needed for the tests

@pytest.fixture
def api_client():
    """Экземпляр клиента API Django REST Framework."""
    # A Django REST Framework API client instance.
    return APIClient()

@pytest.fixture
def create_user():
    """Фикстура для создания пользователя с определенной ролью."""
    # Fixture to create a user with a specific role.
    def _create_user(username, password, role):
        return UserModel.objects.create_user(
            username=username,
            password=password,
            role=role
        )
    return _create_user

@pytest.fixture
def manager_user(create_user):
    """Фикстура для создания и возврата пользователя-менеджера."""
    # Fixture to create and return a manager user.
    return create_user("manager_user", "managerpass", User.Role.MANAGER) # Используем User.Role / Use User.Role

@pytest.fixture
def front_desk_user(create_user):
    """Фикстура для создания и возврата пользователя-службы приема."""
    # Fixture to create and return an front_desk user.
    return create_user("front_desk_user", "adminpass", User.Role.FRONT_DESK) # Используем User.Role / Use User.Role

@pytest.fixture
def housekeeper_user(create_user): # Используем housekeeper_user последовательно / Using housekeeper_user consistently
    """Фикстура для создания и возврата пользователя-горничной."""
    # Fixture to create and return a housekeeper user.
    return create_user("housekeeper_user", "housekeeperpass", User.Role.HOUSEKEEPER) # Используем User.Role / Use User.Role

@pytest.fixture
def room_type_standard():
    """Фикстура для создания стандартного типа номера."""
    # Fixture to create a standard RoomType.
    return RoomType.objects.create(name="Стандарт", capacity=2)

@pytest.fixture
def room_deluxe(room_type_standard):
    """Фикстура для создания номера Делюкс."""
    # Fixture to create a Deluxe Room.
    return Room.objects.create(
        number=101,
        floor=1,
        room_type=room_type_standard,
        status=Room.Status.FREE # Используем Room.Status / Use Room.Status
    )

@pytest.fixture
def room_occupied(room_type_standard):
    """Фикстура для создания занятого номера."""
    # Fixture to create an occupied Room.
    return Room.objects.create(
        number=102,
        floor=1,
        room_type=room_type_standard,
        status=Room.Status.OCCUPIED # Используем Room.Status / Use Room.Status
    )
# --- Helper function for permission checks ---
# Вспомогательная функция для проверки разрешений
# Helper function for permission checks

def check_permission(api_client, user, url, method, data=None):
    """Вспомогательная функция для проверки разрешения для данного пользователя, URL и метода."""
    # Helper to check permission for a given user, URL, and method.
    if user:
        api_client.force_authenticate(user=user) # Принудительная аутентификация пользователя / Force authenticate the user
    else:
        api_client.force_authenticate(user=None) # Убедиться, что пользователь не аутентифицирован / Ensure no user is authenticated

    # Выполняем запрос в зависимости от метода HTTP
    # Perform the request based on the HTTP method
    if method == 'GET':
        response = api_client.get(url)
    elif method == 'POST':
        response = api_client.post(url, data, format="json") # Указываем формат для POST / Specify format for POST
    elif method == 'PATCH':
         response = api_client.patch(url, data, format="json") # Указываем формат для PATCH / Specify format for PATCH
    elif method == 'PUT':
         response = api_client.put(url, data, format="json") # Указываем формат для PUT / Specify format for PUT
    elif method == 'DELETE':
        response = api_client.delete(url)
    else:
        raise ValueError(f"Неподдерживаемый HTTP метод: {method}") # Unsupported HTTP method

    # Выполняем выход, только если пользователь был аутентифицирован
    # Only logout if user was actually authenticated
    if user and user.is_authenticated:
        api_client.logout()

    return response # Возвращаем объект ответа / Return the response object


# --- Booking ViewSet Tests ---
# Тесты для ViewSet бронирований
# Tests for the Booking ViewSet

@pytest.mark.django_db # Отмечаем тест для работы с базой данных Django / Mark test to work with Django database
def test_create_booking_success(api_client, manager_user, room_type_standard):
    """Тест успешного создания бронирования менеджером."""
    # Test successful creation of a booking by a manager.
    client = api_client
    client.force_authenticate(user=manager_user) # Аутентифицируем менеджера / Authenticate the manager

    # Создаем номер для бронирования
    # Create a room for the booking
    room = Room.objects.create(number="101", floor=1, room_type=room_type_standard)

    # Получаем URL для создания бронирования
    # Get the URL for creating a booking
    url = reverse("booking-list")
    # Данные для создания бронирования
    # Data for creating the booking
    data = {
        "room": room.id, # Передаем ID комнаты / Pass Room ID
        "check_in": timezone.now().isoformat(), # Используем isoformat для полей даты/времени / Use isoformat for datetime fields
        "check_out": (timezone.now() + timedelta(days=2)).isoformat(), # Используем isoformat / Use isoformat
        "guest_count": 2,
        "notes": "Заметки тестового бронирования", # Test booking notes
        # НЕ передаем created_by здесь; оно должно быть установлено perform_create
        # Do NOT pass created_by here; it should be set by perform_create
    }

    # Отправляем POST-запрос для создания бронирования
    # Send a POST request to create the booking
    response = client.post(url, data, format="json")

    # Проверяем статус ответа и количество созданных объектов Booking
    # Assert the response status code and the count of created Booking objects
    assert response.status_code == status.HTTP_201_CREATED # Ожидаем статус 201 Created / Expect 201 Created status
    assert Booking.objects.count() == 1 # Проверяем, что создан один объект Booking / Check that one Booking object is created
    # Получаем созданный объект и проверяем его атрибуты
    # Get the created object and assert its attributes
    booking = Booking.objects.first()
    assert booking.room == room
    assert booking.guest_count == 2
    assert booking.notes == "Заметки тестового бронирования" # Check notes
    # Проверяем, что created_by был установлен perform_create
    # Verify created_by was set by perform_create
    assert booking.created_by == manager_user


@pytest.mark.django_db
def test_get_booking_list(api_client, manager_user, room_type_standard):
    """Тест получения списка бронирований менеджером."""
    # Test retrieving a list of bookings by a manager.
    client = api_client
    client.force_authenticate(user=manager_user) # Аутентифицируем менеджера / Authenticate the manager

    # Создаем несколько номеров и бронирований
    # Create a couple of rooms and bookings
    room1 = Room.objects.create(number="201", floor=2, room_type=room_type_standard)
    room2 = Room.objects.create(number="202", floor=2, room_type=room_type_standard)

    Booking.objects.create(
        room=room1,
        check_in=timezone.now(),
        check_out=timezone.now() + timedelta(days=1),
        guest_count=1,
        created_by=manager_user
    )
    Booking.objects.create(
        room=room2,
        check_in=timezone.now() + timedelta(days=2),
        check_out=timezone.now() + timedelta(days=3),
        guest_count=2,
        created_by=manager_user
    )

    # Получаем URL списка бронирований и отправляем GET-запрос
    # Get the booking list URL and send a GET request
    url = reverse("booking-list")
    response = client.get(url)

    # Проверяем статус ответа и количество возвращенных объектов
    # Assert the response status code and the number of returned objects
    assert response.status_code == status.HTTP_200_OK # Ожидаем статус 200 OK / Expect 200 OK status
    assert len(response.data) == 2 # Проверяем, что возвращены оба бронирования / Check that both bookings are returned
    # Опционально: Проверить структуру/содержимое возвращенных данных
    # Optional: Check structure/content of returned data


@pytest.mark.django_db
def test_create_booking_invalid_guest_count(api_client, manager_user, room_type_standard):
    """Тест создания бронирования с количеством гостей, превышающим вместимость номера."""
    # Test creating a booking with guest_count exceeding room capacity.
    client = api_client
    client.force_authenticate(user=manager_user) # Аутентифицируем менеджера / Authenticate the manager

    # Создаем тип номера с низкой вместимостью и номер
    # Create a room type with low capacity and a room
    room_type_mini = RoomType.objects.create(name="Мини", capacity=1)
    room = Room.objects.create(number="301", floor=3, room_type=room_type_mini)

    # Получаем URL для создания бронирования
    # Get the URL for creating a booking
    url = reverse("booking-list")
    # Данные с недопустимым количеством гостей
    # Data with invalid guest count
    data = {
        "room": room.id,
        "check_in": timezone.now().isoformat(),
        "check_out": (timezone.now() + timedelta(days=1)).isoformat(),
        "guest_count": 3, # Превышает вместимость (1) / Exceeds capacity (1)
        "notes": "",
        # created_by будет установлено perform_create / created_by will be set by perform_create
    }

    # Отправляем POST-запрос
    # Send a POST request
    response = client.post(url, data, format="json")

    # Проверяем статус ответа (должна быть ошибка валидации)
    # Assert the response status code (should be a validation error)
    assert response.status_code == status.HTTP_400_BAD_REQUEST # Ожидаем статус 400 Bad Request / Expect 400 Bad Request status
    # Исправленная проверка: проверяем ошибку в конкретном поле
    # Corrected assertion: check for the error in the specific field
    assert 'guest_count' in response.data # Проверяем наличие ошибки для поля 'guest_count' / Check for error on 'guest_count' field
    assert any("превышает вместимость номера" in str(error) for error in response.data['guest_count']) # Проверяем текст ошибки / Check error message text


@pytest.mark.django_db
def test_update_booking_success(api_client, manager_user, room_type_standard):
    """Тест успешного обновления бронирования менеджером (PUT)."""
    # Test successful update of a booking by a manager (PUT).
    client = api_client
    client.force_authenticate(user=manager_user) # Аутентифицируем менеджера / Authenticate the manager

    # Создаем номер и существующее бронирование
    # Create a room and an existing booking
    room = Room.objects.create(number="202", floor=2, room_type=room_type_standard)

    booking = Booking.objects.create(
        room=room,
        check_in=timezone.now(),
        check_out=timezone.now() + timedelta(days=1),
        guest_count=1,
        notes="Начальные заметки", # Initial notes
        created_by=manager_user
    )

    # Получаем URL для детального представления бронирования
    # Get the URL for the booking detail view
    url = reverse("booking-detail", args=[booking.id])
    # Подготавливаем обновленные данные - включаем только те поля, которые можно обновлять
    # Prepare updated data - only include fields that can be updated
    updated_data = {
        "room": room.id, # Можно обновить номер, если это разрешено логикой модели/сериализатора / Can update room if allowed by model/serializer logic
        "check_in": booking.check_in.isoformat(),
        "check_out": (booking.check_out + timedelta(days=1)).isoformat(),
        "guest_count": 2, # Корректное обновление, если вместимость 2 или более / Valid update if capacity is 2 or more
        "notes": "Обновленные заметки через PUT", # Updated notes via PUT
        # НЕ включать поля только для чтения, такие как id, created_at, updated_at, created_by, room_number и т.д.
        # Do NOT include read-only fields like id, created_at, updated_at, created_by, room_number, etc.
    }

    # Отправляем PUT-запрос для полного обновления
    # Send a PUT request for full update
    response = client.put(url, updated_data, format="json")

    # Проверяем статус ответа
    # Assert the response status code
    assert response.status_code == status.HTTP_200_OK # Ожидаем статус 200 OK / Expect 200 OK status

    # Обновляем объект из базы данных, чтобы увидеть изменения
    # Refresh the object to see changes
    booking.refresh_from_db()

    # Проверяем, что объект был обновлен корректно
    # Assert the object was updated correctly
    assert booking.guest_count == 2
    assert booking.notes == "Обновленные заметки через PUT" # Check updated notes
    # Проверяем, что другие поля не были неожиданно изменены
    # Verify other fields were not unexpectedly changed
    assert booking.room == room
    assert booking.created_by == manager_user # created_by не должно меняться через PUT/PATCH, если это явно не разрешено / created_by should not change via PUT/PATCH unless explicitly allowed


@pytest.mark.django_db
def test_partial_update_booking_with_patch(api_client, manager_user, room_type_standard):
    """Тест успешного частичного обновления бронирования менеджером (PATCH)."""
    # Test successful partial update of a booking by a manager (PATCH).
    client = api_client
    client.force_authenticate(user=manager_user) # Аутентифицируем менеджера / Authenticate the manager

    # Создаем номер и существующее бронирование
    # Create a room and an existing booking
    room = Room.objects.create(number="202", floor=2, room_type=room_type_standard)

    booking = Booking.objects.create(
        room=room,
        check_in=timezone.now(),
        check_out=timezone.now() + timedelta(days=2),
        guest_count=1,
        notes="Начальные заметки для PATCH", # Initial notes for PATCH
        created_by=manager_user
    )

    # Получаем URL для детального представления бронирования
    # Get the URL for the booking detail view
    url = reverse("booking-detail", args=[booking.id])
    # Подготавливаем данные для PATCH - включаем только поля для изменения
    # Prepare patch data - only include fields to change
    patch_data = {
        "notes": "Изменено через PATCH", # Changed via PATCH
        "guest_count": 2 # Корректное обновление, если вместимость 2 или более / Valid update if capacity is 2 or more
    }

    # Отправляем PATCH-запрос для частичного обновления
    # Send a PATCH request for partial update
    response = client.patch(url, patch_data, format="json")

    # Проверяем статус ответа
    # Assert the response status code
    assert response.status_code == status.HTTP_200_OK # Ожидаем статус 200 OK / Expect 200 OK status

    # Обновляем объект из базы данных, чтобы увидеть изменения
    # Refresh the object to see changes
    booking.refresh_from_db()

    # Проверяем, что объект был обновлен корректно
    # Assert the object was updated correctly
    assert booking.notes == "Изменено через PATCH" # Check updated notes
    assert booking.guest_count == 2 # Check updated guest count
    # Проверяем, что другие поля не были изменены
    # Verify other fields were not changed
    assert booking.room == room
    assert booking.check_in is not None # Убеждаемся, что исходный check_in сохранен / Ensure original check_in is preserved
    assert booking.check_out is not None # Убеждаемся, что исходный check_out сохранен / Ensure original check_out is preserved


@pytest.mark.django_db
def test_delete_booking_success(api_client, manager_user, room_type_standard):
    """Тест успешного удаления бронирования менеджером."""
    # Test successful deletion of a booking by a manager.
    client = api_client
    client.force_authenticate(user=manager_user) # Аутентифицируем менеджера / Authenticate the manager

    # Создаем номер и бронирование для удаления
    # Create a room and a booking to be deleted
    room = Room.objects.create(number="505", floor=5, room_type=room_type_standard)
    booking = Booking.objects.create(
        room=room,
        check_in=timezone.now(),
        check_out=timezone.now() + timedelta(days=1),
        guest_count=1,
        created_by=manager_user
    )

    # Проверяем, что бронирование существует до удаления
    # Verify booking exists before deletion
    assert Booking.objects.filter(id=booking.id).exists()

    # Получаем URL для детального представления бронирования и отправляем DELETE-запрос
    # Get the URL for the booking detail view and send a DELETE request
    url = reverse("booking-detail", args=[booking.id])
    response = client.delete(url)

    # Проверяем статус ответа (204 No Content для успешного удаления без содержимого)
    # Assert the response status code (204 No Content for successful deletion with no content)
    assert response.status_code == status.HTTP_204_NO_CONTENT # 204 для успешного удаления без содержимого / 204 for successful deletion with no content
    # Проверяем, что бронирование больше не существует
    # Verify booking no longer exists
    assert not Booking.objects.filter(id=booking.id).exists()


@pytest.mark.django_db
def test_unauthenticated_user_cannot_access_booking(api_client, room_type_standard):
    """Неаутентифицированные пользователи не должны иметь доступа к эндпоинтам бронирований."""
    # Unauthenticated users should not be able to access booking endpoints.
    client = api_client

    # Создаем бронирование для тестирования получения/обновления/удаления
    # Create a booking to test retrieve/update/delete
    room = Room.objects.create(number="998", floor=9, room_type=room_type_standard)
    booking = Booking.objects.create(room=room, check_in=timezone.now())

    # Тест списка (GET)
    # Test list (GET)
    list_url = reverse("booking-list")
    response_list = client.get(list_url)
    assert response_list.status_code == status.HTTP_403_FORBIDDEN # Или 401 в зависимости от настроек / Or 401 depending on settings

    # Тест создания (POST)
    # Test create (POST)
    create_url = reverse("booking-list")
    create_data = {"room": room.id, "check_in": timezone.now().isoformat(), "guest_count": 1}
    response_create = client.post(create_url, create_data, format="json")
    assert response_create.status_code == status.HTTP_403_FORBIDDEN # Или 401 / Or 401

    # Тест получения (GET detail)
    # Test retrieve (GET detail)
    detail_url = reverse("booking-detail", args=[booking.id])
    response_retrieve = client.get(detail_url)
    assert response_retrieve.status_code == status.HTTP_403_FORBIDDEN # Или 401 / Or 401

    # Тест обновления (PATCH)
    # Test update (PATCH)
    update_data = {"notes": "Неавторизованное обновление"} # Unauthorized update
    response_update = client.patch(detail_url, update_data, format="json")
    assert response_update.status_code == status.HTTP_403_FORBIDDEN # Или 401 / Or 401

    # Тест удаления (DELETE)
    # Test delete (DELETE)
    response_delete = client.delete(detail_url)
    assert response_delete.status_code == status.HTTP_403_FORBIDDEN # Или 401 / Or 401


@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture, expected_status", [
    ("front_desk_user", status.HTTP_200_OK), # Администратор должен иметь доступ (200 OK) / Admin should have access (200 OK)
    ("housekeeper_user", status.HTTP_403_FORBIDDEN), # Горничная не должна иметь доступа (403 Forbidden) / Housekeeper should not have access (403 Forbidden)
])
def test_booking_permissions_non_manager_or_admin(api_client, request, user_fixture, expected_status, manager_user, room_type_standard):
    """Тест, что только менеджеры и администраторы могут иметь доступ к эндпоинтам бронирований."""
    # Test that only managers and admins can access booking endpoints.
    client = api_client
    # Получаем пользователя из фикстуры по имени
    # Get the user from the fixture by name
    user = request.getfixturevalue(user_fixture)

    # Создаем бронирование для тестирования получения/обновления/удаления
    # Create a booking to test retrieve/update/delete
    room = Room.objects.create(number="997", floor=9, room_type=room_type_standard)
    booking = Booking.objects.create(room=room, check_in=timezone.now(), created_by=manager_user)

    # Тест списка (GET)
    # Test list (GET)
    list_url = reverse("booking-list")
    response_list = check_permission(client, user, list_url, 'GET')
    assert response_list.status_code == expected_status # Проверяем ожидаемый статус / Assert the expected status

    # Тест создания (POST)
    # Test create (POST)
    create_url = reverse("booking-list")
    create_data = {"room": room.id, "check_in": timezone.now().isoformat(), "guest_count": 1}
    response_create = check_permission(client, user, create_url, 'POST', data=create_data)
    # Для создания, только Менеджер/Администратор должны получить 201, остальные 403
    # For create, only Manager/Admin should get 201, others 403
    if user.role in [User.Role.MANAGER, User.Role.FRONT_DESK]:
         assert response_create.status_code == status.HTTP_201_CREATED
    else:
         assert response_create.status_code == status.HTTP_403_FORBIDDEN # Ожидаем 403 Forbidden / Expect 403 Forbidden


    # Тест получения (GET detail)
    # Test retrieve (GET detail)
    detail_url = reverse("booking-detail", args=[booking.id])
    response_retrieve = check_permission(client, user, detail_url, 'GET')
    assert response_retrieve.status_code == expected_status # Проверяем ожидаемый статус / Assert the expected status

    # Тест обновления (PATCH)
    # Test update (PATCH)
    update_data = {"notes": f"Попытка обновления пользователя {user.username}"} # {user.username} update attempt
    response_update = check_permission(client, user, detail_url, 'PATCH', data=update_data)
    assert response_update.status_code == expected_status # Проверяем ожидаемый статус / Assert the expected status

    # Тест удаления (DELETE)
    # Test delete (DELETE)
    # Создаем новое бронирование для теста удаления внутри этого цикла, чтобы избежать многократного удаления одного и того же
    # Create a new booking for deletion test within this loop to avoid deleting the same one multiple times
    booking_to_delete = Booking.objects.create(room=room, check_in=timezone.now(), created_by=manager_user)
    delete_url = reverse("booking-detail", args=[booking_to_delete.id])
    response_delete = check_permission(client, user, delete_url, 'DELETE')

    # Исправленная проверка: Ожидаем 204 No Content для успешного удаления авторизованными пользователями
    # Для неавторизованных пользователей ожидаем expected_status (403)
    # Corrected assertion: Expect 204 No Content for successful deletion by authorized users
    # For unauthorized users, expect the expected_status (403)
    if user.role in [User.Role.MANAGER, User.Role.FRONT_DESK]:
        assert response_delete.status_code == status.HTTP_204_NO_CONTENT
    else:
        assert response_delete.status_code == expected_status # Должен быть 403 для горничной / Should be 403 for housekeeper


@pytest.mark.django_db
def test_created_by_is_set_to_authenticated_user(api_client, manager_user, room_type_standard):
    """Тест, что поле created_by автоматически устанавливается на аутентифицированного пользователя при создании."""
    # Test that the created_by field is automatically set to the authenticated user on creation.
    client = api_client
    client.force_authenticate(user=manager_user) # Аутентифицируем менеджера / Authenticate the manager

    # Создаем номер для бронирования
    # Create a room for the booking
    room = Room.objects.create(number="999", floor=9, room_type=room_type_standard)

    # Получаем URL для создания бронирования
    # Get the URL for creating a booking
    url = reverse("booking-list")
    # Данные для создания бронирования
    # Data for creating the booking
    data = {
        "room": room.id,
        "check_in": timezone.now().isoformat(),
        "check_out": (timezone.now() + timedelta(days=2)).isoformat(),
        "guest_count": 2,
        "notes": "Создано тестом", # Created by test
        # Намеренно НЕ передаем created_by здесь
        # Intentionally do NOT pass created_by here
    }

    # Отправляем POST-запрос
    # Send a POST request
    response = client.post(url, data, format="json")

    # Проверяем статус ответа (должен быть 201 Created)
    # Assert the response status code (should be 201 Created)
    assert response.status_code == status.HTTP_201_CREATED

    # Получаем созданный объект бронирования
    # Get the created booking object
    booking = Booking.objects.first()
    # Проверяем, что created_by был установлен корректно методом perform_create
    # Verify created_by was set correctly by perform_create
    assert booking.created_by == manager_user