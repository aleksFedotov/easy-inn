from rest_framework.permissions import  IsAuthenticated
from utills.permissions import IsManagerOrAdmin
from rest_framework.decorators import action
from rest_framework import viewsets,status
from rest_framework.response import Response


from booking.models import Booking
from booking.serializers import BookingSerializer

# Create your views here.
class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAdmin ]

    def perform_create(self, serializer):
        serializer.save(created_by = self.request.user)

    @action(detail=True,methods=["post"], url_path="check_out")
    def mark_checkout(self, request,pk = None):
        booking = self.get_object()
        if booking.room.status != 'occupied':
            return Response({"detail": "Гость уже выехал."}, status=status.HTTP_400_BAD_REQUEST)
        booking.checkout()  # вызывает твой метод модели
        return Response({"detail": "Бронирование отмечено как выезд, задача на уборку создана."})