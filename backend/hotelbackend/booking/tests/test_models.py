import pytest
from booking.models import Booking
from hotel.models import Room, RoomType
from users.models import User
from cleaning.models import CleaningTask
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError


@pytest.mark.django_db
def test_create_booking():
    room_type = RoomType.objects.create(name="Standard", description="...", capacity=2)
    room = Room.objects.create(number="101", floor=1, room_type=room_type)
    user = User.objects.create_user(username="admin", password="testpass123")

    check_in = timezone.now()
    check_out = check_in + timedelta(days=3)

    booking = Booking.objects.create(
        room=room,
        check_in=check_in,
        check_out=check_out,
        guest_count=2,
        notes="Test booking",
        created_by=user
    )

    
    assert Booking.objects.count() == 1
    assert booking.room == room
    assert booking.check_in == check_in
    assert booking.check_out == check_out
    assert booking.guest_count == 2
    assert booking.notes == "Test booking"
    assert booking.created_by == user

@pytest.mark.django_db
def test_booking_invalid_dates():
    room_type = RoomType.objects.create(name="Standard", capacity=2)
    room = Room.objects.create(number="103", floor=1, room_type=room_type)
    user = User.objects.create_user(username="admin", password="testpass123")

    check_in = timezone.now()
    check_out = check_in - timedelta(days=1)  # Неверная дата

    booking = Booking(
        room=room,
        check_in=check_in,
        check_out=check_out,
        guest_count=1,
        created_by=user
    )

    with pytest.raises(ValidationError) as exc:
        booking.full_clean()

    assert 'Дата выезда должна быть позже даты заезда.' in str(exc.value)

@pytest.mark.django_db
def test_booking_exceeds_capacity():
    room_type = RoomType.objects.create(name = 'Standart Twin', capacity=2)
    room = Room.objects.create(number=("104"), floor=1, room_type = room_type)
    user = User.objects.create(username="admin", password="testpass")

    check_in = timezone.now()
    check_out = check_in + timedelta(days=3)

    booking = Booking(
        room = room,
        check_in = check_in,
        check_out = check_out,
        guest_count = 4,
        created_by = user,
    )

    with pytest.raises(ValidationError) as exc:
        booking.full_clean()
    
    assert 'Количество гостей превышает вместимость комнаты.' in str(exc.value)


@pytest.mark.django_db
def test_booking_duration():
    room_type = RoomType.objects.create(name="Standard", capacity=2)
    room = Room.objects.create(number="104", floor=2, room_type=room_type)
    user = User.objects.create_user(username="guest4", password="testpass")

    check_in = timezone.now()
    check_out = check_in + timedelta(days=5)

    booking = Booking.objects.create(
        room=room,
        check_in=check_in,
        check_out=check_out,
        guest_count=2,
        created_by=user
    )

    assert booking.duration() == 5

@pytest.mark.django_db
def test_booking_duration_without_checkout():
    room_type = RoomType.objects.create(name="Standard", capacity=2)
    room = Room.objects.create(number="105", floor=2, room_type=room_type)
    user = User.objects.create_user(username="guest5", password="testpass")

    check_in = timezone.now()

    booking = Booking.objects.create(
        room=room,
        check_in=check_in,
        check_out=None,
        guest_count=2,
        created_by=user
    )

    assert booking.duration() is None


@pytest.mark.django_db
def test_checkout_creates_cleaning_task_with_due_time():
   
    user = User.objects.create_user(username='testuser', password='1234', role='manager')
    room_type = RoomType.objects.create(name='Standard', capacity=2)
    room = Room.objects.create(number=101, floor=1, room_type=room_type)

    now = timezone.now()
    booking = Booking.objects.create(
        room=room,
        check_in=now - timedelta(days=2),
        check_out=now,
        guest_count=1,
        created_by=user
    )

   
    next_booking = Booking.objects.create(
        room=room,
        check_in=now + timedelta(days=1),
        check_out=now + timedelta(days=2),
        guest_count=1,
        created_by=user
    )

    
    assert CleaningTask.objects.count() == 0

   
    booking.checkout()

   
    task = CleaningTask.objects.get()
    assert task.room == room
    assert task.status == 'pending'
    assert room.status == 'needs_cleaning'

    
    assert task.due_time == next_booking.check_in


@pytest.mark.django_db
def test_checkout_creates_cleaning_task_with_default_due_time():
    user = User.objects.create_user(username='testuser', password='1234', role='manager')
    room_type = RoomType.objects.create(name='Standard', capacity=2)
    room = Room.objects.create(number=102, floor=1, room_type=room_type)

    now = timezone.now()
    booking = Booking.objects.create(
        room=room,
        check_in=now - timedelta(days=2),
        check_out=now,
        guest_count=1,
        created_by=user
    )

    

    booking.checkout()

    task = CleaningTask.objects.get()
    assert task.room == room

   
    expected_time = now.replace(hour=14, minute=0, second=0, microsecond=0)
    
    assert abs((task.due_time - expected_time).total_seconds()) < 60