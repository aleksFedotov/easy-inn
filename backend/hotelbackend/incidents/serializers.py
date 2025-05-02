from rest_framework import serializers
from incidents.models import IncidentReport


class IncidentReportSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source='room.number', read_only =True)
    is_resolved = serializers.SerializerMethodField()
    

    class Meta:
        model = IncidentReport
        fields = [
            'id',
            'room', 
            'room_number', 
            'type', 
            'description',
            'reported_by',
            'status',
            'created_at',
            'updated_at',
            'is_resolved',
        ]
        read_only_fields = ['reported_by','created_at','updated_at']

    def get_is_resolved(self, obj):
        return obj.is_resolved()