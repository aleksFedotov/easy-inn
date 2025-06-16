import logging
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action ,api_view
from django.utils import timezone 
from django.db import transaction 
from django.db.models import Q

from .models import ChecklistTemplate, CleaningTask
from users.models import User, PushToken
from hotel.models import Zone, Room
from booking.models import Booking

from utills.views import LoggingModelViewSet
from utills.mixins import AllowAllPaginationMixin
from utills.calculateAverageDuration import calculate_average_duration
from .cleaningTypeChoices import CleaningTypeChoices 
from utills.mobileNotifications import send_notifications_in_thread
from utills.webNotifications import send_broadcast_notification_to_roles


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
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def available_checklists(self, request):
        """
        Возвращает список доступных шаблонов чек-листов по типу уборки.
        Пример запроса: /api/checklisttemplates/available_checklists/?cleaning_type=stayover
        """
        cleaning_type = request.query_params.get('cleaning_type')
        logger.debug(f"Получение доступных чек-листов для типа: {cleaning_type}")

        if not cleaning_type:
            return Response({"detail": "Параметр 'cleaning_type' является обязательным."}, status=status.HTTP_400_BAD_REQUEST)

    
        available_checklists_qs = ChecklistTemplate.objects.filter(
            cleaning_type=cleaning_type
        )

        
        serializer = ChecklistTemplateSerializer(available_checklists_qs, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        self.perform_create(serializer)
        task = serializer.instance 

        logger.info(f"Cleaning task {task.id} created by user {request.user.username}.")

        if task.assigned_to:
            logger.info(f"Task {task.id} was created and immediately assigned to {task.assigned_to.username}. Sending notification.")           
            
            try:
                
                assigned_housekeeper_tokens_qs = PushToken.objects.filter(
                    user=task.assigned_to
                ).values_list('token', flat=True)

                tokens_to_notify = list(assigned_housekeeper_tokens_qs)

                if tokens_to_notify:
                    title = "Новая задача назначена!"
                    task_identifier = ""
                    if task.room:
                        task_identifier = f"Комната {task.room.number}"
                    elif task.zone:
                        task_identifier = f"Зона {task.zone.name}"
                    else:
                        task_identifier = "Новая задача" 

                    body = f"{task_identifier}: Вам назначена новая задача на уборку."
                    
                    data = {
                        "notification_type": "new_task_assigned", # Явный тип уведомления для клиента
                        "task_id": str(task.id),
                        "room_number": task.room.number if task.room else None,
                        "zone_name": task.zone.name if task.zone else None,
                        "cleaning_type": task.cleaning_type,
                        "scheduled_date": str(task.scheduled_date),
                        "assigned_housekeeper_id": str(task.assigned_to.id),
                    }

                    send_notifications_in_thread(
                        tokens_to_notify,
                        title,
                        body,
                        data
                    )
                    logger.info(f"Notification sent for new assigned task {task.id} to {task.assigned_to.username}.")
                else:
                    logger.warning(f"No push tokens found for assigned housekeeper {task.assigned_to.username} for new task {task.id}.")

            except Exception as e:
                logger.error(f"Error sending notification for new task {task.id} assigned to {task.assigned_to.username}: {e}", exc_info=True)
        else:
            logger.info(f"Task {task.id} created but not immediately assigned. No specific housekeeper notification sent.")

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        task = self.get_object() 
        old_assigned_to = task.assigned_to 

       
        serializer = self.get_serializer(task, data=request.data)
        serializer.is_valid(raise_exception=True)
        
        self.perform_update(serializer)
        task = serializer.instance 

        logger.info(f"Cleaning task {task.id} fully updated by user {request.user.username}.")

        if task.assigned_to and task.assigned_to != old_assigned_to:
            logger.info(f"Task {task.id} was assigned/reassigned to {task.assigned_to.username} during full update. Sending notification.")
            try:
                
                assigned_housekeeper_tokens_qs = PushToken.objects.filter(
                    user=task.assigned_to
                ).values_list('token', flat=True)

                tokens_to_notify = list(assigned_housekeeper_tokens_qs)

                if tokens_to_notify:
                    title = "Новая задача назначена!"
                    task_identifier = ""
                    if task.room:
                        task_identifier = f"Комната {task.room.number}"
                    elif task.zone:
                        task_identifier = f"Зона {task.zone.name}"
                    else:
                        task_identifier = "Новая задача" 

                    body = f"{task_identifier}: Вам назначена новая задача на уборку."
                    
                    data = {
                        "notification_type": "single_task_assigned", 
                        "task_id": str(task.id),
                        "room_number": task.room.number if task.room else None,
                        "zone_name": task.zone.name if task.zone else None,
                        "cleaning_type": task.cleaning_type,
                        "scheduled_date": str(task.scheduled_date),
                        "assigned_housekeeper_id": str(task.assigned_to.id),
                    }

                    send_notifications_in_thread(
                        tokens_to_notify,
                        title,
                        body,
                        data
                    )
                    logger.info(f"Notification sent for assigned task {task.id} to {task.assigned_to.username} during full update.")
                else:
                    logger.warning(f"No push tokens found for assigned housekeeper {task.assigned_to.username} for task {task.id} during full update.")

            except Exception as e:
                logger.error(f"Error sending notification for task {task.id} assigned to {task.assigned_to.username} during full update: {e}", exc_info=True)
        else:
            logger.info(f"Task {task.id} fully updated, but 'assigned_to' field was not changed or is still unassigned. No specific housekeeper notification sent.")
       
        return Response(serializer.data)

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
        
        queryset = CleaningTask.objects.all()

        if self.action == 'list':
            # Get the scheduled date from query parameters, default to today if not provided
            # Получаем дату из параметров запроса, по умолчанию сегодня, если не указано    
            scheduled_date_str = self.request.query_params.get('scheduled_date')
            
            if scheduled_date_str:
                try:
                    scheduled_date = timezone.datetime.strptime(scheduled_date_str, '%Y-%m-%d').date()
                except ValueError:
                    logger.warning("Invalid date format. Expected YYYY-MM-DD.")
                    # Можно не фильтровать по дате, если формат неправильный, или использовать localdate
                    scheduled_date = timezone.localdate()
            else:
                scheduled_date = timezone.localdate()
            
            queryset = queryset.filter(scheduled_date=scheduled_date)


        if user.is_authenticated and user.role in [User.Role.FRONT_DESK, User.Role.MANAGER]:
            logger.debug("User is Manager or Admin, returning all tasks.")
            return queryset      

        # If the user is authenticated and is a housekeeper, return only tasks assigned to them
        # Если пользователь аутентифицирован и является горничной, вернуть только задачи, назначенные ему
        if user.is_authenticated and user.role == User.Role.HOUSEKEEPER:
            logger.debug(f"User is Housekeeper, returning tasks assigned to {user}.")
            return queryset.filter(
            assigned_to=user,
            status__in=['assigned', 'in_progress', 'waiting_inspection']
        ).order_by('-is_rush', 'due_time')
        
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
        logger.debug(f"User {self.request.user} is accessing action: {self.action}")
        logger.debug(f"Getting permissions for action: {self.action}")


        # Authentication is required for all actions (enforced by DEFAULT_PERMISSION_CLASSES or IsAuthenticated)
        # Требуется аутентификация для всех действий (обеспечивается DEFAULT_PERMISSION_CLASSES или IsAuthenticated)

        if self.action == 'list' or self.action == 'retrieve':
            # For listing and retrieving tasks:
            # - Authentication is required.
            # - Allowed for Managers/Admins OR Housekeepers.
            #   get_queryset() already filters the list/details for frontdesk.
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
    
    def get_serializer_context(self):
        """
        Extra context provided to the serializer class.
        Добавляем информацию о правах пользователя в контекст сериализатора.
        """
        context = super().get_serializer_context()
        # Определяем, может ли текущий пользователь вручную управлять чек-листами.
        # Это будет использоваться в сериализаторе для условной логики.
        # Поскольку 'update' и 'partial_update' уже ограничены IsManagerOrFrontDesk
        # в get_permissions, мы можем быть уверены, что здесь request.user
        # будет менеджером или фронт-деском, если действие разрешено.
        # Тем не менее, явная проверка роли добавляет надежности.
        context['user_can_manage_checklists'] = (
            self.request.user and (self.request.user.role == User.Role.MANAGER or self.request.user.role == User.Role.FRONT_DESK)
        )
        return context

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
        user = request.user
        logger.info(f"User {user} attempting to start task {pk}.")
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
                room.status = Room.Status.IN_PROGRESS  
                room.save(update_fields=['status']) 
                logger.info(f"Room {room.number} status changed to 'in_progress'.")

                title = "Уборка начата"
                body = f"Уборка номера {room.number} начата горничной {user.first_name} {user.last_name}"
                data = {
                        "task_id": str(task.id),
                        "room_number": room.number,
                        "cleaning_type": task.cleaning_type,
                        "notification_type": "cleaning_started",
                    
                    }

                send_broadcast_notification_to_roles(
                        title=title,
                        body=body,
                        notification_type="task_started_web",
                        data=data,
                        roles_to_notify=[User.Role.MANAGER, User.Role.FRONT_DESK] 
                    )
                try:

                    frontdesk_tokens_qs = PushToken.objects.filter(
                        user__role = User.Role.FRONT_DESK
                    ).values_list('token', flat=True)
                    tokens_to_notify = list(frontdesk_tokens_qs)

                    if tokens_to_notify:
                        send_notifications_in_thread(
                            tokens_to_notify,
                            title,
                            body,
                            data
                        )
                        logger.info(f"Notification sent for starting task {task.id} for room {room.number}")
                    else:
                        logger.warning(f"No push tokens found for FRONT_DESK users to send starting notification for task {task.id}.")
                except Exception as e:
                        logger.error(f"Error sending starting notification for task {task.id}: {e}", exc_info=True)

                logger.info(f"Room {room.number} status changed to 'waiting_inspection'.")
            if task.zone:
                zone = task.zone
                zone.status = Zone.Status.IN_PROGRESS  
                zone.save(update_fields=['status']) 
                logger.info(f"Zone {zone.name} status changed to 'in_progress'.")
            logger.info(f"Task {task.pk} started successfully by user {user}.")
            serializer = self.get_serializer(task) # Serialize the updated object / Сериализуем обновленный объект
        
            return Response(serializer.data, status=status.HTTP_200_OK) # Return updated data / Возвращаем обновленные данные
        else:
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
            if  task.cleaning_type == None or task.cleaning_type == CleaningTypeChoices.STAYOVER or task.cleaning_type == CleaningTypeChoices.PUBLIC_AREA_CLEANING:
                task.status = CleaningTask.Status.CHECKED 
            else:
                task.status = CleaningTask.Status.WAITING_CHECK 
             

            task.completed_at = timezone.now() # Set completion time / Устанавливаем время завершения
            task.save(update_fields=['status', 'completed_at'])

            if task.room:
                room = task.room
                if task.cleaning_type == CleaningTypeChoices.STAYOVER or task.cleaning_type == CleaningTypeChoices.ON_DEMAND:
                    room.status = Room.Status.OCCUPIED 
                    logger.info(f"Room {room.number} status changed to 'occupied'.")
                else:
                    room.status = Room.Status.WAITING_INSPECTION 

                    title = "Уборка завершена"
                    body = f"Уборка номера {room.number} завершена. Требуется проверка."
                    data = {
                        "task_id": str(task.id),
                        "room_number": room.number,
                        "cleaning_type": task.cleaning_type,
                        "notification_type": "cleaning_completed_for_inspection",
                    
                    }

                    send_broadcast_notification_to_roles(
                        title=title,
                        body=body,
                        notification_type="task_completed_web",
                        data=data,
                        roles_to_notify=[User.Role.MANAGER, User.Role.FRONT_DESK] 
                    )
                
                    try:


                        frontdesk_tokens_qs = PushToken.objects.filter(
                            user__role = User.Role.FRONT_DESK
                        ).values_list('token', flat=True)

                        tokens_to_notify = list(frontdesk_tokens_qs)

                        if tokens_to_notify:
                            

                            send_notifications_in_thread(
                                tokens_to_notify,
                                title,
                                body,
                                data
                            )
                            logger.info(f"Notification sent for completed task {task.id} for room {room.number} (awaiting inspection).")
                        else:
                            logger.warning(f"No push tokens found for FRONT_DESK users to send completion notification for task {task.id}.")
                    except Exception as e:
                            logger.error(f"Error sending completion notification for task {task.id}: {e}", exc_info=True)
                    logger.info(f"Room {room.number} status changed to 'waiting_inspection'.")
                room.save(update_fields=['status'])
            if task.zone:
                zone = task.zone
                zone.status = Zone.Status.CLEAN
                zone.save(update_fields=['status'])
                logger.info(f"Zone new status {zone.status}.")
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
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsAssignedHousekeeperOrManagerOrFrontDesk])
    def start_check(self, request, pk=None):
        """
        Custom action to start inspection of a cleaning task.
        Can be called by the assigned housekeeper, a manager, or an front desk.
        The task must be in WAITING_INSPECTION status.

        Кастомное действие для начала проверки задачи по уборке.
        Может быть вызвано назначенным горничной, менеджером или администратором.
        Задача должна быть в статусе WAITING_INSPECTION.
        """
        logger.info(f"User {request.user} attempting to start inspection for task {pk}.")
        task = self.get_object()

        # Check if the task can be inspected from the current status
        # Проверяем, можно ли начать проверку задачи из текущего статуса
        if task.status == CleaningTask.Status.WAITING_CHECK:
            logger.info(f"Task {task.pk} status is {task.get_status_display()}, allowing inspection.")
            task.status = CleaningTask.Status.CHECKING # Set status to CHECKING / Переводим в статус "Проверка"
            task.save(update_fields=['status']) # Save only the changed fields / Сохраняем только измененные поля
        serializer = self.get_serializer(task)      
        logger.info(f"Inspection started for task {task.pk} by user {request.user}.")
        return Response(serializer.data, status=status.HTTP_200_OK)

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
        if task.status == CleaningTask.Status.CHECKING:
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
    @transaction.atomic # Декоратор транзакции
    def auto_generate(self, request):
        """
        Автоматически генерирует задачи по уборке на указанную дату:
        - Уборка после выезда: если у бронирования выезд в указанную дату
        - Текущая уборка: если гость живёт, но не выезжает в указанную дату
        - Задачи по зонам: для всех зон, если задача еще не существует
        """
        scheduled_date_str = request.data.get('scheduled_date')
        if scheduled_date_str:
            try:
                scheduled_date = timezone.datetime.strptime(scheduled_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"detail": "Неверный формат даты. Используйте ГГГГ-ММ-ДД."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            scheduled_date = timezone.localdate()

        created_tasks_count = 0
        created_tasks_details = []

        # Вспомогательная функция для создания и обработки задачи, избегая повторений
        def create_and_process_task(room=None, zone=None, cleaning_type=None, booking=None, notes="", assigned_by_user=None):
            nonlocal created_tasks_count

            # Проверка на существование задачи
            query_filters = {
                'scheduled_date': scheduled_date,
                'cleaning_type': cleaning_type,
            }
            if room:
                query_filters['room'] = room
            if zone:
                query_filters['zone'] = zone
            # Если задача связана с бронированием, добавляем его в фильтр
            if booking and room: # Booking only makes sense with a room
                query_filters['booking'] = booking
            # Внимание: для задач по зонам или другим, не привязанным к конкретному бронированию,
            # убедитесь, что фильтр `booking` не мешает.
            # Мы используем cleaning_type в фильтре, чтобы различать типы задач (например, DEPARTURE, STAYOVER) для одной и той же комнаты.

            exists = CleaningTask.objects.filter(**query_filters).exists()

            if not exists:
                task = CleaningTask(
                    room=room,
                    zone=zone,
                    booking=booking,
                    scheduled_date=scheduled_date,
                    cleaning_type=cleaning_type,
                    status=CleaningTask.Status.UNASSIGNED,
                    assigned_by=assigned_by_user, # Устанавливаем пользователя, который инициировал создание
                    notes=notes
                )
                
                # Шаг 1: Определяем применимые чек-листы с использованием метода модели
                applicable_checklists = CleaningTask.determine_applicable_checklists_by_periodicity(
                    cleaning_type=task.cleaning_type,
                    scheduled_date=task.scheduled_date,
                    booking=task.booking,
                    room=task.room,
                    zone=task.zone,
                )

                # Шаг 2: Сохраняем задачу, чтобы она получила ID
                # (Это необходимо перед установкой ManyToMany связей)
                task.save() 
                
                # Шаг 3: Устанавливаем ManyToMany связь с найденными шаблонами чек-листов
                task.associated_checklists.set(applicable_checklists)

                # Шаг 4: Сериализуем данные чек-листов и сохраняем их в JSONField
                # Это гарантирует, что поле checklist_data будет заполнено актуальными данными
                task.checklist_data = ChecklistTemplateSerializer(
                    sorted(applicable_checklists, key=lambda x: x.name), # Сортируем для консистентного JSON
                    many=True,
                    context={'request': request} # Передаем контекст, если сериализатор нуждается в нем
                ).data
                
                # Шаг 5: Сохраняем задачу еще раз, чтобы зафиксировать изменения в ManyToMany и JSONField
                task.save()

                created_tasks_count += 1
                if room:
                    created_tasks_details.append(f"Комната {room.number} ({cleaning_type})")
                elif zone:
                    created_tasks_details.append(f"Зона {zone.name} ({cleaning_type})")
                return task
            return None # Задача уже существовала

        # --- Уборка после выезда ---
        checkout_bookings = Booking.objects.filter(check_out__date=scheduled_date).select_related("room")
        for booking in checkout_bookings:
            if booking.room:
                create_and_process_task(
                    room=booking.room,
                    cleaning_type=CleaningTypeChoices.DEPARTURE_CLEANING,
                    booking=booking,
                    assigned_by_user=request.user
                )

        # --- Текущая уборка ---
        staying_bookings = Booking.objects.filter(
            check_in__date__lt=scheduled_date,
            check_out__date__gt=scheduled_date
        ).select_related("room")

        for booking in staying_bookings:
            if booking.room:
                create_and_process_task(
                    room=booking.room,
                    cleaning_type=CleaningTypeChoices.STAYOVER,
                    booking=booking,
                    assigned_by_user=request.user
                )

        # --- Подготовка номера к заезду ---
        preparing_bookings = Booking.objects.filter(
            check_in__date=scheduled_date,
            guest_count__gt=2 # Пример условия
        ).select_related("room")

        for booking in preparing_bookings:
            if booking.room:
                notes = f"Подготовить номер для {booking.guest_count} гостей."
                create_and_process_task(
                    room=booking.room,
                    cleaning_type=CleaningTypeChoices.PRE_ARRIVAL,
                    booking=booking,
                    notes=notes,
                    assigned_by_user=request.user
                )

        # --- Зоны ---
        zones = Zone.objects.all()
        for zone in zones:
            create_and_process_task(
                zone=zone,
                cleaning_type=CleaningTypeChoices.PUBLIC_AREA_CLEANING, # Тип для зон
                assigned_by_user=request.user
            )

        return Response({
            "created_count": created_tasks_count,
            "details": created_tasks_details,
            "message": f"Создано {created_tasks_count} задач по уборке."
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def assign_multiple(self, request):
        """
        Кастомное действие для назначения нескольких задач по уборке горничной.
        Доступно только для менеджеров и сотрудников службы приема.
        """
        user = request.user
        serializer = MultipleTaskAssignmentSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            task_ids = serializer.validated_data['task_ids']
            housekeeper_id = serializer.validated_data['housekeeper_id']
            scheduled_date = serializer.validated_data['scheduled_date']

            try:
                
                assigned_housekeeper = User.objects.get(id=housekeeper_id, role=User.Role.HOUSEKEEPER)
            except User.DoesNotExist:
                return Response({"detail": "Горничная не найдена или не является горничной."},
                                status=status.HTTP_400_BAD_REQUEST)

           
            tasks_to_assign = CleaningTask.objects.filter(id__in=task_ids, scheduled_date=scheduled_date)

           
            if len(tasks_to_assign) != len(task_ids):
                return Response({"detail": "Одна или несколько задач не найдены или не соответствуют указанной дате."},
                                status=status.HTTP_400_BAD_REQUEST)

            task_num_assigned = 0
           
            with transaction.atomic(): 
                for task in tasks_to_assign:
                    
                    
                    task.assigned_to = assigned_housekeeper
                    task.assigned_by = user
                    task.assigned_at = timezone.now()
                    

                    task.status = CleaningTask.Status.ASSIGNED 
                    task.save()
                    task_num_assigned += 1
                
                logger.info(f"{task_num_assigned} tasks assigned to housekeeper {assigned_housekeeper.username} for {scheduled_date}.")

                
                housekeepers_tokens_qs = PushToken.objects.filter(
                    user=assigned_housekeeper
                ).values_list('token', flat=True)
                
                tokens_to_notify = list(housekeepers_tokens_qs)

                if tokens_to_notify:
                    title = "Задачи назначены"
                    body = f"Вам назначили {task_num_assigned} новых задач на {scheduled_date.strftime('%d.%m.%Y')}" # Форматируем дату

                    data = {
                        "notification_type": "multiple_tasks_assigned",
                        "task_ids": list(task_ids),
                        "assigned_housekeeper_id": str(housekeeper_id),
                        "scheduled_date": str(scheduled_date), 
                        "num_tasks": task_num_assigned,
                    }

                    send_notifications_in_thread(
                        tokens_to_notify,
                        title,
                        body,
                        data
                    )
                    logger.info(f"Notifications sent for {task_num_assigned} tasks assigned to housekeeper {assigned_housekeeper.username}.")
                else:
                    logger.warning(f"No active push tokens found for housekeeper {assigned_housekeeper.username} (ID: {housekeeper_id}) to send assignment notification.")

            return Response({"detail": f"Задачи успешно назначены: {task_num_assigned}."}, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsManagerOrFrontDesk])
    def set_rush(self, request, pk=None):
        task = self.get_object()
        is_rush = request.data.get('is_rush')

        if is_rush is None:
            return Response({"detail": "is_rush field is required."}, status=status.HTTP_400_BAD_REQUEST)

        old_is_rush = task.is_rush
        task.is_rush = bool(is_rush)
        task.save()

        if task.is_rush and not old_is_rush:
            logger.info(f"Task {task.id} set to RUSH by {request.user.username}. Sending notification to assigned housekeeper.")

            if task.assigned_to and task.assigned_to.role == User.Role.HOUSEKEEPER:
                try:
                    # ИЗМЕНЕНИЕ: Убран фильтр is_active, так как такого поля нет в вашей модели PushToken
                    assigned_housekeeper_tokens_qs = PushToken.objects.filter(
                        user=task.assigned_to
                    ).values_list('token', flat=True) #

                    tokens_to_notify = list(assigned_housekeeper_tokens_qs)

                    if tokens_to_notify:
                        title = "СРОЧНАЯ ЗАДАЧА!"
                        body = (
                            f"Комната {task.room.number} теперь срочная! Статус: {task.get_status_display()}."
                            if task.room
                            else f"Зона {task.zone.name} теперь срочная! Статус: {task.get_status_display()}."
                        )
                        data = {
                            "task_id": str(task.id),
                            "room_number": task.room.number if task.room else None,
                            "zone_name": task.zone.name if task.zone else None,
                            "is_rush": True
                        }

                        send_notifications_in_thread(
                            tokens_to_notify,
                            title,
                            body,
                            data
                        )
                        logger.info(f"Rush notification sent to assigned housekeeper for task {task.id}.")
                    else:
                        logger.warning(f"No push tokens found for assigned housekeeper {task.assigned_to.username} for task {task.id}.")
                except ImportError:
                    logger.error("PushToken model not found. Cannot send push notifications for rush tasks. "
                                 "Please ensure 'from users.models import PushToken' is correct or adjust token retrieval logic.")
                except Exception as e:
                    logger.error(f"Error sending rush notification for task {task.id}: {e}", exc_info=True)
            else:
                logger.info(f"Task {task.id} has no assigned housekeeper or assigned user is not a housekeeper. No rush notification sent.")

        serializer = self.get_serializer(task)
        return Response(serializer.data)
       
    @action(detail=False, methods=['get'],permission_classes=[IsAuthenticated, IsManagerOrFrontDesk])
    def ready_for_check(self, request):
        """
        Получает список задач, готовых к проверке (COMPLETED или WAITING_CHECK).
        Доступно только для менеджеров и сотрудников службы приема.
        """
        # Удаляем фильтрацию по scheduled_date, если фронтенд должен получать все даты
        # Если нужна фильтрация по дате, фронтенд должен передавать scheduled_date
        
        tasks = CleaningTask.objects.filter(
            Q(status=CleaningTask.Status.WAITING_CHECK) | Q(status=CleaningTask.Status.COMPLETED)
        ).select_related('room', 'booking') # Добавьте select_related для оптимизации запросов к связанным объектам

        tasks = tasks.order_by('-is_rush', 'due_time') 

        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

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


