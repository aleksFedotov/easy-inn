import firebase_admin
import os
from firebase_admin import credentials, messaging

FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH')

if not firebase_admin._apps:
    if FIREBASE_CREDENTIALS_PATH:
        try:
            cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully!")
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK: {e}")
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error initializing Firebase Admin SDK: {e}")
        else:
            print("FIREBASE_CREDENTIALS_PATH environment variable not set. Firebase Admin SDK will not be initialized.")
            import logging
            logger = logging.getLogger(__name__)
            logger.warning("FIREBASE_CREDENTIALS_PATH environment variable not set. Firebase Admin SDK will not be initialized.")