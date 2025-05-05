import pytest
from cleaning.models import (
    CleaningTask,
    CleaningCheck,
    ChecklistItemTemplate,
    CleaningCheckItem
)
from hotel.models import Room, RoomType, CleaningChecklistTemplate
from users.models import User
from booking.models import Booking
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError


@pytest.mark.django_db
def test_create_task():
 
    room_type = RoomType.objects.create(name="Standard", capacity=2)
    room = Room.objects.create(number="101", floor=1, room_type=room_type)
    admin = User.objects.create_user(username="admin", password="testpass123", role='admin')
    maid = User.objects.create_user(username="maid", password="testpass123", role='maid')

    
    check_in = timezone.now()
    check_out = check_in + timedelta(days=3)
    booking = Booking.objects.create(
        room=room,
        check_in=check_in,
        check_out=check_out,
        guest_count=2,
        notes="Test booking",
        created_by=admin
    )

    
    due_time = timezone.now() + timedelta(hours=3)

    
    cleaning_task = CleaningTask.objects.create(
        room=room,
        booking=booking,
        assigned_to=maid,
        due_time=due_time,
    )

    
    assert CleaningTask.objects.count() == 1
    assert cleaning_task.room == room
    assert cleaning_task.booking == booking
    assert cleaning_task.assigned_to == maid
    assert cleaning_task.status == "pending"
    assert cleaning_task.due_time == due_time


@pytest.mark.django_db
def test_invalid_room_number():
 
    room_type = RoomType.objects.create(name="Standard", capacity=2)
    room = Room.objects.create(number="101", floor=1, room_type=room_type)
    another_room = Room.objects.create(number="202", floor=2, room_type=room_type)
    admin = User.objects.create_user(username="admin", password="testpass123", role='admin')
    maid = User.objects.create_user(username="maid", password="testpass123", role='maid')

    
    check_in = timezone.now()
    check_out = check_in + timedelta(days=3)
    booking = Booking.objects.create(
        room=room,
        check_in=check_in,
        check_out=check_out,
        guest_count=2,
        notes="Test booking",
        created_by=admin
    )

    
    due_time = timezone.now() + timedelta(hours=3)

    
    cleaning_task = CleaningTask.objects.create(
        room=another_room,
        booking=booking,
        assigned_to=maid,
        due_time=due_time,
    )

    
    with pytest.raises(ValidationError) as exc:
        cleaning_task.full_clean()

    assert 'Комната в задаче не совпадает с комнатой в бронировании.' in str(exc.value)

@pytest.mark.django_db
def test_due_time_default_from_booking():
    room_type = RoomType.objects.create(name="Standard", capacity=2)
    room = Room.objects.create(number="101", floor=1, room_type=room_type)
    admin = User.objects.create_user(username="admin", password="testpass123", role='admin')
    maid = User.objects.create_user(username="maid", password="testpass123", role='maid')

    check_in = timezone.now()
    check_out = check_in + timedelta(days=3)
    booking = Booking.objects.create(
        room=room,
        check_in=check_in,
        check_out=check_out,
        guest_count=2,
        notes="Test booking",
        created_by=admin
    )

    
    cleaning_task = CleaningTask.objects.create(
        room=room,
        booking=booking,
        assigned_to=maid,
    )

   
    assert cleaning_task.due_time == booking.check_in


@pytest.mark.django_db
def test_cleaning_task_default_status():
    room_type = RoomType.objects.create(name="Standard", capacity=2)
    room = Room.objects.create(number="101", floor=1, room_type=room_type)
    admin = User.objects.create_user(username="admin", password="testpass123", role='admin')
    maid = User.objects.create_user(username="maid", password="testpass123", role='maid')

    check_in = timezone.now()
    check_out = check_in + timedelta(days=3)
    booking = Booking.objects.create(
        room=room,
        check_in=check_in,
        check_out=check_out,
        guest_count=2,
        notes="Test booking",
        created_by=admin
    )

    
    cleaning_task = CleaningTask.objects.create(
        room=room,
        booking=booking,
        assigned_to=maid,
        due_time=timezone.now() + timedelta(hours=3),
    )

    
    assert cleaning_task.status == "pending"


