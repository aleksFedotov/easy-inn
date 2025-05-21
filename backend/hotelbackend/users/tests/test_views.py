import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from users.models import User

# Получаем кастомную модель пользователя / Get the custom User model
UserModel = get_user_model()

# --- Fixtures (Фикстуры) ---

@pytest.fixture
def api_client():
    """DRF API клиент / DRF API client instance."""
    return APIClient()

@pytest.fixture
def create_user():
    """Фикстура для создания пользователя с ролью / Fixture to create user with a specific role."""
    def _create_user(username, password, role):
        # Use create_user method for proper password hashing
        # Использование метода create_user для корректного хеширования пароля
        return UserModel.objects.create_user(
            username=username,
            password=password,
            role=role
        )
    return _create_user

@pytest.fixture
def manager_user(create_user):
    """Менеджер (имеет полные права доступа к UserViewSet) / Manager user (has full access to UserViewSet)."""
    return create_user("manager_user", "managerpass", User.Role.MANAGER)

@pytest.fixture
def front_desk_user(create_user):
    """Администратор (не имеет прав доступа к UserViewSet согласно permission_classes) / Admin user (does not have access to UserViewSet based on permission_classes)."""
    return create_user("front_desk_user", "adminpass", User.Role.FRONT_DESK)

@pytest.fixture
def cleaner_user(create_user):
    """Горничная (не имеет прав доступа к UserViewSet согласно permission_classes) / Housekeeper user (does not have access to UserViewSet based on permission_classes)."""
    return create_user("cleaner_user", "cleanerpass", User.Role.HOUSEKEEPER)


# --- Тесты на разрешения / Permission Tests ---

@pytest.mark.django_db
def test_user_list_permission_unauthenticated(api_client):
    """Неавторизованные пользователи не должны видеть список (ожидается 403 Forbidden) / Unauthenticated users cannot list users (expected 403 Forbidden)."""
    url = reverse('user-list') # Assumes router registered with 'users' / Предполагается, что роутер зарегистрирован с префиксом 'users'
    response = api_client.get(url)
    # Assert that the response status code is 403 Forbidden
    # Проверяем, что код статуса ответа 403 Forbidden
    assert response.status_code == 403

@pytest.mark.django_db
def test_user_list_permission_non_manager(api_client, front_desk_user, cleaner_user):
    """Пользователи без роли менеджера не могут получать список пользователей (ожидается 403 Forbidden) / Non-manager users cannot list users (expected 403 Forbidden)."""
    url = reverse('user-list')

    # Test with Admin user / Тест с пользователем Администратор
    api_client.force_authenticate(user=front_desk_user)
    response = api_client.get(url)
    assert response.status_code == 403 # Forbidden
    api_client.logout() # Logout after test / Выход после теста

    # Test with Housekeeper user / Тест с пользователем Горничная
    api_client.force_authenticate(user=cleaner_user)
    response = api_client.get(url)
    assert response.status_code == 403 # Forbidden
    api_client.logout()

@pytest.mark.django_db
def test_user_list_permission_manager(api_client, manager_user):
    """Менеджер может видеть список пользователей (ожидается 200 OK) / Manager can list all users (expected 200 OK)."""
    url = reverse('user-list')
    api_client.force_authenticate(user=manager_user)
    response = api_client.get(url)
    # Assert that the response status code is 200 OK
    # Проверяем, что код статуса ответа 200 OK
    assert response.status_code == 200
    api_client.logout()


@pytest.mark.django_db
def test_user_create_permission_unauthenticated(api_client):
    """Неавторизованные пользователи не могут создавать пользователей (ожидается 403 Forbidden) / Unauthenticated users cannot create users (expected 403 Forbidden)."""
    url = reverse('user-list') # POST to list URL creates / POST запрос на URL списка создает объект
    user_data = {'username': 'unauth_create', 'password': 'password123'}
    response = api_client.post(url, user_data)
    # Assert that the response status code is 403 Forbidden
    # Проверяем, что код статуса ответа 403 Forbidden
    assert response.status_code == 403

