import logging
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action 
from django.utils import timezone 
from .models import CleaningType, ChecklistTemplate, ChecklistItemTemplate, CleaningTask
from users.models import User


from .serializers import (
    CleaningTypeSerializer,
    ChecklistTemplateSerializer,
    ChecklistItemTemplateSerializer,
    CleaningTaskSerializer
)


from utills.permissions import IsManagerOrAdmin, IsHouseKeeper, IsAssignedHousekeeperOrManagerOrAdmin

# Configure basic logging / Настраиваем базовое логирование
logger = logging.getLogger(__name__)



# --- CleaningType ViewSet ---

class CleaningTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Cleaning Types (CleaningType).
    Accessible only to authenticated users with the 'manager' or 'admin' role.
    Provides operations: list, create, retrieve, update, partial_update, destroy.
    Authentication is handled by DEFAULT_PERMISSION_CLASSES.

    ViewSet для управления типами уборок (CleaningType).
    Доступно только аутентифицированным пользователям с ролью 'manager' или 'admin'.
    Предоставляет операции: list, create, retrieve, update, partial_update, destroy.
    Аутентификация обрабатывается через DEFAULT_PERMISSION_CLASSES.
    """
    queryset = CleaningType.objects.all() # Base queryset / Базовый набор данных
    serializer_class = CleaningTypeSerializer # Serializer class / Класс сериализатора
    # Permissions: Requires manager or admin role / Разрешения: Требуется роль менеджера или администратора
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    def list(self, request, *args, **kwargs):
        """Handle listing CleaningTypes."""
        logger.info(f"User {request.user} is listing CleaningTypes.")
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        """Handle creating a CleaningType."""
        logger.info(f"User {request.user} is attempting to create a CleaningType.")
        return super().create(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        """Handle retrieving a single CleaningType."""
        logger.info(f"User {request.user} is retrieving CleaningType with pk={kwargs.get('pk')}.")
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Handle updating a CleaningType."""
        logger.info(f"User {request.user} is attempting to update CleaningType with pk={kwargs.get('pk')}.")
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Handle partial updating a CleaningType."""
        logger.info(f"User {request.user} is attempting to partially update CleaningType with pk={kwargs.get('pk')}.")
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Handle deleting a CleaningType."""
        logger.info(f"User {request.user} is attempting to delete CleaningType with pk={kwargs.get('pk')}.")
        return super().destroy(request, *args, **kwargs)


# --- ChecklistTemplate ViewSet ---

class ChecklistTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Checklist Templates (ChecklistTemplate).
    Accessible only to authenticated users with the 'manager' or 'admin' role.
    Provides operations: list, create, retrieve, update, partial_update, destroy.
    Authentication is handled by DEFAULT_PERMISSION_CLASSES.

    ViewSet для управления шаблонами чек-листов (ChecklistTemplate).
    Доступно только аутентифицированным пользователям с ролью 'manager' или 'admin'.
    Предоставляет операции: list, create, retrieve, update, partial_update, destroy.
    Аутентификация обрабатывается через DEFAULT_PERMISSION_CLASSES.
    """
    queryset = ChecklistTemplate.objects.all() # Base queryset / Базовый набор данных
    serializer_class = ChecklistTemplateSerializer # Serializer class / Класс сериализатора
    # Permissions: Requires manager or admin role / Разрешения: Требуется роль менеджера или администратора
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    def list(self, request, *args, **kwargs):
        """Handle listing ChecklistTemplates."""
        logger.info(f"User {request.user} is listing ChecklistTemplates.")
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        """Handle creating a ChecklistTemplate."""
        logger.info(f"User {request.user} is attempting to create a ChecklistTemplate.")
        return super().create(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        """Handle retrieving a single ChecklistTemplate."""
        logger.info(f"User {request.user} is retrieving ChecklistTemplate with pk={kwargs.get('pk')}.")
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Handle updating a ChecklistTemplate."""
        logger.info(f"User {request.user} is attempting to update ChecklistTemplate with pk={kwargs.get('pk')}.")
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Handle partial updating a ChecklistTemplate."""
        logger.info(f"User {request.user} is attempting to partially update ChecklistTemplate with pk={kwargs.get('pk')}.")
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Handle deleting a ChecklistTemplate."""
        logger.info(f"User {request.user} is attempting to delete ChecklistTemplate with pk={kwargs.get('pk')}.")
        return super().destroy(request, *args, **kwargs)


