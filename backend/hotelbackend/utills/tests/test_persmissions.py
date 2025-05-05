import pytest
from rest_framework.test import APIClient
from users.models import User
from django.urls import reverse

@pytest.mark.django_db
def test_is_manager_permission():
    manager_user = User.objects.create_user(username="manager", password="password123", role="manager")

    client = APIClient()
    client.force_authenticate(user=manager_user)

    url = reverse('room-list')  
    response = client.get(url)
    
    assert response.status_code == 200  

@pytest.mark.django_db
def test_is_admin_permission():
    admin_user = User.objects.create_user(username="admin", password="admin123", role="admin")

    client = APIClient()
    client.force_authenticate(user=admin_user)
    
    url = reverse('cleaningtask-list') 
    response = client.get(url)
    
    assert response.status_code == 200 

@pytest.mark.django_db
def test_is_maid_permission():
    maid_user = User.objects.create_user(username="maid", password="maid123", role="maid")

    client = APIClient()
    client.force_authenticate(user=maid_user)
    
    url = reverse('cleaningtask-list')  
    response = client.get(url)
    
    assert response.status_code == 200 

@pytest.mark.django_db
def test_is_manager_or_admin_permission():
    client = APIClient()
    url = reverse('booking-list')  

    manager_user = User.objects.create_user(username="manager", password="manager123", role="manager")
    client.force_authenticate(user=manager_user)
    response = client.get(url)
    assert response.status_code == 200 

    admin_user = User.objects.create_user(username="admin", password="admin123", role="admin")
    client.force_authenticate(user=admin_user)
    response = client.get(url)
    assert response.status_code == 200  

    maid_user = User.objects.create_user(username="maid", password="maid123", role="maid")
    client.force_authenticate(user=maid_user)
    response = client.get(url)
    assert response.status_code == 403  