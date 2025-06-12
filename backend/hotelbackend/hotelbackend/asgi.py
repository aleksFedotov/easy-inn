import os
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

import api.routing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hotelbackend.settings')
django_asgi_app = get_asgi_application()

from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from rest_framework_simplejwt.authentication import JWTAuthentication

from rest_framework_simplejwt.tokens import AccessToken 

from rest_framework_simplejwt.backends import TokenBackend # <--- ДОБАВЬТЕ ЭТОТ ИМПОРТ
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError # <--- ДОБАВЬТЕ ЭТОТ ИМПОРТ для более точного отлова ошибок
from rest_framework_simplejwt.settings import api_settings as simple_jwt_settings # <--- Переименуйте для ясности, если используете settings


# Кастомный мидлварь для аутентификации по токену из URL-параметров
@database_sync_to_async
def get_user_from_token(scope):
    query_string = parse_qs(scope["query_string"].decode())
    token = query_string.get("token", [None])[0]

    print(f"\n[ASGI DEBUG] Received query_string: {scope['query_string'].decode()}")
    print(f"[ASGI DEBUG] Extracted token: {token}")

    if token:
        try:
            # --- ИЗМЕНЕНИЕ ЗДЕСЬ: ПРЯМОЕ ИСПОЛЬЗОВАНИЕ TokenBackend ---
            # Создаем экземпляр TokenBackend
            # Он автоматически использует настройки из SIMPLE_JWT в settings.py
            token_backend_instance = TokenBackend(algorithm=simple_jwt_settings.ALGORITHM, signing_key=simple_jwt_settings.SIGNING_KEY, verifying_key=simple_jwt_settings.VERIFYING_KEY, audience=simple_jwt_settings.AUDIENCE, issuer=simple_jwt_settings.ISSUER, leeway=simple_jwt_settings.LEEWAY)
            
            # Декодируем и валидируем токен
            decoded_token = token_backend_instance.decode(token)

            # Получаем ID пользователя из токена
            user_id = decoded_token[simple_jwt_settings.USER_ID_CLAIM]

            # Получаем пользователя по ID
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id)

            print(f"[ASGI DEBUG] Token authenticated successfully for user: {user.username}")
            return user

        except (InvalidToken, TokenError) as e:
            # Отлавливаем специфичные ошибки Simple JWT
            print(f"[ASGI DEBUG] JWT Token is invalid or expired: {e}")
        except User.DoesNotExist:
            print(f"[ASGI DEBUG] User with ID {user_id} not found after token validation.")
        except Exception as e:
            print(f"[ASGI DEBUG] Token authentication FAILED with unexpected error: {e}")
            import traceback
            traceback.print_exc() # Для более детального вывода ошибки
    else:
        print("[ASGI DEBUG] No token found in query string.")
    return AnonymousUser()


class TokenAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] == 'websocket':
            scope['user'] = await get_user_from_token(scope)
        return await self.app(scope, receive, send)

# Примените этот мидлварь
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": TokenAuthMiddleware( # Используйте ваш кастомный TokenAuthMiddleware
        URLRouter(
            api.routing.websocket_urlpatterns
        )
    ),
})