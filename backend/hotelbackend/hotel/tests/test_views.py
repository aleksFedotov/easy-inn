import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from hotel.models import Room, RoomType, CleaningChecklistTemplate
from users.models import User

# RoomType
@pytest.mark.django_db
def test_manager_can_create_room_type():
    client = APIClient()
    user = User.objects.create_user(
        username = "Manager",
        password = "testpass123",
        role = "manager"
    )
    client.force_authenticate(user=user)

    data = {
        "name" : "Standart Twin",
        "description" : "Test disc",
        "capacity" : 2
    }

    url = reverse("roomtype-list")
    response = client.post(url, data, format="json")

    assert response.status_code == 201
    assert RoomType.objects.count() == 1
    room_type = RoomType.objects.first()
    assert room_type.name == "Standart Twin"
    assert room_type.description == "Test disc"
    assert room_type.capacity == 2

@pytest.mark.django_db
def test_admin_can_not_create_room_type():
    client = APIClient()
    user = User.objects.create_user(
        username = "Admin",
        password = "testpass123",
        role = "admin"
    )
    client.force_authenticate(user=user)

    data = {
        "name" : "Standart Twin",
        "description" : "Test disc",
        "capacity" : 2
    }

    url = reverse("roomtype-list")
    response = client.post(url, data, format="json")

    assert response.status_code == 403

@pytest.mark.django_db
def test_maid_can_not_create_room_type():
    client = APIClient()
    user = User.objects.create_user(
        username = "maid",
        password = "testpass123",
        role = "maid"
    )
    client.force_authenticate(user=user)

    data = {
        "name" : "Standart Twin",
        "description" : "Test disc",
        "capacity" : 2
    }

    url = reverse("roomtype-list")
    response = client.post(url, data, format="json")

    assert response.status_code == 403


@pytest.mark.django_db
def test_get_room_type():
    client = APIClient()
    user = User.objects.create_user(
        username = "Manager",
        password = "testpass123",
        role = "manager"
    )
    client.force_authenticate(user=user)

    RoomType.objects.create(
        name = "Standart Twin",
        description = "Test disc",
        capacity = 2
    )
   

    url = reverse("roomtype-list")
    response = client.get(url)

    assert response.status_code == 200
    assert len(response.data) == 1
    room_type = response.data[0]
    assert room_type['name'] == "Standart Twin"
    assert room_type['description'] == "Test disc"
    assert room_type['capacity'] == 2

@pytest.mark.django_db
def test_update_room_type():
    client = APIClient()
    user = User.objects.create_user(
        username = "Manager",
        password = "testpass123",
        role = "manager"
    )
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(
        name = "Standart Twin",
        description = "Test disc",
        capacity = 2
    )

    url = reverse("roomtype-detail", args=[room_type.id])
    updated_data = {
        "name" : "Delux",
        "description" : "Another test disc",
        "capacity" : 3
    }
   

    response = client.put(url, updated_data, format="json")

    assert response.status_code == 200
    room_type.refresh_from_db()
    assert room_type.name == "Delux"
    assert room_type.description == "Another test disc"
    assert room_type.capacity == 3


@pytest.mark.django_db
def test_partial_update_room_type_with_patch():
    client = APIClient()
    user = User.objects.create_user(
        username = "Manager",
        password = "testpass123",
        role = "manager"
    )
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(
        name = "Standart Twin",
        description = "Test disc",
        capacity = 2
    )

    url = reverse("roomtype-detail", args=[room_type.id])
    updated_data = {
        "name" : "Delux",
    }
   

    response = client.patch(url, updated_data, format="json")

    assert response.status_code == 200
    room_type.refresh_from_db()
    assert room_type.name == "Delux"
    assert room_type.description == "Test disc"
    assert room_type.capacity == 2


@pytest.mark.django_db
def test_delete_room_type():
    client = APIClient()
    user = User.objects.create_user(
        username = "Manager",
        password = "testpass123",
        role = "manager"
    )
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(
        name = "Standart Twin",
        description = "Test disc",
        capacity = 2
    )

    url = reverse("roomtype-detail", args=[room_type.id])

   

    response = client.delete(url)

    assert response.status_code == 204
    with pytest.raises(RoomType.DoesNotExist):
        RoomType.objects.get(id=room_type.id)

@pytest.mark.django_db
def test_admin_cannot_delete_room_type():
    client = APIClient()
    user = User.objects.create_user(
        username = "Admin",
        password = "testpass123",
        role = "admin"
    )
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(
        name = "Standart Twin",
        description = "Test disc",
        capacity = 2
    )

    url = reverse("roomtype-detail", args=[room_type.id])

   

    response = client.delete(url)

    assert response.status_code == 403

