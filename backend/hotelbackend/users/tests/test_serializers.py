import pytest
from django.contrib.auth import get_user_model
from users.models import User
from users.serializers import UserSerializer
from rest_framework.exceptions import ValidationError as DRFValidationError


# Get the custom User model
# Получение кастомной модели пользователя
UserModel = get_user_model()

@pytest.mark.django_db
def test_user_serialization():
    """
    Test that the UserSerializer correctly serializes a User object.
    Password field should not be included in the output.

    Тест, что UserSerializer корректно сериализует объект User.
    Поле password не должно включаться в выходные данные.
    """
    # Create a user instance with specific attributes
    # Создаем экземпляр пользователя с определенными атрибутами
    user = UserModel.objects.create_user(
        username="testuser_serialize",
        password="testpassword123",
        role=User.Role.HOUSEKEEPER, # Use the correct Role enum value / Использование корректного значения Role
        first_name="Test",
        last_name="User"
    )

    # Instantiate the serializer with the user instance
    # Создаем экземпляр сериализатора с экземпляром пользователя
    serializer = UserSerializer(instance=user)

    # Get the serialized data (Python dictionary)
    # Получаем сериализованные данные (словарь Python)
    data = serializer.data

    # Assert that required fields are present in the output
    # Проверяем, что обязательные поля присутствуют в выходных данных
    assert 'id' in data
    assert 'username' in data
    assert 'role' in data
    assert 'first_name' in data
    assert 'last_name' in data

    # Ensure the write-only password field is NOT present in the output
    # Убеждаемся, что поле password (только для записи) НЕ присутствует в выходных данных
    assert 'password' not in data

    # Check specific values in the serialized data
    # Проверяем конкретные значения в сериализованных данных
    assert data['username'] == "testuser_serialize"
    assert data['role'] == User.Role.HOUSEKEEPER # Check the role value / Проверка значения роли
    assert data['first_name'] == "Test"
    assert data['last_name'] == "User"

    # Check read-only fields values
    # Проверяем значения полей только для чтения
    assert data['id'] == user.id
    assert data['role'] == User.Role.HOUSEKEEPER # 'role' is read_only, should be in output / 'role' только для чтения, должно быть в выходных данных

@pytest.mark.django_db
def test_user_create_serializer_valid_data():
    """
    Test that the UserSerializer validates valid creation data.
    Тест, что UserSerializer валидирует корректные данные для создания.
    """
    # Valid data for creating a user. Role is not provided as it's read_only
    # and has a default in the model.
    # Корректные данные для создания пользователя. Роль не предоставляется, так как она только для чтения
    # и имеет значение по умолчанию в модели.
    valid_data = {
        'username': 'newuser_create',
        'password': 'securepassword',
        'first_name': 'New',
        'last_name': 'User',
        'role': 'front-desk'
    }

    # Instantiate the serializer with the data
    # Создаем экземпляр сериализатора с данными
    serializer = UserSerializer(data=valid_data)

    # Assert that the data is valid. raise_exception=True provides detailed errors on failure.
    # Проверяем, что данные корректны. raise_exception=True предоставляет детальные ошибки при сбое.
    assert serializer.is_valid(raise_exception=True)

    # Check the validated data. Password should be included as plain text here before hashing.
    # Проверяем валидированные данные. Пароль должен быть включен как обычный текст здесь перед хешированием.
    validated_data = serializer.validated_data
    assert 'username' in validated_data
    assert 'password' in validated_data # Password is in validated_data for create / Пароль в validated_data для создания
    assert 'first_name' in validated_data
    assert 'last_name' in validated_data

 

    assert validated_data['username'] == 'newuser_create'
    assert validated_data['password'] == 'securepassword'


