from firebase_admin import messaging
from firebase import firebase_admin  

def send_push_notification(token: str, title: str, body: str, data: dict = None):
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        token=token,
        data=data or {}
    )
    response = messaging.send(message)
    return response