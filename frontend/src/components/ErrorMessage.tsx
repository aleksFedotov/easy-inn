'use client';

import React from 'react';


interface ErrorMessageProps {
  
  message: string | null;
  
  onRetry?: () => void;
  
  isLoading?: boolean;
}

/**
 * Компонент для отображения сообщения об ошибке с опциональной кнопкой "Повторить".
 * Используется для замены повторяющихся блоков обработки ошибок на страницах.
 */
export default function ErrorMessage({ message, onRetry, isLoading = false }: ErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    // Контейнер для центрирования сообщения об ошибке
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* Блок сообщения об ошибке */}
      <div className="p-8 rounded-lg shadow-lg bg-white max-w-md w-full text-center text-red-600 font-bold">
        {/* Текст сообщения об ошибке */}
        <p>Ошибка: {message}</p>
        {/* Показываем кнопку "Повторить", только если передана функция onRetry */}
        {onRetry && (
          <button
            onClick={onRetry} // Вызываем переданную функцию при клике
            disabled={isLoading} // Отключаем кнопку, если идет загрузка
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Изменяем текст кнопки в зависимости от состояния загрузки */}
            {isLoading ? 'Загрузка...' : 'Повторить'}
          </button>
        )}
      </div>
    </div>
  );
}
