import logging 
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated 
from .models import Booking
from .serializers import BookingSerializer
from utills.permissions import IsManagerOrAdmin

# Получаем логгер для этого модуля
# Get the logger for this module
logger = logging.getLogger(__name__)


# --- Booking ViewSet ---
# ViewSet для управления бронированиями
# ViewSet for managing bookings

class BookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления бронированиями (Booking).
    Доступен только аутентифицированным пользователям с ролью 'manager' или 'admin'.
    Предоставляет операции: list, create, retrieve, update, partial_update, destroy.
    Аутентификация обрабатывается через DEFAULT_PERMISSION_CLASSES.

    ViewSet for managing Booking objects.
    Accessible only to authenticated users with the 'manager' or 'admin' role.
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
    # Requires authentication (globally via settings) and the manager or admin role
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]


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
