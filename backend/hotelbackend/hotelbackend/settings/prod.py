
from .base import *
import os
from dotenv import load_dotenv
import dj_database_url
from django.core.exceptions import ImproperlyConfigured # Добавьте этот импорт

# Загрузка переменных окружения из файла .env для продакшена
load_dotenv()

DEBUG = False

# Получаем SECRET_KEY из переменных окружения
SECRET_KEY = os.getenv('SECRET_KEY')
if SECRET_KEY is None:
    raise ImproperlyConfigured("SECRET_KEY must be set in environment variables for production.")

# Получаем ALLOWED_HOSTS из переменных окружения
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')
if not ALLOWED_HOSTS or ALLOWED_HOSTS == ['']: # Добавлена проверка на пустой список
    raise ImproperlyConfigured("ALLOWED_HOSTS must be set in environment variables for production.")

CORS_ALLOW_ALL_ORIGINS = False # В продакшене лучше явно указать CORS_ALLOWED_ORIGINS
# CORS_ALLOWED_ORIGINS = [
#     "https://your-frontend-domain.com",
#     "https://your-mobile-domain.com", # Если мобильное приложение использует домен
#     "http://localhost:3000", # Для тестирования фронтенда локально
# ]

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
STATIC_URL = 'static/' # Все еще нужен
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Медиа файлы (обслуживаются Nginx)
MEDIA_URL = '/media/' # Все еще нужен
MEDIA_ROOT = BASE_DIR / 'media'

# Логирование для продакшена
# Переопределяем handlers для продакшена
LOGGING['handlers']['file']['filename'] = BASE_DIR / 'logs' / 'django.log' 
LOGGING['loggers']['django']['handlers'] = ['file', 'console']
LOGGING['loggers']['django.request']['handlers'] = ['file', 'console']
LOGGING['loggers']['hotelbackend']['handlers'] = ['file', 'console']
# Добавьте другие нужные настройки логирования для продакшена, если они отличаются.

# Настройки электронной почты для продакшена
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = os.getenv('EMAIL_HOST')
# EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
# EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() == 'true' # Правильная конвертация
# EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
# EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
# DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL')
# SERVER_EMAIL = os.getenv('SERVER_EMAIL', DEFAULT_FROM_EMAIL) # Для ошибок Django

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
# В .env: REDIS_URL=redis://localhost:6379 или redis://your_redis_ip:6379

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