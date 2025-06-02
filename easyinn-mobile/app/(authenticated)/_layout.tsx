import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';

const menuItems = [
  { id: 'dashboard', name: 'Главная', routeName: 'dashboard', roles: ['frontdesk', 'manager'] },
  { id: 'front-desk', name: 'Служба приема', routeName: 'front-desk', roles: ['frontdesk', 'manager'] },
  { id: 'housekeeping', name: 'Уборка', routeName: 'housekeeping', roles: ['frontdesk', 'manager'] },
  { id: 'my-cleaning-task', name: 'Мои задачи', routeName: 'my-cleaning-task', roles: ['housekeeper'] },
];

const settingsItems = [
  { id: 'settings-users', name: 'Пользователи', routeName: 'users', roles: ['manager'] },
  { id: 'settings-rooms', name: 'Настройка комнат', routeName: 'room-setup', roles: ['manager'] },
  { id: 'settings-cleaning', name: 'Настройка уборки', routeName: 'cleaning-setup', roles: ['manager'] },
];

const AuthenticatedLayout = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    router.replace('/login');
    return null;
  }

  // Фильтруем меню по роли
  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user?.role ?? ''));
  const visibleSettingsItems = settingsItems.filter(item => item.roles.includes(user?.role ?? ''));

  return (
    <Drawer>
      {visibleMenuItems.map(item => (
        <Drawer.Screen
          key={item.id}
          name={item.routeName}
          options={{
            drawerLabel: ({ focused }) => (
              <Text style={[styles.drawerLabel, focused && styles.drawerLabelFocused]}>
                {item.name}
              </Text>
            ),
            title: item.name,
            headerShown: true,
          }}
        />
      ))}

      {visibleSettingsItems.map(item => (
        <Drawer.Screen
          key={item.id}
          name={item.routeName}
          options={{
            drawerLabel: ({ focused }) => (
              <Text style={[styles.drawerLabel, focused && styles.drawerLabelFocused]}>
                {item.name}
              </Text>
            ),
            title: item.name,
            headerShown: true,
          }}
        />
      ))}

      <Drawer.Screen
        name="logout"
        options={{
          drawerLabel: () => (
            <TouchableOpacity
              onPress={() => {
                logout();
                router.replace('/login');
              }}
              style={{ width: '100%' }}
            >
              <Text style={[styles.drawerLabel, { fontWeight: 'bold', color: '#d00', paddingVertical: 10 }]}>
                Выйти
              </Text>
            </TouchableOpacity>
          ),
          title: 'Выйти',
          headerShown: true,
          drawerItemStyle: { borderTopWidth: 1, borderTopColor: '#ccc', marginTop: 10 },
        }}
      />
    </Drawer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerLabel: {
    fontSize: 16,
  },
  drawerLabelFocused: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default AuthenticatedLayout;
