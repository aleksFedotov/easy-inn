import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model


from hotel.models import RoomType, Room, Zone
from users.models import User 

# Get the custom User model that is active in settings.py
# Получаем кастомную модель User, активную в settings.py
UserModel = get_user_model()

# --- Fixtures ---
# Фикстуры предоставляют тестовые данные или ресурсы для тестов.
# Fixtures provide test data or resources for tests.

@pytest.fixture
def api_client():
  """
    A Django REST Framework API client instance.
    Used to simulate making HTTP requests to the API.
    Экземпляр клиента API Django REST Framework.
    Используется для имитации выполнения HTTP-запросов к API.
    """
  return APIClient()

@pytest.fixture
def create_user():
  """
    Fixture to create a user with a specific role.
    Returns a factory function that can be called with username, password, and role.
    Фикстура для создания пользователя с определенной ролью.
    Возвращает фабричную функцию, которую можно вызвать с именем пользователя, паролем и ролью.
    """
  def _create_user(username, password, role):
    # Use create_user method to ensure password hashing is handled correctly
        # Используем метод create_user, чтобы убедиться, что хеширование пароля обрабатывается корректно
    return UserModel.objects.create_user(
      username=username, 
      password=password, 
      role=role # Assuming your custom User model has a 'role' field / Предполагается, что ваша кастомная модель User имеет поле 'role'
    )
  return _create_user

@pytest.fixture
def manager_user(create_user):
  """Fixture to create and return a manager user."""
    # Calls the create_user factory with the MANAGER role / Вызывает фабрику create_user с ролью MANAGER
  return create_user("manager_user", "managerpass", User.Role.MANAGER) # Assuming User.Role.MANAGER exists / Предполагается, что User.Role.MANAGER существует

@pytest.fixture
def admin_user(create_user):
  """Fixture to create and return an admin user."""
    # Calls the create_user factory with the ADMIN role / Вызывает фабрику create_user с ролью ADMIN
  return create_user("admin_user", "adminpass", User.Role.ADMIN) # Assuming User.Role.ADMIN exists / Предполагается, что User.Role.ADMIN существует

@pytest.fixture
def cleaner_user(create_user):
  """Fixture to create and return a cleaner user."""
    # Calls the create_user factory with the HOUSEKEEPER role (assuming this is the cleaner role name)
    # Вызывает фабрику create_user с ролью HOUSEKEEPER (предполагается, что это имя роли уборщика)
  return create_user("cleaner_user", "cleanerpass", User.Role.HOUSEKEEPER) # Assuming User.Role.HOUSEKEEPER exists / Предполагается, что User.Role.HOUSEKEEPER существует

@pytest.fixture
def room_type_standard():
  """Fixture to create a standard RoomType."""
    # Creates a RoomType instance in the database / Создает экземпляр RoomType в базе данных
  return RoomType.objects.create(name="Standard", capacity=2)

@pytest.fixture
def room_deluxe(room_type_standard):
  """
    Fixture to create a Deluxe Room.
    Depends on the room_type_standard fixture.
    Фикстура для создания номера "Люкс".
    Зависит от фикстуры room_type_standard.
    """
    # Creates a Room instance linked to the room_type_standard / Создает экземпляр Room, связанный с room_type_standard
  return Room.objects.create(
    number=101, 
    floor=1, 
    room_type=room_type_standard, 
    status=Room.Status.FREE # Using the TextChoices value / Использование значения из TextChoices
  )

@pytest.fixture
def zone_lobby():
  """Fixture to create a Lobby Zone."""
    # Creates a Zone instance in the database / Создает экземпляр Zone в базе данных
  return Zone.objects.create(name="Lobby", floor=1)


# --- Helper function for permission checks ---
# Вспомогательная функция для проверки разрешений

