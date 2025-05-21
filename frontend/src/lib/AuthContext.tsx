'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants'; 
import api from './api';
import { useRouter } from 'next/navigation';
import axios from 'axios'
import { User, JwtPayload } from './types';



// Тип для состояния контекста аутентификации
interface AuthContextType {
  isAuthenticated: boolean; 
  user: User | null; // Данные текущего пользователя, или null если не аутентифицирован
  isLoading: boolean; // Флаг, идет ли проверка аутентификации/загрузка данных
  login: (accessToken: string, refreshToken: string) =>  Promise<void> //Функция для установки токенов и пользователя после входа
  logout: () => void; // Функция для выхода из системы
  
}

// Создаем контекст с значениями по умолчанию
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер контекста аутентификации
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Изначально true, пока идет проверка
  const router = useRouter()

  // Функция для выхода из системы
  const logout =useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setIsAuthenticated(false);
    setUser(null);
    // TODO: Возможно, отправить запрос на бэкенд для аннулирования токенов
    console.log("User logged out.");
    router.push("/login")
  },[setIsAuthenticated, setUser, router]);


  // Функция для получения данных пользователя с бэкенда
  const fetchUser = useCallback(async () => {
      try {
          const response = await api.get<User>('/api/users/me/'); 

          if (response.status === 200) {
              setUser(response.data); // Устанавливаем данные пользователя
              setIsAuthenticated(true); // Устанавливаем флаг аутентификации
              console.log("User data fetched successfully.");
          } else {
              // Если запрос на данные пользователя не удался, считаем пользователя неаутентифицированным
              console.log("Failed to fetch user data. Redirecting to login.");
              logout(); // Выполняем выход
          }
      } catch (error) {
          console.error("Error fetching user data:", error);
           if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
               // Если получили 401 при запросе данных пользователя, значит токен невалиден
               console.log("Unauthorized when fetching user data. Token might be invalid.");
           }
          logout(); // При любой ошибке запроса данных пользователя - выходим
      }
  }, [logout, setIsAuthenticated, setUser]);

  // Функция для установки состояния после успешного входа или обновления токена
  const login =useCallback(async (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN, accessToken);
    localStorage.setItem(REFRESH_TOKEN, refreshToken);
    // Декодируем access токен, чтобы получить данные пользователя (например, роль)
    await fetchUser();
  }, [fetchUser]);


  // Эффект для проверки аутентификации при загрузке приложения
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem(ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN);

      if (!accessToken) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        console.log("No initial access token found.");
        return;
      }

      try {
        const decodedToken = jwtDecode<JwtPayload>(accessToken);
        const tokenExpiration = decodedToken.exp;
        const now = Date.now() / 1000;

        if (tokenExpiration < now) {
          console.log("Initial access token expired. Attempting to refresh.");
          if (refreshToken) {
            // Попытка обновить токен
            try {
              const response = await api.post('/api/token/refresh/', { refresh: refreshToken });
              if (response.status === 200) {
                const newAccessToken = response.data.access;
                localStorage.setItem(ACCESS_TOKEN, newAccessToken); // Сохраняем новый access токен
                // После успешного обновления, получаем данные пользователя
                await fetchUser(); // <--- Вызываем fetchUser после обновления
                console.log("Token refreshed successfully during initial check. Fetching user data.")
              } else {
                console.log("Failed to refresh token during initial check. Redirecting to login.");
                logout(); // Не удалось обновить, выходим
              }
            } catch (error) {
              console.error("Error refreshing token during initial check:", error);
              logout(); // Ошибка запроса, выходим
            }
          } else {
            console.log("Access token expired and no refresh token found during initial check. Redirecting to login.");
            logout(); // Нет refresh токена, выходим
          }
        } else {
            // Access токен действителен, получаем данные пользователя
            console.log("Initial access token is valid. Fetching user data.");
            await fetchUser();
        }
      } catch (error) {
        console.error("Error decoding initial access token:", error);
        logout(); // Ошибка декодирования, выходим
      } finally {
        setIsLoading(false); // Проверка завершена
      }
    };

    checkAuth(); // Запускаем проверку при монтировании провайдера
  }, [logout,fetchUser]); 

  // Значение контекста, которое будет доступно дочерним компонентам
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

// Кастомный хук для удобного доступа к контексту
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
