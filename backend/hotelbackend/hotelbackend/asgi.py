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

from rest_framework_simplejwt.backends import TokenBackend 
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError 
from rest_framework_simplejwt.settings import api_settings as simple_jwt_settings


@database_sync_to_async
def get_user_from_token(scope):
    query_string = parse_qs(scope["query_string"].decode())
    token = query_string.get("token", [None])[0]

    if token:
        try:
            token_backend_instance = TokenBackend(algorithm=simple_jwt_settings.ALGORITHM, signing_key=simple_jwt_settings.SIGNING_KEY, verifying_key=simple_jwt_settings.VERIFYING_KEY, audience=simple_jwt_settings.AUDIENCE, issuer=simple_jwt_settings.ISSUER, leeway=simple_jwt_settings.LEEWAY)
            
            decoded_token = token_backend_instance.decode(token)

            user_id = decoded_token[simple_jwt_settings.USER_ID_CLAIM]

            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id)

       
            return user

        except (InvalidToken, TokenError) as e:
            
            print(f"[ASGI DEBUG] JWT Token is invalid or expired: {e}")
        except User.DoesNotExist:
            print(f"[ASGI DEBUG] User with ID {user_id} not found after token validation.")
        except Exception as e:
            print(f"[ASGI DEBUG] Token authentication FAILED with unexpected error: {e}")
            import traceback
            traceback.print_exc() 
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