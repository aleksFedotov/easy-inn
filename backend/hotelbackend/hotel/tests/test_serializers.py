import pytest
from hotel.models import Room, RoomType, CleaningChecklistTemplate
from hotel.serializers import RoomSerializer, RoomTypeSerializer, CleaningChecklistTemplateSerializer
from users.models import User

# RoomType
@pytest.mark.django_db
def test_room_type_serialiazer_output():
    room_type = RoomType.objects.create(
        name = "Delux",
        description = 'Test description',
        capacity = 2
    )

    serializer = RoomTypeSerializer(room_type)
    data = serializer.data

    assert data["name"] == "Delux"
    assert data["description"] == "Test description"
    assert data["capacity"] == 2


@pytest.mark.django_db
def test_room_type_serializer_valid_input():
    input_data = {
        "name" : "Delux",
        "description" : 'Test description',
        "capacity" : 2
    }

    serializer = RoomTypeSerializer(data = input_data)
    assert serializer.is_valid()
    instance = serializer.save()

    assert RoomType.objects.count() == 1
    assert instance.name == "Delux"
    assert instance.description == "Test description"
    assert instance.capacity == 2

@pytest.mark.django_db
def test_room_type_missing_name():
    input_data = {
        "description" : 'Test description',
        "capacity" : 2
    }

    serializer = RoomTypeSerializer(data = input_data)
    assert not serializer.is_valid()
    assert "name" in serializer.errors


@pytest.mark.django_db
def test_room_type_invalid_capacity():
    input_data = {
        "name": "Delux",
        "description": "Test description",
        "capacity": -1
    }

    serializer = RoomTypeSerializer(data=input_data)
    assert not serializer.is_valid()
    assert "capacity" in serializer.errors



@pytest.mark.django_db
def test_room_type_duplicate_name():
    RoomType.objects.create(
        name="Delux", 
        description="Test description", 
        capacity=2
    )

    input_data = {
        "name": "Delux",
        "description": "Another test description",
        "capacity": 3
    }

    serializer = RoomTypeSerializer(data=input_data)
    assert not serializer.is_valid()
    assert "name" in serializer.errors



# Room
@pytest.mark.django_db
def test_room_serialiazer_output():
    room_type = RoomType.objects.create(
        name = "Superior standart",
        description = 'Test description',
        capacity = 1
    )

    room = Room.objects.create(
        number = 210,
        floor = 2,
        room_type = room_type,
        status = "occupied",
        notes = "some notes",
        is_active = True,
        cleaning_required = False
    )

    serializer = RoomSerializer(room)
    data = serializer.data

    assert data["number"] == 210
    assert data["floor"] == 2
    assert data["room_type"] == room_type.id
    assert data["status"] == "occupied"
    assert data["notes"] == "some notes"
    assert data["is_active"] == True
    assert data["cleaning_required"] == False



@pytest.mark.django_db
def test_room_serializer_valid_input():
    room_type = RoomType.objects.create(
        name = "Superior standart",
        description = 'Test description',
        capacity = 1
    )
    input_data = {
        "number" : 210,
        "floor" : 2,
        "room_type" : room_type.id,
        "status" : "occupied",
        "notes" : "some notes",
        "is_active" : True,
        "cleaning_required" : False
    }

    serializer = RoomSerializer(data = input_data)
    assert serializer.is_valid()
    instance = serializer.save()

    assert RoomType.objects.count() == 1
    assert instance.number == 210
    assert instance.floor == 2
    assert instance.room_type == room_type
    assert instance.status == "occupied"
    assert instance.notes == "some notes"
    assert instance.is_active == True
    assert instance.cleaning_required == False
 

