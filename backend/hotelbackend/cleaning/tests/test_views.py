import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from hotel.models import RoomType, Room
from users.models import User
from booking.models import Booking
from cleaning.models import (
    CleaningTask,
    CleaningChecklistTemplate,
    CleaningCheck,
)
from django.utils import timezone
from datetime import timedelta


@pytest.mark.django_db
def setup_dependencies():
    admin, _ = User.objects.get_or_create(
        username="admin",
        defaults={"password": "testpass123", "role": "admin"}
    )
    if not admin.check_password("testpass123"):
        admin.set_password("testpass123")
        admin.save()
    manager, _ = User.objects.get_or_create(
        username="manager",
        defaults={"password": "testpass123", "role": "manager"}
    )
    if not admin.check_password("testpass123"):
        admin.set_password("testpass123")
        admin.save()
    maid, _ = User.objects.get_or_create(
        username="maid",
        defaults={"password": "testpass123", "role": "maid"}
    )
    if not maid.check_password("testpass123"):
        maid.set_password("testpass123")
        maid.save()

    room_type = RoomType.objects.create(name="Standard", capacity=2)
    room = Room.objects.create(number="101", floor=1, room_type=room_type)
    
    booking = Booking.objects.create(
        room = room,
        check_in = timezone.now(),
        check_out = timezone.now()+ timedelta(days=2),
        guest_count= 2,
        notes = "",
        created_by = admin
    )


    return room, booking,manager ,admin, maid

# Cleanig tasks
@pytest.mark.django_db
def test_manager_can_create_cleaning_task_manually():
    client = APIClient()
    room, _, manager,_, maid = setup_dependencies()
    client.force_authenticate(user=manager)

    checklist = CleaningChecklistTemplate.objects.create(name="Standard Checklist")
    data = {
        "room": room.id,
        "due_time": (timezone.now() + timedelta(hours=2)).isoformat(),
        "assigned_to": maid.id,
        "checklist_template": checklist.id
    }

    url = reverse("cleaningtask-manual")
    response = client.post(url, data)

    assert response.status_code == 201
    assert CleaningTask.objects.count() == 1
    task = CleaningTask.objects.first()
    assert task.assigned_to == maid

@pytest.mark.django_db
def test_maid_cannot_create_cleaning_task_manually():
    client = APIClient()
    room, _, _,_, maid = setup_dependencies()
    client.force_authenticate(user=maid)

    checklist = CleaningChecklistTemplate.objects.create(name="Standard Checklist")
    data = {
        "room": room.id,
        "due_time": (timezone.now() + timedelta(hours=2)).isoformat(),
        "assigned_to": maid.id,
        "checklist_template": checklist.id
    }

    url = reverse("cleaningtask-manual")
    response = client.post(url, data,format="json")

    assert response.status_code == 403

@pytest.mark.django_db
def test_create_cleaning_task_invalid_data():
    client = APIClient()
    _, _, manager, _, _ = setup_dependencies()
    client.force_authenticate(user=manager)

    # отсутствует обязательное поле 'room'
    data = {
        "due_time": (timezone.now() + timedelta(hours=2)).isoformat(),
    }

    url = reverse("cleaningtask-manual")
    response = client.post(url, data, format="json")
    assert response.status_code == 400

@pytest.mark.django_db
def test_get_cleanning_task():
    client = APIClient()
    room, booking,_,admin, maid = setup_dependencies()
    checklist = CleaningChecklistTemplate.objects.create(name="Standard Checklist")
    client.force_authenticate(user=admin)
    CleaningTask.objects.create(
        room = room,
        booking = booking,
        assigned_to = maid,
        status = 'in_progress',
        checklist_template = checklist,
    )
    url=reverse('cleaningtask-list')
    response = client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1
    task = response.data[0]
    assert task['status'] == "in_progress"
    assert task['room'] == room.id
    assert task['assigned_to'] == maid.id
    assert task['checklist_template'] == checklist.id


@pytest.mark.django_db
def test_update_cleanning_task_success():
    client = APIClient()
    room, booking,_,admin, maid = setup_dependencies()
    checklist = CleaningChecklistTemplate.objects.create(name="Standard Checklist")
    client.force_authenticate(user=admin)
    cleaning_task = CleaningTask.objects.create(
        room = room,
        booking = booking,
        assigned_to = maid,
        status = 'in_progress',
        checklist_template = checklist,
    )
    url=reverse('cleaningtask-detail', args=[cleaning_task.id])
    updated_data = {
        "room" : room.id,
        "booking" : booking.id,
        "assigned_to" : maid.id,
        "status" : 'done',
        "checklist_template" : checklist.id,
    }
    response = client.put(url, updated_data, format='json')
    assert response.status_code == 200
    cleaning_task.refresh_from_db()
    assert cleaning_task.status == 'done'


