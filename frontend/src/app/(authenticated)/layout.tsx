'use client';

import React, { useEffect, useState} from 'react';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import { Spinner } from '@/components/spinner'; 
import MainLayout from '@/components/laytout/MainLayout';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { NotificationProvider } from '@/context/NotificationContext';
import { ACCESS_TOKEN } from '@/lib/constants'; 


export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const token = localStorage.getItem(ACCESS_TOKEN);
      setAuthToken(token);
    }
  }, [isLoading, isAuthenticated]);

  // Эффект для перенаправления, если пользователь не аутентифицирован после завершения загрузки
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Authentication check finished. User not authenticated. Redirecting to login.");
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]); 

 
  if (isLoading || (isAuthenticated && !authToken)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner/> 
      </div>
    );
  }

  if (!isAuthenticated || !user || !authToken) {
        return <div>Пользователь не найден.</div>;
    }

 
  return (
    <DndProvider backend={HTML5Backend}>
      <NotificationProvider userId={user.id} token={authToken}>
        <MainLayout>
            {children}
        </MainLayout>
      </NotificationProvider>
    </DndProvider>
  )
}
