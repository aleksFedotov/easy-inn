import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from users.models import User
from shifts.models import ShiftNote

@pytest.mark.django_db
def test_create_shiftnote_sets_author():
    client = APIClient()
    user = User.objects.create_user(username="manager", password="testpass", role="manager")
    client.force_authenticate(user=user)

    url = reverse("shiftnote-list")  # предполагается, что viewset зарегистрирован с basename='shiftnote'
    data = {
        "text": "Подготовить смену",
        "type": "task",
        "is_archived": False
    }

    response = client.post(url, data, format="json")
    assert response.status_code == 201
    note = ShiftNote.objects.first()
    assert note.author == user
    assert note.text == "Подготовить смену"

@pytest.mark.django_db
def test_get_shiftnotes_list():
    user = User.objects.create_user(username="manager", password="testpass", role="manager")
    note = ShiftNote.objects.create(author=user, text="Заметка", type="info")

    client = APIClient()
    client.force_authenticate(user=user)

    url = reverse("shiftnote-list")
    response = client.get(url)

    assert response.status_code == 200
    assert response.data[0]["text"] == "Заметка"
    assert response.data[0]["author_name"] == user.username

@pytest.mark.django_db
def test_patch_shiftnote():
    user = User.objects.create_user(username="manager", password="testpass", role="manager")
    note = ShiftNote.objects.create(author=user, text="Старая заметка", type="info")

    client = APIClient()
    client.force_authenticate(user=user)

    url = reverse("shiftnote-detail", args=[note.id])
    response = client.patch(url, {"text": "Обновлено"}, format="json")

    assert response.status_code == 200
    note.refresh_from_db()
    assert note.text == "Обновлено"

@pytest.mark.django_db
def test_delete_shiftnote():
    user = User.objects.create_user(username="manager", password="testpass", role="manager")
    note = ShiftNote.objects.create(author=user, text="Удалить", type="warning")

    client = APIClient()
    client.force_authenticate(user=user)

    url = reverse("shiftnote-detail", args=[note.id])
    response = client.delete(url)

    assert response.status_code == 204
    assert ShiftNote.objects.count() == 0
