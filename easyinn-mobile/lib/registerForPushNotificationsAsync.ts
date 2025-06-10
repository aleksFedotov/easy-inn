import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native'; 
import Constants from 'expo-constants';
import api from './api'; 
import { isAxiosError } from 'axios';

async function registerForPushNotificationsAsync() {
  let token;

  console.log('registerForPushNotificationsAsync: Запущено');

  if (Device.isDevice) {
    console.log('registerForPushNotificationsAsync: Обнаружено устройство');

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('registerForPushNotificationsAsync: Existing permissions status:', existingStatus);

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('registerForPushNotificationsAsync: Requested permissions, final status:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification! Permissions not granted.');
      console.error('registerForPushNotificationsAsync: Разрешения на уведомления не предоставлены.');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId ?? 'default', 
    })).data;
    console.log('registerForPushNotificationsAsync: Получен токен Expo:', token);

    
    try {
     
      const response = await api.post('/api/users/register-token/', { 
        token: token,
        platform: Platform.OS 
      });
      console.log('registerForPushNotificationsAsync: Токен успешно отправлен на бэкенд. Ответ:', response.data);
     
      
    } catch (error) {
      console.error('registerForPushNotificationsAsync: Ошибка при отправке токена на бэкенд:', error);
     
      if (isAxiosError(error) && error.response) {
        console.error('Backend response status:', error.response.status);
        console.error('Backend response data:', error.response.data);
        alert(`Ошибка регистрации токена: ${error.response.data.detail || error.response.data.error || 'Неизвестная ошибка сервера'}`);
      } else if (isAxiosError(error) && error.request) {
        console.error('No response received:', error.request);
        alert('Ошибка сети: не удалось подключиться к серверу для регистрации токена.');
      } else {
        console.error('Error setting up request:', (error as Error).message);
        alert(`Непредвиденная ошибка при регистрации токена: ${(error as Error).message}`);
      }

    }


  } else {
    alert('Must use physical device for Push Notifications');
    console.warn('registerForPushNotificationsAsync: Запущено не на устройстве, пропускаем регистрацию.');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    console.log('registerForPushNotificationsAsync: Канал уведомлений Android настроен.');
  }

  return token;
}

export default registerForPushNotificationsAsync;