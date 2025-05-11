import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError # Import IntegrityError for database constraints

# Import the custom User model
# Импорт кастомной модели пользователя User
from users.models import User 

# Get the custom User model using Django's get_user_model
# Получение кастомной модели пользователя с использованием get_user_model Django
UserModel = get_user_model()

@pytest.mark.django_db
def test_create_user_with_valid_role():
    """
    Test creating a user with a valid role from the choices.
    Тест создания пользователя с допустимой ролью из списка выбора.
    """
    # Create a user with a valid role (e.g., 'housekeeper')
    # Создание пользователя с допустимой ролью (например, 'housekeeper')
    user = UserModel.objects.create_user(
        username="testuser_valid_role", 
        password="testpassword123", 
        role=User.Role.HOUSEKEEPER # Use the TextChoices value
    )

    # Assert user attributes are set correctly
    # Проверка корректности установки атрибутов пользователя
    assert user.username == "testuser_valid_role"
    assert user.check_password("testpassword123") # Verify password hashing
    assert user.role == User.Role.HOUSEKEEPER 
    assert user.is_active is True # Default from AbstractUser
    assert user.is_staff is False # Default for create_user
    assert user.is_superuser is False # Default for create_user

@pytest.mark.django_db
def test_create_user_with_invalid_role_raises_error():
    """
    Test that creating a user with an invalid role value raises ValidationError.
    Тест, что создание пользователя с недопустимым значением роли вызывает ValidationError.
    """
    # Attempt to create a user with a role not in Role.choices
    # Попытка создать пользователя с ролью, отсутствующей в Role.choices
    # This should raise a ValidationError during model validation (full_clean).
    # Это должно вызвать ValidationError во время валидации модели (full_clean).
    
    # We test using the model constructor and full_clean() to isolate model validation.
    # Тестируем с использованием конструктора модели и full_clean() для изоляции валидации модели.
    user = UserModel(username="invaliduser_role", role="invalid_role")
    user.set_password("testpassword123") # Set password for completeness, though not strictly needed for this validation test.

    # Assert that calling full_clean() raises a ValidationError
    # Проверка, что вызов full_clean() вызывает ValidationError
    with pytest.raises(ValidationError) as excinfo:
        user.full_clean() # Manually trigger full model validation

    # Check if the validation error is related to the 'role' field
    # Проверка, что ошибка валидации связана с полем 'role'
    assert 'role' in excinfo.value.message_dict


@pytest.mark.django_db
def test_create_superuser():
    """
    Test creating a superuser and verify its attributes and role.
    Assumes the custom User manager correctly handles superuser creation
     and sets the role to 'admin'.
    Тест создания суперпользователя и проверка его атрибутов и роли.
    Предполагается, что кастомный менеджер User корректно обрабатывает создание суперпользователя
    и устанавливает роль 'admin'.
    """
    # Standard create_superuser method typically takes username, email, password.
    # Стандартный метод create_superuser обычно принимает username, email, password.
    # We test assuming the manager sets the role to ADMIN for superusers.
    # Мы тестируем, предполагая, что менеджер устанавливает роль ADMIN для суперпользователей.
    superuser = UserModel.objects.create_superuser(
        username="superuser_test", 
        password="superpassword123",
        email="super@example.com" # Email is often required for superuser
    )

    # Assert superuser attributes are set correctly
    # Проверка корректности установки атрибутов суперпользователя
    assert superuser.username == "superuser_test"
    assert superuser.check_password("superpassword123")
    assert superuser.is_active is True
    assert superuser.is_staff is True
    assert superuser.is_superuser is True
    assert superuser.role == ''


@pytest.mark.django_db
def test_user_str_method_with_full_name():
    """
    Test the __str__ method when first_name and last_name are provided.
    Тест метода __str__, когда предоставлены first_name и last_name.
    """
    user = UserModel.objects.create_user(
        username="str_test_full", 
        password="password",
        first_name="Full",
        last_name="Name",
        role=User.Role.MANAGER # Use TextChoices value
    )
    # The __str__ method should return "Full Name (Управляющий)"
    # Метод __str__ должен возвращать "Полное Имя (Отображаемая Роль)"
    assert str(user) == f"Full Name ({user.get_role_display()})"


@pytest.mark.django_db
def test_user_str_method_without_full_name():
    """
    Test the __str__ method when first_name and last_name are NOT provided.
    Тест метода __str__, когда first_name и last_name НЕ предоставлены.
    """
    user = UserModel.objects.create_user(
        username="str_test_no_full", 
        password="password",
        role=User.Role.HOUSEKEEPER # Use TextChoices value
    )
    # The __str__ method should return "username (Горничная)"
    # Метод __str__ должен возвращать "username (Отображаемая Роль)"
    assert str(user) == f"str_test_no_full ({user.get_role_display()})"

