from rest_framework.permissions import BasePermission
from cleaning.models import CleaningTask
from users.models import User

class IsManager(BasePermission):
    """
    Проверяет, является ли аутентифицированный пользователь менеджером.
    Checks if the authenticated user is a manager.
    """
    def has_permission(self, request, view):
        # Проверяем, аутентифицирован ли пользователь и имеет ли роль менеджера
        # Check if the user is authenticated and has the manager role
        return request.user.is_authenticated and request.user.role == User.Role.MANAGER

class IsAdmin(BasePermission):
    """
    Проверяет, является ли аутентифицированный пользователь администратором.
    Checks if the authenticated user is an administrator.
    """
    def has_permission(self, request, view):
        # Проверяем, аутентифицирован ли пользователь и имеет ли роль администратора
        # Check if the user is authenticated and has the admin role
        return request.user.is_authenticated and request.user.role == User.Role.ADMIN

class IsHouseKeeper(BasePermission):
    """
    Проверяет, является ли аутентифицированный пользователь горничной.
    Checks if the authenticated user is a housekeeper.
    """
    def has_permission(self, request, view):
        # Проверяем, аутентифицирован ли пользователь и имеет ли роль горничной
        # Check if the user is authenticated and has the housekeeper role
        return request.user.is_authenticated and request.user.role == User.Role.HOUSEKEEPER

class IsManagerOrAdmin(BasePermission):
    """
    Проверяет, является ли аутентифицированный пользователь менеджером или администратором.
    Checks if the authenticated user is a manager or an administrator.
    """
    def has_permission(self, request, view):
        # Проверяем, аутентифицирован ли пользователь и имеет ли роль менеджера или администратора
        # Check if the user is authenticated and has the manager or admin role
        return request.user.is_authenticated and request.user.role in [User.Role.ADMIN, User.Role.MANAGER]

class IsAssignedHousekeeperOrManagerOrAdmin(BasePermission): # Обновленное имя класса / Updated class name
    """
    Проверяет разрешения на уровне объекта.
    Разрешает доступ менеджерам и администраторам.
    Разрешает доступ горничной, если она назначена на задачу уборки.
    Checks object-level permissions.
    Allows access for managers and administrators.
    Allows access for a housekeeper if they are assigned to the cleaning task.
    """
    def has_object_permission(self, request, view, obj):

        # Разрешаем доступ менеджерам и администраторам
        # Allow access for managers and administrators
        if request.user and request.user.is_authenticated and request.user.role in [User.Role.ADMIN, User.Role.MANAGER]:
            return True

        # Разрешаем доступ горничной, если она назначена на задачу уборки
        # Allow access for a housekeeper if they are assigned to the cleaning task
        if isinstance(obj, CleaningTask) and request.user and request.user.is_authenticated and request.user.role == User.Role.HOUSEKEEPER:
             return obj.assigned_to == request.user

        # В остальных случаях запретить доступ
        # In all other cases, deny access
        return False