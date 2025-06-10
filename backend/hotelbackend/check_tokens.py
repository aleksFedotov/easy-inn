import os
import django

# Убедитесь, что ваш проект Django настроен
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hotelbackend.settings') # Замените 'hotelbackend' на имя вашего основного проекта Django
django.setup()

from booking.models import Booking
from cleaning.models import CleaningTask
from users.models import User, PushToken
from datetime import date

print("Начинаем проверку токенов...")

# 1. Найти бронирование и комнату
booking_id = 94
try:
    booking = Booking.objects.get(id=booking_id)
    room = booking.room
    print(f"Бронирование {booking_id} связано с комнатой: {room.number} (ID: {room.id})")
except Booking.DoesNotExist:
    print(f"Бронирование с ID {booking_id} не найдено.")
    room = None

if room:
    # 2. Найти задачи по уборке для этой комнаты на сегодня
    today = date.today()
    tasks = CleaningTask.objects.filter(
        room=room,
        scheduled_date=today,
        assigned_to__isnull=False
    ).select_related('assigned_to')

    print(f"\nЗадачи по уборке для комнаты {room.number} на {today}:")
    if not tasks.exists():
        print("  Нет активных назначенных задач.")
    else:
        for task in tasks:
            assigned_user = task.assigned_to
            print(f"  ID Задачи: {task.id}, Назначена: {assigned_user.username} (Роль: {assigned_user.get_role_display()}), Статус: {task.get_status_display()}")

            # 3. Проверить токены у назначенного пользователя
            user_tokens = PushToken.objects.filter(user=assigned_user)
            if user_tokens.exists():
                print(f"    Найдены токены для {assigned_user.username}:")
                for token_obj in user_tokens:
                    print(f"      - {token_obj.token}")
            else:
                print(f"    Для пользователя {assigned_user.username} не найдено push-токенов.")
else:
    print("Невозможно продолжить: комната не найдена.")

print("\nПроверка завершена.")