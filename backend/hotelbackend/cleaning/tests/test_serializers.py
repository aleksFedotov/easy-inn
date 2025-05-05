import pytest
from cleaning.models import ChecklistItemTemplate, CleaningChecklistTemplate
from hotel.models import Room,RoomType,CleaningChecklistTemplate
from booking.models import Booking
from cleaning.models import CleaningCheck,CleaningTask,CleaningCheckItem
from cleaning.serializers import ChecklistItemTemplateSerializer, CleaningCheckItemSerializer,CleaningTaskSerializer, CleaningCheckSerializer
from users.models import User
from django.utils import timezone
from datetime import timedelta


@pytest.mark.django_db
def setup_dependencies():

    user, _ = User.objects.get_or_create(
        username="admin",
        defaults={"password": "testpass123", "role": "admin"}
    )
    if not user.check_password("testpass123"):
        user.set_password("testpass123")
        user.save()

    template = CleaningChecklistTemplate.objects.create(name="Test Template", created_by=user)
    template_item = ChecklistItemTemplate.objects.create(template=template, text="Check bed", order=1)

    room_type = RoomType.objects.create(name="Standard", capacity=2)
    room = Room.objects.create(number="101", floor=1, room_type=room_type)
    booking = Booking.objects.create(
        room=room,
        check_in=timezone.now(),
        check_out=timezone.now() + timedelta(days=2),
        guest_count=2,
        notes="Test",
        created_by=user
    )

    task = CleaningTask.objects.create(room=room, booking=booking, assigned_to=user)
    cleaning_check = CleaningCheck.objects.create(cleaning_task=task, checked_by=user)

    return cleaning_check, template_item


@pytest.mark.django_db
def test_checklist_item_template_serializer_output():
    user = User.objects.create_user(username="admin", password="testpass123", role="admin")
    template = CleaningChecklistTemplate.objects.create(name="Standard Template", created_by=user)
    item = ChecklistItemTemplate.objects.create(template=template, text="Check windows", order=1)

    serializer = ChecklistItemTemplateSerializer(item)
    data = serializer.data

    assert data["id"] == item.id
    assert data["template"] == template.id
    assert data["text"] == "Check windows"
    assert data["order"] == 1


@pytest.mark.django_db
def test_checklist_item_template_serializer_valid_input():
    user = User.objects.create_user(username="admin", password="testpass123", role="admin")
    template = CleaningChecklistTemplate.objects.create(name="Standard Template", created_by=user)

    input_data = {
        "template": template.id,
        "text": "Check floor",
        "order": 2
    }

    serializer = ChecklistItemTemplateSerializer(data=input_data)
    assert serializer.is_valid(), serializer.errors
    instance = serializer.save()

    assert ChecklistItemTemplate.objects.count() == 1
    assert instance.text == "Check floor"
    assert instance.order == 2
    assert instance.template == template


@pytest.mark.django_db
def test_checklist_item_template_serializer_missing_text():
    user = User.objects.create_user(username="admin", password="testpass123", role="admin")
    template = CleaningChecklistTemplate.objects.create(name="Standard Template", created_by=user)

    invalid_data = {
        "template": template.id,
        "order": 1
    }

    serializer = ChecklistItemTemplateSerializer(data=invalid_data)
    assert not serializer.is_valid()
    assert "text" in serializer.errors


@pytest.mark.django_db
def test_cleaning_check_item_serializer_output():
    cleaning_check, template_item = setup_dependencies()

    item = CleaningCheckItem.objects.create(
        cleaning_check=cleaning_check,
        template_item=template_item,
        is_passed=True,
        comment="Looks good"
    )

    serializer = CleaningCheckItemSerializer(item)
    data = serializer.data

    assert data["id"] == item.id
    assert data["template_item"] == template_item.id
    assert data["is_passed"] is True
    assert data["comment"] == "Looks good"


@pytest.mark.django_db
def test_cleaning_check_item_serializer_valid_input():
    cleaning_check, template_item = setup_dependencies()

    input_data = {
        "template_item": template_item.id,
        "is_passed": False,
        "comment": "Needs more work"
    }

    serializer = CleaningCheckItemSerializer(data=input_data)
    assert serializer.is_valid(), serializer.errors
    instance = serializer.save(cleaning_check=cleaning_check)

    assert CleaningCheckItem.objects.count() == 1
    assert instance.template_item == template_item
    assert instance.comment == "Needs more work"
    assert instance.is_passed is False


@pytest.mark.django_db
def test_cleaning_check_serializer_output():
    cleaning_check, template_item = setup_dependencies()

    
    CleaningCheckItem.objects.create(
        cleaning_check=cleaning_check,
        template_item=template_item,
        is_passed=True,
        comment="Done well"
    )

    serializer = CleaningCheckSerializer(instance=cleaning_check)
    data = serializer.data

    assert data["id"] == cleaning_check.id
    assert data["cleaning_task"] == cleaning_check.cleaning_task.id
    assert data["status"] == cleaning_check.status
    assert data["notes"] == cleaning_check.notes
    assert isinstance(data["items"], list)
    assert len(data["items"]) == 1
    assert data["items"][0]["template_item"] == template_item.id
    assert data["items"][0]["is_passed"] is True


@pytest.mark.django_db
def test_cleaning_check_serializer_read_only_field():
    cleaning_check, template_item = setup_dependencies()

    
    input_data = {
        "cleaning_task": cleaning_check.cleaning_task.id,
        "checklist": cleaning_check.checklist.id if cleaning_check.checklist else None,
        "status": "approved",
        "notes": "Everything looks fine",
        "checked_by": 999  
    }

    serializer = CleaningCheckSerializer(data=input_data)
    assert serializer.is_valid(), serializer.errors
    validated_data = serializer.validated_data

    assert "checked_by" not in validated_data
