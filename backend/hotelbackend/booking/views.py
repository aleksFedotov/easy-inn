import logging 
from rest_framework import viewsets,status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import OrderingFilter
from django.utils.dateparse import parse_date
from rest_framework.permissions import IsAuthenticated 
from .models import Booking
from .serializers import BookingSerializer
from utills.permissions import IsManagerOrFrontDesk

# Получаем логгер для этого модуля
# Get the logger for this module
logger = logging.getLogger(__name__)


# --- Booking ViewSet ---
# ViewSet для управления бронированиями
# ViewSet for managing bookings

class BookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления бронированиями (Booking).
    Доступен только аутентифицированным пользователям с ролью 'manager' или 'front desk'.
    Предоставляет операции: list, create, retrieve, update, partial_update, destroy.
    Аутентификация обрабатывается через DEFAULT_PERMISSION_CLASSES.

    ViewSet for managing Booking objects.
    Accessible only to authenticated users with the 'manager' or 'front desk' role.
    Provides operations: list, create, retrieve, update, partial_update, destroy.
    Authentication is handled by DEFAULT_PERMISSION_CLASSES.

    ПРИМЕЧАНИЕ: Для более детализированных разрешений (например, чтобы пользователь,
    создавший бронирование, мог его просматривать или отменять), потребуется
    переопределить get_permissions() и, возможно, добавить объектные разрешения
    (например, IsOwnerOrManagerOrAdmin).

    NOTE: For more granular permissions (e.g., for a user who created a booking
    to view or cancel it), you would need to override get_permissions() and
    potentially add object-level permissions (e.g., IsOwnerOrManagerOrAdmin).
    """

    # Определяем набор данных, с которым работает ViewSet (все бронирования)
    # Define the queryset that the ViewSet will operate on (all bookings)
    queryset = Booking.objects.all()

    # Определяем сериализатор для преобразования данных
    # Define the serializer for data transformation
    serializer_class = BookingSerializer

    # Определяем разрешения доступа к этому ViewSet
    # Требуется аутентификация (глобально через settings) и роль менеджера или администратора
    # Define the access permissions for this ViewSet
    # Requires authentication (globally via settings) and the manager or front desk role
    permission_classes = [IsAuthenticated, IsManagerOrFrontDesk]

    filter_backends = [OrderingFilter]
    ordering_fields = ['check_in', 'check_out', 'room__number', 'guest', 'id']
   

    def _get_date_from_request(self, request):
        """Вспомогательный метод для получения и валидации даты из запроса."""
        date_str = request.query_params.get('date', None)

        if not date_str:
            raise serializers.ValidationError({"date": "Неверный формат даты. Используйте YYYY-MM-DD."})
        try:
            selected_date = parse_date(date_str)
            if not selected_date:
                raise ValueError
            return selected_date
        except ValueError:
            raise serializers.ValidationError({"date": "Неверный формат даты. Используйте YYYY-MM-DD."})


    def perform_create(self, serializer):
        """
        Автоматически устанавливает поле created_by текущим аутентифицированным пользователем
        при создании нового бронирования.
        Включает логирование попыток создания и результатов.

        Automatically sets the created_by field to the current authenticated user
        when creating a new booking.
        Includes logging for creation attempts and results.
        """
        # Логируем попытку создания нового бронирования текущим аутентифицированным пользователем
        # Log the attempt to create a new booking by the current authenticated user
        logger.info(f"User {self.request.user.username} is attempting to create a new booking.")

        try:
            # serializer.save() создает объект модели, а мы добавляем created_by
            # serializer.save() creates the model object, and we add created_by
            instance = serializer.save(created_by=self.request.user)

            # Логируем успешное создание бронирования
            # Log the successful creation of the booking
            logger.info(f"User {self.request.user.username} successfully created booking with ID {instance.pk}.")

        except Exception as e:
            # Логируем любые ошибки, возникающие в процессе создания
            # Log any errors that occur during the creation process
            logger.error(f"Error creating booking by {self.request.user.username}: {e}")
            # Логируем полный traceback для исключения
            # Log the full traceback for the exception
            logger.exception("Details of booking creation exception:")

            # Повторно выбрасываем исключение, чтобы DRF мог его обработать и вернуть соответствующий ответ об ошибке
            # Re-raise the exception so DRF can handle it and return an appropriate error response
            raise

    def _get_date_from_request(self, request):
        """Вспомогательный метод для получения и валидации даты из запроса."""
        date_str = request.query_params.get('date', None)
        if not date_str:
            
            raise serializers.ValidationError({"date": "Параметр 'date' обязателен."})
        try:
            selected_date = parse_date(date_str)
            if not selected_date: # parse_date вернет None, если формат неверный
                raise ValueError
            return selected_date
        except ValueError:
            raise serializers.ValidationError({"date": "Неверный формат даты. Используйте YYYY-MM-DD."})

    @action(detail=False, methods=['get'], url_path='departures-on-date')
    def departures_on_date(self, request):
        """
        Возвращает список бронирований, где дата выезда (check_out_date)
        совпадает с указанной датой.
        Пример запроса: /api/bookings/departures-on-date/?date=YYYY-MM-DD
        """
        try:
            selected_date = self._get_date_from_request(request)
        except serializers.ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        
        
        queryset = self.filter_queryset(
            self.get_queryset().filter(check_out__date = selected_date)
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='arrivals-on-date')
    def arrivals_on_date(self, request):
        """
        Возвращает список бронирований, где дата заезда (check_in_date)
        совпадает с указанной датой.
        Пример запроса: /api/bookings/arrivals-on-date/?date=YYYY-MM-DD
        """
        try:
            selected_date = self._get_date_from_request(request)
        except serializers.ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = self.filter_queryset(
            self.get_queryset().filter(check_in__date=selected_date)
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='stays-on-date')
    def stays_on_date(self, request):
        """
        Возвращает список бронирований, которые "проживают" на указанную дату.
        Это означает, что дата заезда <= указанная дата, И дата выезда > указанная дата.
        (т.е. гость находится в отеле в ночь с указанной даты на следующую).
        Пример запроса: /api/bookings/stays-on-date/?date=YYYY-MM-DD
        """
        try:
            selected_date = self._get_date_from_request(request)
        except serializers.ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        queryset = self.filter_queryset(
            self.get_queryset().filter(
                check_in__date__lte=selected_date,
                check_out__date__gt=selected_date 
            )
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    

    @action(detail=True, methods=['post'])
    def change_status(self,request, pk=None):
        booking = self.get_object()
        new_status = request.data.get('new_status')
        if new_status not in Booking.BookingStatus.values:
            Response({'error': "Недопустимый статус"},status=status.HTTP_400_BAD_REQUEST)
        booking.status = new_status
        booking.save()
        return Response()
    
    def paginate_queryset(self, queryset):
        if self.request.query_params.get('all') == 'true':
            return None  
        return super().paginate_queryset(queryset)