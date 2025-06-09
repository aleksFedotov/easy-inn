from django.urls import path
from .views import RegisterPushTokenView, SendPushNotificationView 
urlpatterns = [
    path('register-token/', RegisterPushTokenView.as_view(), name='register-push-token'),
    path('send-notification/', SendPushNotificationView.as_view(), name='send-push-notification'),
    
]