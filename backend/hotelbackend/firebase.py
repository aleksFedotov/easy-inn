import firebase_admin
from firebase_admin import credentials, messaging

cred = credentials.Certificate(".easyinn-2c8c9-firebase-adminsdk-fbsvc-55a42daeea.json")
firebase_admin.initialize_app(cred)