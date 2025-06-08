import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode'; 
import api from '../lib/api'; 
import { useRouter } from 'expo-router';
import { Alert } from 'react-native'; 
import { User,JwtPayload } from '@/lib/types';
import axios from 'axios';
import { registerForPushNotificationsAsync } from '@/lib/registerForPushNotificationsAsync';
import { sendPushToken } from '@/lib/sendPushToken';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/lib/constants';


interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Logout function
  const logout = useCallback(async () => {
    try {
        await AsyncStorage.removeItem(ACCESS_TOKEN);
        await AsyncStorage.removeItem(REFRESH_TOKEN);
        setIsAuthenticated(false);
        setUser(null);
        router.replace('/login'); // Перенаправляем на экран логина
        console.log('User logged out.');
    } catch (error) {
        console.error('Error during logout:', error);
        Alert.alert('Ошибка', 'Не удалось выйти из системы.');
    } finally {
        setIsLoading(false);
    }
  }, [router]);

  // Fetch User Data
  const fetchUser = useCallback(async (accessTokenOverride?: string) => {
    try {
        const accessToken = accessTokenOverride || await AsyncStorage.getItem(ACCESS_TOKEN);
    
        const response = await api.get<User>('/api/users/me/', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      if (response.status === 200) {
          setUser(response.data);
          setIsAuthenticated(true);
          console.log('User data fetched successfully.');
          const expoPushToken = await registerForPushNotificationsAsync();
          if (expoPushToken) {
            await sendPushToken(expoPushToken);
          }
      } else {
          console.log('Failed to fetch user data. Redirecting to login.');
          logout();
      }
    } catch (error) {
          console.error('Error fetching user data:', error);
          // eslint-disable-next-line import/no-named-as-default-member
      if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
          console.log('Unauthorized when fetching user data. Token might be invalid.');
      }
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // Login Function
  const login = useCallback(async (accessToken: string, refreshToken: string) => {
    try {
      await AsyncStorage.setItem(ACCESS_TOKEN, accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN, refreshToken);
      await fetchUser(accessToken); // Fetch user data after login
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Ошибка', 'Не удалось войти в систему.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchUser]);

  // Check Auth on Mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN);
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN);

        if (!accessToken) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          console.log('No initial access token found.');
          return;
        }

        const decodedToken = jwtDecode<JwtPayload>(accessToken);
        const tokenExpiration = decodedToken.exp;
        const now = Date.now() / 1000;

        if (tokenExpiration < now) {
          console.log('Initial access token expired. Attempting to refresh.');
          if (refreshToken) {
            try {
              const response = await api.post('/token/refresh/', { refresh: refreshToken });
              if (response.status === 200) {
                const newAccessToken = response.data.access;
                await AsyncStorage.setItem(ACCESS_TOKEN, newAccessToken);
                await fetchUser();
                console.log('Token refreshed successfully during initial check. Fetching user data.');
              } else {
                console.log('Failed to refresh token during initial check. Redirecting to login.');
                logout();
              }
            } catch (refreshError) {
              console.error('Error refreshing token during initial check:', refreshError);
              logout();
            }
          } else {
            console.log('Access token expired and no refresh token found during initial check. Redirecting to login.');
            logout();
          }
        } else {
          await fetchUser();
          console.log('Initial access token is valid. Fetching user data.');
        }
      } catch (authError) {
        console.error('Error during initial auth check:', authError);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [logout, fetchUser]);

  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook for using AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};