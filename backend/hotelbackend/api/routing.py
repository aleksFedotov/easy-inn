# backend/hotelbackend/api/routing.py

from django.urls import re_path
from notifications.consumers import NotificationConsumer # Импортируем ваш Consumer

websocket_urlpatterns = [
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
]