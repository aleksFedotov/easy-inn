import pytest
from rest_framework.test import APIClient # Although not strictly necessary for direct permission testing, good practice to import
from django.urls import reverse # Not strictly necessary for direct permission testing
from rest_framework import status # Not strictly necessary for direct permission testing
from django.contrib.auth import get_user_model
from unittest.mock import MagicMock # To create mock objects

# Import your permission classes
from utills.permissions import (
    IsManager,
    IsAdmin,
    IsHouseKeeper,
    IsManagerOrAdmin,
    IsAssignedHousekeeperOrManagerOrAdmin
)
# Import your User model and CleaningTask model (needed for object permission test)
from users.models import User
from cleaning.models import CleaningTask # Assuming CleaningTask is in cleaning.models

# Get the custom User model
UserModel = get_user_model()

# --- Fixtures ---

@pytest.fixture
def create_user():
    """Fixture to create a user with a specific role."""
    def _create_user(username, password, role):
        # Use create_user method to ensure password hashing and proper user creation
        return UserModel.objects.create_user(
            username=username,
            password=password,
            role=role
        )
    return _create_user

@pytest.fixture
def manager_user(create_user):
    """Fixture to create and return a manager user."""
    return create_user("manager_user", "managerpass", User.Role.MANAGER)

@pytest.fixture
def admin_user(create_user):
    """Fixture to create and return an admin user."""
    return create_user("admin_user", "adminpass", User.Role.ADMIN)

@pytest.fixture
def housekeeper_user(create_user):
    """Fixture to create and return a housekeeper user."""
    return create_user("housekeeper_user", "housekeeperpass", User.Role.HOUSEKEEPER)

@pytest.fixture
def unauthenticated_user():
    """Fixture to return a mock unauthenticated user."""
    # Create a mock user object that behaves like an unauthenticated user
    mock_user = MagicMock()
    mock_user.is_authenticated = False
    mock_user.role = None # Unauthenticated user has no role
    mock_user.username = "unauthenticated"
    mock_user.pk = None
    return mock_user

@pytest.fixture
def mock_request(unauthenticated_user):
    """Fixture to create a mock request object."""
    # Create a mock request object and attach the unauthenticated user initially
    mock_req = MagicMock()
    mock_req.user = unauthenticated_user
    # Add other request attributes if needed by permissions (e.g., method, data)
    mock_req.method = 'GET' # Default method
    mock_req.data = {} # Default data
    return mock_req

@pytest.fixture
def mock_view():
    """Fixture to create a mock view object."""
    # Create a mock view object
    mock_v = MagicMock()
    # Add view attributes if needed by permissions (e.g., action, detail)
    mock_v.action = 'list' # Default action
    mock_v.detail = False # Default detail status
    return mock_v

@pytest.fixture
def mock_cleaning_task_assigned(housekeeper_user):
    """Fixture to create a mock CleaningTask object assigned to housekeeper_user."""
    mock_task = MagicMock(spec=CleaningTask) # Use spec to mimic CleaningTask attributes
    mock_task.pk = 1
    mock_task.assigned_to = housekeeper_user
    mock_task.status = CleaningTask.Status.ASSIGNED
    return mock_task

@pytest.fixture
def mock_cleaning_task_unassigned():
    """Fixture to create a mock CleaningTask object that is unassigned."""
    mock_task = MagicMock(spec=CleaningTask)
    mock_task.pk = 2
    mock_task.assigned_to = None
    mock_task.status = CleaningTask.Status.UNASSIGNED
    return mock_task

@pytest.fixture
def mock_other_object():
    """Fixture to create a mock object that is not a CleaningTask."""
    mock_obj = MagicMock()
    mock_obj.pk = 99
    return mock_obj


# --- Tests for IsManager ---

@pytest.mark.django_db # Use django_db as we create real users
def test_is_manager_permission(mock_request, manager_user, admin_user, housekeeper_user, unauthenticated_user):
    """Test IsManager permission."""
    permission = IsManager()
    view = mock_view # Use mock view

    # Manager should have permission
    mock_request.user = manager_user
    assert permission.has_permission(mock_request, view) is True

    # Admin should not have permission
    mock_request.user = admin_user
    assert permission.has_permission(mock_request, view) is False

    # Housekeeper should not have permission
    mock_request.user = housekeeper_user
    assert permission.has_permission(mock_request, view) is False

    # Unauthenticated user should not have permission
    mock_request.user = unauthenticated_user
    assert permission.has_permission(mock_request, view) is False


# --- Tests for IsAdmin ---

@pytest.mark.django_db
def test_is_admin_permission(mock_request, manager_user, admin_user, housekeeper_user, unauthenticated_user):
    """Test IsAdmin permission."""
    permission = IsAdmin()
    view = mock_view

    # Admin should have permission
    mock_request.user = admin_user
    assert permission.has_permission(mock_request, view) is True

    # Manager should not have permission
    mock_request.user = manager_user
    assert permission.has_permission(mock_request, view) is False

    # Housekeeper should not have permission
    mock_request.user = housekeeper_user
    assert permission.has_permission(mock_request, view) is False

    # Unauthenticated user should not have permission
    mock_request.user = unauthenticated_user
    assert permission.has_permission(mock_request, view) is False


