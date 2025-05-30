import logging
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action ,api_view
from django.utils import timezone 
from .models import ChecklistTemplate, CleaningTask
from users.models import User
from utills.views import LoggingModelViewSet
from utills.mixins import AllowAllPaginationMixin
from booking.models import Booking
from django.db import transaction 
from django.utils import timezone
from utills.calculateAverageDuration import calculate_average_duration
from .cleaningTypeChoices import CleaningTypeChoices 

from hotel.models import Zone, Room


from .serializers import (
    ChecklistTemplateSerializer,
    CleaningTaskSerializer,
    MultipleTaskAssignmentSerializer
)


from utills.permissions import IsManagerOrFrontDesk, IsHouseKeeper, IsAssignedHousekeeperOrManagerOrFrontDesk

# Configure basic logging / Настраиваем базовое логирование
logger = logging.getLogger(__name__)




# --- ChecklistTemplate ViewSet ---

class ChecklistTemplateViewSet(AllowAllPaginationMixin,viewsets.ModelViewSet):
    """
    ViewSet for managing Checklist Templates (ChecklistTemplate).
    Accessible only to authenticated users with the 'manager' or 'front desk' role.
    Provides operations: list, create, retrieve, update, partial_update, destroy.
    Authentication is handled by DEFAULT_PERMISSION_CLASSES.

    ViewSet для управления шаблонами чек-листов (ChecklistTemplate).
    Доступно только аутентифицированным пользователям с ролью 'manager' или 'front desk'.
    Предоставляет операции: list, create, retrieve, update, partial_update, destroy.
    Аутентификация обрабатывается через DEFAULT_PERMISSION_CLASSES.
    """
    queryset = ChecklistTemplate.objects.all() # Base queryset / Базовый набор данных
    serializer_class = ChecklistTemplateSerializer # Serializer class / Класс сериализатора
    # Permissions: Requires manager or front desk role / Разрешения: Требуется роль менеджера или службы приема
    permission_classes = [IsAuthenticated, IsManagerOrFrontDesk]


# --- CleaningTask ViewSet ---

