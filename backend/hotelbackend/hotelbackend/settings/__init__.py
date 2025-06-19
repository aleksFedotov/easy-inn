# hotelbackend/settings/__init__.py

# По умолчанию загружаем настройки для разработки
from .dev import *

# Чтобы переключиться на продакшен-настройки, нужно установить переменную окружения
# DJANGO_SETTINGS_MODULE_ENV в 'hotelbackend.settings.prod'
# Это будет сделано через Systemd на сервере, как мы обсуждали.