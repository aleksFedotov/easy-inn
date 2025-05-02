from rest_framework.permissions import IsAuthenticated
from utills.permissions import IsManager
from rest_framework import viewsets

from users.models import User
from users.serializers import UserSerializer, UserCreateSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsManager]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer