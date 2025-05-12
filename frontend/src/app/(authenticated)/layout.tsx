'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Удалены импорты jwtDecode, api, ACCESS_TOKEN, REFRESH_TOKEN, useEffect, useState
// так как вся логика аутентификации перенесена в AuthContext.tsx
// import { jwtDecode } from 'jwt-decode';
// import api from '@/lib/api';
// import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/lib/constants';
// import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/AuthContext'; // Импортируем AuthProvider и useAuth
import { Spinner } from '@/components/spinner'; // Импортируем компонент Spinner

// Тип UserData больше не нужен здесь, так как он определен в AuthContext.tsx
// interface UserData {
//   user_id: number;
//   role: string;
//   exp: number;
// }

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // useAuth теперь используется для доступа к состоянию аутентификации из контекста
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Эффект для перенаправления, если пользователь не аутентифицирован после завершения загрузки
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Authentication check finished. User not authenticated. Redirecting to login.");
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]); // Зависимости от состояния аутентификации и загрузки

  // Пока идет проверка аутентификации в AuthProvider, показываем спиннер
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Spinner/> {/* Используем компонент Spinner */}
      </div>
    );
  }

  // Если пользователь аутентифицирован (isAuthenticated === true), рендерим дочерние элементы.
  // Если не аутентифицирован, useEffect выше перенаправит его.
  return <>{children}</>;
}
