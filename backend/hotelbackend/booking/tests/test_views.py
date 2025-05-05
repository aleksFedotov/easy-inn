import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from hotel.models import RoomType, Room
from users.models import User
from booking.models import Booking
from django.utils import timezone
from datetime import timedelta
from cleaning.models import CleaningTask

@pytest.mark.django_db
def test_create_booking_success():
    client = APIClient()
    user = User.objects.create_user(username="testuser", password="testpass123",role="manager")
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(name="Double", capacity=2)
    room = Room.objects.create(number="101", floor=1, room_type=room_type)

    url = reverse("booking-list") 
    data = {
        "room": room.id,
        "check_in": timezone.now(),
        "check_out": timezone.now() + timedelta(days=2),
        "guest_count": 2,
        "notes": "",
        "created_by": user.id
    }

    response = client.post(url, data, format="json")
    assert response.status_code == 201
    assert Booking.objects.count() == 1
    booking = Booking.objects.first()
    assert booking.guest_count == 2

@pytest.mark.django_db
def test_get_booking_list():
    client = APIClient()
    user = User.objects.create_user(username="testuser", password="testpass123",role="manager")
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(name="Single", capacity=1)
    room = Room.objects.create(number="201", floor=2, room_type=room_type)
    Booking.objects.create(
        room=room,
        check_in=timezone.now(),
        check_out=timezone.now() + timedelta(days=1),
        guest_count=1,
        created_by=user
    )

    url = reverse("booking-list")
    response = client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1

@pytest.mark.django_db
def test_create_booking_invalid_guest_count():
    client = APIClient()
    user = User.objects.create_user(username="testuser", password="testpass123",role="manager")
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(name="Mini", capacity=1)
    room = Room.objects.create(number="301", floor=3, room_type=room_type)

    url = reverse("booking-list")
    data = {
        "room": room.id,
        "check_in": timezone.now(),
        "check_out": timezone.now() + timedelta(days=1),
        "guest_count": 3,  
        "notes": "",
        "created_by": user.id
    }

    response = client.post(url, data, format="json")
    assert response.status_code == 400
    assert any("вместимость" in str(e) for e in response.data.values())


@pytest.mark.django_db
def test_update_booking_success():
    client = APIClient()
    user = User.objects.create_user(username="testuser", password="testpass123", role='manager')
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(name="Standard", capacity=2)
    room = Room.objects.create(number="202", floor=2, room_type=room_type)

    booking = Booking.objects.create(
        room=room,
        check_in=timezone.now(),
        check_out=timezone.now() + timedelta(days=1),
        guest_count=1,
        created_by=user
    )

    url = reverse("booking-detail", args=[booking.id])  # URL для update
    updated_data = {
        "room": room.id,
        "check_in": booking.check_in,
        "check_out": booking.check_out + timedelta(days=1),
        "guest_count": 2,
        "notes": "Updated notes",
        "created_by": user.id,
    }

    response = client.put(url, updated_data, format="json")
    assert response.status_code == 200

    booking.refresh_from_db()
    assert booking.guest_count == 2
    assert booking.notes == "Updated notes"


@pytest.mark.django_db
def test_partial_update_booking_with_patch():
    client = APIClient()
    user = User.objects.create_user(username="testuser", password="testpass123",role='manager')
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(name="Standard", capacity=2)
    room = Room.objects.create(number="202", floor=2, room_type=room_type)

    booking = Booking.objects.create(
        room=room,
        check_in=timezone.now(),
        check_out=timezone.now() + timedelta(days=2),
        guest_count=1,
        created_by=user
    )

    url = reverse("booking-detail", args=[booking.id])
    patch_data = {
        "notes": "Changed via PATCH",
        "guest_count": 2
    }

    response = client.patch(url, patch_data, format="json")
    assert response.status_code == 200

    booking.refresh_from_db()
    assert booking.notes == "Changed via PATCH"
    assert booking.guest_count == 2


@pytest.mark.django_db
def test_delete_booking_success():
    client = APIClient()

    #
    user = User.objects.create_user(username="testuser", password="testpass123", role="manager")
    client.force_authenticate(user=user)

 
    room_type = RoomType.objects.create(name="Deluxe", capacity=2)
    room = Room.objects.create(number="505", floor=5, room_type=room_type)
    booking = Booking.objects.create(
        room=room,
        check_in=timezone.now(),
        check_out=timezone.now() + timedelta(days=1),
        guest_count=1,
        created_by=user
    )

  
    url = reverse("booking-detail", args=[booking.id])
    response = client.delete(url)

    assert response.status_code == 204
    with pytest.raises(Booking.DoesNotExist):
        Booking.objects.get(id=booking.id)

@pytest.mark.django_db
def test_unauthenticated_user_cannot_create_booking():
    client = APIClient()

    room_type = RoomType.objects.create(name="Basic", capacity=1)
    room = Room.objects.create(number="999", floor=9, room_type=room_type)

    url = reverse("booking-list")
    data = {
        "room": room.id,
        "check_in": timezone.now(),
        "check_out": timezone.now() + timedelta(days=1),
        "guest_count": 1,
        "notes": "",
    }

    response = client.post(url, data, format="json")
    assert response.status_code == 403


@pytest.mark.django_db
def test_maid_cannot_create_booking():
    client = APIClient()
    maid = User.objects.create_user(username="maiduser", password="testpass123", role="maid")
    client.force_authenticate(user=maid)

    room_type = RoomType.objects.create(name="Basic", capacity=1)
    room = Room.objects.create(number="888", floor=8, room_type=room_type)

    url = reverse("booking-list")
    data = {
        "room": room.id,
        "check_in": timezone.now(),
        "check_out": timezone.now() + timedelta(days=1),
        "guest_count": 1,
        "notes": "",
    }

    response = client.post(url, data, format="json")
    assert response.status_code == 403


@pytest.mark.django_db
def test_created_by_is_set_to_authenticated_user():
    client = APIClient()
    user = User.objects.create_user(username="testuser", password="testpass123", role="manager")
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(name="Suite", capacity=2)
    room = Room.objects.create(number="999", floor=9, room_type=room_type)

    url = reverse("booking-list")
    data = {
        "room": room.id,
        "check_in": timezone.now(),
        "check_out": timezone.now() + timedelta(days=2),
        "guest_count": 2,
        "notes": "",
        # намеренно не передаём created_by
    }

    response = client.post(url, data, format="json")
    assert response.status_code == 201

    booking = Booking.objects.first()
    assert booking.created_by == user



@pytest.mark.django_db
def test_mark_checkout_creates_cleaning_task():
    client = APIClient()
    user = User.objects.create_user(username="testuser", password="testpass123", role="manager")
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(name="Standard", capacity=2)
    room = Room.objects.create(number=101, floor=1, room_type=room_type, status='occupied')
    booking = Booking.objects.create(
        room =room,
        check_in= timezone.now(),
        check_out=timezone.now() + timedelta(days=2),
        guest_count= 2,
        notes= "",
    )

    url = reverse("booking-mark-checkout", args=[booking.id])
    response = client.post(url)

    booking.refresh_from_db()
    room.refresh_from_db()

    tasks = CleaningTask.objects.filter(room=room, booking=booking)

    assert response.status_code == 200
    assert response.data["detail"] == "Бронирование отмечено как выезд, задача на уборку создана."
    assert booking.check_out is not None
    assert room.status == "needs_cleaning"
    assert tasks.exists()