# --- ChecklistItemTemplate ViewSet ---

class ChecklistItemTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Checklist Item Templates (ChecklistItemTemplate).
    Accessible only to authenticated users with the 'manager' or 'admin' role.
    Provides operations: list, create, retrieve, update, partial_update, destroy.
    Authentication is handled by DEFAULT_PERMISSION_CLASSES.

    ViewSet для управления пунктами шаблонов чек-листов (ChecklistItemTemplate).
    Доступно только аутентифицированным пользователям с ролью 'manager' или 'admin'.
    Предоставляет операции: list, create, retrieve, update, partial_update, destroy.
    Аутентификация обрабатывается через DEFAULT_PERMISSION_CLASSES.
    """
    queryset = ChecklistItemTemplate.objects.all() # Base queryset / Базовый набор данных
    serializer_class = ChecklistItemTemplateSerializer # Serializer class / Класс сериализатора
    # Permissions: Requires manager or admin role / Разрешения: Требуется роль менеджера или администратора
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    def list(self, request, *args, **kwargs):
        """Handle listing ChecklistItemTemplates."""
        logger.info(f"User {request.user} is listing ChecklistItemTemplates.")
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        """Handle creating a ChecklistItemTemplate."""
        logger.info(f"User {request.user} is attempting to create a ChecklistItemTemplate.")
        return super().create(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        """Handle retrieving a single ChecklistItemTemplate."""
        logger.info(f"User {request.user} is retrieving ChecklistItemTemplate with pk={kwargs.get('pk')}.")
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Handle updating a ChecklistItemTemplate."""
        logger.info(f"User {request.user} is attempting to update ChecklistItemTemplate with pk={kwargs.get('pk')}.")
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Handle partial updating a ChecklistItemTemplate."""
        logger.info(f"User {request.user} is attempting to partially update ChecklistItemTemplate with pk={kwargs.get('pk')}.")
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Handle deleting a ChecklistItemTemplate."""
        logger.info(f"User {request.user} is attempting to delete ChecklistItemTemplate with pk={kwargs.get('pk')}.")
        return super().destroy(request, *args, **kwargs)


# --- CleaningTask ViewSet ---

