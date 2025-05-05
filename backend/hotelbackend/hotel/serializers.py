from rest_framework import serializers
from hotel.models import  Room, RoomType, CleaningChecklistTemplate


class RoomTypeSerializer(serializers.ModelSerializer):

    class Meta:
        model = RoomType
        fields = ['name', 'description', 'capacity']

        

class RoomSerializer(serializers.ModelSerializer):
    room_type_name = serializers.CharField(source='room_type.name', read_only = True)

    class Meta:
        model = Room
        fields = [
            'id',
            'number', 
            'floor', 
            'room_type',
            'room_type_name',
            'status',
            'notes',
            'is_active',
            'cleaning_required',
        ]
        read_only_fields = ['cleaning_required']

class CleaningChecklistTemplateSerializer(serializers.ModelSerializer):

    class Meta:
        model = CleaningChecklistTemplate
        fields = [
            'id',
            'name', 
            'created_by', 
            'is_active',
        ]
       
