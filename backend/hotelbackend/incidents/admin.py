from django.contrib import admin
from incidents.models import IncidentReport


@admin.register(IncidentReport)
class IncidentReportAdmin(admin.ModelAdmin):
    list_display = (
        'room',
        'type',
        'status',
        'reported_by',
        'created_at',
    )
    list_filter = ('type', 'status', 'created_at')
    search_fields = ('room__number', 'reported_by__username')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ['room', 'reported_by']
