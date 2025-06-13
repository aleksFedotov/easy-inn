from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
import logging

from utills.mixins import AllowAllPaginationMixin

from .models import Notification
from .serializers import NotificationSerializer

logger = logging.getLogger(__name__)

class NotificationViewSet(AllowAllPaginationMixin,viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для просмотра уведомлений пользователя и отметки их как прочитанных.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        
        return Notification.objects.filter(user=self.request.user)

    
    @action(detail=False, methods=['post'], url_path='mark-read')
    def mark_as_read(self, request):
        notification_ids = request.data.get('notification_ids', [])
        mark_all = request.data.get('mark_all', False)
        single_notification_id = request.data.get('single_notification_id')
        logger.debug(f' single_notification_id {single_notification_id}')

        queryset = self.get_queryset() 

        if mark_all:
            
            updated_count = queryset.filter(is_read=False).update(is_read=True)
            logger.info(f"User {request.user.username} marked all {updated_count} notifications as read.")
            return Response({"detail": f"All {updated_count} notifications marked as read."}, status=status.HTTP_200_OK)
        
        elif notification_ids:
            
            updated_count = queryset.filter(id__in=notification_ids, is_read=False).update(is_read=True)
            logger.info(f"User {request.user.username} marked {updated_count} specific notifications as read.")
            return Response({"detail": f"{updated_count} notifications marked as read."}, status=status.HTTP_200_OK)
        elif single_notification_id:
            try:
                self.get_queryset().filter(id=single_notification_id).update(is_read=True)
                return Response({'status': 'Notification marked as read'})
            except Exception as e:
                return Response({'error': str(e)}, status=400)
        
        return Response({"detail": "No notifications specified or 'mark_all' not set."}, status=status.HTTP_400_BAD_REQUEST)

    
    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"unread_count": count}, status=status.HTTP_200_OK)
    

    @action(detail=False, methods=['get'],url_path='unread')
    def unread(self, request):
       
        queryset = self.get_queryset().filter(is_read=False)
      
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