@pytest.mark.django_db
def test_maid_cannot_delete_room_type():
    client = APIClient()
    user = User.objects.create_user(
        username = "Maid",
        password = "testpass123",
        role = "maid"
    )
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(
        name = "Standart Twin",
        description = "Test disc",
        capacity = 2
    )

    url = reverse("roomtype-detail", args=[room_type.id])

   

    response = client.delete(url)

    assert response.status_code == 403

# Room
@pytest.mark.django_db
def test_manager_can_create_room():
    client = APIClient()
    user = User.objects.create_user(
        username = "Manager",
        password = "testpass123",
        role = "manager"
    )

    room_type = RoomType.objects.create(
        name = "Standart Twin",
        description = "Test disc",
        capacity = 2
    )
    client.force_authenticate(user=user)

    data = {
        "number" : 202,
        "floor" : 2,
        "room_type" : room_type.id,
        "status" : "occupied",
        "notes" : "some notes",
        "is_active" : True,
        "cleaning_required" : False
    }

    url = reverse("room-list")
    response = client.post(url, data, format="json")

    assert response.status_code == 201
    assert Room.objects.count() == 1
    room = Room.objects.first()
    assert room.number == 202
    assert room.floor == 2
    assert room.room_type == room_type
    assert room.status == "occupied"
    assert room.notes == "some notes"
    assert room.is_active == True
    assert room.cleaning_required == False

@pytest.mark.django_db
def test_admin_can_not_create_room():
    client = APIClient()
    user = User.objects.create_user(
        username = "Admin",
        password = "testpass123",
        role = "admin"
    )
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(
        name = "Standart Twin",
        description = "Test disc",
        capacity = 2
    )

    data = {
        "number" : 202,
        "floor" : 2,
        "room_type" : room_type.id,
        "status" : "occupied",
        "notes" : "some notes",
        "is_active" : True,
        "cleaning_required" : False
    }

    url = reverse("room-list")
    response = client.post(url, data, format="json")

    assert response.status_code == 403

@pytest.mark.django_db
def test_maid_can_not_create_room():
    client = APIClient()
    user = User.objects.create_user(
        username = "maid",
        password = "testpass123",
        role = "maid"
    )
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(
        name = "Standart Twin",
        description = "Test disc",
        capacity = 2
    )

    data = {
        "number" : 202,
        "floor" : 2,
        "room_type" : room_type.id,
        "status" : "occupied",
        "notes" : "some notes",
        "is_active" : True,
        "cleaning_required" : False
    }

    url = reverse("room-list")
    response = client.post(url, data, format="json")

    assert response.status_code == 403


@pytest.mark.django_db
def test_get_room_type():
    client = APIClient()
    user = User.objects.create_user(
        username = "Manager",
        password = "testpass123",
        role = "manager"
    )
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(
        name = "Standart Twin",
        description = "Test disc",
        capacity = 2
    )

    Room.objects.create(
        number = 202,
        floor = 2,
        room_type = room_type,
        status = "occupied",
        notes = "some notes",
        is_active = True,
        cleaning_required = False
    )
   

    url = reverse("room-list")
    response = client.get(url)

    assert response.status_code == 200
    assert len(response.data) == 1
    room = response.data[0]
    assert room['number'] == 202
    assert room['floor'] == 2
    assert room['room_type'] ==  room_type.id
    assert room['status'] == "occupied"
    assert room['notes'] == "some notes"
    assert room['is_active'] == True
    assert room['cleaning_required'] == False


@pytest.mark.django_db
def test_update_room():
    client = APIClient()
    user = User.objects.create_user(
        username = "Manager",
        password = "testpass123",
        role = "manager"
    )
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(
        name = "Standart Twin",
        description = "Test disc",
        capacity = 2
    )

    room = Room.objects.create(
        number = 202,
        floor = 2,
        room_type = room_type,
        status = "occupied",
        notes = "some notes",
        is_active = True,
        cleaning_required = False
    )

    url = reverse("room-detail", args=[room.id])
    updated_data = {
        "number" : 211,
        "floor" : 1,
        "room_type" : room_type.id,
        "status" : "free",
        "notes" : "another notes",
        "is_active" : False,
        "cleaning_required" : False
    }
   

    response = client.put(url, updated_data, format="json")

    assert response.status_code == 200
    room.refresh_from_db()
    assert room.number == 211
    assert room.floor == 1
    assert room.room_type == room_type
    assert room.status == "free"
    assert room.notes == "another notes"
    assert room.is_active == False
    assert room.cleaning_required == False


