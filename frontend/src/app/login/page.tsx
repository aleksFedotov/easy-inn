'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/spinner';
import axios from 'axios';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { USER_ROLES } from '@/lib/constants';

export default function LoginPage() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated, isLoading, login, user } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('User already authenticated. Redirecting from login page to dashboard.');
      if (user?.role == USER_ROLES.HOUSEKEEPER) {
        router.push('/my-cleaning-task');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, router, user?.role]);

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

      if (accessToken && refreshToken) {
        login(accessToken, refreshToken);
      } else {
        setError('Токены не получены.');
      }
    } catch (err) {
      let errorMessage = 'Ошибка входа. Проверьте логин и пароль.';
      if (axios.isAxiosError(err)) {
        if (err.response) {
          errorMessage = err.response.data.detail || 'Ошибка входа. Проверьте логин и пароль.';
        } else if (err.request) {
          errorMessage = 'Нет ответа от сервера. Проверьте подключение или URL API.';
        } else {
          errorMessage = 'Ошибка сети или сервера. Пожалуйста, попробуйте позже.';
        }
      } else {
        errorMessage = 'Произошла непредвиденная ошибка. Пожалуйста, попробуйте позже.';
      }
      setError(errorMessage);
      console.error('Ошибка при входе:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Вход в EasyInn</CardTitle>
          <CardDescription className="text-sm">
            Введите свои учетные данные для входа в систему
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя:</Label>
              <Input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль:</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full">
              Войти
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}