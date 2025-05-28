import logging
logger = logging.getLogger(__name__)
from django.db.models.functions import Extract
from django.db.models import  ExpressionWrapper, Avg
from django.db import models

def calculate_average_duration(queryset, task_type):
    """
    Универсальная функция для расчета средней продолжительности задач
    """
    if not queryset.exists():
        logger.info(f"No completed {task_type} tasks found")
        return 0
    
    try:
        # Метод 1: Пробуем с Extract (для PostgreSQL/MySQL)
        from django.db import connection
        db_vendor = connection.vendor
        logger.info(f"Database vendor: {db_vendor}")
        
        if db_vendor == 'postgresql':
            average_result = queryset.annotate(
                duration_seconds=ExpressionWrapper(
                    Extract('completed_at', 'epoch') - Extract('started_at', 'epoch'),
                    output_field=models.FloatField()
                )
            ).aggregate(avg_duration=Avg('duration_seconds'))
            
            if average_result['avg_duration'] is not None:
                avg_minutes = average_result['avg_duration'] / 60.0
                logger.info(f"Average {task_type} cleaning time (PostgreSQL): {avg_minutes:.2f} minutes")
                return round(avg_minutes, 2)
                
        elif db_vendor == 'sqlite':
            # Для SQLite используем Python метод
            raise Exception("Using Python method for SQLite")
            
        elif db_vendor == 'mysql':
            # Для MySQL можно попробовать UNIX_TIMESTAMP
            average_result = queryset.extra(
                select={'duration_seconds': 'UNIX_TIMESTAMP(completed_at) - UNIX_TIMESTAMP(started_at)'}
            ).aggregate(avg_duration=Avg('duration_seconds'))
            
            if average_result['avg_duration'] is not None:
                avg_minutes = average_result['avg_duration'] / 60.0
                logger.info(f"Average {task_type} cleaning time (MySQL): {avg_minutes:.2f} minutes")
                return round(avg_minutes, 2)
        
    except Exception as e:
        logger.warning(f"SQL method failed for {task_type}: {e}. Using Python calculation.")
    
    # Метод 2: Python расчет (fallback)
    try:
        total_seconds = 0
        count = 0
        
        for task in queryset:
            if task.started_at and task.completed_at:
                duration = (task.completed_at - task.started_at).total_seconds()
                if duration > 0:
                    total_seconds += duration
                    count += 1
                    logger.debug(f"{task_type} task duration: {duration:.2f} seconds")
        
        if count > 0:
            avg_minutes = total_seconds / count / 60.0
            logger.info(f"Average {task_type} cleaning time (Python): {avg_minutes:.2f} minutes")
            return round(avg_minutes, 2)
        else:
            logger.info(f"No valid durations found for {task_type} tasks")
            return 0
            
    except Exception as e:
        logger.error(f"Python calculation failed for {task_type}: {e}")
        return 0