@pytest.mark.django_db
def test_user_create_serializer_invalid_data():
    """
    Test that the UserSerializer rejects invalid creation data.
    (e.g., missing required fields like username, or invalid data types)

    Тест, что UserSerializer отклоняет некорректные данные для создания.
    (например, отсутствуют обязательные поля, такие как username, или некорректные типы данных)
    """
    # Invalid data: missing username (required by AbstractUser)
    # Некорректные данные: отсутствует username (обязательно для AbstractUser)
    invalid_data = {
        'password': 'securepassword',
        'first_name': 'Invalid',
        'last_name': 'User',
    }

    serializer = UserSerializer(data=invalid_data)

    # Assert that the data is NOT valid
    # Проверяем, что данные НЕ корректны
    assert not serializer.is_valid()

    # Check for specific validation errors
    # Проверяем наличие конкретных ошибок валидации
    assert 'username' in serializer.errors # Expecting a validation error for missing username / Ожидается ошибка валидации для отсутствующего username

    # Invalid data: username too long (assuming default max_length=150 for username)
    # Некорректные данные: слишком длинный username (предполагается max_length=150 для username по умолчанию)
    invalid_data_long_username = {
        'username': 'a' * 151,
        'password': 'securepassword',
    }
    serializer_long = UserSerializer(data=invalid_data_long_username)
    assert not serializer_long.is_valid()
    assert 'username' in serializer_long.errors


@pytest.mark.django_db
def test_user_create_serializer_create_method():
    """
    Test that the create() method of the UserSerializer creates a User object
    with a correctly hashed password and default role when role is not provided.

    Тест, что метод create() UserSerializer создает объект User
    с корректно хешированным паролем и ролью по умолчанию, когда роль не предоставлена.
    """
    valid_data = {
        'username': 'user_to_create',
        'password': 'createpassword',
        'first_name': 'Created',
        'last_name': 'User',
        'role': 'front-desk'
    }

    serializer = UserSerializer(data=valid_data)
    # Ensure data is valid before attempting to save
    # Убеждаемся, что данные корректны перед попыткой сохранения
    assert serializer.is_valid(raise_exception=True)

    # Call the create method via serializer.save()
    # Вызываем метод create через serializer.save()
    user = serializer.save()

    # Assert that a User object was created
    # Проверяем, что объект User был создан
    assert isinstance(user, UserModel)
    assert user.pk is not None # Check if it has been saved to the database / Проверка сохранения в базу данных

    # Check the user's attributes
    # Проверяем атрибуты пользователя
    assert user.username == 'user_to_create'
    assert user.first_name == 'Created'
    assert user.last_name == 'User'
   

    # Check that the password was correctly hashed
    # Проверяем, что пароль был корректно хеширован
    assert user.check_password('createpassword')

    


@pytest.mark.django_db
def test_user_update_serializer_valid_data():
    """
    Test that the UserSerializer validates valid update data.
    Тест, что UserSerializer валидирует корректные данные для обновления.
    """
    # Create an existing user instance
    # Создаем существующий экземпляр пользователя
    user = UserModel.objects.create_user(
        username="user_to_update",
        password="oldpassword",
        role=User.Role.FRONT_DESK # User created with admin role / Пользователь создан с ролью admin
    )

    # Valid data for updating the user (changing first name and password)
    # Valid data for updating the user (changing first name and password)
    # Role is read_only, providing it should be ignored by update method
    # Роль является полем только для чтения, ее предоставление должно игнорироваться методом update
    valid_update_data = {
        'first_name': 'Updated',
        'password': 'newpassword',
        'role': User.Role.MANAGER # Attempting to change read-only role / Попытка изменить роль (только для чтения)
    }

    # Instantiate the serializer with the instance and the update data
    # Создаем экземпляр сериализатора с экземпляром и данными для обновления
    serializer = UserSerializer(instance=user, data=valid_update_data, partial=True) # Use partial=True for PATCH / Использование partial=True для PATCH

    # Assert that the data is valid
    # Проверяем, что данные корректны
    assert serializer.is_valid(raise_exception=True)

    # Check the validated data. New password should be in validated_data.
    # Проверяем валидированные данные. Новый пароль должен быть в validated_data.
    validated_data = serializer.validated_data
    assert 'first_name' in validated_data
    assert 'password' in validated_data # New password is in validated_data for update / Новый пароль в validated_data для обновления
    assert validated_data['first_name'] == 'Updated'
    assert validated_data['password'] == 'newpassword'
    assert validated_data['role'] == 'manager'



