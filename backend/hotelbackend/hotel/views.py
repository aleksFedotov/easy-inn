from rest_framework.permissions import IsAuthenticated
from utills.permissions import IsManager
from rest_framework import viewsets
from hotel.models import Room,RoomType, CleaningChecklistTemplate
from hotel.serializers import RoomSerializer, RoomTypeSerializer, CleaningChecklistTemplateSerializer



class RoomTypeViewSet(viewsets.ModelViewSet):
    queryset = RoomType.objects.all()
    serializer_class = RoomTypeSerializer
    permission_classes = [IsAuthenticated, IsManager]
 
class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated, IsManager]

class CleaningChecklistTemplateViewSet(viewsets.ModelViewSet):
    queryset = CleaningChecklistTemplate.objects.all()
    serializer_class = CleaningChecklistTemplateSerializer
    permission_classes = [IsAuthenticated, IsManager]
