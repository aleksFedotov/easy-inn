
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from utills.permissions import IsManagerOrAdmin, IsManager
from cleaning.models import CleaningTask
from cleaning.serializers import CleaningTaskSerializer
from rest_framework.exceptions import PermissionDenied


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
    permission_classes = [IsAuthenticated ]

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated, IsManagerOrAdmin])
    def manual(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        
        if user.role == 'maid':
            return queryset.filter(assigned_to=user)
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        if request.user.role == 'maid':
            raise PermissionDenied("Горничной запрещено удалять задачи.")
        return super().destroy(request, *args, **kwargs)

class CleaningCheckViewSet(viewsets.ModelViewSet):
    queryset = CleaningCheck.objects.all()
    serializer_class = CleaningCheckSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated, IsManager])
    def manual(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            cleaning_check = serializer.save()
            cleaning_check.create_check_items_from_template()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    

       
       
class ChecklistItemTemplateViewSet(viewsets.ModelViewSet):
    queryset = ChecklistItemTemplate.objects.all()
    serializer_class = ChecklistItemTemplateSerializer
    permission_classes = [IsAuthenticated]

class CleaningCheckItemViewSet(viewsets.ModelViewSet):
    queryset = CleaningCheckItem.objects.all()
    serializer_class = CleaningCheckItemSerializer
    permission_classes = [IsAuthenticated]