@pytest.mark.django_db
def test_create_cleaning_check():
 
    room_type = RoomType.objects.create(name="Standard", capacity=2)
    room = Room.objects.create(number="101", floor=1, room_type=room_type)
    admin = User.objects.create_user(username="admin", password="testpass123", role='admin')
    maid = User.objects.create_user(username="maid", password="testpass123", role='maid')

    
    check_in = timezone.now()
    check_out = check_in + timedelta(days=3)
    booking = Booking.objects.create(
        room=room,
        check_in=check_in,
        check_out=check_out,
        guest_count=2,
        notes="Test booking",
        created_by=admin
    )

    cleaning_task = CleaningTask.objects.create(
        room=room,
        booking=booking,
        assigned_to=maid,
        due_time=timezone.now() + timedelta(hours=3),
    )

    cleaning_check = CleaningCheck.objects.create(
        cleaning_task= cleaning_task,
        checked_by = admin,
        status='approved',
    )

    
    assert CleaningCheck.objects.count() == 1
    assert cleaning_check.cleaning_task == cleaning_task
    assert cleaning_check.checked_by == admin
    assert cleaning_check.status == 'approved'
  
@pytest.mark.django_db
def test_cleaning_check_default_status():
 
    room_type = RoomType.objects.create(name="Standard", capacity=2)
    room = Room.objects.create(number="101", floor=1, room_type=room_type)
    admin = User.objects.create_user(username="admin", password="testpass123", role='admin')
    maid = User.objects.create_user(username="maid", password="testpass123", role='maid')

    
    check_in = timezone.now()
    check_out = check_in + timedelta(days=3)
    booking = Booking.objects.create(
        room=room,
        check_in=check_in,
        check_out=check_out,
        guest_count=2,
        notes="Test booking",
        created_by=admin
    )

    cleaning_task = CleaningTask.objects.create(
        room=room,
        booking=booking,
        assigned_to=maid,
        due_time=timezone.now() + timedelta(hours=3),
    )

    cleaning_check = CleaningCheck.objects.create(
        cleaning_task= cleaning_task,
        checked_by = admin,
    )

    
    
    assert cleaning_check.status == 'needs_rework'


@pytest.mark.django_db
def test_create_checklist_item_template():
    checklist_template = CleaningChecklistTemplate.objects.create(name="Test Template", created_by=None)
    
    checklist_item = ChecklistItemTemplate.objects.create(
        template=checklist_template,
        text="Check cleanliness of room",
        order=1
    )
    
    assert ChecklistItemTemplate.objects.count() == 1
    assert checklist_item.template == checklist_template
    assert checklist_item.text == "Check cleanliness of room"
    assert checklist_item.order == 1

@pytest.mark.django_db
def test_checklist_item_template_ordering():
    checklist_template = CleaningChecklistTemplate.objects.create(name="Test Template", created_by=None)
    
    checklist_item_1 = ChecklistItemTemplate.objects.create(
        template=checklist_template,
        text="Check cleanliness of room",
        order=2
    )
    checklist_item_2 = ChecklistItemTemplate.objects.create(
        template=checklist_template,
        text="Check bed sheets",
        order=1
    )
    
    items = ChecklistItemTemplate.objects.filter(template=checklist_template).all()
    assert items[0].order == 1
    assert items[1].order == 2

@pytest.mark.django_db
def test_update_checklist_item_template_order():
    checklist_template = CleaningChecklistTemplate.objects.create(name="Test Template", created_by=None)
    
    checklist_item_1 = ChecklistItemTemplate.objects.create(
        template=checklist_template,
        text="Check cleanliness of room",
        order=1
    )
    checklist_item_2 = ChecklistItemTemplate.objects.create(
        template=checklist_template,
        text="Check bed sheets",
        order=2
    )
    
    checklist_item_1.order = 3
    checklist_item_1.save()

    items = ChecklistItemTemplate.objects.filter(template=checklist_template).all()
    assert items[0].order == 2
    assert items[1].order == 3

