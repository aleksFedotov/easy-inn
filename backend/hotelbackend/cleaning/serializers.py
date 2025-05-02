from rest_framework import serializers
from cleaning.models import (
    CleaningTask,
    CleaningCheck,
    ChecklistItemTemplate,
    CleaningCheckItem
)
class ChecklistItemTemplateSerializer(serializers.ModelSerializer):
    

    class Meta:
        model = ChecklistItemTemplate
        fields = [
            'id',
            'template',
            'text',
            'order',
        ]

        
class CleaningCheckItemSerializer(serializers.ModelSerializer):
    

    class Meta:
        model = CleaningCheckItem
        fields = [
            'id',
            'template_item',
            'is_passed',
            'comment',
        ]


class CleaningTaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = CleaningTask
        fields = [
            'id',
            'room',
            'assigned_to',
            'assigned_to_name',
            'due_time',
            'status',
            'checklist_template',
            'created_at',
            'updated_at',
        ]

        read_only_fields = ['created_at','updated_at','assigned_to']


class CleaningCheckSerializer(serializers.ModelSerializer):
    items = CleaningCheckItemSerializer(many=True, read_only=True)  

    class Meta:
        model = CleaningCheck
        fields = [
            'id',
            'cleaning_task',
            'checked_by',
            'checklist',
            'status',
            'notes',
            'created_at',
            'updated_at',
            'items',
        ]
        read_only_fields = ['created_at','updated_at','checked_by']



        


