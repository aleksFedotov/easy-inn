import logging
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.views import APIView
from rest_framework import status
from .models import PushToken
from firebase_admin import messaging

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
      
        logger.info(f'Получение данных для пользователя {request.user.username, request.user.id}')
        serializer = self.get_serializer(request.user)
        logger.info(f'AUTHENTICATION BACKEND: {request.successful_authenticator.__class__.__name__}')

        return Response(serializer.data)
    
    def paginate_queryset(self, queryset):
        if self.request.query_params.get('all') == 'true':
            return None 
        return super().paginate_queryset(queryset)
    


@api_view(['GET'])
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


    already_assigned_housekeepers = User.objects.filter(
        assigned_tasks__scheduled_date=scheduled_date
    ).distinct().all()

   
    all_relevant_housekeepers = (already_assigned_housekeepers).distinct()

   
    serializer = UserSerializer(all_relevant_housekeepers, many=True)  
    return Response(serializer.data)

class RegisterPushTokenView(APIView):
    permission_classes = [IsAuthenticated] # Ensure only authenticated users can register tokens

    def post(self, request, *args, **kwargs):
        token = request.data.get('token')

        if not token:
            return Response({'detail': 'Push token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Assuming your User model has a field to store the push token
        # For example, if you have a custom User model or a Profile model linked to User
        # You'll need to adjust this based on your actual User/Profile model structure
        try:
            # Example: Store the token directly on the User model
            # user = request.user
            # user.expo_push_token = token # Add this field to your User model!
            # user.save()

            # OR, if you have a separate PushToken model to store multiple tokens per user
            # from .models import UserPushToken # Create this model first
            # UserPushToken.objects.update_or_create(user=request.user, token=token)

            print(f"Received push token for user {request.user.username}: {token}")
            # In a real app, you'd save this token to your database
            # For now, just a print to confirm it works
            return Response({'detail': 'Push token registered successfully.'}, status=status.HTTP_200_OK)

        except Exception as e:
            # Handle potential database errors or other issues
            print(f"Error registering push token: {e}")
            return Response({'detail': 'Failed to register push token.', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SendPushNotificationView(APIView):
    permission_classes = [IsAuthenticated]  # или IsAdminUser, если нужно ограничить

    def post(self, request):
        title = request.data.get('title')
        body = request.data.get('body')
        data = request.data.get('data', {})

        tokens = PushToken.objects.values_list('token', flat=True)

        if not tokens:
            return Response({'detail': 'No tokens found'}, status=404)

        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            tokens=list(tokens),
            data=data,
        )

        response = messaging.send_multicast(message)
        return Response({'success_count': response.success_count})