def check_permission(api_client, user, url, method, data=None):
  """
    Helper to check permission for a given user, URL, and method.
    Authenticates the user, makes the request, and logs out.
    Вспомогательная функция для проверки разрешений для данного пользователя, URL и метода.
    Аутентифицирует пользователя, выполняет запрос и выходит из системы.

    Args:
        api_client: The DRF APIClient fixture. / Фикстура DRF APIClient.
        user: The user object to authenticate (or None for unauthenticated). / Объект пользователя для аутентификации (или None для неаутентифицированного).
        url: The URL to request. / URL для запроса.
        method: The HTTP method ('GET', 'POST', 'PATCH', 'PUT', 'DELETE'). / HTTP-метод ('GET', 'POST', 'PATCH', 'PUT', 'DELETE').
        data: Request data for POST/PATCH/PUT requests. / Данные запроса для запросов POST/PATCH/PUT.

    Returns:
        The response object from the API request. / Объект ответа от API-запроса.
    """
    # Authenticate the user if provided
    # Аутентифицируем пользователя, если предоставлен
  if user:
    api_client.force_authenticate(user=user)
  else:
    api_client.force_authenticate(user=None) # Ensure no user is authenticated / Убеждаемся, что ни один пользователь не аутентифицирован

    # Make the request based on the method
    # Выполняем запрос в зависимости от метода
  if method == 'GET':
    response = api_client.get(url)
  elif method == 'POST':
    response = api_client.post(url, data)
  elif method == 'PATCH':
    response = api_client.patch(url, data)
  elif method == 'PUT':
    response = api_client.put(url, data)
  elif method == 'DELETE':
    response = api_client.delete(url)
  else:
        # Raise an error for unsupported methods / Генерируем ошибку для неподдерживаемых методов
    raise ValueError(f"Unsupported HTTP method: {method}")

    # Logout the user if they were authenticated
    # Выходим из системы, если пользователь был аутентифицирован
  if user:
    api_client.logout() # Logout after each check if authenticated / Выходим после каждой проверки, если аутентифицирован

  return response

# --- Tests for RoomTypeViewSet Permissions ---
# Тесты разрешений для ViewSet RoomType

@pytest.mark.django_db # Mark test to use the database / Отмечаем тест для использования базы данных
# Parametrize the test to run with different user fixtures and expected statuses
# Параметризуем тест для запуска с различными фикстурами пользователей и ожидаемыми статусами
@pytest.mark.parametrize("user_fixture, expected_status", [
  (None, 403), # Unauthenticated user should get Forbidden / Неаутентифицированный пользователь должен получить Forbidden
  ("admin_user", 403), # Admin user should get Forbidden (based on IsManager permission) / Пользователь Admin должен получить Forbidden (на основе разрешения IsManager)
  ("cleaner_user", 403), # Cleaner user should get Forbidden (based on IsManager permission) / Пользователь Cleaner должен получить Forbidden (на основе разрешения IsManager)
  ("manager_user", 200), # Manager user should get OK / Пользователь Manager должен получить OK
])
def test_roomtype_list_permissions(api_client, request, user_fixture, expected_status):
  """
    Test permissions for listing RoomTypes.
    Проверка разрешений для просмотра списка RoomTypes.
    """
    # Get the user object from the fixture name / Получаем объект пользователя из имени фикстуры
  user = request.getfixturevalue(user_fixture) if user_fixture else None
    # Get the URL for the list action / Получаем URL для действия list
  url = reverse('roomtype-list') # Assumes router basename='roomtype' / Предполагается, что basename роутера='roomtype'
    # Use the helper function to check permission / Используем вспомогательную функцию для проверки разрешения
  response = check_permission(api_client, user, url, 'GET')
    # Assert the response status code matches the expected status / Проверяем, что код статуса ответа соответствует ожидаемому статусу
  assert response.status_code == expected_status

@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture, expected_status", [
  (None, 403), # Unauthenticated / Неаутентифицированный
  ("admin_user", 403), # Admin / Admin
  ("cleaner_user", 403), # Cleaner / Cleaner
  ("manager_user", 201), # Manager should be able to create / Manager должен иметь возможность создавать
])
def test_roomtype_create_permissions(api_client, request, user_fixture, expected_status):
  """
    Test permissions for creating RoomTypes.
    Проверка разрешений для создания RoomTypes.
    """
  user = request.getfixturevalue(user_fixture) if user_fixture else None
  url = reverse('roomtype-list')
  # Valid data for creation / Корректные данные для создания
  create_data = {'name': 'New Room Type', 'capacity': 1} 
  response = check_permission(api_client, user, url, 'POST', data=create_data)
  assert response.status_code == expected_status

