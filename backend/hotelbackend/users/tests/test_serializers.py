import pytest
from users.models import User
from users.serializers import UserSerializer, UserCreateSerializer

@pytest.mark.django_db
def test_user_serializer():
    user = User.objects.create_user(username="testuser", password="password123", role="admin")
    
    serializer = UserSerializer(user)
    data = serializer.data
   
    assert data['id'] == user.id
    assert data['username'] == "testuser"
    assert data['email'] == user.email
    assert data['role'] == "admin"


@pytest.mark.django_db
def test_user_create_serializer_valid_data():
    data = {
        'username': 'newuser',
        'password': 'password123',
        'role': 'manager'
    }

    serializer = UserCreateSerializer(data=data)
    assert serializer.is_valid()

    
    user = serializer.save()
    assert user.username == 'newuser'
    assert user.role == 'manager'
    assert user.check_password('password123')  

@pytest.mark.django_db
def test_user_create_serializer_invalid_data():
    data = {
        'username': '', 
        'password': 'password123',
        'role': 'admin'
    }

    serializer = UserCreateSerializer(data=data)
    assert not serializer.is_valid()  
    assert 'username' in serializer.errors  

@pytest.mark.django_db
def test_user_create_serializer_password_is_write_only():
    data = {
        'username': 'newuser',
        'password': 'password123',
        'role': 'manager'
    }

    serializer = UserCreateSerializer(data=data)
    assert serializer.is_valid()

    user = serializer.save()

    assert 'password' not in serializer.data

@pytest.mark.django_db
def test_user_create_serializer_missing_password():
    data = {
        'username': 'newuser',
        'role': 'manager'
    }

    serializer = UserCreateSerializer(data=data)
    
    assert not serializer.is_valid()
    assert 'password' in serializer.errors  

@pytest.mark.django_db
def test_user_create_serializer_role():
    data = {
        'username': 'newuser',
        'password': 'password123',
        'role': 'maid'
    }

    serializer = UserCreateSerializer(data=data)
    assert serializer.is_valid()

    user = serializer.save()
    
    assert user.role == 'maid'
