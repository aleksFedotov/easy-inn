import pytest
from rest_framework.exceptions import ValidationError
from incidents.models import IncidentReport
from incidents.serializers import IncidentReportSerializer
from hotel.models import Room
from users.models import User


@pytest.mark.django_db
def test_incident_report_serializer_valid_data():
    room = Room.objects.create(number="101", floor=1, status="needs_cleaning")
    user = User.objects.create_user(username="admin", password="testpass", role="admin")


    input_data = {
        "room" : room.id,
        "type" : "broken_item",
        "description" : "Сломанный душ",
        "reported_by" : user.id,
    
    }

    serializer = IncidentReportSerializer(data=input_data)

    assert serializer.is_valid() 
    serializer.save(reported_by=user)

    data = serializer.data
    assert data['room_number'] == room.number
    assert data['type'] == "broken_item"
    assert data['description'] == "Сломанный душ"
    assert data['reported_by'] == user.id
    assert data['status'] == "open"
    assert 'created_at' in data
    assert 'updated_at' in data
    

@pytest.mark.django_db
def test_incident_report_serializer_invalid_data():
    
    serializer = IncidentReportSerializer(data={})
    with pytest.raises(ValidationError):
        serializer.is_valid(raise_exception=True)

@pytest.mark.django_db
def test_incident_report_serializer_resolved_status():
    room = Room.objects.create(number="102", floor=1, status="needs_cleaning")
    user = User.objects.create_user(username="admin", password="testpass", role="admin")

    incident = IncidentReport.objects.create(
        room=room,
        type="broken_item",
        description="Сломанный холодильник",
        reported_by=user,
        status="resolved"
    )

    serializer = IncidentReportSerializer(incident)
    data = serializer.data
    assert data['is_resolved'] is True  # теперь инцидент должен быть решён

@pytest.mark.django_db
def test_incident_report_serializer_read_only_fields():
    room = Room.objects.create(number="103", floor=2, status="needs_cleaning")
    user = User.objects.create_user(username="admin", password="testpass", role="admin")

    report = IncidentReport.objects.create(
        room=room,
        type="broken_item",
        description="Сломанный душ",
        reported_by=user,
        status="new"
    )

    serializer = IncidentReportSerializer(report)
    data = serializer.data

    
    assert 'reported_by' in data
    assert 'created_at' in data
    assert 'updated_at' in data

   
    assert data['reported_by'] == user.id