@pytest.mark.django_db
def test_user_create_permission_non_manager(api_client, front_desk_user, cleaner_user):
    """Пользователи без роли менеджера не могут создавать пользователей (ожидается 403 Forbidden) / Non-manager users cannot create users (expected 403 Forbidden)."""
    url = reverse('user-list')
    user_data = {'username': 'non_manager_create', 'password': 'password123'}

    # Test with Admin user / Тест с пользователем Администратор
    api_client.force_authenticate(user=front_desk_user)
    response = api_client.post(url, user_data)
    assert response.status_code == 403 # Forbidden
    api_client.logout()

    # Test with Housekeeper user / Тест с пользователем Горничная
    api_client.force_authenticate(user=cleaner_user)
    response = api_client.post(url, user_data)
    assert response.status_code == 403 # Forbidden
    api_client.logout()


@pytest.mark.django_db
def test_user_create_permission_manager(api_client, manager_user):
    """Менеджер может создавать пользователей (ожидается 201 Created) / Manager can create users (expected 201 Created)."""
    url = reverse('user-list')
    user_data = {
        'username': 'manager_created_user',
        'password': 'password123',
        'email': 'manager@example.com',
        'first_name': 'Manager',
        'last_name': 'Created',
        'role' : 'front-desk'
    }
    api_client.force_authenticate(user=manager_user)
    response = api_client.post(url, user_data)
    # Assert that the response status code is 201 Created
    # Проверяем, что код статуса ответа 201 Created
    assert response.status_code == 201
    # Verify that the user object was actually created in the database
    # Проверяем, что объект пользователя действительно был создан в базе данных
    assert UserModel.objects.filter(username='manager_created_user').exists()
    api_client.logout()


@pytest.mark.django_db
def test_user_retrieve_permission_unauthenticated(api_client, manager_user):
    """Неавторизованные пользователи не могут просматривать пользователей (ожидается 403 Forbidden) / Unauthenticated users cannot retrieve user data (expected 403 Forbidden)."""
    url = reverse('user-detail', args=[manager_user.pk]) # Use manager_user as a target / Используем manager_user как целевой объект
    response = api_client.get(url)
    # Assert that the response status code is 403 Forbidden
    # Проверяем, что код статуса ответа 403 Forbidden
    assert response.status_code == 403


@pytest.mark.django_db
def test_user_retrieve_permission_non_manager(api_client, manager_user, front_desk_user, cleaner_user):
    """Пользователи без роли менеджера не могут просматривать пользователей (ожидается 403 Forbidden) / Non-manager users cannot retrieve users (expected 403 Forbidden)."""
    url = reverse('user-detail', args=[manager_user.pk]) # Use manager_user as a target / Используем manager_user как целевой объект

    # Test with Admin user / Тест с пользователем Администратор
    api_client.force_authenticate(user=front_desk_user)
    response = api_client.get(url)
    assert response.status_code == 403 # Forbidden
    api_client.logout()

    # Test with Housekeeper user / Тест с пользователем Горничная
    api_client.force_authenticate(user=cleaner_user)
    response = api_client.get(url)
    assert response.status_code == 403 # Forbidden
    api_client.logout()


@pytest.mark.django_db
def test_user_retrieve_permission_manager(api_client, manager_user, cleaner_user):
    """Менеджер может просматривать любого пользователя (ожидается 200 OK) / Manager can retrieve any user (expected 200 OK)."""
    url = reverse('user-detail', args=[cleaner_user.pk]) # Manager retrieves Housekeeper / Менеджер просматривает Горничную
    api_client.force_authenticate(user=manager_user)
    response = api_client.get(url)
    # Assert that the response status code is 200 OK
    # Проверяем, что код статуса ответа 200 OK
    assert response.status_code == 200
    # Verify that the correct user data is returned
    # Проверяем, что возвращены данные правильного пользователя
    assert response.data['username'] == cleaner_user.username
    api_client.logout()