@pytest.mark.django_db
def test_room_missing_number():
    room_type = RoomType.objects.create(
        name = "Superior standart",
        description = 'Test description',
        capacity = 1
    )
    input_data = {
        "floor" : 2,
        "room_type" : room_type.id,
        "status" : "occupied",
        "notes" : "some notes",
        "is_active" : True,
        "cleaning_required" : False
    }

    serializer = RoomSerializer(data = input_data)
    assert not serializer.is_valid()
    assert "number" in serializer.errors

@pytest.mark.django_db
def test_room_missing_floor():
    room_type = RoomType.objects.create(
        name = "Superior standart",
        description = 'Test description',
        capacity = 1
    )
    input_data = {
        "number" : 210,
        "room_type" : room_type.id,
        "status" : "occupied",
        "notes" : "some notes",
        "is_active" : True,
        "cleaning_required" : False
    }

    serializer = RoomSerializer(data = input_data)
    assert not serializer.is_valid()
    assert "floor" in serializer.errors


@pytest.mark.django_db
def test_room_duplicate_number():
    room_type = RoomType.objects.create(
        name = "Superior standart",
        description = 'Test description',
        capacity = 1
    )
    Room.objects.create(
        number = 210,
        floor = 2,
        room_type = room_type,
        status = "occupied",
        notes = "some notes",
        is_active = True,
        cleaning_required = False
    )

    input_data = {
        "number" : 210,
        "room_type" : room_type.id,
        "status" : "free",
        "notes" : "another notes",
        "is_active" : False,
        "cleaning_required" : False
    }

    serializer = RoomSerializer(data=input_data)
    assert not serializer.is_valid()
    assert "number" in serializer.errors

@pytest.mark.django_db
def test_room_serializer_ignores_cleaning_required_input():
    room_type = RoomType.objects.create(name="Standard", description="desc", capacity=2)
    input_data = {
        "number": 211,
        "floor": 3,
        "room_type": room_type.id,
        "status": "needs_cleaning",
        "notes": "",
        "is_active": True,
        "cleaning_required": False  
    }

    serializer = RoomSerializer(data=input_data)
    assert serializer.is_valid()
    room = serializer.save()

    assert room.cleaning_required == True  

@pytest.mark.django_db
def test_room_type_name_field():
    room_type = RoomType.objects.create(name="Deluxe", description="", capacity=2)
    room = Room.objects.create(number=301, floor=3, room_type=room_type)

    serializer = RoomSerializer(room)
    data = serializer.data
    assert data["room_type_name"] == "Deluxe"


# Cleaning template
@pytest.mark.django_db
def test_cleanit_template_serialiazer_output():
    user = User.objects.create(
        username = "Manager",
        password = 'testpass123',
        role = "manager"
    )

    cleaning_template = CleaningChecklistTemplate.objects.create(
        name = "Standart cleaning",
        created_by = user,
        is_active = False,
    )

    serializer = CleaningChecklistTemplateSerializer(cleaning_template)
    data = serializer.data

    assert data["name"] == "Standart cleaning"
    assert data["created_by"] == user.id
    assert data["is_active"] == False
  

@pytest.mark.django_db
def test_cleaning_template_serializer_valid_input():
    user = User.objects.create(
        username = "Manager",
        password = 'testpass123',
        role = "manager"
    )

    input_data = {
        "name" : "Standart cleaning",
        "created_by" : user.id,
        "is_active" : False,
    }

    serializer = CleaningChecklistTemplateSerializer(data = input_data)
    assert serializer.is_valid()
    instance = serializer.save()

    assert CleaningChecklistTemplate.objects.count() == 1
    assert instance.name == "Standart cleaning"
    assert instance.is_active == False
    assert instance.created_by == user
    

@pytest.mark.django_db
def test_cleaning_template_missing_name():
    user = User.objects.create(
        username = "Manager",
        password = 'testpass123',
        role = "manager"
    )

    input_data = {
        "created_by" : user.id,
        "is_active" : False,
    }

    serializer = CleaningChecklistTemplateSerializer(data = input_data)
    assert not serializer.is_valid()
    assert "name" in serializer.errors