@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture, expected_status", [
  (None, 403), # Unauthenticated / Неаутентифицированный
  ("admin_user", 403), # Admin / Admin
  ("cleaner_user", 403), # Cleaner / Cleaner
  ("manager_user", 200), # Manager should be able to retrieve / Manager должен иметь возможность получать
])
def test_roomtype_retrieve_permissions(api_client, request, user_fixture, expected_status, room_type_standard):
  """
    Test permissions for retrieving a single RoomType.
    Проверка разрешений для получения одного RoomType.
    Depends on room_type_standard fixture. / Зависит от фикстуры room_type_standard.
    """
  user = request.getfixturevalue(user_fixture) if user_fixture else None
    # Get the URL for the detail action using the instance's primary key
    # Получаем URL для действия detail, используя первичный ключ экземпляра
  url = reverse('roomtype-detail', args=[room_type_standard.pk]) # Assumes router basename='roomtype' / Предполагается, что basename роутера='roomtype'
  response = check_permission(api_client, user, url, 'GET')
  assert response.status_code == expected_status

@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture, expected_status", [
  (None, 403), # Unauthenticated / Неаутентифицированный
  ("admin_user", 403), # Admin / Admin
  ("cleaner_user", 403), # Cleaner / Cleaner
  ("manager_user", 200), # Manager should be able to update / Manager должен иметь возможность обновлять
])
def test_roomtype_update_permissions(api_client, request, user_fixture, expected_status, room_type_standard):
  """
    Test permissions for updating a RoomType.
    Проверка разрешений для обновления RoomType.
    Depends on room_type_standard fixture. / Зависит от фикстуры room_type_standard.
    """
  user = request.getfixturevalue(user_fixture) if user_fixture else None
  url = reverse('roomtype-detail', args=[room_type_standard.pk])
  update_data = {'name': 'Updated Standard'} # Valid data for update / Корректные данные для обновления
  response = check_permission(api_client, user, url, 'PATCH', data=update_data) # Using PATCH for partial update / Использование PATCH для частичного обновления
  assert response.status_code == expected_status

@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture, expected_status", [
  (None, 403), # Unauthenticated / Неаутентифицированный
  ("admin_user", 403), # Admin / Admin
  ("cleaner_user", 403), # Cleaner / Cleaner
  ("manager_user", 204), # Manager should be able to delete (204 No Content is typical for successful deletion)
    # Manager должен иметь возможность удалять (204 No Content - типичный статус для успешного удаления)
])
def test_roomtype_destroy_permissions(api_client, request, user_fixture, expected_status, room_type_standard):
  """
    Test permissions for deleting a RoomType.
    Проверка разрешений для удаления RoomType.
    Depends on room_type_standard fixture. / Зависит от фикстуры room_type_standard.
    """
  user = request.getfixturevalue(user_fixture) if user_fixture else None
  url = reverse('roomtype-detail', args=[room_type_standard.pk])
  response = check_permission(api_client, user, url, 'DELETE')
  assert response.status_code == expected_status


# --- Tests for RoomViewSet Permissions ---
# Тесты разрешений для ViewSet Room

@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture, expected_status", [
  (None, 403), # Unauthenticated / Неаутентифицированный
  ("admin_user", 403), # Admin / Admin
  ("cleaner_user", 403), # Cleaner / Cleaner
  ("manager_user", 200), # Manager should have access / Manager должен иметь доступ
])
def test_room_list_permissions(api_client, request, user_fixture, expected_status):
  """
    Test permissions for listing Rooms.
    Проверка разрешений для просмотра списка Rooms.
    """
  user = request.getfixturevalue(user_fixture) if user_fixture else None
  url = reverse('room-list') # Assumes router basename='room' / Предполагается, что basename роутера='room'
  response = check_permission(api_client, user, url, 'GET')
  assert response.status_code == expected_status