# --- Tests for IsHouseKeeper ---

@pytest.mark.django_db
def test_is_housekeeper_permission(mock_request, manager_user, admin_user, housekeeper_user, unauthenticated_user):
    """Test IsHouseKeeper permission."""
    permission = IsHouseKeeper()
    view = mock_view

    # Housekeeper should have permission
    mock_request.user = housekeeper_user
    assert permission.has_permission(mock_request, view) is True

    # Manager should not have permission
    mock_request.user = manager_user
    assert permission.has_permission(mock_request, view) is False

    # Admin should not have permission
    mock_request.user = admin_user
    assert permission.has_permission(mock_request, view) is False

    # Unauthenticated user should not have permission
    mock_request.user = unauthenticated_user
    assert permission.has_permission(mock_request, view) is False


# --- Tests for IsManagerOrAdmin ---

@pytest.mark.django_db
def test_is_manager_or_admin_permission(mock_request, manager_user, admin_user, housekeeper_user, unauthenticated_user):
    """Test IsManagerOrAdmin permission."""
    permission = IsManagerOrAdmin()
    view = mock_view

    # Manager should have permission
    mock_request.user = manager_user
    assert permission.has_permission(mock_request, view) is True

    # Admin should have permission
    mock_request.user = admin_user
    assert permission.has_permission(mock_request, view) is True

    # Housekeeper should not have permission
    mock_request.user = housekeeper_user
    assert permission.has_permission(mock_request, view) is False

    # Unauthenticated user should not have permission
    mock_request.user = unauthenticated_user
    assert permission.has_permission(mock_request, view) is False


# --- Tests for IsAssignedHousekeeperOrManagerOrAdmin (Object Level) ---

@pytest.mark.django_db
def test_is_assigned_housekeeper_or_manager_or_admin_permission(
    mock_request,
    mock_view,
    manager_user,
    admin_user,
    housekeeper_user,
    unauthenticated_user, # Removed other_user
    mock_cleaning_task_assigned,
    mock_cleaning_task_unassigned,
    mock_other_object
):
    """Test IsAssignedHousekeeperOrManagerOrAdmin object-level permission."""
    permission = IsAssignedHousekeeperOrManagerOrAdmin()
    view = mock_view # Use mock view

    # Set view action to a detail action to ensure has_object_permission is relevant
    view.action = 'retrieve'
    view.detail = True

    # --- Test with mock_cleaning_task_assigned (assigned to housekeeper_user) ---

    # Assigned Housekeeper should have permission
    mock_request.user = housekeeper_user
    assert permission.has_object_permission(mock_request, view, mock_cleaning_task_assigned) is True

    # Manager should have permission
    mock_request.user = manager_user
    assert permission.has_object_permission(mock_request, view, mock_cleaning_task_assigned) is True

    # Admin should have permission
    mock_request.user = admin_user
    assert permission.has_object_permission(mock_request, view, mock_cleaning_task_assigned) is True

    # Unauthenticated user should NOT have permission
    mock_request.user = unauthenticated_user
    assert permission.has_object_permission(mock_request, view, mock_cleaning_task_assigned) is False

    # --- Test with mock_cleaning_task_unassigned ---

    # Assigned Housekeeper (who is not assigned to this task) should NOT have permission
    mock_request.user = housekeeper_user
    assert permission.has_object_permission(mock_request, view, mock_cleaning_task_unassigned) is False

    # Manager should have permission
    mock_request.user = manager_user
    assert permission.has_object_permission(mock_request, view, mock_cleaning_task_unassigned) is True

    # Admin should have permission
    mock_request.user = admin_user
    assert permission.has_object_permission(mock_request, view, mock_cleaning_task_unassigned) is True

    # Unauthenticated user should NOT have permission
    mock_request.user = unauthenticated_user
    assert permission.has_object_permission(mock_request, view, mock_cleaning_task_unassigned) is False


    # --- Test with mock_other_object (not a CleaningTask) ---

    # Manager should have permission (as they have general object access)
    mock_request.user = manager_user
    assert permission.has_object_permission(mock_request, view, mock_other_object) is True

    # Admin should have permission (as they have general object access)
    mock_request.user = admin_user
    assert permission.has_object_permission(mock_request, view, mock_other_object) is True

    # Housekeeper should NOT have permission (logic only applies to CleaningTask)
    mock_request.user = housekeeper_user
    assert permission.has_object_permission(mock_request, view, mock_other_object) is False

    # Unauthenticated user should NOT have permission
    mock_request.user = unauthenticated_user
    assert permission.has_object_permission(mock_request, view, mock_other_object) is False

