from rest_framework.routers import DefaultRouter

from booking.views import BookingViewSet
from cleaning.views import (
    CleaningTaskViewSet,
    CleaningCheckViewSet,
    CleaningCheckItemViewSet,
    ChecklistItemTemplateViewSet
)
from hotel.views import RoomViewSet, RoomTypeViewSet,CleaningChecklistTemplateViewSet
from incidents.views import IncidentReportViewSet
from shifts.views import ShiftNoteViewSet
from users.views import UserViewSet


router = DefaultRouter()

# Booking
router.register('booking', BookingViewSet)

# Cleaning
router.register('cleaning-task', CleaningTaskViewSet)
router.register('cleaning-check', CleaningCheckViewSet)
router.register(r'checklist-items', ChecklistItemTemplateViewSet)
router.register(r'check-items', CleaningCheckItemViewSet)

# Hotel 
router.register('room', RoomViewSet)
router.register('room-type', RoomTypeViewSet)
router.register(r'cleaning-templates', CleaningChecklistTemplateViewSet,basename='cleaningtemplates')

# Incidents
router.register('incidents', IncidentReportViewSet)

# Shifts
router.register('shifts', ShiftNoteViewSet)

# Users
router.register('users', UserViewSet)


urlpatterns = router.urls