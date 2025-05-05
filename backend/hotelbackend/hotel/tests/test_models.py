import pytest
from hotel.models import Room, RoomType, CleaningChecklistTemplate
from users.models import User
from django.db import IntegrityError

# RoomType
@pytest.mark.django_db
def test_create_room_type():
    room_type = RoomType.objects.create(
        name = 'Standart',
        description = 'Test description',
        capacity = 2,
    )

    assert RoomType.objects.count() == 1
    assert room_type.name == 'Standart'
    assert room_type.description == 'Test description'
    assert room_type.capacity == 2


@pytest.mark.django_db
def test_room_type_defaul_capacity():
    room_type = RoomType.objects.create(
        name = 'Standart',
        description = 'Test description',
    )

    assert room_type.capacity == 1

@pytest.mark.django_db
def test_room_type_name_unique():
    RoomType.objects.create(
        name = "Standart"
    )
   

    with pytest.raises(IntegrityError):
        RoomType.objects.create(
        name = "Standart"
    )
        
@pytest.mark.django_db
def test_room_type_str():
    room_type = RoomType.objects.create(name="Standart")
    assert str(room_type) == "Standart"

# Room
@pytest.mark.django_db
def test_create_room():
    room_type = RoomType.objects.create(name= "Deluxe")
    room = Room.objects.create(
        number = 208,
        floor = 2,
        room_type = room_type,
        status = "occupied",
        notes ="Test Notes",
        is_active = False,
        cleaning_required = False,
    )

    assert Room.objects.count() == 1
    assert room.number == 208
    assert room.floor == 2
    assert room.room_type == room_type
    assert room.status == "occupied"
    assert room.notes == "Test Notes"
    assert room.is_active == False
    assert room.cleaning_required == False

@pytest.mark.django_db
def test_room_number_unique():
    Room.objects.create(
        number = 208,
        floor = 2,
    )

    with pytest.raises(IntegrityError):
        Room.objects.create(
        number = 208,
        floor = 1,
    )
        
@pytest.mark.django_db
def test_room_default_status():
    room = Room.objects.create(
        number = 208,
        floor = 2,
    )

    assert room.status == "free"

@pytest.mark.django_db
def test_room_default_is_active():
    room = Room.objects.create(
        number = 208,
        floor = 2,
    )

    assert room.is_active == True

@pytest.mark.django_db
def test_room_default_cleaning_required():
    room = Room.objects.create(
        number = 208,
        floor = 2,
    )

    assert room.cleaning_required == False
        
@pytest.mark.django_db
def test_room_default_str():
    room = Room.objects.create(
        number = 208,
        floor = 2,
    )

    assert str(room) == "Комната 208 (Этаж 2)"

@pytest.mark.django_db
def test_room_auto_save_cleaning_required_as_true_if_status_is_needs_cleaning():
    room = Room.objects.create(
        number = 208,
        floor = 2,
        status = "needs_cleaning"
    )

    assert room.cleaning_required == True

@pytest.mark.django_db
def test_room_auto_save_cleaning_required_false_if_status_is_not_needs_cleaning():
    room = Room.objects.create(
        number=209,
        floor=3,
        status="occupied"
    )
    assert room.cleaning_required is False

@pytest.mark.django_db
def test_room_type_set_null_on_delete():
    room_type = RoomType.objects.create(name="Suite")
    room = Room.objects.create(number=210, floor=2, room_type=room_type)
    room_type.delete()
    room.refresh_from_db()
    assert room.room_type is None

# CleaningChecklistTemplate
@pytest.mark.django_db
def test_create_cleaning_template():
    user = User.objects.create(username = "manager", password = "testpass123", role = "manager")
    cleaning_template = CleaningChecklistTemplate.objects.create(
        name = "Standart cleaning", 
        created_by = user,
        is_active = False
    )

    assert CleaningChecklistTemplate.objects.count() == 1
    assert cleaning_template.name == "Standart cleaning"
    assert cleaning_template.created_by == user
    assert cleaning_template.is_active == False

@pytest.mark.django_db
def test_cleaning_template_default_is_active():
    user = User.objects.create(username = "manager", password = "testpass123", role = "manager")
    cleaning_template = CleaningChecklistTemplate.objects.create(
        name = "Standart cleaning", 
        created_by = user,
       
    )

    assert cleaning_template.is_active == True
@pytest.mark.django_db
def test_str_cleaning_template():
    user = User.objects.create(username = "manager", password = "testpass123", role = "manager")
    cleaning_template = CleaningChecklistTemplate.objects.create(
        name = "Standart cleaning", 
        created_by = user,
       
    )

    assert str(cleaning_template) == "Standart cleaning"


@pytest.mark.django_db
def test_cleaning_template_created_by_can_be_null():
    cleaning_template = CleaningChecklistTemplate.objects.create(
        name="Без автора"
    )
    assert cleaning_template.created_by is None