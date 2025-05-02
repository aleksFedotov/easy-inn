from rest_framework.permissions import  IsAuthenticated
from utills.permissions import IsManagerOrAdmin
from rest_framework import viewsets

from booking.models import Booking
from booking.serializers import BookingSerializer

# Create your views here.
class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAdmin ]

    def perform_create(self, serializer):
        serializer.save(created_by = self.request.user)
