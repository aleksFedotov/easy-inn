// src/app/dashboard/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/lib/constants'

export default function DashboardPage() {
  const router = useRouter();
  const handleLogout = () => {
    // Реализация логики выхода
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    // TODO: Возможно, отправить запрос на бэкенд для аннулирования токенов
    console.log("Logged out. Redirecting to login.");
    router.push('/login');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 rounded-lg shadow-lg bg-white max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Добро пожаловать в EasyInn!</h1>
        <p className="text-gray-600">Вы успешно вошли в систему.</p>
        {/* TODO: Здесь будет основное содержимое панели управления */}
        <div className="mt-6">
          <button
            onClick={handleLogout} // Используем функцию выхода
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}

