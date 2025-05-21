'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation'; 
import { useAuth } from '@/lib/AuthContext'; 
import { Spinner } from '@/components/spinner'; 
import ErrorMessage from '@/components/ErrorMessage'; 
import api from '@/lib/api'; 
import axios from 'axios';

import { CleaningTask, ChecklistItemTemplate, ChecklistTemplate } from '@/lib/types';

import { Building,FileText,UserIcon,BookOpen,Clock,Edit,ClipboardList, CircleDotDashed, Loader, CheckCircle, CircleHelp, XCircle, PauseCircle } from 'lucide-react'; // <-- Импортируем иконки редактирования и статусов

export default function CleaningTaskDetailsPage() {
    const params = useParams<{ id: string }>();
    const taskId = params.id; 
    
    const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();


    const [taskDetails, setTaskDetails] = useState<CleaningTask | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);



    
    const fetchTaskDetails = useCallback(async () => {
        if (!taskId) {
            setError('ID задачи не указан.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true); 
        setError(null); 

        try {
           
            const response = await api.get<CleaningTask>(`/api/cleaningtasks/${taskId}/`); 

            if (response.status === 200) {
                    console.log(response.data)
                    setTaskDetails(response.data); 
                    console.log(`Cleaning task details fetched successfully for ID: ${taskId}`, response.data);
            } else {
                    setError('Не удалось загрузить детали задачи. Статус: ' + response.status);
                    console.error("Failed to fetch cleaning task details. Status:", response.status);
            }
        } catch (err) {
            console.error('Error fetching cleaning task details:', err);
            if (axios.isAxiosError(err) && err.response) {
                    setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при загрузке деталей задачи.');
            } else if (axios.isAxiosError(err) && err.request) {
                    setError('Нет ответа от сервера при загрузке деталей задачи.');
            } else {
                setError('Произошла непредвиденная ошибка при загрузке деталей задачи.');
            }
        } finally {
           setIsLoading(false); 
        }
    }, [taskId]); 


   
    useEffect(() => {
        
        if (!isAuthLoading && isAuthenticated && user && taskId) {
            console.log("useEffect triggered: fetching cleaning task details...");
            fetchTaskDetails(); 
        }
         if (!isAuthLoading && !isAuthenticated) {
             // TODO: Обработать случай, когда пользователь не аутентифицирован
             // Например, перенаправить на страницу входа (хотя Layout уже должен это делать)
             setError('Пользователь не аутентифицирован.'); 
             setIsLoading(false);
         }
       
         if (!taskId && !isAuthLoading) {
              setError('ID задачи не указан.');
              setIsLoading(false); 
         }

    }, [taskId, user, isAuthLoading, isAuthenticated, fetchTaskDetails]); // Зависимости эффекта


    
   const getStatusDisplay = (status: CleaningTask['status'] | undefined) => {
        switch (status) {
             case 'unassigned': // <-- ДОБАВЛЕН НОВЫЙ СТАТУС
                 return { icon: <CircleDotDashed size={16} className="text-gray-500 mr-1"/>, text: 'Не назначена' };
            case 'assigned':
                return { icon: <CircleDotDashed size={16} className="text-blue-500 mr-1"/>, text: 'Назначена' };
            case 'in_progress':
                return { icon: <Loader size={16} className="text-yellow-500 mr-1"/>, text: 'В процессе' };
            case 'completed':
                return { icon: <CheckCircle size={16} className="text-green-500 mr-1"/>, text: 'Выполнена' };
            case 'waiting_inspection':
                return { icon: <CircleHelp size={16} className="text-purple-500 mr-1"/>, text: 'Ожидает проверки' };
            case 'checked':
                return { icon: <CheckCircle size={16} className="text-teal-500 mr-1"/>, text: 'Проверена' };
            case 'canceled':
                return { icon: <XCircle size={16} className="text-red-500 mr-1"/>, text: 'Отменена' };
            case 'on_hold':
                return { icon: <PauseCircle size={16} className="text-gray-500 mr-1"/>, text: 'Приостановлена' };
            default:
                return { icon: null, text: 'Неизвестный статус' };
        }
    };

    // Функция для переключения статуса пункта чек-листа (выполнено/не выполнено)
   
    // TODO: Добавить обработчики для кнопок смены статуса задачи на этой странице, если нужно

    // --- Условный рендеринг ---

    // Если AuthContext еще загружается или детали задачи загружаются
    if (isAuthLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Spinner/>
            </div>
        );
    }

    // Если у пользователя нет прав (пример проверки роли)
    // TODO: Реализовать реальную проверку роли, если необходимо
    // if (!user || !['admin', 'manager', 'housekeeper'].includes(user.role)) {
    //      return (
    //          <div className="flex items-center justify-center min-h-screen bg-gray-100">
    //              <div className="p-8 rounded-lg shadow-lg bg-white max-w-md w-full text-center text-red-600 font-bold">
    //                  У вас нет прав для просмотра этой страницы.
    //              </div>
    //          </div>
    //      );
    // }


    // Если есть ошибка загрузки деталей
    if (error) {
        return (
            <ErrorMessage
                message={error}
                // При повторной попытке загружаем детали задачи
                onRetry={fetchTaskDetails}
                isLoading={isLoading} // Передаем состояние загрузки
            />
        );
    }

    // Если данные успешно загружены и доступны
    if (taskDetails) {
         const statusInfo = getStatusDisplay(taskDetails.status); // Получаем информацию о статусе

        return (
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Детали задачи уборки #{taskDetails.id}</h1>

                <div className="bg-white shadow-md rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                        {/* Информация о месте и типе уборки */}
                        <div>
                            <p className="flex items-center mb-2">
                                <Building size={18} className="mr-2 text-gray-600"/>
                                <strong>Место:</strong> {taskDetails.room_number || taskDetails.zone_name || 'Неизвестно'}
                            </p>
                             <p className="flex items-center mb-2">
                                <FileText size={18} className="mr-2 text-gray-600"/>
                                <strong>Тип уборки:</strong> {taskDetails.cleaning_type_name || 'Не указан'}
                            </p>
                             <p className="flex items-center mb-2">
                                <UserIcon size={18} className="mr-2 text-gray-600"/>
                                <strong>Назначена:</strong> {taskDetails.assigned_to_name || 'Не назначен'}
                            </p>
                             <p className="flex items-center mb-2">
                                <BookOpen size={18} className="mr-2 text-gray-600"/>
                                <strong>Назначена менеджером:</strong> {taskDetails.assigned_by_name || 'Неизвестно'}
                            </p>
                        </div>

                        {/* Информация о статусе и времени */}
                        <div>
                             <p className="flex items-center mb-2">
                                {statusInfo.icon}
                                <strong>Статус:</strong> {statusInfo.text}
                            </p>
                             <p className="flex items-center mb-2">
                                <Clock size={18} className="mr-2 text-gray-600"/>
                                <strong>Срок выполнения:</strong> {taskDetails.due_time ? new Date(taskDetails.due_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Не указан'}
                            </p>
                             {/* TODO: Отобразить время начала, завершения, проверки, если они есть */}
                             {taskDetails.started_at && (
                                  <p className="flex items-center mb-2">
                                     <Clock size={18} className="mr-2 text-gray-600"/>
                                     <strong>Начата:</strong> {new Date(taskDetails.started_at).toLocaleString()}
                                  </p>
                             )}
                             {taskDetails.completed_at && (
                                  <p className="flex items-center mb-2">
                                     <Clock size={18} className="mr-2 text-gray-600"/>
                                     <strong>Завершена:</strong> {new Date(taskDetails.completed_at).toLocaleString()}
                                  </p>
                             )}
                             {taskDetails.checked_at && (
                                  <p className="flex items-center mb-2">
                                     <Clock size={18} className="mr-2 text-gray-600"/>
                                     <strong>Проверена:</strong> {new Date(taskDetails.checked_at).toLocaleString()}
                                  </p>
                             )}
                              {taskDetails.checked_by_name && (
                                  <p className="flex items-center mb-2">
                                     <UserIcon size={18} className="mr-2 text-gray-600"/>
                                     <strong>Проверена кем:</strong> {taskDetails.checked_by_name}
                                  </p>
                             )}
                        </div>
                    </div>

                    {/* Секция "Заметки" */}
                    <div className="mt-6 border-t pt-4 border-gray-200">
                        <p className="text-lg font-semibold text-gray-700 mb-2">Заметки:</p>
                        <p className="bg-gray-100 p-3 rounded-md whitespace-pre-wrap text-gray-800">{taskDetails.notes || 'Нет заметок'}</p>
                    </div>

                    {/* Секция "Чек-лист" */}
                    {/* Проверяем наличие checklist_items и отображаем секцию только если они есть */}
                    {taskDetails.checklist_data.items && taskDetails.checklist_data.items.length > 0 && (
                        <div className="mt-6 border-t pt-4 border-gray-200">
                            <p className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                                <ClipboardList size={20} className="mr-2 text-gray-600"/> Чек-лист:
                            </p>
                            <ul className="space-y-3">
                                {taskDetails.checklist_data.items.map(item => (
                                    <li key={item.id} className="flex items-center bg-gray-50 p-3 rounded-md shadow-sm">
                                        {/* Отображаем иконку статуса пункта чек-листа без интерактивности */}
                                        <span className="mr-3">
                                         
                                                <CircleDotDashed size={20} className="text-gray-400"/>
                                    
                                        </span>
                                        {/* Текст пункта чек-листа */}
                                        <span className={`flex-1 text-gray-800`}>
                                            {item.text}
                                        </span>
                                        {/* TODO: Возможно, добавить иконку или текст для примечаний к пункту, если есть */}
                                    </li>
                                ))}
                            </ul>
                             {/* Отображение ошибки, если не удалось обновить пункт чек-листа - УДАЛЕНО */}
                             {/* {error && isPerformingAction && (
                                  <p className="text-red-500 text-xs italic mt-3 text-center">{error}</p>
                             )} */}
                        </div>
                    )}
                    {/* TODO: Добавить кнопки действий для задачи (Начать, Завершить, Проверить и т.д.) */}
                    {/* Логика этих кнопок будет похожа на ту, что на странице списка */}
                    {/* <div className="mt-6 flex justify-end space-x-4">
                        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out">
                            Начать
                        </button>
                        <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out">
                            Завершить
                        </button>
                        <button className="bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out">
                             Проверить
                         </button>
                    </div> */}
                </div>
            </div>
        );
    }

    // Если taskId доступен, но taskDetails null после загрузки (например, задача не найдена)
    if (!isLoading && !taskDetails && taskId) {
         return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="p-8 rounded-lg shadow-lg bg-white max-w-md w-full text-center text-gray-600 font-bold">
                    Задача уборки с ID {taskId} не найдена.
                </div>
            </div>
         );
    }

    // Запасной вариант, если что-то пошло не так и нет ни загрузки, ни ошибки, ни данных
     return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
             <div className="p-8 rounded-lg shadow-lg bg-white max-w-md w-full text-center text-gray-600 font-bold">
                 Неизвестная ошибка при загрузке страницы.
             </div>
         </div>
     );
}