@pytest.mark.django_db
def test_partial_update_task_with_patch():
    client = APIClient()
    room, booking,_,admin, maid = setup_dependencies()
    checklist = CleaningChecklistTemplate.objects.create(name="Standard Checklist")
    client.force_authenticate(user=admin)
    cleaning_task = CleaningTask.objects.create(
        room = room,
        booking = booking,
        assigned_to = None,
        status = 'in_progress',
        checklist_template = checklist,
    )
    url=reverse('cleaningtask-detail', args=[cleaning_task.id])
    updated_data = {
        "assigned_to" : maid.id,
        "status" : 'done',
        
    }

    restponse = client.patch(url, updated_data, format='json')
    assert restponse.status_code == 200
    cleaning_task.refresh_from_db()
    assert cleaning_task.status == "done"
    assert cleaning_task.assigned_to == maid


@pytest.mark.django_db
def test_delete_cleaning_task_success():
    client = APIClient()
    room, booking,_,admin, maid = setup_dependencies()
    checklist = CleaningChecklistTemplate.objects.create(name="Standard Checklist")
    client.force_authenticate(user=admin)
    cleaning_task = CleaningTask.objects.create(
        room = room,
        booking = booking,
        assigned_to = None,
        status = 'in_progress',
        checklist_template = checklist,
    )
    url=reverse('cleaningtask-detail', args=[cleaning_task.id])
    response = client.delete(url)

    assert response.status_code == 204
    with pytest.raises(CleaningTask.DoesNotExist):
        CleaningTask.objects.get(id=cleaning_task.id)

@pytest.mark.django_db
def test_maid_sees_only_own_tasks():
    CleaningTask.objects.all().delete()
    client = APIClient()
    room, booking, _, _, maid = setup_dependencies()
    other_maid = User.objects.create_user(username="othermaid", password="test123", role="maid")
    checklist = CleaningChecklistTemplate.objects.create(name="Checklist")
    
    CleaningTask.objects.create(room=room, booking=booking, assigned_to=maid, checklist_template=checklist)
    CleaningTask.objects.create(room=room, booking=booking, assigned_to=other_maid, checklist_template=checklist)
    
    client.force_authenticate(user=maid)
    url = reverse("cleaningtask-list")
    response = client.get(url)
    assert response.status_code == 200
    for task in response.data:
        assert task['assigned_to'] == maid.id

@pytest.mark.django_db
def test_maid_cannot_delete_cleaning_task():
    client = APIClient()
    room, booking, _, _, maid = setup_dependencies()
    checklist = CleaningChecklistTemplate.objects.create(name="Standard Checklist")
    cleaning_task = CleaningTask.objects.create(
        room=room,
        booking=booking,
        assigned_to=maid,
        checklist_template=checklist
    )

    client.force_authenticate(user=maid)
    url = reverse('cleaningtask-detail', args=[cleaning_task.id])
    response = client.delete(url)
    assert response.status_code == 403

# Cleaning check
@pytest.mark.django_db
def test_manager_can_create_cleaning_check_manually():
    client = APIClient()
    room, booking, manager,admin, maid = setup_dependencies()
    client.force_authenticate(user=manager)


    cleaning_task = CleaningTask.objects.create(
        room=room,
        booking=booking,
        assigned_to=maid,
        due_time=timezone.now() + timedelta(hours=3),
    )

    checklist = CleaningChecklistTemplate.objects.create(name="Standard Checklist")
    data = {
        "cleaning_task": cleaning_task.id,
        "checked_by": admin.id,
        "checklist" : checklist.id,
        "status" : "needs_rework",
        "notes" : "some notes",

    }

    url = reverse("cleaningcheck-manual")
    response = client.post(url, data, format="json")

    assert response.status_code == 201
    assert CleaningCheck.objects.count() == 1
    check = CleaningCheck.objects.first()
    assert check.status == "needs_rework"
    assert check.notes == "some notes"

@pytest.mark.django_db
def test_maid_cannot_create_cleaning_check_manually():
    client = APIClient()
    room, booking, manager,admin, maid = setup_dependencies()
    client.force_authenticate(user=maid)


    cleaning_task = CleaningTask.objects.create(
        room=room,
        booking=booking,
        assigned_to=maid,
        due_time=timezone.now() + timedelta(hours=3),
    )

    checklist = CleaningChecklistTemplate.objects.create(name="Standard Checklist")
    data = {
        "cleaning_task": cleaning_task.id,
        "checked_by": admin.id,
        "checklist" : checklist.id,
        "status" : "needs_rework",
        "notes" : "some notes",

    }

    url = reverse("cleaningtask-manual")
    response = client.post(url, data,format="json")

    assert response.status_code == 403


