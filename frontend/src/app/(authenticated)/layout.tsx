'use client';

import React, { useEffect} from 'react';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext'; // Импортируем AuthProvider и useAuth
import { Spinner } from '@/components/spinner'; // Импортируем компонент Spinner
import MainLayout from '@/components/laytout/MainLayout';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';


export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <Spinner/> 
      </div>
    );
  }

 
  return (
    <DndProvider backend={HTML5Backend}>
      <MainLayout>
          {children}
      </MainLayout>
    </DndProvider>
  )
}
