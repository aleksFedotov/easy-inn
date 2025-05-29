from django.db import models

class CleaningTypeChoices(models.TextChoices):
    STAYOVER = "stayover", "Ежедневная уборка"
    DEPARTURE_CLEANING = "departure_cleaning", "Уборка при выезде"
    DEEP_CLEANING = "deep_cleaning", "Генеральная уборка"
    ON_DEMAND = "on_demand", "Уборка по запросу"
    POST_RENOVATION_CLEANING = "post_renovation_cleaning", "Уборка после ремонта"
    PUBLIC_AREA_CLEANING = "public_area_cleaning", "Текущая уборка общих зон"