@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture, expected_status", [
  (None, 403), # Unauthenticated / Неаутентифицированный
  ("admin_user", 403), # Admin / Admin
  ("cleaner_user", 403), # Cleaner / Cleaner
  ("manager_user", 201), # Manager should be able to create / Manager должен иметь возможность создавать
])
def test_room_create_permissions(api_client, request, user_fixture, expected_status, room_type_standard):
  """
    Test permissions for creating Rooms.
    Проверка разрешений для создания Rooms.
    Depends on room_type_standard fixture. / Зависит от фикстуры room_type_standard.
    """
  user = request.getfixturevalue(user_fixture) if user_fixture else None
  url = reverse('room-list')
  # Valid data for creation. Note: room_type should be provided by ID if the serializer supports it for writing.
    # Корректные данные для создания. Примечание: room_type должен быть предоставлен по ID, если сериализатор поддерживает запись по ID.
  create_data = {
    'number': 999, 
    'floor': 9, 
    'room_type_id': room_type_standard.id, # Provide the ID of the related RoomType / Предоставляем ID связанного RoomType
    'status': Room.Status.FREE, # Using TextChoices value / Использование значения из TextChoices
    'is_active': True
  }
  response = check_permission(api_client, user, url, 'POST', data=create_data)
  assert response.status_code == expected_status


@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture, expected_status", [
  (None, 403), # Unauthenticated / Неаутентифицированный
  ("admin_user", 403), # Admin / Admin
  ("cleaner_user", 403), # Cleaner / Cleaner
  ("manager_user", 200), # Manager should be able to retrieve / Manager должен иметь возможность получать
])
def test_room_retrieve_permissions(api_client, request, user_fixture, expected_status, room_deluxe):
  """
    Test permissions for retrieving a single Room.
    Проверка разрешений для получения одного Room.
    Depends on room_deluxe fixture. / Зависит от фикстуры room_deluxe.
    """
  user = request.getfixturevalue(user_fixture) if user_fixture else None
  url = reverse('room-detail', args=[room_deluxe.pk]) # Assumes router basename='room' / Предполагается, что basename роутера='room'
  response = check_permission(api_client, user, url, 'GET')
  assert response.status_code == expected_status


@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture, expected_status", [
  (None, 403), # Unauthenticated / Неаутентифицированный
  ("admin_user", 403), # Admin / Admin
  ("cleaner_user", 403), # Cleaner / Cleaner
  ("manager_user", 200), # Manager should be able to update / Manager должен иметь возможность обновлять
])
def test_room_update_permissions(api_client, request, user_fixture, expected_status, room_deluxe):
  """
    Test permissions for updating a Room.
    Проверка разрешений для обновления Room.
    Depends on room_deluxe fixture. / Зависит от фикстуры room_deluxe.
    """
  user = request.getfixturevalue(user_fixture) if user_fixture else None
  url = reverse('room-detail', args=[room_deluxe.pk])
  update_data = {'status': Room.Status.DIRTY} # Valid data for update / Корректные данные для обновления
  response = check_permission(api_client, user, url, 'PATCH', data=update_data)
  assert response.status_code == expected_status

@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture, expected_status", [
  (None, 403), # Unauthenticated / Неаутентифицированный
  ("admin_user", 403), # Admin / Admin
  ("cleaner_user", 403), # Cleaner / Cleaner
  ("manager_user", 204), # Manager should be able to delete / Manager должен иметь возможность удалять
])
def test_room_destroy_permissions(api_client, request, user_fixture, expected_status, room_deluxe):
  """
    Test permissions for deleting a Room.
    Проверка разрешений для удаления Room.
    Depends on room_deluxe fixture. / Зависит от фикстуры room_deluxe.
    """
  user = request.getfixturevalue(user_fixture) if user_fixture else None
  url = reverse('room-detail', args=[room_deluxe.pk])
  response = check_permission(api_client, user, url, 'DELETE')
  assert response.status_code == expected_status


# --- Tests for ZoneViewSet Permissions ---
# Тесты разрешений для ViewSet Zone

