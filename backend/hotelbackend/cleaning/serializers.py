from rest_framework import serializers 
from django.contrib.auth import get_user_model # Import get_user_model to reference the User model
from .models import  ChecklistTemplate, ChecklistItemTemplate, CleaningTask
from django.core.exceptions import ValidationError as DjangoValidationError 
from rest_framework.exceptions import ValidationError as DRFValidationError
from cleaning.cleaningTypeChoices import CleaningTypeChoices
from hotel.models import Room
from booking.models import Booking
import logging 
import copy 

from datetime import date 

UserModel = get_user_model() # Get the custom User model / Получаем пользовательскую модель User
logger = logging.getLogger(__name__)


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
    cleaning_type_display = serializers.SerializerMethodField()

    items = ChecklistItemTemplateSerializer(many=True)

    class Meta:
        model = ChecklistTemplate # Specify the model / Указываем модель
        fields = [ # List of fields / Список полей
            'id',
            'name',
            'cleaning_type', # Allows setting the CleaningType via its ID / Позволяет устанавливать CleaningType по его ID
            'cleaning_type_display', # Read-only field displaying the name / Поле только для чтения, отображающее имя
            'periodicity',  
            'offset_days',  
            'description',
            'items', 
        ]
        read_only_fields = ['id',  'cleaning_type_display',] # Read-only fields / Поля только для чтения

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
    def get_cleaning_type_display(self, obj):
        return obj.get_cleaning_type_display()

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
    cleaning_type_display = serializers.SerializerMethodField()

    # Read-only field for human-readable status display
    # Поле только для чтения для человекочитаемого отображения статуса
    status_display = serializers.SerializerMethodField()

    # Use SerializerMethodField for user names to handle None assigned users gracefully.
    # These methods are defined below and return the name or None if the user is not assigned.
    # Используем SerializerMethodField для имен пользователей для корректной обработки неназначенных пользователей.
    # Эти методы определены ниже и возвращают имя или None, если пользователь не назначен.
    assigned_to_name = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    checked_by_name = serializers.SerializerMethodField()
    is_guest_checked_out = serializers.SerializerMethodField()
    associated_checklists = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=ChecklistTemplate.objects.all(),
        required=False,  
        
    )
    associated_checklist_names = serializers.SerializerMethodField()
    checklist_data = serializers.SerializerMethodField()


    def get_cleaning_type_display(self, obj):
        return obj.get_cleaning_type_display()
    
    def get_is_guest_checked_out(self, obj):
        """
        Возвращает True, если тип задачи — 'уборка после выезда',
        и комната уже отмечена как dirty (гость выехал).
        Иначе False или None.
        """
        if obj.cleaning_type == CleaningTypeChoices.DEPARTURE_CLEANING and obj.room:
            return obj.room.status == Room.Status.DIRTY
        return False

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

    def get_status_display(self, obj):
        """
        Returns the human-readable display value for the status field using the model's get_status_display() method.
        Возвращает человекочитаемое значение для поля статуса, используя метод get_status_display() модели.
        """
        return obj.get_status_display()

    # Custom validate method to trigger model's clean()
    # Пользовательский метод validate для вызова метода clean() модели
    def validate(self, attrs):
        attrs_for_validation = copy.copy(attrs)

  
        associated_checklists_data = attrs_for_validation.pop('associated_checklists', None)

        if self.instance: 
            
            temp_instance = copy.deepcopy(self.instance)
            
            
            for field_name, value in attrs_for_validation.items():
                if hasattr(temp_instance, field_name):
                    setattr(temp_instance, field_name, value)
            

            temp_instance.pk = self.instance.pk
            temp_instance.id = self.instance.id

        else: 
            
            temp_instance = self.Meta.model(**attrs_for_validation)

        try:
           
            temp_instance.full_clean()
        except DjangoValidationError as e:
     
            if '__all__' in e.message_dict:
                raise DRFValidationError(e.message_dict['__all__'])
            else:
                raise DRFValidationError(e.message_dict)

        
        return attrs

    
    # Метод для получения списка названий чек-листов
    def get_associated_checklist_names(self, obj: CleaningTask):
        # Если это новый объект и мы только что применили логику автогенерации,
        # используем временный список. Иначе - связанные чек-листы.
        if hasattr(obj, '_temp_auto_checklists'):
            return [template.name for template in obj._temp_auto_checklists]
        return [template.name for template in obj.associated_checklists.all()]

    def get_checklist_data(self, obj: CleaningTask):
        # Аналогично get_associated_checklist_names
        if hasattr(obj, '_temp_auto_checklists'):
            return ChecklistTemplateSerializer(obj._temp_auto_checklists, many=True, context=self.context).data
        return ChecklistTemplateSerializer(obj.associated_checklists.all().prefetch_related('items'), many=True, context=self.context).data

    def create(self, validated_data):
        associated_checklists_input = validated_data.pop('associated_checklists', None)

       
        instance = super().create(validated_data)

        user_can_manage_checklists = self.context.get('user_can_manage_checklists', False)
        
        if associated_checklists_input is not None and user_can_manage_checklists:
           
            extracted_ids = []
            if not isinstance(associated_checklists_input, (list, tuple)):
                logger.error(f"Unexpected type for associated_checklists_input in create: {type(associated_checklists_input)}")
                raise DRFValidationError({"associated_checklists": "Expected a list of checklist IDs."})

            for item in associated_checklists_input:
                if isinstance(item, int):
                    extracted_ids.append(item)
                elif isinstance(item, ChecklistTemplate):
                    extracted_ids.append(item.id)
                else:
                    logger.error(f"Invalid item type in associated_checklists (create): {type(item)} - {item}")
                    raise DRFValidationError({"associated_checklists": "Invalid item type in checklist list."})
            
            associated_templates = list(ChecklistTemplate.objects.filter(id__in=extracted_ids))
            instance.associated_checklists.set(associated_templates)
            instance._temp_auto_checklists = associated_templates
        else:
            room = validated_data.get('room')
            zone = validated_data.get('zone')
            scheduled_date = validated_data.get('scheduled_date', date.today())

            current_booking = None
            if instance.room:
                current_booking = Booking.objects.filter(
                    room=instance.room,
                    check_in__date__lte=instance.scheduled_date,
                    check_out__date__gte=instance.scheduled_date
                ).first()
            
            applicable_checklists = CleaningTask.determine_applicable_checklists_by_periodicity(
                cleaning_type=instance.cleaning_type, 
                scheduled_date=scheduled_date,
                booking=current_booking,
                room=room,
                zone=zone
            )
            instance.associated_checklists.set(applicable_checklists)
            instance._temp_auto_checklists = applicable_checklists
        
        instance.save() 
        return instance


    def update(self, instance, validated_data):
        associated_checklists_input = validated_data.pop('associated_checklists', None)

        instance = super().update(instance, validated_data)

        user_can_manage_checklists = self.context.get('user_can_manage_checklists', False)

        if associated_checklists_input is not None and user_can_manage_checklists:
           
            extracted_ids = []
            if not isinstance(associated_checklists_input, (list, tuple)):
                logger.error(f"Unexpected type for associated_checklists_input in update: {type(associated_checklists_input)}")
                raise DRFValidationError({"associated_checklists": "Expected a list of checklist IDs."})

            for item in associated_checklists_input:
                if isinstance(item, int):
                    extracted_ids.append(item)
                elif isinstance(item, ChecklistTemplate):
                 
                    extracted_ids.append(item.id)
                else:
             
                    logger.error(f"Invalid item type in associated_checklists (update): {type(item)} - {item}")
                    raise DRFValidationError({"associated_checklists": "Invalid item type in checklist list."})
            
            # Теперь extracted_ids должен корректно содержать только целые числа.
            associated_templates = list(ChecklistTemplate.objects.filter(id__in=extracted_ids))
            instance.associated_checklists.set(associated_templates)
        
        instance.save() 
        return instance
            

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
            'cleaning_type_display', # Read-only, displays cleaning type name / Только для чтения, отображает название типа уборки
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
            'is_guest_checked_out',
            'is_rush',
            'associated_checklist_names',
            'associated_checklists',
        ]
        # Define all fields that should only be included in the output, not accepted as input
        # Определяем все поля, которые должны быть включены только в вывод, но не приниматься в качестве ввода
        read_only_fields = [
            'id',
            'assigned_to_name',
            'assigned_by_name',
            'room_number',
            'zone_name',
            'cleaning_type_display',
            'checked_by_name',
            'status_display',
            'assigned_at',
            'started_at',
            'completed_at',
            'checked_at',
            'is_guest_checked_out',
        ]
