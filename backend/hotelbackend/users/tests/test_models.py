import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

@pytest.mark.django_db
def test_create_user():
    user = get_user_model().objects.create_user(
        username="testuser", password="testpassword123", role="maid"
    )

  
    assert user.username == "testuser"
    assert user.check_password("testpassword123")  
    assert user.role == "maid"  


@pytest.mark.django_db
def test_create_user_with_invalid_role():

    user = get_user_model()(username="invaliduser", password="testpassword123", role="invalid_role")
    

    with pytest.raises(ValidationError):
        user.full_clean()


@pytest.mark.django_db
def test_create_superuser():
    user = get_user_model().objects.create_superuser(
        username="superuser", password="testpassword123", role="admin"
    )

    assert user.username == "superuser"
    assert user.check_password("testpassword123")
    assert user.is_superuser is True
    assert user.is_staff is True
    assert user.role == "admin"


@pytest.mark.django_db
def test_create_user_without_role():
    
    user = get_user_model().objects.create_user(
        username="user_without_role", password="testpassword123"
    )

    #
    assert user.role == ""  


@pytest.mark.django_db
def test_user_str_method():
   
    user = get_user_model().objects.create_user(
        username="testuser", password="testpassword123", role="maid"
    )
    assert str(user) == "testuser"