@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture, expected_status", [
  (None, 403), # Unauthenticated / Неаутентифицированный
  ("admin_user", 403), # Admin / Admin
  ("cleaner_user", 403), # Cleaner / Cleaner
  ("manager_user", 200), # Manager should have access / Manager должен иметь доступ
])
def test_zone_list_permissions(api_client, request, user_fixture, expected_status):
  """
    Test permissions for listing Zones.
    Проверка разрешений для просмотра списка Zones.
    """
  user = request.getfixturevalue(user_fixture) if user_fixture else None
  url = reverse('zone-list') # Assumes router basename='zone' / Предполагается, что basename роутера='zone'
  response = check_permission(api_client, user, url, 'GET')
  assert response.status_code == expected_status

@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture, expected_status", [
  (None, 403), # Unauthenticated / Неаутентифицированный
  ("admin_user", 403), # Admin / Admin
  ("cleaner_user", 403), # Cleaner / Cleaner
  ("manager_user", 201), # Manager should be able to create / Manager должен иметь возможность создавать
])
def test_zone_create_permissions(api_client, request, user_fixture, expected_status):
  """
    Test permissions for creating Zones.
    Проверка разрешений для создания Zones.
    """
  user = request.getfixturevalue(user_fixture) if user_fixture else None
  url = reverse('zone-list')
  # Valid data for creation / Корректные данные для создания
  create_data = {'name': 'New Zone', 'floor': 5} 
  response = check_permission(api_client, user, url, 'POST', data=create_data)
  assert response.status_code == expected_status

@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture, expected_status", [
  (None, 403), # Unauthenticated / Неаутентифицированный
  ("admin_user", 403), # Admin / Admin
  ("cleaner_user", 403), # Cleaner / Cleaner
  ("manager_user", 200), # Manager should be able to retrieve / Manager должен иметь возможность получать
])
def test_zone_retrieve_permissions(api_client, request, user_fixture, expected_status, zone_lobby):
  """
    Test permissions for retrieving a single Zone.
    Проверка разрешений для получения одной Zone.
    Depends on zone_lobby fixture. / Зависит от фикстуры zone_lobby.
    """
  user = request.getfixturevalue(user_fixture) if user_fixture else None
  url = reverse('zone-detail', args=[zone_lobby.pk]) # Assumes router basename='zone' / Предполагается, что basename роутера='zone'
  response = check_permission(api_client, user, url, 'GET')
  assert response.status_code == expected_status

@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture, expected_status", [
  (None, 403), # Unauthenticated / Неаутентифицированный
  ("admin_user", 403), # Admin / Admin
  ("cleaner_user", 403), # Cleaner / Cleaner
  ("manager_user", 200), # Manager should be able to update / Manager должен иметь возможность обновлять
])
def test_zone_update_permissions(api_client, request, user_fixture, expected_status, zone_lobby):
  """
    Test permissions for updating a Zone.
    Проверка разрешений для обновления Zone.
    Depends on zone_lobby fixture. / Зависит от фикстуры zone_lobby.
    """
  user = request.getfixturevalue(user_fixture) if user_fixture else None
  url = reverse('zone-detail', args=[zone_lobby.pk])
  update_data = {'name': 'Updated Lobby'} # Valid data for update / Корректные данные для обновления
  response = check_permission(api_client, user, url, 'PATCH', data=update_data)
  assert response.status_code == expected_status

@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture, expected_status", [
  (None, 403), # Unauthenticated / Неаутентифицированный
  ("admin_user", 403), # Admin / Admin
  ("cleaner_user", 403), # Cleaner / Cleaner
  ("manager_user", 204), # Manager should be able to delete / Manager должен иметь возможность удалять
])
def test_zone_destroy_permissions(api_client, request, user_fixture, expected_status, zone_lobby):
  """
    Test permissions for deleting a Zone.
    Проверка разрешений для удаления Zone.
    Depends on zone_lobby fixture. / Зависит от фикстуры zone_lobby.
    """
  user = request.getfixturevalue(user_fixture) if user_fixture else None
  url = reverse('zone-detail', args=[zone_lobby.pk])
  response = check_permission(api_client, user, url, 'DELETE')
  assert response.status_code == expected_status