@pytest.mark.django_db
def test_user_update_serializer_update_method():
    """
    Test that the update() method of the UserSerializer correctly updates
    a User object, including changing the password, and does NOT change read-only fields like role.

    Тест, что метод update() UserSerializer корректно обновляет объект User,
    включая изменение пароля, и НЕ изменяет поля только для чтения
    """
    # Create an existing user instance
    # Создаем существующий экземпляр пользователя
    user = UserModel.objects.create_user(
        username="user_to_update_method",
        password="oldpassword123",
        first_name="Old",
        last_name="Name",
        role=User.Role.HOUSEKEEPER # Initial role / Начальная роль
    )

    # Data for updating the user (changing first name, last name, and password)
    # Providing a role here should be ignored by the update method.
    # Данные для обновления пользователя (изменение имени, фамилии и пароля).
    # Предоставление роли здесь должно игнорироваться методом update.
    update_data = {
        'first_name': 'New',
        'last_name': 'LastName',
        'password': 'brandnewpassword',
    }

    # Instantiate the serializer with the instance and the update data
    # Создаем экземпляр сериализатора с экземпляром и данными для обновления
    serializer = UserSerializer(instance=user, data=update_data, partial=True) # Use partial=True for PATCH / Использование partial=True для PATCH

    # Ensure data is valid
    # Убеждаемся, что данные корректны
    assert serializer.is_valid(raise_exception=True)
    # Call the update method via serializer.save()
    # Вызываем метод update через serializer.save()
    updated_user = serializer.save()

    # Assert that the returned object is the same instance
    # Проверяем, что возвращенный объект является тем же экземпляром
    assert updated_user.pk == user.pk

    # Refresh the instance from the database to get the latest data
    # Обновляем экземпляр из базы данных, чтобы получить последние данные
    updated_user.refresh_from_db()

    # Check the updated attributes
    # Проверяем обновленные атрибуты
    assert updated_user.first_name == 'New'
    assert updated_user.last_name == 'LastName'
    # Check that the password was correctly updated and hashed
    # Проверяем, что пароль был корректно обновлен и хеширован
    assert updated_user.check_password('brandnewpassword')
    # Check that the old password no longer works
    # Проверяем, что старый пароль больше не работает
    assert not updated_user.check_password('oldpassword123')
    # Check that the role was NOT changed (because it's read_only)
    # Проверяем, что роль НЕ была изменена (потому что она только для чтения)
  


@pytest.mark.django_db
def test_user_update_serializer_no_password_change():
    """
    Test that the update() method works correctly when the password is not provided
    in the update data. The original password should remain unchanged.

    Тест, что метод update() работает корректно, когда пароль не предоставлен
    в данных для обновления. Исходный пароль должен остаться без изменений.
    """
    # Create an existing user instance
    # Создаем существующий экземпляр пользователя
    user = UserModel.objects.create_user(
        username="user_no_pass_change",
        password="originalpassword",
        first_name="Original",
        last_name="User",
        role=User.Role.MANAGER # Initial role / Начальная роль
    )

    # Data for updating the user (changing only first name)
    # Данные для обновления пользователя (изменение только имени)
    update_data = {
        'first_name': 'Modified',
    }

    # Instantiate the serializer with the instance and the update data
    # Создаем экземпляр сериализатора с экземпляром и данными для обновления
    serializer = UserSerializer(instance=user, data=update_data, partial=True) # Use partial=True for PATCH / Использование partial=True для PATCH

    # Ensure data is valid
    # Убеждаемся, что данные корректны
    assert serializer.is_valid(raise_exception=True)

    # Call the update method via serializer.save()
    # Вызываем метод update через serializer.save()
    updated_user = serializer.save()

    # Refresh the instance from the database
    # Обновляем экземпляр из базы данных
    updated_user.refresh_from_db()

    # Check the updated attribute
    # Проверяем обновленный атрибут
    assert updated_user.first_name == 'Modified'
    # Check that the original password still works
    # Проверяем, что исходный пароль все еще работает
    assert updated_user.check_password('originalpassword')
    # Check that the role was NOT changed (because it's read_only)
    # Проверяем, что роль НЕ была изменена (потому что она только для чтения)
    assert updated_user.role == User.Role.MANAGER # Assert role remains the initial role / Проверка, что роль осталась начальной
