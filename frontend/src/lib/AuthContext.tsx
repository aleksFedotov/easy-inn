'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants'; 
import api from './api';


interface User {
  user_id: number;
  role: 'housekeeper' | 'admin' | 'manager';
  exp: number;
  iat: number;
}

// Тип для состояния контекста аутентификации
interface AuthContextType {
  isAuthenticated: boolean; // Флаг, аутентифицирован ли пользователь
  user: User | null; // Данные текущего пользователя, или null если не аутентифицирован
  isLoading: boolean; // Флаг, идет ли проверка аутентификации/загрузка данных
  login: (accessToken: string, refreshToken: string) => void; // Функция для установки токенов и пользователя после входа
  logout: () => void; // Функция для выхода из системы
  // Возможно, добавить функцию для получения актуальных данных пользователя: fetchUser: () => Promise<void>;
}

// Создаем контекст с значениями по умолчанию
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер контекста аутентификации
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Изначально true, пока идет проверка

  // Функция для выхода из системы
  const logout =useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setIsAuthenticated(false);
    setUser(null);
    // TODO: Возможно, отправить запрос на бэкенд для аннулирования токенов
    console.log("User logged out.");
  },[setIsAuthenticated, setUser]);
  // Функция для установки состояния после успешного входа или обновления токена
  const login =useCallback((accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN, accessToken);
    localStorage.setItem(REFRESH_TOKEN, refreshToken);
    // Декодируем access токен, чтобы получить данные пользователя (например, роль)
    try {
      const decodedToken = jwtDecode<User>(accessToken);
      // Убедитесь, что поля user_id и role существуют в payload вашего JWT!
      setUser({
          user_id: decodedToken.user_id,
          role: decodedToken.role, 
          exp: decodedToken.exp,
          iat: decodedToken.iat,
      });
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Failed to decode access token:", error);
      // Если токен не декодируется, считаем его невалидным
      logout(); // Выполняем выход
    }
  }, [logout, setIsAuthenticated, setUser]);


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
        const decodedToken = jwtDecode<User>(accessToken);
        const tokenExpiration = decodedToken.exp;
        const now = Date.now() / 1000;

        if (tokenExpiration < now) {
          console.log("Initial access token expired. Attempting to refresh.");
          if (refreshToken) {
            // Попытка обновить токен
            try {
              const response = await api.post('/api/token/refresh/', { refresh: refreshToken }); // <--- ПРОВЕРЬТЕ ЭТОТ URL
              if (response.status === 200) {
                login(response.data.access, refreshToken); // Используем функцию login для установки нового токена и пользователя
                console.log("Token refreshed successfully during initial check.");
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
          // Access токен действителен, устанавливаем пользователя из токена
          console.log("Initial access token is valid.");
           try {
              const decodedToken = jwtDecode<User>(accessToken);
               // Убедитесь, что поля user_id и role существуют в payload вашего JWT!
               setUser({
                    user_id: decodedToken.user_id,
                    role: decodedToken.role, 
                    exp: decodedToken.exp,
                    iat: decodedToken.iat,
               });
               setIsAuthenticated(true);
           } catch (error) {
               console.error("Failed to decode valid access token:", error);
               logout(); // Если токен не декодируется, выходим
           }
        }
      } catch (error) {
        console.error("Error decoding initial access token:", error);
        logout(); // Ошибка декодирования, выходим
      } finally {
        setIsLoading(false); // Проверка завершена
      }
    };

    checkAuth(); // Запускаем проверку при монтировании провайдера
  }, [login, logout]); // Пустой массив зависимостей, чтобы эффект выполнился только один раз при монтировании

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
