from django.contrib import admin
from hotel.models import Room, RoomType,CleaningChecklistTemplate
from cleaning.models import ChecklistItemTemplate

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('number', 'floor', 'room_type', 'status', 'is_active', 'cleaning_required')
    list_filter = ('floor', 'room_type', 'status', 'is_active')
    search_fields = ('number',)

@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'capacity')
    search_fields = ('name',)

class ChecklistItemTemplateInline(admin.TabularInline):
    model = ChecklistItemTemplate
    extra = 1


@admin.register(CleaningChecklistTemplate)
class CleaningChecklistTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'is_active')
    search_fields = ('name',)
    inlines = [ChecklistItemTemplateInline]
