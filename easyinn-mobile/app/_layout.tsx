import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/context/AuthContext';
import registerForPushNotificationsAsync from '../lib/registerForPushNotificationsAsync';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
         
        }
      })
      .catch(error => {
        console.error('RootLayout: Error registering for push notifications:', error); 
      });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Уведомление получено:', notification);
      
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Пользователь взаимодействовал с уведомлением:', response);
      
    });

    return () => {
      if (notificationListener.current) {
        // Правильный вызов метода .remove() на объекте подписки
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        // Правильный вызов метода .remove() на объекте подписки
        responseListener.current.remove();
      }
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Slot />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}