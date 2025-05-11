import logging
from rest_framework.permissions import IsAuthenticated
from utills.permissions import IsManager
from rest_framework import viewsets

from users.models import User
from users.serializers import UserSerializer

logger = logging.getLogger(__name__)

# --- User ViewSet ---

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing User objects.
    Provides standard CRUD operations (list, create, retrieve, update, partial_update, destroy).
    Access is restricted based on permission_classes.

    ViewSet для управления объектами User.
    Предоставляет стандартные CRUD операции (список, создание, получение, обновление, частичное обновление, удаление).
    Доступ ограничен на основе permission_classes.
    """
    # Define the queryset to retrieve all User objects
    # Определяем queryset для получения всех объектов User
    queryset = User.objects.all()

    # Specify the serializer class to use for this ViewSet
    # Указываем класс сериализатора, который будет использоваться для этого ViewSet
    serializer_class = UserSerializer

    # Define the permission classes required to access this ViewSet.
    # [IsAuthenticated, IsManager] means:
    # - The user must be authenticated (logged in).
    # - AND the user must pass the IsManager permission check (have the 'manager' role).
    # Only authenticated managers can access this ViewSet.
    # Определяем классы разрешений, необходимые для доступа к этому ViewSet.
    # [IsAuthenticated, IsManager] означает:
    # - Пользователь должен быть аутентифицирован (войти в систему).
    # - И пользователь должен пройти проверку разрешения IsManager (иметь роль 'manager').
    # Только аутентифицированные управляющие могут получить доступ к этому ViewSet.
    permission_classes = [IsAuthenticated, IsManager]

    