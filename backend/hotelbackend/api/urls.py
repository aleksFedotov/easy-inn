from rest_framework.routers import DefaultRouter

# Import all ViewSets from your apps
from django.urls import path, include
from booking.views import BookingViewSet
from cleaning.views import (
    CleaningTypeViewSet,
    ChecklistTemplateViewSet,
    CleaningTaskViewSet,
    get_cleaning_stats
)
from users.views import UserViewSet, get_assigned_housekeepers_for_date
from hotel.views import RoomViewSet, RoomTypeViewSet, ZoneViewSet,RoomStatusViewSet



# Create an instance of DefaultRouter
router = DefaultRouter()

# Register each ViewSet with the router

# Booking App ViewSets
router.register(r'bookings', BookingViewSet, basename='booking')

# Cleaning App ViewSets
router.register(r'cleaningtypes', CleaningTypeViewSet, basename='cleaningtype')
router.register(r'checklisttemplates', ChecklistTemplateViewSet, basename='checklisttemplate')
router.register(r'cleaningtasks', CleaningTaskViewSet, basename='cleaningtask')


# Hotel App ViewSets

router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'room-types', RoomTypeViewSet, basename='roomtype')
router.register(r'zones', ZoneViewSet, basename='zone')
router.register(r'rooms-status', RoomStatusViewSet, basename='room-status')

# Users App ViewSets
router.register(r'users', UserViewSet, basename='user')




# router.register(r'incidents', IncidentReportViewSet, basename='incidentreport')


# router.register(r'shiftnotes', ShiftNoteViewSet, basename='shiftnote')


urlpatterns = [
    path('cleaning/stats/', get_cleaning_stats, name='cleaning-stats'),  
    path('housekeepers/assigned/', get_assigned_housekeepers_for_date, name='assigned-housekeepers'),  
] + router.urls
