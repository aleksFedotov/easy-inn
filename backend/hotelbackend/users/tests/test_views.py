import pytest
from rest_framework.test import APIClient
from users.models import User
from django.urls import reverse 

@pytest.mark.django_db
def test_create_user():
    client = APIClient()
    user = User.objects.create(username = "manager", password="testpass123", role="manager")
    client.force_authenticate(user=user)
    data = {
        'username': 'newuser',
        'password': 'password123',
        'role': 'manager'
    }
    
    url = reverse('user-list') 
    
   
    response = client.post(url, data, format='json')

    assert response.status_code == 201  
    
    
    user = User.objects.get(username='newuser')
    assert user.username == 'newuser'
    assert user.check_password('password123') 
    assert user.role == 'manager'



@pytest.mark.django_db
def test_get_user_list():
    client = APIClient()
    user = User.objects.create_user(username="testuser", password="password123", role="manager")
    
    client.force_authenticate(user=user)  

    url = reverse('user-list') 
    response = client.get(url)

    assert response.status_code == 200  
    assert len(response.data) > 0  
    assert response.data[0]['username'] == 'testuser'  


@pytest.mark.django_db
def test_create_user_permission_check():
    admin_user = User.objects.create_user(username="admin", password="admin123", role="admin")
    client = APIClient()
    client.force_authenticate(user=admin_user)

    data = {
        'username': 'newuser',
        'password': 'password123',
        'role': 'manager'
    }
    url = reverse('user-list') 
   
    response = client.post(url, data, format='json')
    assert response.status_code == 403  
    
    maid_user = User.objects.create_user(username="maid", password="maid123", role="maid")
    client.force_authenticate(user=maid_user)


    response = client.post(url, data, format='json')
    assert response.status_code == 403  


    manager_user = User.objects.create_user(username="manager", password="manager123", role="manager")
    client.force_authenticate(user=manager_user)

    
    response = client.post(url, data, format='json')
    assert response.status_code == 201  


@pytest.mark.django_db
def test_get_user_detail():
    user = User.objects.create_user(username="testuser", password="password123", role="manager")
    client = APIClient()
    client.force_authenticate(user=user)

    url = reverse('user-detail', args=[user.id])
    response = client.get(url)

    assert response.status_code == 200  
    assert response.data['username'] == 'testuser'  
    assert response.data['role'] == 'manager'  

@pytest.mark.django_db
def test_delete_user():
    user = User.objects.create_user(username="testuser", password="password123", role="manager")
    client = APIClient()
    client.force_authenticate(user=user)

    url = reverse('user-detail',args=[user.id]) 
    response = client.delete(url)

    assert response.status_code == 204  
  
    with pytest.raises(User.DoesNotExist):
        User.objects.get(id=user.id)

