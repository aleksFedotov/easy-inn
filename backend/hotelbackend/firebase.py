import firebase_admin
from firebase_admin import credentials, messaging

if not firebase_admin._apps:
    try:
        cred = credentials.Certificate("easyinn-2c8c9-firebase-adminsdk-fbsvc-55a42daeea.json")
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized successfully!")
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {e}")
        # Возможно, захотите добавить логирование или обработку этой ошибки