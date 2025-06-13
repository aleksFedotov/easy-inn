
import json
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone

from notifications.models import Notification
from users.models import User # Убедитесь, что User импортирован корректно

logger = logging.getLogger(__name__)


def send_websocket_notification(user_id, title, body, notification_type, data):
    """
    Отправляет WebSocket уведомление конкретному пользователю.
    """

    try:
        user = User.objects.get(id=user_id)
        notification = Notification.objects.create(
            user=user,
            title=title,
            body=body,
            notification_type=notification_type,
            data=data
        )
        logger.info(f"In-app notification created for user {user.username} (ID: {user_id}), type: {notification_type}")
    except User.DoesNotExist:
        logger.error(f"User with ID {user_id} not found for in-app notification creation.")
    except Exception as e:
        logger.error(f"Error creating in-app notification for user {user_id}: {e}", exc_info=True)


    channel_layer = get_channel_layer()
    if channel_layer:
        message_payload = {
            "id" : notification.id,
            "title": notification.title,
            "body": notification.body,
            "notification_type": notification.notification_type,
            "data": notification.data,
            "timestamp":notification.created_at.isoformat()
        }
        try:
            async_to_sync(channel_layer.group_send)(
                f'user_{user_id}',
                {
                    "type": "send_notification",
                    "message": message_payload,
                }
            )
            logger.info(f"WebSocket notification sent to user_{user_id} for type {notification_type}.")
        except Exception as e:
            logger.error(f"Error sending WebSocket notification to user_{user_id}: {e}", exc_info=True)
    else:
        logger.warning("Channel layer not configured, cannot send WebSocket notification.")