@pytest.mark.django_db
def test_user_update_permission_unauthenticated(api_client, cleaner_user):
    """Неавторизованные пользователи не могут обновлять данные пользователя (ожидается 403 Forbidden) / Unauthenticated users cannot update users (expected 403 Forbidden)."""
    url = reverse('user-detail', args=[cleaner_user.pk])
    update_data = {'first_name': 'Unauthorized Update'}
    response = api_client.patch(url, update_data)
    # Assert that the response status code is 403 Forbidden
    # Проверяем, что код статуса ответа 403 Forbidden
    assert response.status_code == 403


@pytest.mark.django_db
def test_user_update_permission_non_manager(api_client, cleaner_user, front_desk_user):
    """Пользователи без роли менеджера не могут обновлять пользователей (ожидается 403 Forbidden) / Non-manager users cannot update users (expected 403 Forbidden)."""
    url = reverse('user-detail', args=[cleaner_user.pk])
    update_data = {'first_name': 'Forbidden Update'}

    # Test with Admin user / Тест с пользователем Администратор
    api_client.force_authenticate(user=front_desk_user)
    response = api_client.patch(url, update_data)
    assert response.status_code == 403 # Forbidden
    api_client.logout()


@pytest.mark.django_db
def test_user_update_permission_manager(api_client, manager_user, cleaner_user):
    """Менеджер может обновить данные пользователя (ожидается 200 OK) / Manager can update any user (expected 200 OK)."""
    url = reverse('user-detail', args=[cleaner_user.pk])
    update_data = {'first_name': 'Manager Updated Name'}
    api_client.force_authenticate(user=manager_user)
    response = api_client.patch(url, update_data)
    # Assert that the response status code is 200 OK
    # Проверяем, что код статуса ответа 200 OK
    assert response.status_code == 200
    # Refresh the user instance from the database to check the update
    # Обновляем экземпляр пользователя из базы данных для проверки обновления
    cleaner_user.refresh_from_db()
    assert cleaner_user.first_name == 'Manager Updated Name'
    api_client.logout()


@pytest.mark.django_db
def test_user_destroy_permission_unauthenticated(api_client, cleaner_user):
    """Неавторизованные пользователи не могут удалять пользователей (ожидается 403 Forbidden) / Unauthenticated users cannot delete users (expected 403 Forbidden)."""
    url = reverse('user-detail', args=[cleaner_user.pk])
    response = api_client.delete(url)
    # Assert that the response status code is 403 Forbidden
    # Проверяем, что код статуса ответа 403 Forbidden
    assert response.status_code == 403

@pytest.mark.django_db
def test_user_destroy_permission_non_manager(api_client, cleaner_user, front_desk_user):
    """Пользователи без роли менеджера не могут удалять пользователей (ожидается 403 Forbidden) / Non-manager users cannot delete users (expected 403 Forbidden)."""
    url = reverse('user-detail', args=[cleaner_user.pk])

    # Test with Admin user / Тест с пользователем Администратор
    api_client.force_authenticate(user=front_desk_user)
    response = api_client.delete(url)
    assert response.status_code == 403 # Forbidden
    api_client.logout()

@pytest.mark.django_db
def test_user_destroy_permission_manager(api_client, manager_user, cleaner_user):
    """Менеджер может удалять пользователя (ожидается 204 No Content) / Manager can delete users (expected 204 No Content)."""
    url = reverse('user-detail', args=[cleaner_user.pk])
    api_client.force_authenticate(user=manager_user)
    response = api_client.delete(url)
    # Assert that the response status code is 204 No Content (successful deletion)
    # Проверяем, что код статуса ответа 204 No Content (успешное удаление)
    assert response.status_code == 204
    # Verify that the user object was deleted from the database
    # Проверяем, что объект пользователя был удален из базы данных
    assert not UserModel.objects.filter(pk=cleaner_user.pk).exists()
    api_client.logout()
