import json
import logging # Добавьте импорт логирования
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__) # Инициализация логгера

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_authenticated:
            self.user_group_name = f'user_{self.user.id}'
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )
            await self.accept()
            logger.info(f"WebSocket connected for user {self.user.username} to group {self.user_group_name}")
        else:
            await self.close()
            logger.warning("WebSocket connection attempt from unauthenticated user closed.")

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
            logger.info(f"WebSocket disconnected for user {self.user.username} from group {self.user_group_name}")

    async def send_notification(self, event):
        message = event['message']
        await self.send(text_data=json.dumps(message))