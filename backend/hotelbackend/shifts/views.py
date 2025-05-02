from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets

from shifts.models import ShiftNote
from shifts.serializers import ShiftNoteSerializer

class ShiftNoteViewSet(viewsets.ModelViewSet):
    class Meta:
        ordering = ['-created_at']
    queryset = ShiftNote.objects.all()
    serializer_class = ShiftNoteSerializer
    permission_classes = [ IsAuthenticated ]
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

# Create your views here.