class CleaningTaskViewSet(viewsets.ModelViewSet):
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

        # If the user is authenticated and is a manager or admin, return all tasks
        # Если пользователь аутентифицирован и является управляющим или администратором, вернуть все задачи
        if user.is_authenticated and user.role in [User.Role.ADMIN, User.Role.MANAGER]:
            logger.debug("User is Manager or Admin, returning all tasks.")
            return CleaningTask.objects.all()

        # If the user is authenticated and is a housekeeper, return only tasks assigned to them
        # Если пользователь аутентифицирован и является горничной, вернуть только задачи, назначенные ему
        if user.is_authenticated and user.role == User.Role.HOUSEKEEPER:
            logger.debug(f"User is Housekeeper, returning tasks assigned to {user}.")
            return CleaningTask.objects.filter(assigned_to=user)

        # For all other authenticated users or if the user is not authenticated,
        # return an empty queryset. Permission classes will further restrict access.
        # Для всех других аутентифицированных пользователей или если пользователь не аутентифицирован,
        # вернуть пустой набор данных. Классы разрешений дополнительно ограничат доступ.
        logger.debug("User is neither Manager/Admin nor Housekeeper, returning empty queryset.")
        return CleaningTask.objects.none()


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
            self.permission_classes = [IsAuthenticated, IsManagerOrAdmin | IsHouseKeeper]
            logger.debug("Applying permissions: IsAuthenticated, IsManagerOrAdmin | IsHouseKeeper")

        elif self.action in ['update', 'partial_update']:
            # For updating a specific task (e.g., manager changes assignee):
            # - Authentication is required.
            # - Allowed only for Managers/Admins.
            #   Housekeepers will use custom 'start'/'complete' actions for status changes.
            # Для обновления конкретной задачи (например, менеджер меняет назначенного):
            # - Требуется аутентификация.
            # - Разрешено только для управляющих/администраторов.
            #   Горничные будут использовать кастомные действия 'start'/'complete' для смены статуса.
            self.permission_classes = [IsAuthenticated, IsManagerOrAdmin]
            logger.debug("Applying permissions: IsAuthenticated, IsManagerOrAdmin")

        elif self.action == 'create' or self.action == 'destroy':
            # For creating or deleting tasks:
            # - Authentication is required.
            # - Allowed only for Managers or Admins.
            # Для создания или удаления задач:
            # - Требуется аутентификация.
            # - Разрешено только для управляющих или администраторов.
            self.permission_classes = [IsAuthenticated, IsManagerOrAdmin]
            logger.debug("Applying permissions: IsAuthenticated, IsManagerOrAdmin")

        # Permissions for custom actions / Разрешения для кастомных действий
        elif self.action in ['start', 'complete']:
             # For start and complete actions:
             # - Authentication is required.
             # - Allowed for the assigned housekeeper, manager, or admin.
             # Для действий start и complete:
             # - Требуется аутентификация.
             # - Разрешено для назначенного горничной, менеджера или администратора.
             self.permission_classes = [IsAuthenticated, IsAssignedHousekeeperOrManagerOrAdmin]
             logger.debug("Applying permissions: IsAuthenticated, IsAssignedHousekeeperOrManagerOrAdmin")

        elif self.action in ['check', 'cancel']:
             # For check and cancel actions:
             # - Authentication is required.
             # - Allowed only for the manager or admin.
             # Для действий check и cancel:
             # - Требуется аутентификация.
             # - Разрешено только для менеджера или администратора.
             self.permission_classes = [IsAuthenticated, IsManagerOrAdmin]
             logger.debug("Applying permissions: IsAuthenticated, IsManagerOrAdmin")

        else:
            # Default permissions for any other actions not explicitly defined
            # Разрешения по умолчанию для любых других действий, не определенных явно
            self.permission_classes = [IsAuthenticated, IsManagerOrAdmin] # Restrict by default / Ограничиваем по умолчанию
            logger.debug("Applying default permissions: IsAuthenticated, IsManagerOrAdmin")


        return [permission() for permission in self.permission_classes]

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsAssignedHousekeeperOrManagerOrAdmin])
    def start(self, request, pk=None):
        """
        Custom action to start a cleaning task.
        Can be called by the assigned housekeeper, a manager, or an admin.
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

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsAssignedHousekeeperOrManagerOrAdmin])
    def complete(self, request, pk=None):
        """
        Custom action to complete a cleaning task.
        Can be called by the assigned housekeeper, a manager, or an admin.
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
            task.status = CleaningTask.Status.WAITING_CHECK # Set status to WAITING_CHECK / Переводим в статус ожидания проверки
            task.completed_at = timezone.now() # Set completion time / Устанавливаем время завершения
            task.save(update_fields=['status', 'completed_at'])
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

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsManagerOrAdmin])
    def check(self, request, pk=None):
        """
        Custom action to check and confirm a cleaning task.
        Can be called only by a manager or an admin.
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

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsManagerOrAdmin])
    def cancel(self, request, pk=None):
        """
        Custom action to cancel a cleaning task.
        Can be called only by a manager or an admin.
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