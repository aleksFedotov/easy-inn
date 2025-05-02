from rest_framework import serializers
from booking.models import Booking

class BookingSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source='room.number', read_only=True)
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id',
            'room',
            'room_number',
            'check_in',
            'check_out',
            'guest_count',
            'notes',
            'created_at',
            'created_by',
            'duration',
        ]

        read_only_fields = ['created_at','created_by']

    def get_duration(self, obj):
        return obj.duration()