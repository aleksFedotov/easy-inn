# notifications/consumers.py

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from users.models import User 

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"] 

        if self.user.is_authenticated:
            self.user_group_name = f'user_{self.user.id}'
            self.online_group_name = "online_users" 
            # 1. Добавляем пользователя в его персональную группу
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )
            logger.info(f"User {self.user.username} (ID: {self.user.id}) connected. Added to personal group: {self.user_group_name}")

            # 2. Добавляем пользователя в общую группу всех онлайн-пользователей
            await self.channel_layer.group_add(
                self.online_group_name,
                self.channel_name
            )
            logger.info(f"User {self.user.username} (ID: {self.user.id}) added to general online group: {self.online_group_name}")

            # 3. Добавляем пользователя в группы, специфичные для его роли
            if hasattr(self.user, 'role') and self.user.role:
                role_group_name = None
                if self.user.role == User.Role.MANAGER:
                    role_group_name = "online_manager"
                elif self.user.role == User.Role.FRONT_DESK:
                    role_group_name = "online_front-desk"
                elif self.user.role == User.Role.HOUSEKEEPER:
                    role_group_name = "online_housekeeper"

                if role_group_name:
                    await self.channel_layer.group_add(
                        role_group_name,
                        self.channel_name
                    )
                 
                    self.role_group_name = role_group_name 
                    logger.info(f"User {self.user.username} (ID: {self.user.id}, Role: {self.user.role}) added to role group: {role_group_name}")
                else:
                    self.role_group_name = None 
                    logger.info(f"User {self.user.username} (ID: {self.user.id}, Role: {self.user.role}) does not have a specific online role group.")
            else:
                self.role_group_name = None
                logger.warning(f"User {self.user.username} (ID: {self.user.id}) has no 'role' attribute or it is empty. Not adding to role-specific group.")


            await self.accept()
            logger.info(f"WebSocket connection established for user {self.user.username} (ID: {self.user.id}).")
        else:
            await self.close()
            logger.warning("WebSocket connection attempt from unauthenticated user closed.")

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
            logger.info(f"User {self.user.username} (ID: {self.user.id}) disconnected. Removed from personal group: {self.user_group_name}")

          
            await self.channel_layer.group_discard(
                self.online_group_name,
                self.channel_name
            )
            logger.info(f"User {self.user.username} (ID: {self.user.id}) removed from general online group: {self.online_group_name}")

            
            if hasattr(self, 'role_group_name') and self.role_group_name:
                await self.channel_layer.group_discard(
                    self.role_group_name,
                    self.channel_name
                )
                logger.info(f"User {self.user.username} (ID: {self.user.id}) removed from role group: {self.role_group_name}")
        else:
            logger.warning("Attempted to disconnect an unauthenticated user from WebSocket groups.")

    async def send_notification(self, event):
        """
        Обрабатывает событие "send_notification", отправляя сообщение клиенту.
        """
        message = event['message']
        await self.send(text_data=json.dumps(message))

  