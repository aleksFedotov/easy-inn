from django.contrib import admin

from .models import Booking

class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'room',
        'check_in',
        'check_out',
        'guest_count',
        'status',
        'created_by',
        'created_at',
    )

    search_fields = (
        'room__number',
        'notes',
        'created_by__username',
    )

    list_filter = (
        'check_in',
        'check_out',
        'created_at',
        'created_by',
        'room__room_type',
    )

    readonly_fields = (
        'created_at',
        'updated_at',
    )

    raw_id_fields = (
        'room',
        'created_by',
    )

    fieldsets = (
        (None, {
            'fields': ('room', 'check_in', 'check_out', 'guest_count','status', 'notes')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )

admin.site.register(Booking, BookingAdmin)
