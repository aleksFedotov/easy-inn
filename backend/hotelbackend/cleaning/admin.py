from django.contrib import admin

from .models import CleaningType, ChecklistTemplate, ChecklistItemTemplate, CleaningTask

class CleaningTypeAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

admin.site.register(CleaningType, CleaningTypeAdmin)

class ChecklistTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'cleaning_type')
    search_fields = ('name', 'description')
    list_filter = ('cleaning_type',)

admin.site.register(ChecklistTemplate, ChecklistTemplateAdmin)

class ChecklistItemTemplateAdmin(admin.ModelAdmin):
    list_display = ('text', 'checklist_template', 'order')
    search_fields = ('text',)
    list_filter = ('checklist_template',)
    list_editable = ('order',)

admin.site.register(ChecklistItemTemplate, ChecklistItemTemplateAdmin)

class CleaningTaskAdmin(admin.ModelAdmin):
    list_display = ('room', 'zone', 'cleaning_type', 'status', 'assigned_to', 'scheduled_date', 'due_time')
    search_fields = ('room__number', 'zone__name', 'notes', 'assigned_to__username')
    list_filter = ('status', 'cleaning_type', 'assigned_to', 'scheduled_date')
    raw_id_fields = ('room', 'zone', 'assigned_to', 'assigned_by', 'checked_by', 'booking') 
    readonly_fields = ('assigned_at', 'started_at', 'completed_at', 'checked_at') 

admin.site.register(CleaningTask, CleaningTaskAdmin)