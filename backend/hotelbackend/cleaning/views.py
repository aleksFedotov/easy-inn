from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets

from cleaning.models import (
    CleaningCheck, 
    ChecklistItemTemplate, 
    CleaningTask,
    CleaningCheckItem
    )
from cleaning.serializers import (
    CleaningCheckSerializer,
    ChecklistItemTemplateSerializer,
    CleaningTaskSerializer,
    CleaningCheckItemSerializer
    )

# Create your views here.
class CleaningTaskViewSet(viewsets.ModelViewSet):
    queryset = CleaningTask.objects.all()
    serializer_class = CleaningTaskSerializer
    permission_classes = [IsAuthenticated]

class CleaningCheckViewSet(viewsets.ModelViewSet):
    queryset = CleaningCheck.objects.all()
    serializer_class = CleaningCheckSerializer
    permission_classes = [IsAuthenticated]

class ChecklistItemTemplateViewSet(viewsets.ModelViewSet):
    queryset = ChecklistItemTemplate.objects.all()
    serializer_class = ChecklistItemTemplateSerializer
    permission_classes = [IsAuthenticated]

class CleaningCheckItemViewSet(viewsets.ModelViewSet):
    queryset = CleaningCheckItem.objects.all()
    serializer_class = CleaningCheckItemSerializer
    permission_classes = [IsAuthenticated]
