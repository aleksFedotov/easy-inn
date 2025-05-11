from rest_framework import viewsets

from rest_framework.permissions import IsAuthenticated 
from .models import RoomType, Room, Zone
from .serializers import RoomTypeSerializer, RoomSerializer, ZoneSerializer
from utills.permissions import IsManager 

# --- RoomType ViewSet ---

class RoomTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления типами номеров (RoomType).
    Доступен только аутентифицированным пользователям с ролью 'manager'.
    Предоставляет стандартные CRUD операции: list, create, retrieve, update, partial_update, destroy.

    ViewSet for managing Room Types (RoomType).
    Accessible only to authenticated users with the 'manager' role.
    Provides standard CRUD operations: list, create, retrieve, update, partial_update, destroy.
    """
    # Определяем набор данных, с которым работает ViewSet (все объекты RoomType).
    # Define the queryset for the ViewSet (all RoomType objects).
    queryset = RoomType.objects.all()
    
    # Определяем сериализатор для преобразования данных.
    # Define the serializer for data transformation.
    serializer_class = RoomTypeSerializer
    
    # Определяем разрешения доступа к этому ViewSet.
    # Требуется аутентификация (глобально или явно) И роль менеджера.
    # Define the access permissions for this ViewSet.
    # Requires authentication (globally or explicitly) AND the 'manager' role.
    permission_classes = [IsAuthenticated, IsManager] 

# --- Room ViewSet ---

class RoomViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления номерами (Room).
    Доступен только аутентифицированным пользователям с ролью 'manager'.
    Предоставляет стандартные CRUD операции: list, create, retrieve, update, partial_update, destroy.

    ViewSet for managing Rooms (Room).
    Accessible only to authenticated users with the 'manager' role.
    Provides standard CRUD operations: list, create, retrieve, update, partial_update, destroy.
    """
    # Определяем набор данных, с которым работает ViewSet (все объекты Room).
    # Define the queryset for the ViewSet (all Room objects).
    queryset = Room.objects.all()
    
    # Определяем сериализатор для преобразования данных.
    # Define the serializer for data transformation.
    serializer_class = RoomSerializer
    
    # Определяем разрешения доступа к этому ViewSet.
    # Требуется аутентификация (глобально или явно) И роль менеджера.
    # Define the access permissions for this ViewSet.
    # Requires authentication (globally or explicitly) AND the 'manager' role.
    permission_classes = [IsAuthenticated, IsManager] 



# --- Zone ViewSet ---

class ZoneViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления зонами (Zone).
    Доступен только аутентифицированным пользователям с ролью 'manager'.
    Предоставляет стандартные CRUD операции: list, create, retrieve, update, partial_update, destroy.

    ViewSet for managing Zones (Zone).
    Accessible only to authenticated users with the 'manager' role.
    Provides standard CRUD operations: list, create, retrieve, update, partial_update, destroy.
    """
    # Определяем набор данных, с которым работает ViewSet (все объекты Zone).
    # Define the queryset for the ViewSet (all Zone objects).
    queryset = Zone.objects.all()
    
    # Определяем сериализатор для преобразования данных.
    # Define the serializer for data transformation.
    serializer_class = ZoneSerializer
    
    # Определяем разрешения доступа к этому ViewSet.
    # Требуется аутентификация (глобально или явно) И роль менеджера.
    # Define the access permissions for this ViewSet.
    # Requires authentication (globally or explicitly) AND the 'manager' role.
    permission_classes = [IsAuthenticated, IsManager] 


