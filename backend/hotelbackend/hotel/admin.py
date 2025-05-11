from django.contrib import admin

from .models import RoomType, Room, Zone

class RoomTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'capacity')
    search_fields = ('name',)

admin.site.register(RoomType, RoomTypeAdmin)

class RoomAdmin(admin.ModelAdmin):
    list_display = ('number', 'floor', 'room_type', 'status', 'is_active')
    search_fields = ('number', 'notes')
    list_filter = ('floor', 'room_type', 'status', 'is_active')
    readonly_fields = ('status',)

admin.site.register(Room, RoomAdmin)

class ZoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'floor', 'description')
    search_fields = ('name', 'description')
    list_filter = ('floor',)

admin.site.register(Zone, ZoneAdmin)
