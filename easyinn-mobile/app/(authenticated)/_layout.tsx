import React, { useEffect, type FC } from 'react';
import { Drawer } from 'expo-router/drawer';
import { useAuth } from '../../context/AuthContext';
import { useRouter, usePathname, Redirect } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DrawerContentScrollView, DrawerItem, type DrawerContentComponentProps } from '@react-navigation/drawer';

// --- Типы ---
// Определяем возможные роли для строгой типизации
type UserRole = 'manager' | 'frontdesk' | 'housekeeper';

// Тип для объекта пользователя, который приходит из контекста
interface User {
  role: UserRole;
  // ... другие поля пользователя
}

// Тип для нашего контекста аутентификации
interface AuthContextType {
  user: User | null;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Используем 'as const', чтобы TypeScript понимал ключи как конкретные строки, а не просто 'string'
const routePermissions: Record<string, readonly UserRole[]> = {
  'dashboard': ['frontdesk', 'manager'],
  'housekeeping/index': ['frontdesk', 'manager'],
  'my-cleaning-task': ['housekeeper'],
  'ready-for-check': ['frontdesk', 'manager'],
} as const;

// Автоматически создаем тип для всех возможных маршрутов на основе ключей routePermissions
type AppRoute = keyof typeof routePermissions;

// Тип для одного пункта меню
interface MenuItem {
    id: string;
    name: string;
    routeName: AppRoute;
    roles: readonly UserRole[];
}

// --- Данные меню (уже с типами) ---
const menuItems: MenuItem[] = [
    { id: 'dashboard', name: 'Главная', routeName: 'dashboard', roles: routePermissions.dashboard },
    { id: 'my-cleaning-task', name: 'Мои задачи', routeName: 'my-cleaning-task', roles: routePermissions['my-cleaning-task'] },
    { id: 'ready-for-check', name: 'Готовы к проверке', routeName: 'ready-for-check', roles: routePermissions['ready-for-check'] },
];
  


// --- Кастомный компонент для содержимого меню (типизированный) ---
function CustomDrawerContent(props: DrawerContentComponentProps) {
  // Применяем наш тип к результату хука useAuth
  const { user, logout } = useAuth() as AuthContextType;
  const router = useRouter();

  if (!user) return null;

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user.role));
  

  return (
    <DrawerContentScrollView {...props}>
      {visibleMenuItems.map((item) => (
        <DrawerItem
          key={item.id}
          label={item.name}
          onPress={() => {
            router.navigate(item.routeName);
          }}
        />
      ))}
      <DrawerItem
        label="Выйти"
        onPress={logout}
        labelStyle={styles.logoutLabel}
        style={styles.logoutItem}
      />
    </DrawerContentScrollView>
  );
}

// --- Основной компонент Layout (типизированный) ---
const AuthenticatedLayout: FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth() as AuthContextType;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) {
      return;
    }
    const currentRoute = pathname.substring(1).split('/')[0] as AppRoute;
    if (!currentRoute) return;

    // Проверяем, что ключ существует в объекте прав
    if (Object.keys(routePermissions).includes(currentRoute)) {
        const allowedRoles = routePermissions[currentRoute];
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            router.replace(user.role === 'housekeeper' ? '/my-cleaning-task' : '/dashboard');
        }
    }
  }, [pathname, isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return <View style={styles.loading}><Text>Загрузка...</Text></View>;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}>
        {/* Объявляем все экраны, чтобы Expo Router мог корректно настраивать заголовки */}
        <Drawer.Screen name="dashboard" options={{ title: 'Главная' }} />
        <Drawer.Screen name="my-cleaning-task" options={{ title: 'Мои задачи' }} />
        <Drawer.Screen name="ready-for-check" options={{ title: 'Готовы к проверке' }} />
        {/* Скрываем экран для housekeeper, так как он не должен быть доступен напрямую */}
        <Drawer.Screen name="housekeeping/[id]" options={{ drawerItemStyle: { display: 'none' } }} />
      </Drawer>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoutItem: { borderTopWidth: 1, borderTopColor: '#ccc', marginTop: 10 },
  logoutLabel: { color: '#d00', fontWeight: 'bold' },
  settingsHeader: {
    color: '#888',
    marginTop: 15,
    marginBottom: 5,
    marginLeft: 16,
    fontWeight: 'bold',
  }
});

export default AuthenticatedLayout;