from django.contrib import admin
from cleaning.models import CleaningTask, CleaningCheck,CleaningCheckItem
from users.models import User


@admin.register(CleaningTask)
class CleaningTaskAdmin(admin.ModelAdmin):
    list_display = (
        'room',
        'booking',
        'assigned_to',
        'due_time',
        'status',
        'checklist_template',
        'created_at',
    )
    list_filter = ('status', 'due_time', 'assigned_to')
    search_fields = ('room__number', 'assigned_to__username')
    autocomplete_fields = ['room', 'booking', 'assigned_to', 'checklist_template']

class CleaningCheckItemInline(admin.TabularInline):
    model = CleaningCheckItem
    extra = 0
    fields = ('template_item', 'is_passed', 'comment')
    readonly_fields = ('template_item',)  
    
@admin.register(CleaningCheck)
class CleaningCheckAdmin(admin.ModelAdmin):
    list_display = (
        'cleaning_task',
        'checked_by',
        'status',
        'created_at',
    )
    list_filter = ('status', 'created_at')
    search_fields = ('cleaning_task__room__number', 'checked_by__username')
    autocomplete_fields = ['cleaning_task', 'checked_by', 'checklist']