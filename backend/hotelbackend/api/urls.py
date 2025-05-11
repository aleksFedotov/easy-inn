from rest_framework.routers import DefaultRouter

# Import all ViewSets from your apps
from booking.views import BookingViewSet
from cleaning.views import (
    CleaningTypeViewSet,
    ChecklistTemplateViewSet,
    ChecklistItemTemplateViewSet,
    CleaningTaskViewSet
)
from hotel.views import RoomViewSet, RoomTypeViewSet, ZoneViewSet

# from incidents.views import IncidentReportViewSet # Uncomment if incidents app is ready
# from shifts.views import ShiftNoteViewSet # Uncomment if shifts app is ready
from users.views import UserViewSet


# Create an instance of DefaultRouter
router = DefaultRouter()

# Register each ViewSet with the router

# Booking App ViewSets
router.register(r'bookings', BookingViewSet, basename='booking')

# Cleaning App ViewSets
router.register(r'cleaningtypes', CleaningTypeViewSet, basename='cleaningtype')
router.register(r'checklisttemplates', ChecklistTemplateViewSet, basename='checklisttemplate')
router.register(r'checklistitemtemplates', ChecklistItemTemplateViewSet, basename='checklistitemtemplate')
router.register(r'cleaningtasks', CleaningTaskViewSet, basename='cleaningtask')


# Hotel App ViewSets

router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'room-types', RoomTypeViewSet, basename='roomtype')
router.register(r'zones', ZoneViewSet, basename='zone')

# Users App ViewSets
router.register(r'users', UserViewSet, basename='user')



# router.register(r'incidents', IncidentReportViewSet, basename='incidentreport')


# router.register(r'shiftnotes', ShiftNoteViewSet, basename='shiftnote')


urlpatterns = router.urls
