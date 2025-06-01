import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { useAuth } from '../../context/AuthContext';
import { Redirect, useRouter } from 'expo-router';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

const menuItems = [
  {
    id: 'dashboard',
    name: 'Главная',
    href: '/dashboard',
    roles: ['frontDesk', 'manager'],
  },
  {
    id: 'front-desk',
    name: 'Служба приема',
    href: '/front-desk',
    roles: ['frontDesk', 'manager'],
  },
  {
    id: 'housekeeping',
    name: 'Уборка',
    href: '/housekeeping/index',
    roles: ['frontDesk', 'manager'],
  },
  {
    id: 'my-cleaning-task',
    name: 'Мои задачи',
    href: '/my-cleaning-task',
    roles: ['housekeeper'],
  },
];

const settingsItems = [
  {
    id: 'settings-users',
    name: 'Пользователи',
    href: '/users',
    roles: ['manager'],
  },
  {
    id: 'settings-rooms',
    name: 'Настройка комнат',
    href: '/room-setup',
    roles: ['manager'],
  },
  {
    id: 'settings-cleaning',
    name: 'Настройка уборки',
    href: '/cleaning-setup',
    roles: ['manager'],
  },
];





const AuthenticatedLayout = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <View style={styles.loading}><Text>Загрузка...</Text></View>;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user!.role));
  const visibleSettingsItems = settingsItems.filter(item => item.roles.includes(user!.role));

  return (
    <Drawer>
      {visibleMenuItems.map((item) => (
        <Drawer.Screen
          key={item.id}
          name={item.href.startsWith('/') ? item.href.slice(1) : item.href}
          options={{
            drawerLabel: ({ focused }) => <Text style={[styles.drawerLabel, focused && styles.drawerLabelFocused]}>{item.name}</Text>,
            title: item.name,
            headerShown: true,
          }}
        />
      ))}

        {visibleSettingsItems.map((item) => (
        <Drawer.Screen
            key={item.id}
            name={item.href.startsWith('/') ? item.href.slice(1) : item.href}
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
              <Text style={[styles.drawerLabel, { fontWeight: 'bold', color: '#d00', paddingVertical: 10 }]}>Выйти</Text>
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
  drawerSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  drawerItemFocused: {
    backgroundColor: '#e6f7ff',
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