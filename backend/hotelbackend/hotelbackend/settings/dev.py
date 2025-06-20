# hotelbackend/settings/dev.py

from .base import *
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(BASE_DIR, '.env'))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-gi@udp)k)f^*z^9e%1v4ibn+m3b2z^7g=f)iw&e27npjilx@b9' # Ваш текущий ключ для разработки

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = [
    '10.0.2.2',
    '127.0.0.1',
    'localhost',
    '192.168.1.133',
    '192.168.1.154',
    '192.168.1.216',
    # Добавьте другие IP или домены, которые вы используете для локальной разработки
]

CORS_ALLOW_ALL_ORIGINS = True 

# Database для разработки (SQLite)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
        'OPTIONS': {
            'timeout': 20,
            'init_command': 'PRAGMA busy_timeout=30000;',
        }
    }
}

# Static files для разработки (Django будет их обслуживать)
STATIC_URL = 'static/'

# Media files (Django будет их обслуживать в dev)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media' # Создастся в корне проекта /backend/hotelbackend/media

# Email (для разработки) - вывод в консоль
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Если используете Redis для Channels, убедитесь, что он запущен локально
CHANNEL_LAYERS['default']['CONFIG']["hosts"] = [('127.0.0.1', 6379)]

# Настройки SIMPLE_JWT (перемещены из base.py)
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=12),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': False,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY, # Используется SECRET_KEY, определенный выше
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',

    'JTI_CLAIM': 'jti',

    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),

    'TOKEN_OBTAIN_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenObtainPairSerializer',
    'TOKEN_REFRESH_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenRefreshSerializer',
    'TOKEN_VERIFY_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenVerifySerializer',
    'TOKEN_BLACKLIST_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenBlacklistSerializer',
    'TOKEN_SLIDING_OBTAIN_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenObtainSlidingSerializer',
    'TOKEN_SLIDING_REFRESH_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenRefreshSlidingSerializer',
}