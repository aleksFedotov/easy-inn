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
import httpx

from users.models import User
from users.serializers import UserSerializer
from rest_framework.decorators import action, api_view
from django.utils import timezone

logger = logging.getLogger(__name__)

# --- User ViewSet ---



def send_expo_push_message(token: str, title: str, body: str, data: dict = None):
    if not token.startswith('ExponentPushToken'):
        print(f"Invalid Expo token: {token}")
        return

    message = {
        'to': token,
        'title': title,
        'body': body,
        'data': data or {},
        'sound': 'default',
    }

    try:
        response = httpx.post('https://exp.host/--/api/v2/push/send', json=message)
        response.raise_for_status()
        print(f"Expo push sent: {response.json()}")
    except Exception as e:
        print(f"Error sending push: {e}")

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

        try:
            # Используем update_or_create для сохранения токена
            # Это обновит существующий токен, если он уже есть для пользователя, или создаст новый
            push_token, created = PushToken.objects.update_or_create(
                user=request.user,
                token=token # В случае обновления, токен будет перезаписан этим значением
                            # Если PushToken.token уникален и вы хотите разрешить
                            # несколько токенов на пользователя, но каждый токен уникален,
                            # тогда просто создайте: PushToken.objects.create(user=request.user, token=token)
                            # или ищите по токену: PushToken.objects.update_or_create(token=token, defaults={'user': request.user})
                            # В вашей модели PushToken.token - unique=True, поэтому update_or_create
                            # по полю 'token' является правильным подходом для обеспечения уникальности.
            )
            
            # Если вы хотите, чтобы пользователь имел только один токен (перезаписывать старый при регистрации нового):
            # PushToken.objects.filter(user=request.user).exclude(token=token).delete() # Удалить все старые токены, кроме текущего
            # push_token, created = PushToken.objects.get_or_create(user=request.user)
            # push_token.token = token
            # push_token.save()

            print(f"Received and saved push token for user {request.user.username}: {token}")
            
            return Response({'detail': 'Push token registered successfully.'}, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Error registering push token: {e}")
            return Response({'detail': 'Failed to register push token.', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SendPushNotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get('title')
        body = request.data.get('body')
        data = request.data.get('data', {})

        tokens = PushToken.objects.values_list('token', flat=True)

        if not tokens:
            return Response({'detail': 'No tokens found'}, status=404)

        for token in tokens:
            send_expo_push_message(token, title, body, data)

        return Response({'detail': f'Sent to {len(tokens)} tokens'})