@pytest.mark.django_db
def test_get_cleanning_check():
    client = APIClient()
    room, booking,_,admin, maid = setup_dependencies()
    client.force_authenticate(user=admin)


    cleaning_task = CleaningTask.objects.create(
        room=room,
        booking=booking,
        assigned_to=maid,
        due_time=timezone.now() + timedelta(hours=3),
    )

    checklist = CleaningChecklistTemplate.objects.create(name="Standard Checklist")
    CleaningCheck.objects.create(
        cleaning_task= cleaning_task,
        checked_by= admin,
        checklist = checklist,
        status = "needs_rework",
        notes = "some notes",
    )
    
    url=reverse('cleaningcheck-list')
    response = client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1
    check = response.data[0]
    assert check['status'] == "needs_rework"
    assert check['notes'] == "some notes"
    assert check['cleaning_task'] == cleaning_task.id
    assert check['checked_by'] == admin.id
    assert check['checklist'] == checklist.id

@pytest.mark.django_db
def test_update_cleanning_check_success():
    client = APIClient()
    room, booking,_,admin, maid = setup_dependencies()
    checklist = CleaningChecklistTemplate.objects.create(name="Standard Checklist")
    client.force_authenticate(user=admin)
    cleaning_task = CleaningTask.objects.create(
        room = room,
        booking = booking,
        assigned_to = maid,
        status = 'in_progress',
        checklist_template = checklist,
    )
    checklist = CleaningChecklistTemplate.objects.create(name="Standard Checklist")
    cleaning_check = CleaningCheck.objects.create(
        cleaning_task= cleaning_task,
        checked_by= admin,
        checklist = checklist,
        status = "needs_rework",
        notes = "some notes",
    )
    
    url=reverse('cleaningcheck-detail', args=[cleaning_check.id])
    updated_data = {
        "cleaning_task": cleaning_task.id,
        "checked_by": admin.id,
        "checklist" : checklist.id,
        "status" : "approved",
        "notes" : "test notes",
    }
    response = client.put(url, updated_data, format='json')
    assert response.status_code == 200
    cleaning_check.refresh_from_db()
    assert cleaning_check.status == 'approved'
    assert cleaning_check.notes == 'test notes'

@pytest.mark.django_db
def test_partial_update_check_with_patch():
    client = APIClient()
    room, booking,_,admin, maid = setup_dependencies()
    checklist = CleaningChecklistTemplate.objects.create(name="Standard Checklist")
    client.force_authenticate(user=admin)
    cleaning_task = CleaningTask.objects.create(
        room = room,
        booking = booking,
        assigned_to = maid,
        status = 'in_progress',
        checklist_template = checklist,
    )
    checklist = CleaningChecklistTemplate.objects.create(name="Standard Checklist")
    cleaning_check = CleaningCheck.objects.create(
        cleaning_task= cleaning_task,
        checked_by= admin,
        checklist = checklist,
        status = "needs_rework",
        notes = "some notes",
    )
    
    url=reverse('cleaningcheck-detail', args=[cleaning_check.id])
    updated_data = {
        "status" : "approved",
    }
    response = client.patch(url, updated_data, format='json')
    assert response.status_code == 200
    cleaning_check.refresh_from_db()
    assert cleaning_check.status == 'approved'
    assert cleaning_check.notes == 'some notes'


@pytest.mark.django_db
def test_delete_cleaning_check_success():
    client = APIClient()
    room, booking,_,admin, maid = setup_dependencies()
    checklist = CleaningChecklistTemplate.objects.create(name="Standard Checklist")
    client.force_authenticate(user=admin)
    cleaning_task = CleaningTask.objects.create(
        room = room,
        booking = booking,
        assigned_to = maid,
        status = 'in_progress',
        checklist_template = checklist,
    )
    checklist = CleaningChecklistTemplate.objects.create(name="Standard Checklist")
    cleaning_check = CleaningCheck.objects.create(
        cleaning_task= cleaning_task,
        checked_by= admin,
        checklist = checklist,
        status = "needs_rework",
        notes = "some notes",
    )
    url=reverse('cleaningcheck-detail', args=[cleaning_task.id])
    response = client.delete(url)

    assert response.status_code == 204
    with pytest.raises(CleaningCheck.DoesNotExist):
        CleaningCheck.objects.get(id=cleaning_task.id)


@pytest.mark.django_db
def test_unauthenticated_user_cannot_access_cleaning_tasks():
    client = APIClient()
    url = reverse("cleaningtask-list")
    response = client.get(url)
    assert response.status_code in [401, 403]