@pytest.mark.django_db
def test_partial_update_room_with_patch():
    client = APIClient()
    user = User.objects.create_user(
        username = "Manager",
        password = "testpass123",
        role = "manager"
    )
    client.force_authenticate(user=user)

   
    room_type = RoomType.objects.create(
        name = "Standart Twin",
        description = "Test disc",
        capacity = 2
    )

    room = Room.objects.create(
        number = 202,
        floor = 2,
        room_type = room_type,
        status = "occupied",
        notes = "some notes",
        is_active = True,
        cleaning_required = False
    )

    url = reverse("room-detail", args=[room.id])
    updated_data = {
        "number" : 211,  
    }
   

    response = client.patch(url, updated_data, format="json")

    assert response.status_code == 200
    room.refresh_from_db()
    assert room.number == 211
    assert room.floor == 2
    assert room.room_type == room_type
    assert room.status == "occupied"
    assert room.notes == "some notes"
    assert room.is_active == True
    assert room.cleaning_required == False


@pytest.mark.django_db
def test_delete_room_type():
    client = APIClient()
    user = User.objects.create_user(
        username = "Manager",
        password = "testpass123",
        role = "manager"
    )
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(
        name = "Standart Twin",
        description = "Test disc",
        capacity = 2
    )

    room = Room.objects.create(
        number = 202,
        floor = 2,
        room_type = room_type,
        status = "occupied",
        notes = "some notes",
        is_active = True,
        cleaning_required = False
    )



    url = reverse("room-detail", args=[room.id])

   

    response = client.delete(url)

    assert response.status_code == 204
    with pytest.raises(Room.DoesNotExist):
        Room.objects.get(id=room.id)

@pytest.mark.django_db
def test_admin_cannot_delete_room():
    client = APIClient()
    user = User.objects.create_user(
        username = "Admin",
        password = "testpass123",
        role = "admin"
    )
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(
        name = "Standart Twin",
        description = "Test disc",
        capacity = 2
    )

    room = Room.objects.create(
        number = 202,
        floor = 2,
        room_type = room_type,
        status = "occupied",
        notes = "some notes",
        is_active = True,
        cleaning_required = False
    )



    url = reverse("room-detail", args=[room.id])

   

    response = client.delete(url)

    assert response.status_code == 403

@pytest.mark.django_db
def test_maid_cannot_delete_room():
    client = APIClient()
    user = User.objects.create_user(
        username = "Maid",
        password = "testpass123",
        role = "maid"
    )
    client.force_authenticate(user=user)

    room_type = RoomType.objects.create(
        name = "Standart Twin",
        description = "Test disc",
        capacity = 2
    )

    room = Room.objects.create(
        number = 202,
        floor = 2,
        room_type = room_type,
        status = "occupied",
        notes = "some notes",
        is_active = True,
        cleaning_required = False
    )



    url = reverse("room-detail", args=[room.id])

   

    response = client.delete(url)

    assert response.status_code == 403


# CleaningChecklistTemplate
@pytest.mark.django_db
def test_manager_can_create_cleaning_template():
    client = APIClient()
    user = User.objects.create_user(
        username = "Manager",
        password = "testpass123",
        role = "manager"
    )
    client.force_authenticate(user=user)

    data = {
        "name" : "Standart Cleaning",
        "created_by" : user.id,
        "is_active" : True
    }

    url = reverse("cleaningtemplates-list")
    response = client.post(url, data, format="json")

    assert response.status_code == 201
    assert CleaningChecklistTemplate.objects.count() == 1
    cleaning_template = CleaningChecklistTemplate.objects.first()
    assert cleaning_template.name == "Standart Cleaning"
    assert cleaning_template.created_by == user
    assert cleaning_template.is_active == True

@pytest.mark.django_db
def test_admin_can_not_create_cleaning_template():
    client = APIClient()
    user = User.objects.create_user(
        username = "Admin",
        password = "testpass123",
        role = "admin"
    )
    client.force_authenticate(user=user)

    data = {
        "name" : "Standart Cleaning",
        "created_by" : user.id,
        "is_active" : True
    }

    url = reverse("cleaningtemplates-list")
    response = client.post(url, data, format="json")

    assert response.status_code == 403

