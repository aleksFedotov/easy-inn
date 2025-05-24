from rest_framework import serializers 
from django.contrib.auth import get_user_model # Import get_user_model to reference the User model
from .models import CleaningType, ChecklistTemplate, ChecklistItemTemplate, CleaningTask
from django.core.exceptions import ValidationError as DjangoValidationError 
from rest_framework.exceptions import ValidationError as DRFValidationError
from hotel.models import Room, Zone 
import logging 

UserModel = get_user_model() # Get the custom User model / Получаем пользовательскую модель User
logger = logging.getLogger(__name__)
# --- CleaningType Serializer ---

class CleaningTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for the CleaningType model.
    Handles serialization and deserialization of cleaning type data.
    Сериализатор для модели CleaningType.
    Обрабатывает сериализацию и десериализацию данных о типах уборок.
    """
    class Meta:
        model = CleaningType # Specify the model to be serialized / Указываем модель для сериализации
        fields = [ # List of fields to include in the serialization / Список полей для включения в сериализацию
            'id',
            'name',
            'description'
        ]
        read_only_fields = ['id'] # Fields that should be included in the output but not accepted for input / Поля, которые должны быть включены в вывод, но не приниматься для ввода

# --- ChecklistItemTemplate Serializer ---

class ChecklistItemTemplateSerializer(serializers.ModelSerializer):
    """
    Serializer for the ChecklistItemTemplate model.
    Handles serialization and deserialization of checklist item template data.
    Сериализатор для модели ChecklistItemTemplate.
    Обрабатывает сериализацию и десериализацию данных о пунктах шаблона чек-листа.
    """
    class Meta:
        model = ChecklistItemTemplate # Specify the model / Указываем модель
        fields = [ # List of fields / Список полей
            'id',
            'text',
            'order',
        ]
        read_only_fields = ['id'] # Read-only fields / Поля только для чтения

    def validate_order(self, value):
        if value < 0:
            raise serializers.ValidationError("Order must be non-negative.")
        return value

# --- ChecklistTemplate Serializer ---

class ChecklistTemplateSerializer(serializers.ModelSerializer):
    """
    Serializer for the ChecklistTemplate model.
    Handles serialization and deserialization of checklist template data.
    Сериализатор для модели ChecklistTemplate.
    Обрабатывает сериализацию и десериализацию данных о шаблонах чек-листов.
    """
    # To display the name of the related CleaningType instead of just its ID
    # Используется для отображения имени связанного CleaningType вместо его ID
    cleaning_type_name = serializers.CharField(source='cleaning_type.name', read_only=True)

    items = ChecklistItemTemplateSerializer(many=True)

    class Meta:
        model = ChecklistTemplate # Specify the model / Указываем модель
        fields = [ # List of fields / Список полей
            'id',
            'name',
            'cleaning_type', # Allows setting the CleaningType via its ID / Позволяет устанавливать CleaningType по его ID
            'cleaning_type_name', # Read-only field displaying the name / Поле только для чтения, отображающее имя
            'description',
            'items', 
        ]
        read_only_fields = ['id', 'cleaning_type_name'] # Read-only fields / Поля только для чтения

    def create(self, validated_data):
        
        items_data = validated_data.pop('items', [])

        
        template = ChecklistTemplate.objects.create(**validated_data)

        
        for index, item_data in enumerate(items_data): 

            item_data.pop('id', None)
            ChecklistItemTemplate.objects.create(
                checklist_template=template,
                order=index, 
                **item_data
            )

        return template

    def update(self, instance, validated_data):
        # Извлекаем данные пунктов из validated_data
        items_data = validated_data.pop('items', None)


        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        
        if items_data is not None:
            
            instance.items.all().delete()

            
            for index, item_data in enumerate(items_data): 
               
                 item_data.pop('id', None)
                 ChecklistItemTemplate.objects.create(
                     checklist_template=instance,
                     order=index, 
                     **item_data 
                 )

        return instance

class MultipleTaskAssignmentSerializer(serializers.Serializer):
    task_ids = serializers.ListField(child=serializers.IntegerField(), required=True)
    housekeeper_id = serializers.IntegerField(required=True)
    scheduled_date = serializers.DateField(required=True)
    def validate_task_ids(self, value):
        if not value:
            raise serializers.ValidationError("Необходимо указать хотя бы одну задачу.")
        return value

    def validate_housekeeper_id(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            User.objects.get(pk=value, role='housekeeper')
        except User.DoesNotExist:
            raise serializers.ValidationError("Выбранная горничная не найдена.")
        return value

    def validate_scheduled_date(self, value):
        # Дополнительная валидация даты, если необходимо
        return value


# --- CleaningTask Serializer ---

class CleaningTaskSerializer(serializers.ModelSerializer):
    """
    Serializer for the CleaningTask model.
    Handles serialization and deserialization of cleaning task data.
    Includes fields for related objects and status display.
    Uses SerializerMethodField for user names to handle None gracefully.
    Includes custom validate method to trigger model's clean().

    Сериализатор для модели CleaningTask.
    Обрабатывает сериализацию и десериализацию данных о задачах уборки.
    Включает поля для связанных объектов и отображения статуса.
    Использует SerializerMethodField для имен пользователей для корректной обработки None.
    Включает пользовательский метод validate для вызова метода clean() модели.
    """
    # Read-only fields to display related object information by name/number
    # These fields use 'source' to access attributes of related objects.
    # allow_null=True is used because the related ForeignKey fields are null=True.
    # Поля только для чтения для отображения информации о связанных объектах по имени/номеру.
    # Эти поля используют 'source' для доступа к атрибутам связанных объектов.
    # allow_null=True используется, потому что связанные поля ForeignKey могут быть NULL.
    room_number = serializers.CharField(source='room.number', read_only=True, allow_null=True)
    zone_name = serializers.CharField(source='zone.name', read_only=True, allow_null=True)
    cleaning_type_name = serializers.CharField(source='cleaning_type.name', read_only=True, allow_null=True)

    # Use SerializerMethodField for user names to handle None assigned users gracefully.
    # These methods are defined below and return the name or None if the user is not assigned.
    # Используем SerializerMethodField для имен пользователей для корректной обработки неназначенных пользователей.
    # Эти методы определены ниже и возвращают имя или None, если пользователь не назначен.
    assigned_to_name = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    checked_by_name = serializers.SerializerMethodField()

    checklist_data = serializers.SerializerMethodField()

    def get_assigned_to_name(self, obj):
        """
        Returns the full name or username of the assigned user, or None.
        Возвращает полное имя или имя пользователя назначенного пользователя, или None.
        """
        if obj.assigned_to:
            # Return full name if available, otherwise username
            # Возвращаем полное имя, если доступно, иначе имя пользователя
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None # Return None if assigned_to is None / Возвращаем None, если assigned_to равно None

    def get_assigned_by_name(self, obj):
        """
        Returns the full name or username of the user who assigned the task, or None.
        Возвращает полное имя или имя пользователя пользователя, который назначил задачу, или None.
        """
        if obj.assigned_by:
            # Return full name if available, otherwise username
            # Возвращаем полное имя, если доступно, иначе имя пользователя
            return obj.assigned_by.get_full_name() or obj.assigned_by.username
        return None # Return None if assigned_by is None / Возвращаем None, если assigned_by равно None

    def get_checked_by_name(self, obj):
        """
        Returns the full name or username of the user who checked the task, or None.
        Возвращает полное имя или имя пользователя пользователя, который проверил задачу, или None.
        """
        if obj.checked_by:
            # Return full name if available, otherwise username
            # Возвращаем полное имя, если доступно, иначе имя пользователя
            return obj.checked_by.get_full_name() or obj.checked_by.username
        return None # Return None if checked_by is None / Возвращаем None, если checked_by равно None


    # Read-only field for human-readable status display
    # Поле только для чтения для человекочитаемого отображения статуса
    status_display = serializers.SerializerMethodField()

    def get_status_display(self, obj):
        """
        Returns the human-readable display value for the status field using the model's get_status_display() method.
        Возвращает человекочитаемое значение для поля статуса, используя метод get_status_display() модели.
        """
        return obj.get_status_display()

    # Custom validate method to trigger model's clean()
    # Пользовательский метод validate для вызова метода clean() модели
    def validate(self, attrs):
        """
        Custom validation to trigger the model's clean() method.
        This ensures model-level validation (like room/zone conflict) is checked
        during serializer validation.

        Пользовательская валидация для вызова метода clean() модели.
        Это гарантирует, что валидация на уровне модели (например, конфликт комнаты/зоны)
        проверяется во время валидации сериализатора.
        """
        # Create a temporary instance to perform model-level clean validation
        # This handles both create and update scenarios.
        # For updates, apply the changes from attrs to the instance before cleaning.
        # For creations, create a new instance with the attrs.

        # Создаем временный экземпляр для выполнения валидации clean() на уровне модели.
        # Это обрабатывает сценарии создания и обновления.
        # Для обновлений применяем изменения из attrs к существующему экземпляру перед валидацией.
        # Для созданий создаем новый экземпляр с данными из attrs.

        if self.instance:
            # For update: use the existing instance and apply changes from attrs
            # Create a copy to avoid modifying the original instance during validation
            # Для обновления: используем существующий экземпляр и применяем изменения из attrs.
            # Создаем копию, чтобы избежать изменения оригинального экземпляра во время валидации.
            temp_instance = self.instance
        else:
            # For create: create a new temporary instance of the model
            # Для создания: создаем новый временный экземпляр модели.
            temp_instance = self.Meta.model()

        # Apply the validated data (attrs) to the temporary instance.
        # DRF's default validation for PrimaryKeyRelatedFields will have already
        # converted incoming IDs into model instances in the 'attrs' dictionary.
        # Применяем валидированные данные (attrs) к временному экземпляру.
        # Стандартная валидация DRF для PrimaryKeyRelatedFields уже преобразует
        # входящие ID в экземпляры моделей в словаре 'attrs'.
        for field_name, value in attrs.items():
             # Check if the field exists on the model before setting the attribute
             # This prevents errors if 'attrs' contains keys not directly mapping to model fields
             # Проверяем, существует ли поле в модели перед установкой атрибута.
             # Это предотвращает ошибки, если 'attrs' содержит ключи, не соответствующие напрямую полям модели.
             if hasattr(temp_instance, field_name):
                 setattr(temp_instance, field_name, value)


        try:
            # Call the model's full_clean() method to trigger all model-level validators.
            # full_clean will validate all fields on the temp_instance based on model constraints.
            # No need to exclude fields here as we are setting attributes directly.
            # Вызываем метод full_clean() модели для запуска всех валидаторов на уровне модели.
            # full_clean проверит все поля временного экземпляра на основе ограничений модели.
            # Нет необходимости исключать поля здесь, так как мы устанавливаем атрибуты напрямую.
            temp_instance.full_clean()
        except DjangoValidationError as e:
            # Convert Django's ValidationError to DRF's ValidationError.
            # Check if the error is a non-field error (usually under '__all__')
            # Преобразуем Django's ValidationError в DRF's ValidationError.
            # Проверяем, является ли ошибка ошибкой, не связанной с полем (обычно под '__all__').
            if '__all__' in e.message_dict:
                # Raise DRF ValidationError with the list of non-field errors
                # Генерируем DRF ValidationError со списком ошибок, не связанных с полем.
                raise DRFValidationError(e.message_dict['__all__'])
            else:
                # Otherwise, it's a field-specific error, pass the message_dict
                # В противном случае это ошибка, связанная с конкретным полем, передаем message_dict.
                raise DRFValidationError(e.message_dict)

        # Return the original validated data dictionary
        # Возвращаем оригинальный словарь валидированных данных
        return attrs

    def get_checklist_data(self, obj: CleaningTask):
        """
        Получает данные шаблона чек-листа, связанные с типом уборки данной задачи.
        """
        if not obj.cleaning_type:
            return {
                "name": None,
                "description": None,
                "items": []
            }

        checklist_template = ChecklistTemplate.objects.filter(
            cleaning_type=obj.cleaning_type
        ).prefetch_related('items').first()

        if checklist_template:
            return ChecklistTemplateSerializer(checklist_template, context=self.context).data

        # Если шаблон не найден, возвращаем пустую структуру
        return {
            "name": None,
            "description": None,
            "items": []
        }
        

    class Meta:
        model = CleaningTask # Specify the model / Указываем модель
        fields = [ # List of fields to include / Список полей для включения
            'id',
            'assigned_to', # Allows setting the User via ID / Позволяет устанавливать пользователя по ID
            'assigned_to_name', # Read-only, displays assigned user's name / Только для чтения, отображает имя назначенного пользователя
            'assigned_by', # Allows setting the User via ID / Позволяет устанавливать пользователя по ID
            'assigned_by_name', # Read-only, displays assigning user's name / Только для чтения, отображает имя пользователя, назначившего задачу
            'room', # Allows setting the Room via ID / Позволяет устанавливать комнату по ID
            'room_number', # Read-only, displays room number / Только для чтения, отображает номер комнаты
            'zone', # Allows setting the Zone via ID / Позволяет устанавливать зону по ID
            'zone_name', # Read-only, displays zone name / Только для чтения, отображает название зоны
            'booking', # Allows setting the Booking via ID / Позволяет устанавливать бронирование по ID
            'cleaning_type', # Allows setting the CleaningType via ID / Позволяет устанавливать тип уборки по ID
            'cleaning_type_name', # Read-only, displays cleaning type name / Только для чтения, отображает название типа уборки
            'status', # Allows setting the status / Позволяет устанавливать статус
            'status_display', # Read-only, displays human-readable status / Только для чтения, отображает человекочитаемый статус
            'scheduled_date', # Allows setting the scheduled date / Позволяет устанавливать запланированную дату
            'due_time', # Allows setting the due time / Позволяет устанавливать срок выполнения
            'assigned_at', # Read-only, timestamp / Только для чтения, метка времени
            'started_at', # Read-only, timestamp / Только для чтения, метка времени
            'completed_at', # Read-only, timestamp / Только для чтения, метка времени
            'checked_at', # Read-only, timestamp / Только для чтения, метка времени
            'checked_by', # Allows setting the User via ID / Позволяет устанавливать пользователя по ID
            'checked_by_name', # Read-only, displays checking user's name / Только для чтения, отображает имя пользователя, проверившего задачу
            'notes', # Allows setting notes / Позволяет устанавливать заметки
            'checklist_data',
        ]
        # Define all fields that should only be included in the output, not accepted as input
        # Определяем все поля, которые должны быть включены только в вывод, но не приниматься в качестве ввода
        read_only_fields = [
            'id',
            'assigned_to_name',
            'assigned_by_name',
            'room_number',
            'zone_name',
            'cleaning_type_name',
            'checked_by_name',
            'status_display',
            'assigned_at',
            'started_at',
            'completed_at',
            'checked_at',
        ]
