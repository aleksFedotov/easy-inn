import pytest
from rest_framework.test import APIClient
from django.urls import reverse

from incidents.models import IncidentReport
from hotel.models import Room
from users.models import User


@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user():
    return User.objects.create_user(username='user1', password='pass1234', role='admin')

@pytest.fixture
def room():
    return Room.objects.create(number='105', floor=1, status='available')

@pytest.mark.django_db
def test_create_incident_report(api_client, user, room):
    api_client.force_authenticate(user=user)
    url = reverse('incidentreport-list')  # ⚠️ Убедись, что это имя указано в urls через DRF router

    data = {
        "room": room.id,
        "type": "broken_item",
        "description": "Разбитое окно"
    }

    response = api_client.post(url, data, format='json')
    assert response.status_code == 201
    assert IncidentReport.objects.count() == 1
    incident = IncidentReport.objects.first()
    assert incident.description == "Разбитое окно"
    assert incident.reported_by == user


@pytest.mark.django_db
def test_list_incident_reports(api_client, user, room):
    incident = IncidentReport.objects.create(room=room, type="broken_item", description="Test", reported_by=user)
    api_client.force_authenticate(user=user)
    url = reverse('incidentreport-list')
    response = api_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]['description'] == "Test"


@pytest.mark.django_db
def test_retrieve_incident_report(api_client, user, room):
    incident = IncidentReport.objects.create(room=room, type="broken_item", description="Test", reported_by=user)
    api_client.force_authenticate(user=user)
    url = reverse('incidentreport-detail', args=[incident.id])
    response = api_client.get(url)
    assert response.status_code == 200
    assert response.data['id'] == incident.id


@pytest.mark.django_db
def test_update_incident_report(api_client, user, room):
    incident = IncidentReport.objects.create(room=room, type="broken_item", description="Old", reported_by=user)
    api_client.force_authenticate(user=user)
    url = reverse('incidentreport-detail', args=[incident.id])
    updated_data = {
        "room": room.id,
        "type": "broken_item",
        "description": "Updated description",
        "status": "open"
    }
    response = api_client.put(url, updated_data, format='json')
    assert response.status_code == 200
    incident.refresh_from_db()
    assert incident.description == "Updated description"


@pytest.mark.django_db
def test_delete_incident_report(api_client, user, room):
    incident = IncidentReport.objects.create(room=room, type="broken_item", description="To delete", reported_by=user)
    api_client.force_authenticate(user=user)
    url = reverse('incidentreport-detail', args=[incident.id])
    response = api_client.delete(url)
    assert response.status_code == 204
    assert IncidentReport.objects.count() == 0


@pytest.mark.django_db
def test_unauthenticated_user_cannot_create(api_client, room):
    url = reverse('incidentreport-list')
    data = {
        "room": room.id,
        "type": "broken_item",
        "description": "Unauthorized attempt"
    }
    response = api_client.post(url, data, format='json')
    assert response.status_code in [403,401]