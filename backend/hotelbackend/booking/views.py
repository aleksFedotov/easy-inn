import logging 
from rest_framework import viewsets,status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import OrderingFilter
from django.utils.dateparse import parse_date
from rest_framework.permissions import IsAuthenticated 
from .models import Booking
from hotel.models import Room
from .serializers import BookingSerializer
from utills.permissions import IsManagerOrFrontDesk
from cleaning.models import CleaningTask
from cleaning.cleaningTypeChoices import CleaningTypeChoices
from users.models import PushToken, User
from datetime import date
from utills.notifications import send_notifications_in_thread
from asgiref.sync import async_to_sync
import asyncio
import threading
import httpx
from django.db import transaction
from firebase_admin import messaging
from django.utils import timezone

# from utills.runAsyncInThread import run_async_in_thread 
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

    # async def _send_expo_push_notification(self, token: str, title: str, body: str, data: dict = None):
    #     """
    #     Sends a notification via Expo Push Service using httpx.
    #     This method is async.
    #     """
    #     if not token.startswith("ExponentPushToken"):
    #         logger.warning(f"Attempted to send notification to non-Expo token: {token[:20]}...")
    #         return

    #     payload = {
    #         "to": token,
    #         "title": title,
    #         "body": body,
    #         "data": data or {},
    #         "sound": "default", # Or specify a custom sound
    #     }

    #     try:
    #         async with httpx.AsyncClient(timeout=10.0) as client:
    #             response = await client.post("https://exp.host/--/api/v2/push/send", json=payload)
    #             response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
    #             result = response.json()
    #             logger.info(f"Expo push sent successfully to {token[:20]}...: {result}")
    #             # You might want to check result['data']['status'] for per-token errors
    #             # Example: {'data': {'status': 'error', 'message': 'The recipient device is not registered with FCM.', 'details': {'error': 'InvalidCredentials'}}}
    #             if result.get('data') and result['data'].get('status') == 'error':
    #                 # Log or handle specific errors, e.g., 'InvalidCredentials' for the token
    #                 logger.error(f"Error sending Expo push to {token[:20]}...: {result['data'].get('message')}")
    #                 # If the token is invalid, you might want to mark it as inactive in your DB
    #                 # self._mark_token_inactive_sync(token) # You'd need to create this sync method
    #             return result
    #     except httpx.TimeoutException:
    #         logger.error(f"Expo push timeout for token {token[:20]}...")
    #     except httpx.HTTPStatusError as e:
    #         logger.error(f"Expo push HTTP error {e.response.status_code} for token {token[:20]}...: {e.response.text}", exc_info=True)
    #         # You might want to parse e.response.json() for more details
    #     except Exception as e:
    #         logger.error(f"Expo push failed for token {token[:20]}...: {e}", exc_info=True)

    # # Helper method to run async notification sending in a separate thread.
    # # This is useful when calling from a synchronous context like a Django view.
    # def _send_notifications_in_thread(self, tokens_to_send, room_number, task_description):
    #     """
    #     Sends notifications to multiple tokens concurrently using asyncio.gather
    #     and runs it in a separate thread to avoid blocking the main request.
    #     """
    #     async def _send_all_expo_pushes():
    #         # Create a list of coroutines (async calls)
    #         tasks = [
    #             self._send_expo_push_notification(
    #                 token=token,
    #                 title=f"Новая задача: Комната {room_number}",
    #                 body=task_description,
    #                 data={"roomNumber": str(room_number), "taskDescription": task_description}
    #             )
    #             for token in tokens_to_send
    #         ]
    #         # Run all tasks concurrently
    #         await asyncio.gather(*tasks)

    #     # Run the async function in a new thread
    #     thread = threading.Thread(target=lambda: asyncio.run(_send_all_expo_pushes()))
    #     thread.start()

        
    
    
    
    
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
                check_in__date__lt=selected_date,
                check_out__date__gt=selected_date 
            )
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsManagerOrFrontDesk])
    def check_out(self, request, pk=None):
        try:
            with transaction.atomic():
                booking = self.get_object()
                if booking.status != Booking.BookingStatus.IN_PROGRESS:
                    return Response({"detail": "Бронирование не находится в статусе 'В процессе проживания'."}, status=status.HTTP_400_BAD_REQUEST)

                booking.status = Booking.BookingStatus.CHECKED_OUT
                booking.checked_out = timezone.now()
                booking.save()

                
                if booking.room:
                    booking.room.status = Room.Status.DIRTY
                    booking.room.save(update_fields=['status'])
                    logger.info(f"Room {booking.room.number} status changed to 'dirty' for checkout.")

                
                room_number = booking.room.number if booking.room else "N/A"
               

                cleaning_task  = CleaningTask.objects.filter(
                    room = booking.room,
                    scheduled_date=timezone.localdate(),
                    cleaning_type=CleaningTypeChoices.DEPARTURE_CLEANING
                ).first()
              
               
                if cleaning_task:
                    if cleaning_task.assigned_to:
                        try:
                            housekeepers_tokens_qs = PushToken.objects.filter(
                                user=cleaning_task.assigned_to 
                            ).values_list('token', flat=True)

                            tokens_to_notify = list(housekeepers_tokens_qs)

                            if tokens_to_notify:
                                title = "Номер выехал"
                                body = f"Комната {room_number} освободилась после выезда гостя. Требуется уборка."
                                data = {
                                    "task_id": str(cleaning_task.id),
                                    "booking_id": str(booking.id),
                                    "room_number": room_number,
                                    "cleaning_type": CleaningTypeChoices.DEPARTURE_CLEANING,
                                
                                }

                                send_notifications_in_thread(
                                    tokens_to_notify,
                                    title,
                                    body,
                                    data
                                )
                                logger.info(f"Notifications sent for new checkout task for room {room_number}.")
                            else:
                                logger.warning("No active housekeeper push tokens found to send checkout notification.")

                        except Exception as e:
                            logger.error(f"Error during checkout notification for booking {booking.id}: {e}", exc_info=True)
                    else:
                        logger.info(f"Cleaning task {cleaning_task.id} for room {room_number} is found but unassigned. No specific housekeeper notification sent.") 
                else:
                    cleaning_task = CleaningTask.objects.create(
                        booking=booking,
                        cleaning_type=CleaningTypeChoices.DEPARTURE_CLEANING,
                        status=CleaningTask.Status.UNASSIGNED,
                        scheduled_date=timezone.localdate(), 
                        room=booking.room,
                        zone=None 
                    )
                    logger.info(f"Cleaning task created for checkout: {cleaning_task.id}")
                serializer = self.get_serializer(booking)
                return Response(serializer.data, status=status.HTTP_200_OK)

        except Booking.DoesNotExist:
            logger.warning(f"Booking with ID {pk} not found for checkout.")
            return Response({"detail": "Бронирование не найдено."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error during checkout for booking {pk}: {e}", exc_info=True)
            return Response({"detail": "Внутренняя ошибка сервера."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


        
    @action(detail=True, methods=['post'])
    def check_in(self,request, pk=None):
        try:
            booking = self.get_object()
            booking.status = Booking.BookingStatus.IN_PROGRESS
            booking.save()
            room = booking.room
            room.status = Room.Status.OCCUPIED
            room.save()
            serializer = self.get_serializer(booking)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Booking.DoesNotExist:
            return Response({"error": "Бронирование не найдено."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def paginate_queryset(self, queryset):
        if self.request.query_params.get('all') == 'true':
            return None  
        return super().paginate_queryset(queryset)