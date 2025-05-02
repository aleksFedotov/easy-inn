from rest_framework import serializers
from shifts.models import ShiftNote


class ShiftNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only = True)

    class Meta:
        model = ShiftNote
        fields = [
            'id',
            'author',
            'author_name',
            'text',
            'type',
            'is_archived',
            'created_at',
            'updated_at',
        ]

        read_only_fields = ['created_at', 'updated_at']