import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.conf import settings # Import settings to access JWT secret key
import jwt # Import PyJWT library for decoding tokens

# Import your custom User model
# from users.models import User

# # Get the custom User model
# UserModel = get_user_model()

# # --- Fixtures ---

# @pytest.fixture
# def api_client():
#     """A Django REST Framework API client instance."""
#     return APIClient()

# @pytest.fixture
# def create_user():
#     """Fixture to create a user with a specific role."""
#     def _create_user(username, password, role, **extra_fields):
#         # Use create_user method to ensure password hashing
#         return UserModel.objects.create_user(
#             username=username,
#             password=password,
#             role=role,
#             **extra_fields
#         )
#     return _create_user

# @pytest.fixture
# def manager_user(create_user):
#     """Fixture to create and return a manager user."""
#     # Use User.Role for consistency
#     return create_user("manager_user", "managerpass", User.Role.MANAGER)

# @pytest.fixture
# def admin_user(create_user):
#     """Fixture to create and return an admin user."""
#     # Use User.Role for consistency
#     return create_user("admin_user", "adminpass", User.Role.ADMIN)

# @pytest.fixture
# def housekeeper_user(create_user):
#     """Fixture to create and return a housekeeper user."""
#     # Use User.Role for consistency
#     return create_user("housekeeper_user", "housekeeperpass", User.Role.HOUSEKEEPER)

# # --- Helper function to decode JWT token payload ---

# def decode_jwt_payload(token):
#     """
#     Decodes a JWT token and returns its payload.
#     Requires the JWT signing key from settings.
#     """
#     # Use the signing key from Django settings (SIMPLE_JWT['SIGNING_KEY'] or SECRET_KEY)
#     # SIMPLE_JWT['SIGNING_KEY'] is preferred if explicitly set, otherwise use SECRET_KEY
#     signing_key = getattr(settings, 'SIMPLE_JWT', {}).get('SIGNING_KEY', settings.SECRET_KEY)

#     # Decode the token. audience and issuer might be needed depending on SIMPLE_JWT settings,
#     # but for basic payload check, just key and algorithms are usually enough.
#     # algorithms should match what simplejwt uses (usually HS256 by default)
#     algorithms = getattr(settings, 'SIMPLE_JWT', {}).get('ALGORITHM', 'HS256')

#     try:
#         # jwt.decode returns the payload as a dictionary
#         payload = jwt.decode(token, signing_key, algorithms=[algorithms])
#         return payload
#     except jwt.ExpiredSignatureError:
#         pytest.fail("JWT token has expired")
#     except jwt.InvalidTokenError:
#         pytest.fail("Invalid JWT token")
#     except Exception as e:
#         pytest.fail(f"Error decoding JWT token: {e}")


# # --- Tests for CustomTokenObtainPairSerializer ---

# @pytest.mark.django_db
# def test_token_payload_includes_role_manager(api_client, manager_user):
#     """
#     Test that the access token payload for a manager user includes the correct role.
#     """
#     # URL for obtaining JWT tokens (assuming simplejwt urls are set up)
#     url = reverse('token_obtain_pair') # This is the default name for simplejwt's TokenObtainPairView

#     # Data for the login request
#     login_data = {
#         'username': manager_user.username,
#         'password': 'managerpass',
#     }

#     # Post the login data to get tokens
#     response = api_client.post(url, login_data, format='json')

#     # Assert that the request was successful
#     assert response.status_code == status.HTTP_200_OK
#     assert 'access' in response.data # Ensure access token is in response
#     assert 'refresh' in response.data # Ensure refresh token is in response

#     # Get the access token from the response
#     access_token = response.data['access']

#     # Decode the access token to inspect its payload
#     payload = decode_jwt_payload(access_token)

#     # Assert that the payload contains 'user_id' and 'role'
#     assert 'user_id' in payload
#     assert 'role' in payload

#     # Assert that the 'user_id' and 'role' in the payload are correct
#     assert payload['user_id'] == manager_user.pk # user_id is the user's primary key
#     assert payload['role'] == User.Role.MANAGER # Check if the role matches the manager's role


# @pytest.mark.django_db
# def test_token_payload_includes_role_housekeeper(api_client, housekeeper_user):
#     """
#     Test that the access token payload for a housekeeper user includes the correct role.
#     """
#     url = reverse('token_obtain_pair')

#     login_data = {
#         'username': housekeeper_user.username,
#         'password': 'housekeeperpass',
#     }

#     response = api_client.post(url, login_data, format='json')

#     assert response.status_code == status.HTTP_200_OK
#     assert 'access' in response.data
#     assert 'refresh' in response.data

#     access_token = response.data['access']
#     payload = decode_jwt_payload(access_token)

#     assert 'user_id' in payload
#     assert 'role' in payload

#     assert payload['user_id'] == housekeeper_user.pk
#     assert payload['role'] == User.Role.HOUSEKEEPER # Check if the role matches the housekeeper's role


# @pytest.mark.django_db
# def test_token_payload_includes_role_admin(api_client, admin_user):
#     """
#     Test that the access token payload for an admin user includes the correct role.
#     """
#     url = reverse('token_obtain_pair')

#     login_data = {
#         'username': admin_user.username,
#         'password': 'adminpass',
#     }

#     response = api_client.post(url, login_data, format='json')

#     assert response.status_code == status.HTTP_200_OK
#     assert 'access' in response.data
#     assert 'refresh' in response.data

#     access_token = response.data['access']
#     payload = decode_jwt_payload(access_token)

#     assert 'user_id' in payload
#     assert 'role' in payload

#     assert payload['user_id'] == admin_user.pk
#     assert payload['role'] == User.Role.ADMIN # Check if the role matches the admin's role

