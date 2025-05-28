import logging
from rest_framework.permissions import IsAuthenticated
from utills.permissions import IsManager
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from users.models import User
from users.serializers import UserSerializer
from rest_framework.decorators import action, api_view
from django.utils import timezone

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
    
    # --- Добавление сортировки ---
    filter_backends = [OrderingFilter,DjangoFilterBackend] # Включаем фильтр сортировки
    filterset_fields = ['role']  
    ordering_fields = [
        'username',
        'email',
        'first_name',
        'last_name',
        'role',
        'date_joined',
        'last_login'
    ]

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated], url_path="me")
    def me(self, request):
        """
        Get data for the current authenticated user.
        Получить данные текущего аутентифицированного пользователя.
        """
        # request.user содержит объект текущего аутентифицированного пользователя
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    def paginate_queryset(self, queryset):
        if self.request.query_params.get('all') == 'true':
            return None 
        return super().paginate_queryset(queryset)
    


@api_view(['GET'])  # Or whatever method you use
def get_assigned_housekeepers_for_date(request):
    scheduled_date_str = request.query_params.get('scheduled_date')
    logger.info(f'Поиск горничных на дату {scheduled_date_str}')
    if not scheduled_date_str:
        return Response({"error": "scheduled_date is required"}, status=400)
    try:
        scheduled_date = timezone.datetime.strptime(scheduled_date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)

   
    available_housekeepers = User.objects.filter(role=User.Role.HOUSEKEEPER)  

    # 2. Get housekeepers *already* assigned to tasks on this date
    already_assigned_housekeepers = User.objects.filter(
        assigned_tasks__scheduled_date=scheduled_date
    ).distinct().all()

   
    all_relevant_housekeepers = (already_assigned_housekeepers).distinct()

   
    serializer = UserSerializer(all_relevant_housekeepers, many=True)  
    return Response(serializer.data)

