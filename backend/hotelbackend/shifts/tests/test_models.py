import pytest
from django.utils import timezone
from shifts.models import ShiftNote
from users.models import User  

@pytest.mark.django_db
def test_shift_note_creation():
    user = User.objects.create(username="manager", password="test123", role="manager")
    note = ShiftNote.objects.create(
        author=user,
        text="Проверить номер 202",
        type="task"
    )

    assert note.id is not None
    assert note.author == user
    assert note.text == "Проверить номер 202"
    assert note.type == "task"
    assert note.is_archived is False
    assert note.pinned is False
    assert isinstance(note.created_at, timezone.datetime)
    assert isinstance(note.updated_at, timezone.datetime)

@pytest.mark.django_db
def test_shift_note_default_values():
    user = User.objects.create(username="manager2", password="test123", role="manager")
    note = ShiftNote.objects.create(author=user, text="Просто заметка")

    assert note.type == "info"
    assert note.is_archived is False
    assert note.pinned is False

@pytest.mark.django_db
def test_shift_note_ordering():
    user = User.objects.create(username="manager3", password="test123", role="manager")

    note1 = ShiftNote.objects.create(author=user, text="Заметка 1", pinned=False)
    note2 = ShiftNote.objects.create(author=user, text="Заметка 2", pinned=True)

    notes = list(ShiftNote.objects.all())
    assert notes[0] == note2  
    assert notes[1] == note1

@pytest.mark.django_db
def test_shift_note_str_method():
    user = User.objects.create(username="manager4", password="test123", role="manager")
    note = ShiftNote.objects.create(author=user, text="Краткая заметка", type="warning")

    assert str(note) == "Внимание: Краткая заметка"