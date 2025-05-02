from django.contrib import admin
from booking.models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        'room',
        'check_in',
        'check_out',
        'guest_count',
        'short_notes',
        'created_at',
        'created_by',
        
    ]
    list_filter = (
    ('check_in', admin.DateFieldListFilter),
    ('check_out', admin.DateFieldListFilter),
    )
    search_fields = ('room__number',)
    def short_notes(self, obj):
        return obj.notes[:30] + '...' if obj.notes else '-'
    short_notes.short_description = 'Заметки'



