import pytest
from booking.models import Booking
from hotel.models import Room, RoomType
from users.models import User
from booking.serializers import BookingSerializer
from django.utils import timezone
from datetime import timedelta
from rest_framework.exceptions import ValidationError

@pytest.mark.django_db
def test_booking_serializer_output():
    room_type = RoomType.objects.create(name="Suite", capacity=3)
    room = Room.objects.create(number="203", floor=2, room_type=room_type)
    user = User.objects.create_user(username="admin", password="testpass123")

    check_in = timezone.now()
    check_out = check_in + timedelta(days=2)

    booking = Booking.objects.create(
        room=room,
        check_in=check_in,
        check_out=check_out,
        guest_count=2,
        notes="Some notes",
        created_by=user
    )

    serializer = BookingSerializer(instance=booking)
    data = serializer.data

    assert data['room'] == room.id
    assert data['room_number'] == room.number
    assert data['guest_count'] == 2
    assert data['notes'] == "Some notes"
    assert data['created_by'] == user.id
    assert data['duration'] == 2


@pytest.mark.django_db
def test_booking_serializer_duration_none():
    room_type = RoomType.objects.create(name="Single", capacity=1)
    room = Room.objects.create(number="101", floor=1, room_type=room_type)
    user = User.objects.create_user(username="admin", password="testpass123")

    booking = Booking.objects.create(
        room=room,
        check_in=timezone.now(),
        check_out=None,
        guest_count=1,
        created_by=user
    )

    serializer = BookingSerializer(instance=booking)
    assert serializer.data['duration'] is None

@pytest.mark.django_db
def test_booking_serializer_invalid_guest_count():
    room_type = RoomType.objects.create(name="Mini", capacity=1)
    room = Room.objects.create(number="104", floor=1, room_type=room_type)
    user = User.objects.create_user(username="guest")

    data = {
        'room': room.id,
        'check_in': timezone.now(),
        'check_out': timezone.now() + timedelta(days=1),
        'guest_count': 3,  # превышает вместимость
        'notes': '',
        'created_by': user.id,
    }

    serializer = BookingSerializer(data=data)
    with pytest.raises(ValidationError) as exc:
        serializer.is_valid(raise_exception=True)
    assert 'guest_count' not in exc.value.detail  # общая ошибка, не по полю
    assert any('вместимость' in str(e) for e in exc.value.detail.values())

@pytest.mark.django_db
def test_booking_serializer_invalid_dates():
    room_type = RoomType.objects.create(name="Mini", capacity=2)
    room = Room.objects.create(number="202", floor=2, room_type=room_type)
    user = User.objects.create_user(username="guest")

    now = timezone.now()
    data = {
        'room': room.id,
        'check_in': now,
        'check_out': now - timedelta(days=1),  # check_out до check_in
        'guest_count': 1,
        'notes': '',
        'created_by': user.id,
    }

    serializer = BookingSerializer(data=data)
    with pytest.raises(ValidationError) as exc:
        serializer.is_valid(raise_exception=True)
    assert any('должна быть позже' in str(e) for e in exc.value.detail.values())


@pytest.mark.django_db
def test_booking_serializer_guest_count_equal_to_capacity():
    room_type = RoomType.objects.create(name="Double", capacity=2)
    room = Room.objects.create(number="301", floor=3, room_type=room_type)
    user = User.objects.create_user(username="testuser")

    data = {
        'room': room.id,
        'check_in': timezone.now(),
        'check_out': timezone.now() + timedelta(days=1),
        'guest_count': 2,  # максимум
        'notes': '',
        'created_by': user.id,
    }

    serializer = BookingSerializer(data=data)
    assert serializer.is_valid(), serializer.errors

