import React, { useEffect, type FC } from 'react';
import { Drawer } from 'expo-router/drawer';
import { useAuth } from '../../context/AuthContext';
import { useRouter, usePathname, Redirect } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DrawerContentScrollView, DrawerItem, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { User } from '@/lib/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


type UserRole = 'manager' | 'front-desk'  | 'housekeeper';

interface AuthContextType {
  user: User | null;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const routePermissions: Record<string, readonly UserRole[]> = {
  'dashboard': ['front-desk' , 'manager'],
  'housekeeping/index': ['front-desk' , 'manager'],
  'my-cleaning-task': ['housekeeper'],
  'ready-for-check': ['front-desk' , 'manager'],
} as const;

type AppRoute = keyof typeof routePermissions;

interface MenuItem {
  id: string;
  name: string;
  routeName: AppRoute;
  roles: readonly UserRole[];
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', name: 'Главная', routeName: 'dashboard', roles: routePermissions.dashboard },
  { id: 'my-cleaning-task', name: 'Мои задачи', routeName: 'my-cleaning-task', roles: routePermissions['my-cleaning-task'] },
  { id: 'ready-for-check', name: 'Готовы к проверке', routeName: 'ready-for-check', roles: routePermissions['ready-for-check'] },
];
  
function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout } = useAuth() as AuthContextType;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!user) return null;

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
      <View style={{ flex: 1 , paddingBottom: insets.bottom}}>
        <DrawerContentScrollView {...props} style={{ flex: 1 }}> 
          {visibleMenuItems.map((item) => (
            <DrawerItem
              key={item.id}
              label={item.name}
              onPress={() => {
                router.navigate(item.routeName);
              }}
            />
          ))}
        </DrawerContentScrollView>

        <View style={styles.bottomDrawerSection}>
          <DrawerItem
            label="Выйти"
            onPress={logout}
            labelStyle={styles.logoutLabel}
            style={styles.logoutItem}
          />
        </View>
      </View>
  );
}


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
     return <Redirect href="/" />;
   }

   return (
     <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}>
          <Drawer.Screen name="dashboard" options={{ title: 'Главная' }} />
          <Drawer.Screen name="my-cleaning-task" options={{ title: 'Мои задачи' }} />
          <Drawer.Screen name="ready-for-check" options={{ title: 'Готовы к проверке' }} />
          <Drawer.Screen 
            name="housekeeping/[id]"      
            options={{ 
              drawerItemStyle: { display: 'none' },
              title: '',
              headerShown:false
              
              }} />
        </Drawer>
     </GestureHandlerRootView>
   );
};

const styles = StyleSheet.create({
   loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   logoutItem: { borderTopWidth: 1, borderTopColor: '#ccc', marginTop: 10 },
   logoutLabel: { color: '#888', fontWeight: 'bold' },
  bottomDrawerSection: {
    marginBottom: 10, 
    paddingHorizontal: 16,
  },
   settingsHeader: {
     color: '#888',
     marginTop: 15,
     marginBottom: 5,
     marginLeft: 16,
     fontWeight: 'bold',
   },
 container: {
    flex: 1,
    
  },
});

export default AuthenticatedLayout;