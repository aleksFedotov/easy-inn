import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';


export async function registerForPushNotificationsAsync() {
  let token;

  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Не получены разрешения на уведомления!');
      return null;
    }

    const expoPushToken = await Notifications.getExpoPushTokenAsync();
    token = expoPushToken.data;
  } else {
    alert('Для пушей нужно настоящее устройство');
    return null;
  }

  return token;
}