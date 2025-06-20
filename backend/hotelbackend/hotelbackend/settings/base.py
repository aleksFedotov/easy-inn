
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/


# CORS_ALLOW_ALL_ORIGINS = True # Эту строку лучше удалить из base.py и определить в dev.py/prod.py

# Application definition

ASGI_APPLICATION = 'hotelbackend.application'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'hotel.apps.HotelConfig',
    'booking.apps.BookingConfig',
    'cleaning.apps.CleaningConfig',
    'shifts.apps.ShiftsConfig',
    'incidents.apps.IncidentsConfig',
    'users.apps.UsersConfig',
    'notifications.apps.NotificationsConfig',
    'rest_framework',
    'drf_yasg',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',


]

ROOT_URLCONF = 'hotelbackend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'hotelbackend.wsgi.application'



# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Moscow'

DATETIME_FORMAT = '%d/%m/%Y %H:%M'
DATETIME_INPUT_FORMATS = ['%d/%m/%Y %H:%M']

USE_I18N = True

USE_TZ = True




# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


AUTH_USER_MODEL = 'users.User'


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,

}

SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'description': 'JWT Authorization header using the Bearer scheme. Example: "Bearer <your_token>"',
        }
    },
     'USE_SESSION_AUTH': False,
}

SWAGGER_USE_COMPAT_RENDERERS = False




LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple', # ИСПРАВЛЕНО: DEBUG здесь не определен, используется простой форматтер
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'django_debug.log',
            'formatter': 'verbose',
        },
        'mail_admins': {
            'class': 'django.utils.log.AdminEmailHandler',
            'level': 'ERROR',
            'formatter': 'verbose',

        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['console',],
            'level': 'ERROR',
            'propagate': False,
        },
        'hotelbackend': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },

        'booking': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'cleaning': {
            'handlers': ['console',],
            'level': 'DEBUG',
            'propagate': False,
        },
        'hotel': {
            'handlers': ['console',],
            'level': 'DEBUG',
            'propagate': False,
        },
        'users': {
            'handlers': ['console',],
            'level': 'DEBUG',
            'propagate': False,
        },
        'notifications': {
            'handlers': ['console',],
            'level': 'DEBUG',
            'propagate': False,
        },

    },

}

# ADMINS = [
#     ('Your Name', 'your_email@example.com'),

# ]

