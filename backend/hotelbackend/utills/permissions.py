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

class IsHouseKeeper(BasePermission):
    """
    Проверяет, является ли аутентифицированный пользователь горничной.
    Checks if the authenticated user is a housekeeper.
    """
    def has_permission(self, request, view):
        # Проверяем, аутентифицирован ли пользователь и имеет ли роль горничной
        # Check if the user is authenticated and has the housekeeper role
        return request.user.is_authenticated and request.user.role == User.Role.HOUSEKEEPER

class IsFrontDesk(BasePermission):
    """
    Allows access only to front desk staff.
    Разрешает доступ только сотрудникам ресепшна.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.FRONT_DESK
    

class IsManagerOrFrontDesk(BasePermission):
    """
    Allows access only to managers or front desk staff.
    Разрешает доступ только управляющим или сотрудникам ресепшна.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == User.Role.MANAGER or \
            request.user.role == User.Role.FRONT_DESK
    
    
class IsAssignedHousekeeperOrManagerOrFrontDesk(BasePermission):
    """
    Allows access to the assigned housekeeper, or any manager, or any front desk staff.
    """
    message = "У вас нет прав для выполнения этого действия над этой задачей."

    def has_object_permission(self, request, view, obj):
        # obj - это экземпляр задачи, например, CleaningTask
        if not request.user or not request.user.is_authenticated:
            return False

        # Разрешено, если пользователь - назначенный исполнитель
        if hasattr(obj, 'assigned_to') and obj.assigned_to == request.user:
            return True

        # Разрешено, если пользователь - Управляющий или Ресепшн
        if request.user.role == User.Role.MANAGER or \
           request.user.role == User.Role.FRONT_DESK:
            return True

        return False