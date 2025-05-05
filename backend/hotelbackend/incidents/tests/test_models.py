import pytest
from django.utils import timezone
from incidents.models import IncidentReport
from hotel.models import Room, RoomType
from users.models import User

@pytest.mark.django_db
def test_create_incident_report():
    room = Room.objects.create(
        number = 208,
        floor = 2,
        status = "needs_cleaning"
    )
    user = User.objects.create_user(username="admin", password="testpass", role ='admin')

    incident = IncidentReport.objects.create(
        room=room,
        type='broken_item',
        description="Сломанный душ",
        reported_by=user
    )

    assert incident.pk is not None
    assert incident.status == 'open'
    assert incident.type == 'broken_item'
    assert incident.room == room
    assert incident.reported_by == user
    assert incident.description == "Сломанный душ"

@pytest.mark.django_db
def test_str_representation():
    room = Room.objects.create(
        number = 208,
        floor = 2,
        status = "needs_cleaning"
    )
    incident = IncidentReport.objects.create(room=room)

    expected = f"Поломка — комната 208 (Зарегистрирована)"
    assert str(incident) == expected

@pytest.mark.django_db
def test_is_resolved_method():
    room = Room.objects.create(
        number = 208,
        floor = 2,
        status = "needs_cleaning"
    )
    incident = IncidentReport.objects.create(room=room)

    assert incident.is_resolved() is False
    incident.status = 'resolved'
    assert incident.is_resolved() is True

@pytest.mark.django_db
def test_auto_timestamps():
    room = Room.objects.create(
        number = 208,
        floor = 2,
        status = "needs_cleaning"
    )
    incident = IncidentReport.objects.create(room=room)

    now = timezone.now()
    assert incident.created_at <= now
    assert incident.updated_at <= now

@pytest.mark.django_db
def test_defaults_applied():
    room = Room.objects.create(
        number = 208,
        floor = 2,
        status = "needs_cleaning"
    )
    incident = IncidentReport.objects.create(room=room)

    assert incident.type == 'broken_item'
    assert incident.status == 'open'
