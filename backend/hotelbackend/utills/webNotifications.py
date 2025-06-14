# notifications/services.py (или notifications/utils.py)

import json
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone
from datetime import datetime 
import uuid # 

from notifications.models import Notification
from users.models import User 

from django.db.models import Q 

logger = logging.getLogger(__name__)


def send_personal_notification(
    user_id, 
    title, 
    body, 
    notification_type, 
    data =None, 
    save_to_db = True 
):
    """
    Отправляет WebSocket уведомление конкретному пользователю
    и, опционально, сохраняет уведомление в базе данных.
    """
    notification_db_id = None
    notification_created_at = timezone.now()

    if save_to_db:
        try:
            user = User.objects.get(id=user_id)
            notification_obj = Notification.objects.create(
                user=user,
                title=title,
                body=body,
                notification_type=notification_type,
                data=data
            )
            notification_db_id = str(notification_obj.id) 
            notification_created_at = notification_obj.created_at 
            logger.info(f"In-app notification created for user {user.username} (ID: {user_id}), type: {notification_type}, DB ID: {notification_db_id}")
        except User.DoesNotExist:
            logger.error(f"User with ID {user_id} not found for personal notification creation. Notification not saved to DB.", exc_info=True)
            return 
        except Exception as e:
            logger.error(f"Error creating in-app notification for user {user_id}: {e}", exc_info=True)
            return 
    else:
        
        notification_db_id = f"temp_{uuid.uuid4()}"
        logger.info(f"Temporary notification ID generated for user {user_id}: {notification_db_id}. Not saving to DB.")


    channel_layer = get_channel_layer()

    if channel_layer and notification_db_id:
        message_payload = {
            "id": notification_db_id, 
            "title": title,
            "body": body,
            "notification_type": notification_type,
            "data": data,
            "is_read": False, 
            "created_at": notification_created_at.isoformat(),
            "save_to_db": save_to_db
        }
        try:
            async_to_sync(channel_layer.group_send)(
                f'user_{user_id}',
                {
                    "type": "send_notification",
                    "message": message_payload,
                }
            )
            logger.info(f"WebSocket personal notification sent to user_{user_id} for type {notification_type}.")
        except Exception as e:
            logger.error(f"Error sending WebSocket personal notification to user_{user_id}: {e}", exc_info=True)
    else:
        logger.warning(f"Channel layer not configured or no notification ID for user {user_id}. Cannot send WebSocket personal notification.")


def send_broadcast_notification_to_roles(
    title: str,
    body: str,
    notification_type: str,
    data: dict = None,
    roles_to_notify: list[User.Role] = None 

):
    """
    Отправляет WebSocket уведомление всем онлайн-пользователям с указанными ролями.
    Это уведомление не сохраняется в БД для каждого пользователя индивидуально
    """
    if roles_to_notify is None:
        roles_to_notify = [] 

    channel_layer = get_channel_layer()

    if not channel_layer:
        logger.warning("Channel layer not configured, cannot send WebSocket broadcast notification.")
        return

    
    message_payload = {
        "id": f"broadcast_{uuid.uuid4()}", 
        "title": title,
        "body": body,
        "notification_type": notification_type,
        "data": data,
        "is_read": False, 
        "created_at": timezone.now().isoformat(),
        "save_to_db": False
    }

    
    try:
        
        for role in roles_to_notify:
            group_name = f"online_{role.lower()}" 
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "send_notification",
                    "message": message_payload,
                }
            )
            logger.info(f"WebSocket broadcast notification sent to group '{group_name}' for type {notification_type}.")
        

    except Exception as e:
        logger.error(f"Error sending WebSocket broadcast notification: {e}", exc_info=True)