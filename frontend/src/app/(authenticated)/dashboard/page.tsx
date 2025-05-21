'use client';

import React from 'react';
import { useAuth } from '@/lib/AuthContext'; 
import { Spinner } from '@/components/spinner';

export default function DashboardPage() {

  const { user, logout, isLoading } = useAuth(); // Получаем user, logout и isLoading из контекста

  const handleLogout = () => {
    logout();
  };

  // Отображаем содержимое в зависимости от роли пользователя
  const renderDashboardContent = () => {
    // Если данные пользователя еще загружаются или не получены
    if (isLoading || !user) {
      return (
                  <div className="flex items-center justify-center min-h-screen bg-gray-100">
                       <Spinner/> 
                  </div>
              ); 
    }

    // Теперь у нас есть user.username из API
    const userNameDisplay = user.first_name;

    switch (user.role) {
      case 'front-desk':
      case 'manager':
        return (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Панель управления Менеджера/Администратора</h1>
            <p className="text-gray-600 mb-6">Добро пожаловать, {userNameDisplay}! У вас полный доступ к системе.</p>
            {/* TODO: Добавить ссылки на страницы управления (пользователи, номера, бронирования, уборка) */}
            <div className="mt-6 flex flex-col space-y-4">
                {/* Замените button на Link из next/link для навигации */}
                <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out">
                    Управление пользователями
                </button>
                 <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out">
                    Управление номерами
                </button>
                 <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out">
                    Управление бронированиями
                </button>
                 <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out">
                    Управление уборкой
                </button>
            </div>
          </>
        );
      case 'housekeeper':
        return (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Панель управления Горничной</h1>
            <p className="text-gray-600 mb-6">Добро пожаловать, {userNameDisplay}! Здесь вы видите ваши задачи по уборке.</p>
            {/* TODO: Добавить список задач уборки для горничной */}
             <div className="mt-6">
                <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out">
                    Мои задачи по уборке
                </button>
             </div>
          </>
        );
      default:
        // Если роль неизвестна, можно показать общее сообщение или ошибку
        return (
            <>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Добро пожаловать!</h1>
                <p className="text-gray-600 mb-6">Ваша роль: {user.role}.</p>
            </>
        );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 rounded-lg shadow-lg bg-white max-w-md w-full text-center">

        {/* Рендерим содержимое в зависимости от роли */}
        {renderDashboardContent()}

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
