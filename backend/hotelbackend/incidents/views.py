from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets

from incidents.models import IncidentReport
from incidents.serializers import IncidentReportSerializer


class IncidentReportViewSet(viewsets.ModelViewSet):
    queryset = IncidentReport.objects.all()
    serializer_class = IncidentReportSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)