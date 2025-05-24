from rest_framework import viewsets
import logging 
from rest_framework.permissions import IsAuthenticated
from .models import RoomType, Room, Zone
from .serializers import RoomTypeSerializer, RoomSerializer, ZoneSerializer
from utills.permissions import IsManager, IsManagerOrFrontDesk
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.db import models
from utills.mixins import AllowAllPaginationMixin



logger = logging.getLogger(__name__)
# --- RoomType ViewSet ---

class RoomTypeViewSet(AllowAllPaginationMixin,viewsets.ModelViewSet):
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

class RoomViewSet(AllowAllPaginationMixin,viewsets.ModelViewSet):
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

    @action(detail=False, methods=['get'],url_path='status-summary')
    def status_summary(self, request):
        """
        Возвращает количество номеров по определенным статусам (dirty, in_progress, waiting_inspection).
        Доступно аутентифицированным пользователям с ролью 'manager' или 'front desk'.
        """
        self.permission_classes = [IsAuthenticated, IsManagerOrFrontDesk] 
        self.check_permissions(request) 
        summary = Room.objects.filter(is_active=True).aggregate( # Учитываем только активные номера
            awaiting_cleaning=models.Count('pk', filter=models.Q(status='dirty')), 
            in_progress=models.Count('pk', filter=models.Q(status='in_progress')), 
            ready_for_inspection=models.Count('pk', filter=models.Q(status='waiting_inspection')), 
           
        )

        
        return Response(summary, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def change_status(self,request, pk=None):
        room = self.get_object()
        new_status = request.data.get('new_status')
        if new_status not in Room.Status.values:
            return Response({'error': "Недопустимый статус"},status=status.HTTP_400_BAD_REQUEST)
        room.status = new_status
        room.save()
        logger.info(f"Room {room.pk} status changed to {new_status}")
        return Response()
    
    


# --- Zone ViewSet ---

class ZoneViewSet(AllowAllPaginationMixin,viewsets.ModelViewSet):
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
    
    


