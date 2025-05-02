from rest_framework.permissions import BasePermission

class IsManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'manager'
    
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsMaid(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'maid'
    
class IsManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'manager']
        