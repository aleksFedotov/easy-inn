from django.contrib import admin
from shifts.models import ShiftNote


@admin.register(ShiftNote)
class ShiftNoteAdmin(admin.ModelAdmin):
    list_display = (
        'type',
        'author',
        'short_text',
        'is_archived',
        'created_at',
    )
    list_filter = ('type', 'is_archived', 'created_at')
    search_fields = ('text', 'author__username')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ['author']

    def short_text(self, obj):
        return obj.text[:40] + '...' if obj.text and len(obj.text) > 40 else obj.text
    short_text.short_description = 'Текст'
