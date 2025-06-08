import api from './api';

export const sendPushToken = async (expoPushToken: string) => {
  try {
    const response = await api.post('/api/users/push-token/', {
      token: expoPushToken,
    });

    if (response.status === 200 || response.status === 201) {
      console.log('Push token sent successfully');
    } else {
      console.warn('Unexpected response while sending push token:', response.status);
    }
  } catch (error) {
    console.error('Error sending push token:', error);
  }
};