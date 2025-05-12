'use client';

import React, { useState, FormEvent, useEffect } from 'react'; // Добавлен useEffect
import { useRouter } from 'next/navigation';
// Удалены импорты ACCESS_TOKEN, REFRESH_TOKEN, так как управление токенами теперь в AuthContext
// import { ACCESS_TOKEN,REFRESH_TOKEN } from '@/lib/constants';
import api from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'; // Импортируем useAuth
import { Spinner } from '@/components/spinner';


export default function LoginPage() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth(); // Получаем состояние и функцию login из контекста

  // Если пользователь уже аутентифицирован (например, вернулся на страницу логина),
  // перенаправляем его на dashboard
  useEffect(() => {
      // Проверяем isLoading, чтобы не перенаправить до завершения первичной проверки в AuthProvider
      if (!isLoading && isAuthenticated) {
          console.log("User already authenticated. Redirecting from login page to dashboard.");
          router.push('/dashboard');
      }
  }, [isAuthenticated, isLoading, router]); // Зависимости от состояния контекста и router


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!api.defaults.baseURL) {
        setError('Ошибка конфигурации: API_BASE_URL не установлен в .env.local');
        console.error('NEXT_PUBLIC_API_BASE_URL is not defined or incorrectly set for Axios instance.');
        return;
    }

    try {
      const response = await api.post('/api/token/', {
        username,
        password,
      });

      const accessToken = response.data.access;
      const refreshToken = response.data.refresh;

      if (accessToken && refreshToken) { // Убедимся, что оба токена получены
        login(accessToken, refreshToken); // Используем функцию login из контекста
        // Перенаправление теперь происходит автоматически в useEffect выше
        // router.push('/dashboard'); // <-- Эту строку можно удалить
      } else {
        setError('Токены не получены.'); // Более точное сообщение
      }
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.detail || 'Ошибка входа. Проверьте логин и пароль.');
      } else if (err.request) {
         setError('Нет ответа от сервера. Проверьте подключение или URL API.');
      } else {
        setError('Ошибка сети или сервера. Пожалуйста, попробуйте позже.');
      }
      console.error('Ошибка при входе:', err);
    }
  };

   // Пока AuthProvider загружается, можно показать пустую страницу или спиннер
   if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                 <Spinner/> {/* Используем компонент Spinner */}
            </div>
        );
    }


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 rounded-lg shadow-lg bg-white max-w-sm w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Вход в EasyInn</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
              Имя пользователя:
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Пароль:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-200 ease-in-out"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
