import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

async function registerForPushNotificationsAsync() {
  let token;

  console.log('registerForPushNotificationsAsync: Запущено'); // Добавьте это

  if (Device.isDevice) {
    console.log('registerForPushNotificationsAsync: Обнаружено устройство'); // И это

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('registerForPushNotificationsAsync: Existing permissions status:', existingStatus); // И это

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('registerForPushNotificationsAsync: Requested permissions, final status:', finalStatus); // И это
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification! Permissions not granted.');
      console.error('registerForPushNotificationsAsync: Разрешения на уведомления не предоставлены.'); // И это
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId ?? 'default',
    })).data;
    console.log('registerForPushNotificationsAsync: Получен токен Expo:', token); // И это

    await api.post('/api/users/register-token/', { token });
    console.log('registerForPushNotificationsAsync: Токен отправлен на бэкенд.'); // И это
  } else {
    alert('Must use physical device for Push Notifications');
    console.warn('registerForPushNotificationsAsync: Запущено не на устройстве, пропускаем регистрацию.'); // И это
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
    console.log('registerForPushNotificationsAsync: Канал уведомлений Android настроен.'); // И это
  }

  return token;
}

export default registerForPushNotificationsAsync;