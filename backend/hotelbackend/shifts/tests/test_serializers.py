import pytest
from shifts.models import ShiftNote
from shifts.serializers import ShiftNoteSerializer
from users.models import User 
from datetime import datetime

@pytest.mark.django_db
def test_shiftnote_serializer_valid_input():
    user = User.objects.create(username="manager", password="testpass", role="manager")
    input_data = {
        "author": user.id,
        "text": "Убрать номер 101",
        "type": "task",
        "is_archived": False
    }

    serializer = ShiftNoteSerializer(data=input_data)
    assert serializer.is_valid(), serializer.errors
    instance = serializer.save()

    assert ShiftNote.objects.count() == 1
    assert instance.text == "Убрать номер 101"
    assert instance.author == user
    assert instance.type == "task"
    assert instance.is_archived is False

@pytest.mark.django_db
def test_shiftnote_serializer_output():
    user = User.objects.create(username="manager", password="testpass", role="manager")
    note = ShiftNote.objects.create(
        author=user,
        text="Проверить кондиционер",
        type="warning",
        is_archived=True
    )

    serializer = ShiftNoteSerializer(note)
    data = serializer.data

    assert data["text"] == "Проверить кондиционер"
    assert data["type"] == "warning"
    assert data["is_archived"] is True
    assert data["author"] == user.id
    assert data["author_name"] == "manager"
    assert "created_at" in data
    assert "updated_at" in data

@pytest.mark.django_db
def test_shiftnote_serializer_missing_text():
    user = User.objects.create(username="manager", password="testpass", role="manager")
    input_data = {
        "author": user.id,
        "type": "info"
    }

    serializer = ShiftNoteSerializer(data=input_data)
    assert not serializer.is_valid()
    assert "text" in serializer.errors

@pytest.mark.django_db
def test_shiftnote_serializer_invalid_type():
    user = User.objects.create(username="manager", password="testpass", role="manager")
    input_data = {
        "author": user.id,
        "text": "Тестовая заметка",
        "type": "invalid_type"
    }

    serializer = ShiftNoteSerializer(data=input_data)
    assert not serializer.is_valid()
    assert "type" in serializer.errors


@pytest.mark.django_db
def test_shiftnote_serializer_read_only_fields_ignored():
    user = User.objects.create(username="manager", password="testpass", role="manager")

   
    input_data = {
        "author": user.id,
        "text": "Сделать отчет",
        "type": "info",
        "is_archived": False,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-02T00:00:00Z",
    }

    serializer = ShiftNoteSerializer(data=input_data)
    assert serializer.is_valid(), serializer.errors
    instance = serializer.save()

    
    assert instance.created_at.date() != datetime(2025, 1, 1).date()
    assert instance.updated_at.date() != datetime(2025, 1, 2).date()