class CleaningTaskViewSet(AllowAllPaginationMixin,LoggingModelViewSet,viewsets.ModelViewSet):
    """
    ViewSet for managing Cleaning Tasks (CleaningTask) with detailed permissions and custom actions.
    - Managers/Admins: Full access to all tasks.
    - Housekeepers: Can view list and details of tasks assigned to them,
      and use 'start' and 'complete' actions for tasks assigned to them. Cannot create or delete tasks.
    - Other users: No access.

    ViewSet для управления задачами по уборке (CleaningTask) с детализированными разрешениями и кастомными действиями.
    - Управляющие/Администраторы: Полный доступ ко всем задачам.
    - Горничные: Могут просматривать список и детали только задач, назначенных им,
      и использовать действия 'start' и 'complete' для задач, назначенных им. Не могут создавать или удалять задачи.
    - Другие пользователи: Нет доступа.
    """
    queryset = CleaningTask.objects.all() # Base queryset / Базовый набор данных
    serializer_class = CleaningTaskSerializer # Serializer class / Класс сериализатора

    
    def create(self, request, *args, **kwargs):

        return super().create(request, *args, **kwargs)

    def get_object(self):
        """
        Retrieves the object for the current detail view.
        Ensures object permissions are checked.
        Получает объект для текущего детального представления.
        Проверяет разрешения для объекта.
        """
        obj = super().get_object()
        # Check object-level permissions / Проверяем разрешения на уровне объекта
        self.check_object_permissions(self.request, obj)
        return obj

    def get_queryset(self):
        """
        Filters the queryset based on the user's role.
        - Managers/Admins see all tasks.
        - Housekeepers see only tasks assigned to them.

        Фильтрует набор данных в зависимости от роли пользователя.
        - Управляющие/Администраторы видят все задачи.
        - Горничные видят только задачи, назначенные им.
        """
        user = self.request.user
        logger.info(f"Filtering CleaningTask queryset for user {user} with role {user.role}.")
        
        scheduled_date_str = self.request.query_params.get('scheduled_date')
        scheduled_date = None
        if scheduled_date_str:
            try:
                scheduled_date = timezone.datetime.strptime(scheduled_date_str, '%Y-%m-%d').date()
            except ValueError:
                logger.warning("Invalid date format. Expected YYYY-MM-DD.")
                # Можно не фильтровать по дате, если формат неправильный, или использовать localdate
                scheduled_date = timezone.localdate()
        else:
            scheduled_date = timezone.localdate()
        # If the user is authenticated and is a manager or front desk, return all tasks
        # Если пользователь аутентифицирован и является управляющим или администратором, вернуть все задачи
        queryset = CleaningTask.objects.all()
        
        if scheduled_date:
            queryset = queryset.filter(scheduled_date=scheduled_date)
        if user.is_authenticated and user.role in [User.Role.FRONT_DESK, User.Role.MANAGER]:       
            logger.debug("User is Manager or Admin, returning all tasks.")

            return queryset
        # If the user is authenticated and is a housekeeper, return only tasks assigned to them
        # Если пользователь аутентифицирован и является горничной, вернуть только задачи, назначенные ему
        if user.is_authenticated and user.role == User.Role.HOUSEKEEPER:
            logger.debug(f"User is Housekeeper, returning tasks assigned to {user}.")
            return queryset.filter(assigned_to=user, status__in=['assigned', 'in_progress', 'waiting_inspection'])
        
        # For all other authenticated users or if the user is not authenticated,
        # return an empty queryset. Permission classes will further restrict access.
        # Для всех других аутентифицированных пользователей или если пользователь не аутентифицирован,
        # вернуть пустой набор данных. Классы разрешений дополнительно ограничат доступ.
        logger.debug("User is neither Manager/Admin nor Housekeeper, returning empty queryset.")
        return CleaningTask.objects.none()
    
    def retrieve(self, request, pk=None):
        logger.info(f"Attempting to retrieve task with ID: {pk}")
        try:
            task = self.queryset.get(pk=pk)
            serializer = self.get_serializer(task)
            logger.info(f"Task found: {task}")
            return Response(serializer.data)
        except CleaningTask.DoesNotExist:
            logger.warning(f"Task with ID: {pk} not found.")
            return Response({"detail": "Задача не найдена."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"An unexpected error occurred: {e}")
            return Response({"detail": "Internal Server Error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        Applies different permissions based on the action being performed.

        Создает и возвращает список разрешений, необходимых для данного представления.
        Применяет различные разрешения в зависимости от выполняемого действия.
        """
        logger.debug(f"Getting permissions for action: {self.action}")

        # Authentication is required for all actions (enforced by DEFAULT_PERMISSION_CLASSES or IsAuthenticated)
        # Требуется аутентификация для всех действий (обеспечивается DEFAULT_PERMISSION_CLASSES или IsAuthenticated)

        if self.action == 'list' or self.action == 'retrieve':
            # For listing and retrieving tasks:
            # - Authentication is required.
            # - Allowed for Managers/Admins OR Housekeepers.
            #   get_queryset() already filters the list/details for housekeepers.
            # Для просмотра списка и деталей задач:
            # - Требуется аутентификация.
            # - Разрешено для управляющих/администраторов ИЛИ для горничных.
            #   get_queryset() уже фильтрует список/детали для горничных.
            self.permission_classes = [IsAuthenticated, IsManagerOrFrontDesk | IsHouseKeeper]
            logger.debug("Applying permissions: IsAuthenticated, IsManagerOrFrontDesk | IsHouseKeeper")

        elif self.action in ['update', 'partial_update']:
            # For updating a specific task (e.g., manager changes assignee):
            # - Authentication is required.
            # - Allowed only for Managers/Admins.
            #   Housekeepers will use custom 'start'/'complete' actions for status changes.
            # Для обновления конкретной задачи (например, менеджер меняет назначенного):
            # - Требуется аутентификация.
            # - Разрешено только для управляющих/администраторов.
            #   Горничные будут использовать кастомные действия 'start'/'complete' для смены статуса.
            self.permission_classes = [IsAuthenticated, IsManagerOrFrontDesk]
            logger.debug("Applying permissions: IsAuthenticated, IsManagerOrFrontDesk")

        elif self.action == 'create' or self.action == 'destroy':
            # For creating or deleting tasks:
            # - Authentication is required.
            # - Allowed only for Managers or Admins.
            # Для создания или удаления задач:
            # - Требуется аутентификация.
            # - Разрешено только для управляющих или администраторов.
            self.permission_classes = [IsAuthenticated, IsManagerOrFrontDesk]
            logger.debug("Applying permissions: IsAuthenticated, IsManagerOrFrontDesk")

        # Permissions for custom actions / Разрешения для кастомных действий
        elif self.action in ['start', 'complete']:
             # For start and complete actions:
             # - Authentication is required.
             # - Allowed for the assigned housekeeper, manager, or front desk.
             # Для действий start и complete:
             # - Требуется аутентификация.
             # - Разрешено для назначенного горничной, менеджера или службы приема.
             self.permission_classes = [IsAuthenticated, IsAssignedHousekeeperOrManagerOrFrontDesk]
             logger.debug("Applying permissions: IsAuthenticated, IsAssignedHousekeeperOrManagerOrFrontDesk")

        elif self.action in ['check', 'cancel']:
             # For check and cancel actions:
             # - Authentication is required.
             # - Allowed only for the manager or front desk.
             # Для действий check и cancel:
             # - Требуется аутентификация.
             # - Разрешено только для менеджера или службы приема.
             self.permission_classes = [IsAuthenticated, IsManagerOrFrontDesk]
             logger.debug("Applying permissions: IsAuthenticated, IsManagerOrFrontDesk")

        else:
            # Default permissions for any other actions not explicitly defined
            # Разрешения по умолчанию для любых других действий, не определенных явно
            self.permission_classes = [IsAuthenticated, IsManagerOrFrontDesk] # Restrict by default / Ограничиваем по умолчанию
            logger.debug("Applying default permissions: IsAuthenticated, IsManagerOrFrontDesk")


        return [permission() for permission in self.permission_classes]

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsAssignedHousekeeperOrManagerOrFrontDesk])
    def start(self, request, pk=None):
        """
        Custom action to start a cleaning task.
        Can be called by the assigned housekeeper, a manager, or an front desk.
        The task must be in UNASSIGNED or ASSIGNED status.

        Кастомное действие для начала выполнения задачи по уборке.
        Может быть вызвано назначенным горничной, менеджером или администратором.
        Задача должна быть в статусе UNASSIGNED или ASSIGNED.
        """
        logger.info(f"User {request.user} attempting to start task {pk}.")
        task = self.get_object() # Get the specific task object / Получаем конкретный объект задачи

        # Check if the task can be started from the current status
        # Проверяем, можно ли начать задачу из текущего статуса
        if task.status in [CleaningTask.Status.UNASSIGNED, CleaningTask.Status.ASSIGNED]:
            logger.info(f"Task {task.pk} status is {task.get_status_display()}, allowing start.")
            task.status = CleaningTask.Status.IN_PROGRESS # Set status to IN_PROGRESS / Устанавливаем статус "В процессе уборки"
            task.started_at = timezone.now() # Set start time / Устанавливаем время начала
            task.save(update_fields=['status', 'started_at']) # Save only the changed fields / Сохраняем только измененные поля

            if task.room:
                room = task.room
                room.status = "in_progress"  
                room.save(update_fields=['status']) 
                logger.info(f"Room {room.number} status changed to 'in_progress'.")

            serializer = self.get_serializer(task) # Serialize the updated object / Сериализуем обновленный объект
            logger.info(f"Task {task.pk} started successfully by user {request.user}.")
            return Response(serializer.data, status=status.HTTP_200_OK) # Return updated data / Возвращаем обновленные данные

        # If the status does not allow starting the task
        # Если статус не позволяет начать задачу
        logger.warning(f"Task {task.pk} cannot be started from status '{task.get_status_display()}' by user {request.user}.")
        return Response(
            {"detail": f"Задача не может быть начата из статуса '{task.get_status_display()}'."},
            status=status.HTTP_400_BAD_REQUEST # Bad Request, because the action is not possible / Bad Request, потому что действие невозможно
        )

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsAssignedHousekeeperOrManagerOrFrontDesk])
    def complete(self, request, pk=None):
        """
        Custom action to complete a cleaning task.
        Can be called by the assigned housekeeper, a manager, or an front desk.
        The task must be in IN_PROGRESS status.

        Кастомное действие для завершения выполнения задачи по уборке.
        Может быть вызвано назначенным горничной, менеджером или администратором.
        Задача должна быть в статусе IN_PROGRESS.
        """
        logger.info(f"User {request.user} attempting to complete task {pk}.")
        task = self.get_object()

        # Check if the task can be completed from the current status
        # Проверяем, можно ли завершить задачу из текущего статуса
        if task.status == CleaningTask.Status.IN_PROGRESS:
            logger.info(f"Task {task.pk} status is {task.get_status_display()}, allowing completion.")
            if  task.cleaning_type == None or task.cleaning_type == CleaningTypeChoices.STAYOVER:
                task.status = CleaningTask.Status.CHECKED 
            elif task.cleaning_type == CleaningTypeChoices.DEPARTURE_CLEANING:
                task.status = CleaningTask.Status.WAITING_CHECK 

            task.completed_at = timezone.now() # Set completion time / Устанавливаем время завершения
            task.save(update_fields=['status', 'completed_at'])

            if task.room:
                room = task.room
                if task.cleaning_type == CleaningTypeChoices.DEPARTURE_CLEANING:
                    room.status = Room.Status.WAITING_INSPECTION 
                elif task.cleaning_type == CleaningTypeChoices.STAYOVER:
                    room.status = Room.Status.CLEAN  
                room.save(update_fields=['status'])
                logger.info(f"Room {room.number} status changed to 'waiting_inspection'.")
            if task.zone:
                zone = task.zone
                zone.status = Zone.Status.CLEAN
                zone.save(update_fields=['status'])
                logger.info(f"Zone {zone.name} status changed to 'clean'.")
            serializer = self.get_serializer(task)
            logger.info(f"Task {task.pk} completed successfully by user {request.user}.")
            return Response(serializer.data, status=status.HTTP_200_OK)


        # If the status does not allow completing the task
        # Если статус не позволяет завершить задачу
        logger.warning(f"Task {task.pk} cannot be completed from status '{task.get_status_display()}' by user {request.user}.")
        return Response(
            {"detail": f"Задача не может быть завершена из статуса '{task.get_status_display()}'."},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsManagerOrFrontDesk])
    def check(self, request, pk=None):
        """
        Custom action to check and confirm a cleaning task.
        Can be called only by a manager or an front desk.
        The task must be in WAITING_CHECK status.

        Кастомное действие для проверки и подтверждения задачи по уборке.
        Может быть вызвано только менеджером или администратором.
        Задача должна быть в статусе WAITING_CHECK.
        """
        logger.info(f"User {request.user} attempting to check task {pk}.")
        task = self.get_object()

        # Check if the task can be checked from the current status
        # Проверяем, можно ли проверить задачу из текущего статуса
        if task.status == CleaningTask.Status.WAITING_CHECK:
            logger.info(f"Task {task.pk} status is {task.get_status_display()}, allowing check.")
            task.status = CleaningTask.Status.CHECKED # Set status to CHECKED / Переводим в статус "Проверено"
            task.checked_at = timezone.now() # Set check time / Устанавливаем время проверки
            task.checked_by = request.user # Set the user who checked / Устанавливаем пользователя, который проверил
            task.save(update_fields=['status', 'checked_at', 'checked_by'])

            if task.room:
                room = task.room
                room.status = "clean"
                room.save(update_fields=['status'])
                logger.info(f"Room {room.number} status changed to 'clean'.")

            serializer = self.get_serializer(task)
            logger.info(f"Task {task.pk} checked successfully by user {request.user}.")
            return Response(serializer.data, status=status.HTTP_200_OK)
        # If the status does not allow checking the task
        # Если статус не позволяет проверить задачу
        logger.warning(f"Task {task.pk} cannot be checked from status '{task.get_status_display()}' by user {request.user}.")
        return Response(
            {"detail": f"Задача не может быть проверена из статуса '{task.get_status_display()}'."},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsManagerOrFrontDesk])
    def cancel(self, request, pk=None):
        """
        Custom action to cancel a cleaning task.
        Can be called only by a manager or an front desk.
        The task must not be in CANCELED or CHECKED status.

        Кастомное действие для отмены задачи по уборке.
        Может быть вызвано только менеджером или администратором.
        Задача не должна быть в статусе CANCELED или CHECKED.
        """
        logger.info(f"User {request.user} attempting to cancel task {pk}.")
        task = self.get_object()

        # Check if the task can be canceled from the current status
        # Проверяем, можно ли отменить задачу из текущего статуса
        if task.status not in [CleaningTask.Status.CANCELED, CleaningTask.Status.CHECKED]:
            logger.info(f"Task {task.pk} status is {task.get_status_display()}, allowing cancel.")
            task.status = CleaningTask.Status.CANCELED # Set status to CANCELED / Переводим в статус "Отменена"
            # Optionally: you can set a cancellation time if needed
            # Опционально: можно установить время отмены, если нужно
            # task.cancelled_at = timezone.now()
            task.save(update_fields=['status']) # Save only the changed fields / Сохраняем только измененные поля
            serializer = self.get_serializer(task)
            logger.info(f"Task {task.pk} canceled successfully by user {request.user}.")
            return Response(serializer.data, status=status.HTTP_200_OK)

        # If the status does not allow canceling the task
        # Если статус не позволяет отменить задачу
        logger.warning(f"Task {task.pk} cannot be canceled from status '{task.get_status_display()}' by user {request.user}.")
        return Response(
            {"detail": f"Задача не может быть отменена из статуса '{task.get_status_display()}'."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated, IsManagerOrFrontDesk])
    @transaction.atomic  # Декоратор транзакции
    def auto_generate(self, request):
        """
        Автоматически генерирует задачи по уборке на указанную дату:
        - Уборка после выезда: если у бронирования выезд в указанную дату
        - Текущая уборка: если гость живёт, но не выезжает в указанную дату
        - Задачи по зонам: для всех зон, если задача еще не существует
        """
        # Get date from request data, default to today if not provided
        scheduled_date_str = request.data.get('scheduled_date')
        if scheduled_date_str:
            try:
                scheduled_date = timezone.datetime.strptime(scheduled_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"detail": "Неверный формат даты. Используйте YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            scheduled_date = timezone.localdate() 

        created_tasks_count = 0
        created_tasks_details = []

        # Убираем with transaction.atomic(): так как вся функция уже в транзакции
        
        # --- Уборка после выезда ---
        checkout_bookings = Booking.objects.filter(check_out__date=scheduled_date).select_related("room")
        
        for booking in checkout_bookings:
            if not booking.room:
                continue

            exists = CleaningTask.objects.filter(
                booking=booking,
                room=booking.room,
                scheduled_date=scheduled_date,
                cleaning_type=CleaningTypeChoices.DEPARTURE_CLEANING
            ).exists()

            if not exists:
                task = CleaningTask.objects.create(
                    booking=booking,
                    room=booking.room,
                    scheduled_date=scheduled_date,
                    cleaning_type=CleaningTypeChoices.DEPARTURE_CLEANING,
                    status=CleaningTask.Status.UNASSIGNED,
                )
                created_tasks_count += 1
                created_tasks_details.append(f"Комната {booking.room.number} (Выезд)")

        # --- Текущая уборка ---
        staying_bookings = Booking.objects.filter(
            check_in__date__lt=scheduled_date,
            check_out__date__gt=scheduled_date
        ).select_related("room")

        for booking in staying_bookings:
            if not booking.room:
                continue
            
            exists = CleaningTask.objects.filter(
                booking=booking,
                room=booking.room,
                scheduled_date=scheduled_date,
                cleaning_type=CleaningTypeChoices.STAYOVER
            ).exists()

            if not exists:
                task = CleaningTask.objects.create(
                    booking=booking,
                    room=booking.room,
                    scheduled_date=scheduled_date,
                    cleaning_type=CleaningTypeChoices.STAYOVER,
                    status=CleaningTask.Status.UNASSIGNED,
                )
                created_tasks_count += 1
                created_tasks_details.append(f"Комната {booking.room.number} (Текущая)")

        # --- Зоны ---
        zones = Zone.objects.all()
        for zone in zones:
            exists = CleaningTask.objects.filter(
                zone=zone,
                scheduled_date=scheduled_date,
            ).exists()

            if not exists:
                task = CleaningTask.objects.create(
                    zone=zone,
                    scheduled_date=scheduled_date,
                    cleaning_type=CleaningTypeChoices.PUBLIC_AREA_CLEANING,
                    status=CleaningTask.Status.UNASSIGNED
                )
                created_tasks_count += 1
                created_tasks_details.append(f"Зона {zone.name}")

        return Response({
            "created_count": created_tasks_count,
            "details": created_tasks_details,
            "message": f"Создано {created_tasks_count} задач по уборке."
        }, status=status.HTTP_201_CREATED)


    @action(detail=False, methods=['post'])
    def assign_multiple(self, request):
        serializer = MultipleTaskAssignmentSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            task_ids = serializer.validated_data['task_ids']
            housekeeper_id = serializer.validated_data['housekeeper_id']
            scheduled_date = serializer.validated_data['scheduled_date'];

            #  Получаем задачи, которые нужно назначить
            tasks = CleaningTask.objects.filter(id__in=task_ids, scheduled_date=scheduled_date)
            

            #  Проверяем, что все задачи существуют и соответствуют дате
            if len(tasks) != len(task_ids):
                return Response({"detail": "Одна или несколько задач не найдены или не соответствуют указанной дате."},
                                status=status.HTTP_400_BAD_REQUEST)
    
            #  Обновляем горничную для каждой задачи
            for task in tasks:
                task.assigned_to_id = housekeeper_id
                task.status = Room.Status.ASSIGNED
                task.save()

            return Response({"detail": "Задачи успешно назначены."}, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        

@api_view(['GET'])
def get_cleaning_stats(request):
    """
    Получает статистику по задачам уборки.
    """
    try:
        # --- Общая статистика ---
        scheduled_date_str = request.query_params.get('scheduled_date')
        scheduled_date = None
        if scheduled_date_str:
            try:
                scheduled_date = timezone.datetime.strptime(scheduled_date_str, '%Y-%m-%d').date()
            except ValueError:
                logger.warning("Invalid date format. Expected YYYY-MM-DD.")
                scheduled_date = timezone.localdate()
        else:
            scheduled_date = timezone.localdate()

        # --- ЗАДАЧИ ПОСЛЕ ВЫЕЗДА ---
        checkout_tasks = CleaningTask.objects.filter(
            cleaning_type= CleaningTypeChoices.DEPARTURE_CLEANING
        )
        
        if scheduled_date:
            checkout_tasks = checkout_tasks.filter(scheduled_date=scheduled_date)
        
        checkout_total = checkout_tasks.count()
        checkout_completed = checkout_tasks.filter(
            status__in=[CleaningTask.Status.WAITING_CHECK,CleaningTask.Status.CHECKED,CleaningTask.Status.COMPLETED,]
        ).count()

        # Среднее время уборки для выездов
        completed_checkout_tasks = checkout_tasks.filter(
            status__in=[CleaningTask.Status.WAITING_CHECK,CleaningTask.Status.CHECKED,CleaningTask.Status.COMPLETED,],
            started_at__isnull=False,
            completed_at__isnull=False
        )
        
        logger.info(f"Completed checkout tasks count: {completed_checkout_tasks.count()}")
        checkout_avg_time = calculate_average_duration(completed_checkout_tasks, "checkout")

        # --- ТЕКУЩИЕ ЗАДАЧИ ---
        current_tasks = CleaningTask.objects.filter( cleaning_type=CleaningTypeChoices.STAYOVER,zone__isnull=True) 
        
        if scheduled_date:
            current_tasks = current_tasks.filter(scheduled_date=scheduled_date)
        
        current_total = current_tasks.count()
        current_completed = current_tasks.filter(
            status=CleaningTask.Status.CHECKED
        ).count()

        # Среднее время уборки для текущих задач
        completed_current_tasks = current_tasks.filter(
            status=CleaningTask.Status.CHECKED,
            started_at__isnull=False,
            completed_at__isnull=False
        )
        
        logger.info(f"Completed current tasks count: {completed_current_tasks.count()}")
        current_avg_time = calculate_average_duration(completed_current_tasks, "current")

        stats = {
            "checkoutTotal": checkout_total,
            "checkoutCompleted": checkout_completed,
            "checkoutAvgTime": checkout_avg_time,
            "currentTotal": current_total,
            "currentCompleted": current_completed,
            "currentAvgTime": current_avg_time,
        }

        return Response(stats, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error in get_cleaning_stats: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


