# Generated by Django 5.2 on 2025-05-30 10:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cleaning', '0005_alter_checklisttemplate_cleaning_type_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='checklisttemplate',
            name='offset_days',
            field=models.PositiveIntegerField(default=0, help_text='Через сколько дней после начала отсчета начать уборку.', verbose_name='Смещение (дни)'),
        ),
        migrations.AddField(
            model_name='checklisttemplate',
            name='periodicity',
            field=models.IntegerField(choices=[(1, 'Каждый день'), (2, 'Раз в 2 дня'), (3, 'Раз в 3 дня'), (4, 'Раз в 4 дня'), (7, 'Раз в неделю'), (30, 'Раз в месяц')], default=1, help_text='Как часто должна проводиться уборка (в днях).', verbose_name='Периодичность уборки'),
        ),
    ]
