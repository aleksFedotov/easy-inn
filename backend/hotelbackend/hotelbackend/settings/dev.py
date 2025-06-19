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

CORS_ALLOW_ALL_ORIGINS = True # Часто используется в dev для простоты

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