@pytest.mark.django_db
def test_delete_checklist_item_template():
    checklist_template = CleaningChecklistTemplate.objects.create(name="Test Template", created_by=None)

    checklist_item = ChecklistItemTemplate.objects.create(
        template=checklist_template,
        text="Check cleanliness of room",
        order=1
    )

    checklist_item.delete()

    assert ChecklistItemTemplate.objects.count() == 0


@pytest.mark.django_db
def test_delete_checklist_item_template():
    checklist_template = CleaningChecklistTemplate.objects.create(name="Test Template", created_by=None)
    
    checklist_item = ChecklistItemTemplate.objects.create(
        template=checklist_template,
        text="Check cleanliness of room",
        order=1
    )
    
    checklist_item.delete()

    assert ChecklistItemTemplate.objects.count() == 0


@pytest.mark.django_db
def test_checklist_item_template_text_required():
    checklist_template = CleaningChecklistTemplate.objects.create(name="Test Template", created_by=None)

    checklist_item = ChecklistItemTemplate(
        template=checklist_template,
        order=1
    )

    with pytest.raises(ValidationError):
        checklist_item.full_clean() 
        checklist_item.save()


@pytest.mark.django_db
def test_create_cleaning_check_item():
    room_type = RoomType.objects.create(name="Standard", capacity=2)
    room = Room.objects.create(number="101", floor=1, room_type=room_type)
    admin = User.objects.create_user(username="admin", password="adminpass", role="admin")
    maid = User.objects.create_user(username="maid", password="maidpass", role="maid")
    checklist_template = CleaningChecklistTemplate.objects.create(name="Basic", created_by=admin)
    checklist_item = ChecklistItemTemplate.objects.create(template=checklist_template, text="Test item", order=1)

    booking = Booking.objects.create(
        room=room,
        check_in=timezone.now(),
        check_out=timezone.now() + timezone.timedelta(days=3),
        guest_count=2,
        created_by=admin
    )

    cleaning_task = CleaningTask.objects.create(
        room=room,
        booking=booking,
        assigned_to=maid,
        due_time=timezone.now()
    )

    cleaning_check = CleaningCheck.objects.create(
        cleaning_task=cleaning_task,
        checked_by=admin
    )

    item = CleaningCheckItem.objects.create(
        cleaning_check=cleaning_check,
        template_item=checklist_item,
        is_passed=True,
        comment="Все чисто"
    )

    assert CleaningCheckItem.objects.count() == 1
    assert item.cleaning_check == cleaning_check
    assert item.template_item == checklist_item
    assert item.is_passed is True
    assert item.comment == "Все чисто"
    assert "✓" in str(item)
    assert checklist_item.text in str(item)


@pytest.mark.django_db
def test_cleaning_check_item_str_when_template_item_deleted():
    room_type = RoomType.objects.create(name="Standard", capacity=2)
    room = Room.objects.create(number="101", floor=1, room_type=room_type)
    admin = User.objects.create_user(username="admin", password="adminpass", role="admin")
    checklist_template = CleaningChecklistTemplate.objects.create(name="Basic", created_by=admin)
    checklist_item = ChecklistItemTemplate.objects.create(template=checklist_template, text="Window", order=1)

    booking = Booking.objects.create(
        room=room,
        check_in=timezone.now(),
        check_out=timezone.now() + timezone.timedelta(days=1),
        guest_count=1,
        created_by=admin
    )

    cleaning_task = CleaningTask.objects.create(
        room=room,
        booking=booking,
        due_time=timezone.now()
    )

    cleaning_check = CleaningCheck.objects.create(
        cleaning_task=cleaning_task,
        checked_by=admin
    )

    check_item = CleaningCheckItem.objects.create(
        cleaning_check=cleaning_check,
        template_item=checklist_item,
        is_passed=False
    )

    checklist_item.delete()

    check_item.refresh_from_db()
    assert "Пункт удалён" in str(check_item)
    assert "✗" in str(check_item)