@pytest.mark.django_db
def test_maid_can_not_create_cleaning_template():
    client = APIClient()
    user = User.objects.create_user(
        username = "maid",
        password = "testpass123",
        role = "maid"
    )
    client.force_authenticate(user=user)

    data = {
        "name" : "Standart Cleaning",
        "created_by" : user.id,
        "is_active" : True
    }

    url = reverse("cleaningtemplates-list")
    response = client.post(url, data, format="json")

    assert response.status_code == 403


@pytest.mark.django_db
def test_get_room_cleaning_template():
    client = APIClient()
    user = User.objects.create_user(
        username = "Manager",
        password = "testpass123",
        role = "manager"
    )
    client.force_authenticate(user=user)

    CleaningChecklistTemplate.objects.create(
        name = "Standart Cleaning",
        created_by = user,
        is_active = True
    )
   

    url = reverse("cleaningtemplates-list")
    response = client.get(url)

    assert response.status_code == 200
    assert len(response.data) == 1
    room_type = response.data[0]
    assert room_type['name'] == "Standart Cleaning"
    assert room_type['created_by'] == user.id
    assert room_type['is_active'] == True

@pytest.mark.django_db
def test_update_cleaning_template():
    client = APIClient()
    user = User.objects.create_user(
        username = "Manager",
        password = "testpass123",
        role = "manager"
    )
    client.force_authenticate(user=user)

    cleaning_template =  CleaningChecklistTemplate.objects.create(
        name = "Standart Cleaning",
        created_by = user,
        is_active = True
    )

    url = reverse("cleaningtemplates-detail", args=[cleaning_template.id])
    updated_data = {
        "name" : "General cleaning",
        "created_by" : user.id,
        "is_active" : False
    }
   

    response = client.put(url, updated_data, format="json")

    assert response.status_code == 200
    cleaning_template.refresh_from_db()
    assert cleaning_template.name == "General cleaning"
    assert cleaning_template.created_by == user
    assert cleaning_template.is_active == False


@pytest.mark.django_db
def test_partial_update_cleaning_template_with_patch():
    client = APIClient()
    user = User.objects.create_user(
        username = "Manager",
        password = "testpass123",
        role = "manager"
    )
    client.force_authenticate(user=user)

    cleaning_template =  CleaningChecklistTemplate.objects.create(
        name = "Standart Cleaning",
        created_by = user,
        is_active = True
    )

    url = reverse("cleaningtemplates-detail", args=[cleaning_template.id])
    updated_data = {
        "name" : "General cleaning",
    }
   

    response = client.patch(url, updated_data, format="json")

    assert response.status_code == 200
    cleaning_template.refresh_from_db()
    assert cleaning_template.name == "General cleaning"
    assert cleaning_template.created_by == user
    assert cleaning_template.is_active == True


@pytest.mark.django_db
def test_delete_cleaning_template():
    client = APIClient()
    user = User.objects.create_user(
        username = "Manager",
        password = "testpass123",
        role = "manager"
    )
    client.force_authenticate(user=user)

    cleaning_template =  CleaningChecklistTemplate.objects.create(
        name = "Standart Cleaning",
        created_by = user,
        is_active = True
    )

    url = reverse("cleaningtemplates-detail", args=[cleaning_template.id])

   

    response = client.delete(url)

    assert response.status_code == 204
    with pytest.raises(CleaningChecklistTemplate.DoesNotExist):
        CleaningChecklistTemplate.objects.get(id=cleaning_template.id)

@pytest.mark.django_db
def test_admin_cannot_delete_cleaning_template():
    client = APIClient()
    user = User.objects.create_user(
        username = "Admin",
        password = "testpass123",
        role = "admin"
    )
    client.force_authenticate(user=user)

    cleaning_template =  CleaningChecklistTemplate.objects.create(
        name = "Standart Cleaning",
        created_by = user,
        is_active = True
    )

    url = reverse("cleaningtemplates-detail", args=[cleaning_template.id])

   

    response = client.delete(url)

    assert response.status_code == 403

@pytest.mark.django_db
def test_maid_cannot_delete_cleaning_template():
    client = APIClient()
    user = User.objects.create_user(
        username = "Maid",
        password = "testpass123",
        role = "maid"
    )
    client.force_authenticate(user=user)

    cleaning_template =  CleaningChecklistTemplate.objects.create(
        name = "Standart Cleaning",
        created_by = user,
        is_active = True
    )

    url = reverse("cleaningtemplates-detail", args=[cleaning_template.id])

   

    response = client.delete(url)

    assert response.status_code == 403
