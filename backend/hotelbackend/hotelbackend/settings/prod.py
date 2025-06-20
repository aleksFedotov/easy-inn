# hotelbackend/settings/prod.py

from .base import *
import os
from dotenv import load_dotenv
import dj_database_url
from django.core.exceptions import ImproperlyConfigured

# Загрузка переменных окружения из файла .env для продакшена
load_dotenv()

DEBUG = False

# Получаем SECRET_KEY из переменных окружения
SECRET_KEY = os.getenv('SECRET_KEY')
if SECRET_KEY is None:
    raise ImproperlyConfigured("SECRET_KEY must be set in environment variables for production.")

# Получаем ALLOWED_HOSTS из переменных окружения
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')
if not ALLOWED_HOSTS or ALLOWED_HOSTS == ['']:
    raise ImproperlyConfigured("ALLOWED_HOSTS must be set in environment variables for production.")

CORS_ALLOW_ALL_ORIGINS = False # В продакшене лучше явно указать CORS_ALLOWED_ORIGINS
CORS_ALLOWED_ORIGINS = [
    "https://easyinn.ru",
    # "https://your-mobile-domain.com",
    "http://localhost:3000", 
]

# Настройка базы данных для продакшена (PostgreSQL)
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=600
    )
}
if not DATABASES['default']['NAME']:
    raise ImproperlyConfigured("DATABASE_URL must be set in environment variables for production.")


# Статические файлы (обслуживаются Nginx)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Медиа файлы (обслуживаются Nginx)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Логирование для продакшена
# Переопределяем handlers для продакшена
LOGGING['handlers']['file']['filename'] = BASE_DIR / 'logs' / 'django.log'
LOGGING['loggers']['django']['handlers'] = ['file', 'console']
LOGGING['loggers']['django.request']['handlers'] = ['file', 'console']
LOGGING['loggers']['hotelbackend']['handlers'] = ['file', 'console']
# Добавьте другие нужные настройки логирования для продакшена, если они отличаются.

# Настройки электронной почты для продакшена (Закомментированы, как мы обсуждали)
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = os.getenv('EMAIL_HOST')
# EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
# EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() == 'true'
# EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
# EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
# DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL')
# SERVER_EMAIL = os.getenv('SERVER_EMAIL', DEFAULT_FROM_EMAIL)

# Redis для Channels
# Убедитесь, что Redis-сервер доступен с вашего VPS
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [os.getenv('REDIS_URL', 'redis://127.0.0.1:6379')],
        },
    },
}

# Firebase Service Account Key (на сервере будет абсолютный путь)
FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH')
if FIREBASE_CREDENTIALS_PATH is None:
    raise ImproperlyConfigured("FIREBASE_CREDENTIALS_PATH must be set in environment variables for production.")

# SECURITY WARNING: Настройте SECURE_HSTS_SECONDS, SECURE_PROXY_SSL_HEADER и т.д.
# После того как HTTPS будет настроен.
# SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True
# SECURE_HSTS_SECONDS = 31536000 # 1 год
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True

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