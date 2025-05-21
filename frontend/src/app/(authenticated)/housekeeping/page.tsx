// src/app/(authenticated)/housekeeping/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import api from '@/lib/api';
import axios from 'axios';
import { CleaningTask, User, Room, Zone, CleaningType } from '@/lib/types'; 

import {Play, XCircle,CheckSquare, Plus, Eye , Search, CalendarDays, User as UserIcon, CircleDotDashed, Loader, CheckCircle, CircleHelp, PauseCircle } from 'lucide-react';
import Modal from '@/components/Modal'; // <-- Импортируем Modal
import CleaningTaskForm from '@/components/forms/CleaningTaskForm';
import { useRouter } from 'next/navigation';

import { DraggableTaskRow } from '@/components/DraggableTaskRow';




// TODO: Возможно, определить типы для пагинации, если API поддерживает

export default function HousekeepingPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter()

  // Состояние для хранения списка задач по уборке
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  // Состояние для хранения списка горничных
  const [housekeepers, setHousekeepers] = useState<User[]>([]);
  // Состояния для хранения списков комнат, зон и типов уборок (нужны для формы создания задачи)
  const [rooms, setRooms] = useState<Room[]>([]); 
  const [zones, setZones] = useState<Zone[]>([]); 
  const [cleaningTypes, setCleaningTypes] = useState<CleaningType[]>([]);


  // Состояния загрузки и ошибок
  // isLoadingData теперь будет ждать загрузки задач, горничных, комнат, зон и типов уборок
  const [isLoadingData, setIsLoadingData] = useState(true); 
  const [error, setError] = useState<string | null>(null); 

  // Состояние для выбранной даты (для фильтрации задач)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); 

  // Состояние для управления видимостью модального окна формы создания задачи
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false); 

  // Состояние для отслеживания выполнения действия (например, смена статуса)
  const [isPerformingAction, setIsPerformingAction] = useState<boolean>(false); 

   // Состояние для отслеживания ID задачи, для которой меняется статус
  const [changingStatusTaskId, setChangingStatusTaskId] = useState<number | null>(null);
  // Состояние для отслеживания ID задачи, которая переназначается (для drag-and-drop)
  const [assigningTaskId, setAssigningTaskId] = useState<number | null>(null); // <-- Новое состояние


  // TODO: Состояния для фильтрации и пагинации задач
  // TODO: Состояния для поиска горничных/задач


  // Функция для загрузки списка задач по уборке
  // TODO: Добавить параметры фильтрации/пагинации, когда они будут реализованы
  const fetchCleaningTasks = useCallback(async (date: string) => {
      // setError(null); // Общая ошибка сбрасывается в useEffect
      try {
          // TODO: Добавить параметры запроса для фильтрации по дате
          const response = await api.get<CleaningTask[]>('/api/cleaningtasks/', {
              params: {
                   scheduled_date: date, 
                   all: true
                  // TODO: Добавить параметры пагинации
              }
          }); 

          if (response.status === 200) {
              setCleaningTasks(response.data);
              console.log("Cleaning tasks fetched successfully:", response.data);
          } else {
              console.error("Failed to fetch cleaning tasks. Status:", response.status);
              // setError('Не удалось загрузить список задач по уборке. Статус: ' + response.status); // Пока не устанавливаем общую ошибку здесь
          }
      } catch (err) {
          console.error('Error fetching cleaning tasks:', err);
          // setError('Ошибка при загрузке списка задач по уборке.'); // Пока не устанавливаем общую ошибку здесь
      }
  }, []); // TODO: Добавить зависимости для фильтрации/пагинации/даты


    // Функция для загрузки списка горничных
    const fetchHousekeepers = useCallback(async () => {
        try {
            const response = await api.get<User[]>('/api/users/', {
                params: {
                    all:true,
                    role: 'housekeeper', 
                    // TODO: Добавить параметры поиска, если будут реализованы
                }
            }); 

            if (response.status === 200) {
                setHousekeepers(response.data);
                console.log("Housekeepers fetched successfully:", response.data);
            } else {
                console.error("Failed to fetch housekeepers. Status:", response.status);
            }
        } catch (err) {
            console.error('Error fetching housekeepers:', err);
        }
    }, []); // TODO: Добавить зависимости для поиска

    // --- Новые функции для загрузки комнат, зон и типов уборок (для формы) ---

    const fetchRooms = useCallback(async () => {
        try {
            // Убедитесь, что этот URL соответствует вашему эндпоинту RoomViewSet
            const response = await api.get<Room[]>('/api/rooms/', {
                params: {
                    all:true,
                }
            }); 
            if (response.status === 200) {
                setRooms(response.data);
                console.log("Rooms fetched successfully:", response.data);
            } else {
                 console.error("Failed to fetch rooms. Status:", response.status);
            }
        } catch (err) {
             console.error('Error fetching rooms:', err);
        }
    }, []);

    const fetchZones = useCallback(async () => {
         try {
             const response = await api.get<Zone[]>('/api/zones/', {
                params: {
                    all:true,
                }
            }); 
             if (response.status === 200) {
                 setZones(response.data);
                 console.log("Zones fetched successfully:", response.data);
             } else {
                  console.error("Failed to fetch zones. Status:", response.status);
             }
         } catch (err) {
              console.error('Error fetching zones:', err);
         }
    }, []);

    const fetchCleaningTypes = useCallback(async () => {
         try {
             const response = await api.get<CleaningType[]>('/api/cleaningtypes/', {
                params: {
                    all:true,
                }
            }); 
             if (response.status === 200) {
                 setCleaningTypes(response.data);
                 console.log("Cleaning types fetched successfully:", response.data);
             } else {
                  console.error("Failed to fetch cleaning types. Status:", response.status);
             }
         } catch (err) {
              console.error('Error fetching cleaning types:', err);
         }
    }, []);

    // --- Конец новых функций ---


  // Эффект для запуска загрузки данных при монтировании компонента или изменении даты
  useEffect(() => {
    
    if (!isAuthLoading) {
     
      if (user && ['front-desk', 'manager', 'housekeeper'].includes(user.role)) {
        setIsLoadingData(true);
        setError(null); 

        // Запускаем загрузку всех необходимых данных параллельно
        Promise.all([
            fetchCleaningTasks(selectedDate), 
            fetchHousekeepers(), 
            fetchRooms(), 
            fetchZones(), 
            fetchCleaningTypes() 
        ])
            .then(() => {
                 
                 // TODO: Добавить более надежный механизм обработки ошибок из Promise.all,
                 // возможно, собирать их в массив и устанавливать общий error, если массив не пуст.
            })
            .catch(err => {
                console.error("Error during parallel data fetching on housekeeping page:", err);
                // TODO: Установить общую ошибку, если хотя бы один запрос завершился с ошибкой
                 setError('Произошла ошибка при загрузке данных.'); // Устанавливаем общую ошибку
            })
            .finally(() => {
                setIsLoadingData(false); 
            });

      } else {
        
        setIsLoadingData(false);
        setError('У вас нет прав для просмотра этой страницы.');
      }
    }
  }, [user, isAuthLoading, selectedDate, fetchCleaningTasks, fetchHousekeepers, fetchRooms, fetchZones, fetchCleaningTypes]); 


  // --- Обработчики для управления модальным окном создания задачи ---

  const handleCreateTaskClick = () => {
      // TODO: Возможно, добавить проверку роли перед открытием модального окна
      // if (user?.role === 'manager' || user?.role === 'front-desk') { ... }
      console.log("Create new cleaning task clicked");
      setIsCreateTaskModalOpen(true); // Открываем модальное окно создания задачи
  };

  const handleCreateTaskSuccess = () => {
      console.log("New cleaning task created successfully.");
      setIsCreateTaskModalOpen(false); // Закрываем модальное окно
      // После успешного создания, обновляем список задач для текущей даты
      fetchCleaningTasks(selectedDate);
      // TODO: Возможно, обновить сводные данные, если они есть на этой странице
  };

  const handleCreateTaskCancel = () => {
      console.log("Cleaning task creation cancelled.");
      setIsCreateTaskModalOpen(false); // Закрываем модальное окно
      // Ошибки формы сбрасываются внутри CleaningTaskForm
  };
  const handleViewTaskDetails = (taskId: number) => {
        // Не переходим, если выполняется другое действие или модальное окно открыто
        if (isPerformingAction || isCreateTaskModalOpen || assigningTaskId !== null) return; // <-- Добавлена проверка assigningTaskId

        console.log(`Navigating to cleaning task details for ID: ${taskId}`);
        router.push(`/housekeeping/${taskId}`); // <-- ПУТЬ К НОВОЙ СТРАНИЦЕ
    };

  

  // --- Конец обработчиков для модального окна создания задачи --- 
  
  // ---Изменение статуса задачи ---
  const handleChangeStatus = async (taskId: number, action: 'start' | 'complete' | 'check' | 'cancel') => {
      if (isPerformingAction || isCreateTaskModalOpen) return;

      setIsPerformingAction(true); 
      setChangingStatusTaskId(taskId); 
      setError(null); 

      console.log(`Attempting to change status for task ID: ${taskId} with action: ${action}`);

      try {
          const endpoint = `/api/cleaningtasks/${taskId}/${action}/`; 

          const response = await api.post(endpoint); 

          if (response.status === 200) {
              console.log(`Status change successful for task ID: ${taskId} to ${action}.`);
              
              fetchCleaningTasks(selectedDate);
              // TODO: Возможно, обновить сводные данные, если они связаны со статусами задач
          } else {
               setError(`Не удалось изменить статус задачи ${taskId}. Статус: ` + response.status);
               console.error(`Status change failed for task ID: ${taskId}. Status:`, response.status);
          }

      } catch (err) {
          console.error(`Error changing status for task ID: ${taskId}:`, err);
           if (axios.isAxiosError(err) && err.response) {
               setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || `Ошибка при изменении статуса задачи ${taskId}.`);
           } else if (axios.isAxiosError(err) && err.request) {
               setError(`Нет ответа от сервера при изменении статуса задачи ${taskId}.`);
           } else {
               setError(`Произошла непредвиденная ошибка при изменении статуса задачи ${taskId}.`);
           }
      } finally {
          setIsPerformingAction(false); 
          setChangingStatusTaskId(null); 
      }
    }


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
              return { icon: <CheckCircle size={16} className="text-teal-500 mr-1"/>, text: 'Проверена' }; // Или другая иконка для "Проверена"
          case 'canceled':
              return { icon: <XCircle size={16} className="text-red-600 mr-1"/>, text: 'Отменена' }; // Цвет изменен на красный
          case 'on_hold':
              return { icon: <PauseCircle size={16} className="text-gray-500 mr-1"/>, text: 'Приостановлена' };
          default:
              return { icon: null, text: 'Неизвестный статус' };
      }
  };
    // Функция для определения кнопок действий в зависимости от статуса и роли
 const getTaskActions = (task: CleaningTask) => {
      const actions = [];
      const isActionInProgress = isPerformingAction || isCreateTaskModalOpen || changingStatusTaskId === task.id; // Объединенная проверка для отключения

      // Кнопка "Просмотр" всегда доступна (если не отключена общим состоянием)
      actions.push({
          label: 'Просмотр',
          icon: <Eye size={16}/>,
          onClick: () => router.push(`housekeeping/${task.id}`), // TODO: Реализовать просмотр деталей задачи
          color: 'text-blue-600 hover:text-blue-900',
          disabled: isActionInProgress, // Используем объединенную проверку
      });

      // Логика кнопок смены статуса в зависимости от роли и текущего статуса
      if (user) { // Проверяем, что user объект существует
          switch (task.status) {
              case 'assigned': // Назначена
              case 'on_hold': // Приостановлена
                  // Кнопка "Начать" - доступна горничной, которой назначена задача, или менеджеру/админу
                  if ((user.role === 'housekeeper' && task.assigned_to === user.id) || user.role === 'manager' || user.role === 'front-desk') {
                       actions.push({
                           label: changingStatusTaskId === task.id ? 'Начало...' : 'Начать',
                           icon: changingStatusTaskId === task.id ? <Spinner size={16}/> : <Play size={16}/>,
                           onClick: () => handleViewTaskDetails(task.id),
                           color: 'text-green-600 hover:text-green-900',
                           disabled: isActionInProgress, // Используем объединенную проверку
                       });
                  }
                  // Кнопка "Отменить" - доступна менеджеру/админу
                  if (user.role === 'manager' || user.role === 'front-desk') {
                      actions.push({
                           label: changingStatusTaskId === task.id ? 'Отмена...' : 'Отменить',
                           icon: changingStatusTaskId === task.id ? <Spinner size={16}/> : <XCircle size={16}/>,
                           onClick: () => handleChangeStatus(task.id, 'cancel'),
                           color: 'text-red-600 hover:text-red-900',
                           disabled: isActionInProgress, // Используем объединенную проверку
                       });
                  }
                  break;

              case 'in_progress': // В процессе
                  // Кнопка "Завершить" - доступна горничной, которой назначена задача, или менеджеру/админу
                   if ((user.role === 'housekeeper' && task.assigned_to === user.id) || user.role === 'manager' || user.role === 'front-desk') {
                       actions.push({
                           label: changingStatusTaskId === task.id ? 'Завершение...' : 'Завершить',
                           icon: changingStatusTaskId === task.id ? <Spinner size={16}/> : <CheckSquare size={16}/>,
                           onClick: () => handleChangeStatus(task.id, 'complete'),
                           color: 'text-yellow-600 hover:text-yellow-900',
                           disabled: isActionInProgress, // Используем объединенную проверку
                       });
                   }
                   // Кнопка "Приостановить" - доступна горничной, которой назначена задача, или менеджеру/админу
                    // if ((user.role === 'housekeeper' && task.assigned_to === user.id) || user.role === 'manager' || user.role === 'front-desk') {
                    //     actions.push({
                    //         label: changingStatusTaskId === task.id ? 'Приостановка...' : 'Приостановить',
                    //         icon: changingStatusTaskId === task.id ? <Spinner size={16}/> : <PauseCircle size={16}/>,
                    //         onClick: () => handleChangeStatus(task.id, 'on_hold'), // Предполагаем, что действие называется 'on_hold'
                    //         color: 'text-gray-600 hover:text-gray-900',
                    //         disabled: isActionInProgress, // Используем объединенную проверку
                    //     });
                    // }
                   // Кнопка "Отменить" - доступна менеджеру/админу
                   if (user.role === 'manager' || user.role === 'front-desk') {
                       actions.push({
                            label: changingStatusTaskId === task.id ? 'Отмена...' : 'Отменить',
                            icon: changingStatusTaskId === task.id ? <Spinner size={16}/> : <XCircle size={16}/>,
                            onClick: () => handleChangeStatus(task.id, 'cancel'),
                            color: 'text-red-600 hover:text-red-900',
                            disabled: isActionInProgress, // Используем объединенную проверку
                        });
                   }
                  break;

              case 'completed': // Выполнена
              case 'waiting_inspection': // Ожидает проверки
                  // Кнопка "Проверить" - доступна менеджеру/админу
                  if (user.role === 'manager' || user.role === 'front-desk') {
                      actions.push({
                          label: changingStatusTaskId === task.id ? 'Проверка...' : 'Проверить',
                          icon: changingStatusTaskId === task.id ? <Spinner size={16}/> : <Eye size={16}/>, // Или другая иконка для проверки
                          onClick: () => handleChangeStatus(task.id, 'check'),
                          color: 'text-teal-600 hover:text-teal-900',
                          disabled: isActionInProgress, // Используем объединенную проверку
                      });
                  }
                  // Кнопка "Отменить" - доступна менеджеру/админу
                   if (user.role === 'manager' || user.role === 'front-desk') {
                       actions.push({
                            label: changingStatusTaskId === task.id ? 'Отмена...' : 'Отменить',
                            icon: changingStatusTaskId === task.id ? <Spinner size={16}/> : <XCircle size={16}/>,
                            onClick: () => handleChangeStatus(task.id, 'cancel'),
                            color: 'text-red-600 hover:text-red-900',
                            disabled: isActionInProgress, // Используем объединенную проверку
                        });
                   }
                  break;

              case 'checked': // Проверена
                  // Кнопка "Отменить" - доступна менеджеру/админу (если нужно отменить проверенную задачу)
                   if (user.role === 'manager' || user.role === 'front-desk') {
                       actions.push({
                            label: changingStatusTaskId === task.id ? 'Отмена...' : 'Отменить',
                            icon: changingStatusTaskId === task.id ? <Spinner size={16}/> : <XCircle size={16}/>,
                            onClick: () => handleChangeStatus(task.id, 'cancel'),
                            color: 'text-red-600 hover:text-red-900',
                            disabled: isActionInProgress, // Используем объединенную проверку
                        });
                   }
                   // TODO: Возможно, добавить кнопку "Редактировать" для менеджера/админа
                   // actions.push({
                   //      label: 'Редактировать',
                   //      icon: <Edit size={16}/>,
                   //      onClick: () => console.log('Edit task', task.id), // TODO: Реализовать редактирование
                   //      color: 'text-blue-600 hover:text-blue-900',
                   //      disabled: isActionInProgress,
                   // });
                  break;

              case 'canceled': // Отменена
                  // Обычно нет кнопок смены статуса из этого состояния, кроме, возможно, повторного назначения через редактирование
                  // TODO: Возможно, добавить кнопку "Редактировать" для менеджера/админа
                  // actions.push({
                  //      label: 'Редактировать',
                  //      icon: <Edit size={16}/>,
                  //      onClick: () => console.log('Edit task', task.id), // TODO: Реализовать редактирование
                  //      color: 'text-blue-600 hover:text-blue-900',
                  //      disabled: isActionInProgress,
                  // });
                  break;
          }

           // Кнопки редактирования и удаления (обычно для менеджера/админа)
           if (user.role === 'manager' || user.role === 'housekeeper') {
               // TODO: Добавить кнопки редактирования и удаления
               // actions.push({
               //     label: 'Редактировать',
               //     icon: <Edit size={16}/>,
               //     onClick: () => console.log('Edit task', task.id), // TODO: Реализовать редактирование
               //     color: 'text-blue-600 hover:text-blue-900',
               //     disabled: isActionInProgress,
               // });
               // actions.push({
               //     label: 'Удалить',
               //     icon: <Trash2 size={16}/>,
               //     onClick: () => console.log('Delete task', task.id), // TODO: Реализовать удаление
               //     color: 'text-red-600 hover:text-red-900',
               //      disabled: isActionInProgress,
               // });
           }
      }


      return actions;
  };

  // TODO: Обработчики для редактирования, изменения статуса, удаления задач
  // Например: handleEditTask, handleChangeStatus, handleDeleteTaskClick

  // TODO: Обработчики для назначения задач горничным (drag-and-drop или кнопки)
  // TODO: Обработчики для кнопок "Auto Assign" и "Assign Selected"

  // TODO: Добавить модальные окна для форм редактирования и подтверждений


  // --- Условный рендеринг ---

  // Если AuthContext еще загружается, не рендерим содержимое страницы (Layout уже показывает спиннер)
  if (isAuthLoading) {
      return null;
  }

   // Проверка роли: доступно 'front-desk', 'manager', 'housekeeper'
   if (!user || !['front-desk', 'manager', 'housekeeper'].includes(user.role)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="p-8 rounded-lg shadow-lg bg-white max-w-md w-full text-center text-red-600 font-bold">
                    У вас нет прав для просмотра этой страницы.
                </div>
            </div>
        );
    }

    // Если данные загружаются И модальное окно создания задачи НЕ открыто, показываем спиннер на всю страницу
    if (isLoadingData && !isCreateTaskModalOpen) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Spinner/>
            </div>
        );
    }

   // Если есть общая ошибка (например, ошибка доступа или ошибка загрузки данных) И модальное окно создания задачи НЕ открыто
   if (error && !isLoadingData && !isCreateTaskModalOpen) { // Показываем ошибку только если загрузка завершена и модальное окно закрыто
       return (
           <ErrorMessage
               message={error}
               // При повторной попытке загружаем все необходимые данные
               onRetry={() => {
                   setIsLoadingData(true); // Снова устанавливаем общую загрузку
                   setError(null); // Сбрасываем ошибку перед повторной попыткой
                   Promise.all([
                       fetchCleaningTasks(selectedDate),
                       fetchHousekeepers(),
                       fetchRooms(),
                       fetchZones(),
                       fetchCleaningTypes()
                   ])
                       .catch(err => console.error("Error during retry fetch on housekeeping page:", err))
                       .finally(() => setIsLoadingData(false));
               }}
               isLoading={isLoadingData} // Передаем состояние загрузки
           />
       );
   }


  // Если все успешно загружено, отображаем основной макет страницы
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Уборка</h1>

      {/* Панель управления: выбор даты, кнопки действий */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
           {/* Выбор даты */}
           <div className="flex items-center space-x-2">
                <CalendarDays size={20} className="text-gray-600"/>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border rounded-md text-gray-700 focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
           </div>

           {/* Кнопки действий (например, Автоназначение, Назначить выбранное) */}
           <div className="flex space-x-2">
               {/* TODO: Условное отображение кнопок в зависимости от роли */}
               <button
                   // onClick={handleAutoAssign} TODO: Реализовать обработчик
                   disabled={isPerformingAction || isCreateTaskModalOpen}
                   className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out text-sm"
               >
                   Автоназначение
               </button>
               <button
                   // onClick={handleAssignSelected} TODO: Реализовать обработчик
                   disabled={isPerformingAction || isCreateTaskModalOpen}
                   className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out text-sm"
               >
                   Назначить выбранное
               </button>
           </div>

           {/* TODO: Кнопка создания новой задачи (если нужно создавать вручную) */}
            {/* Показываем кнопку создания задачи, например, только для менеджеров или персонала службы приема */}
            {(user?.role === 'manager' || user?.role === 'front-desk') && ( // <-- Условное отображение по роли
                 <button
                     onClick={handleCreateTaskClick} // <-- Обработчик клика
                     // Отключаем кнопку, если данные еще загружаются или модальное окно уже открыто
                     disabled={isLoadingData || isCreateTaskModalOpen || isPerformingAction} 
                     className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <Plus size={18} className="inline mr-1"/> Создать задачу
                </button>
            )}

      </div>


      {/* Основной контент: две колонки */}
      <div className="flex flex-col md:flex-row gap-6">

          {/* Левая колонка: Список горничных */}
          <div className="md:w-1/3 bg-white shadow-md rounded-lg overflow-hidden p-4">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><UserIcon size={20} className="mr-2"/> Горничные</h2>
              {/* TODO: Поле поиска горничных */}
              <div className="mb-4 relative">
                  <input
                      type="text"
                      placeholder="Поиск горничных..."
                      className="w-full px-3 py-2 border rounded-md text-gray-700 focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search size={20} className="absolute right-3 top-3 text-gray-400"/>
              </div>

              {/* Список горничных */}
              <div className="space-y-4">
                  {housekeepers.length > 0 ? (
                      housekeepers.map(housekeeper => (
                          <div key={housekeeper.id} className="bg-gray-100 p-3 rounded-md shadow-sm border border-gray-200">
                              <p className="font-semibold text-gray-800">{housekeeper.first_name} {housekeeper.last_name}</p>
                              {/* TODO: Отобразить количество назначенных задач или время работы */}
                              <p className="text-sm text-gray-600">Назначено: {/* TODO: Количество задач */}</p>
                              {/* TODO: Добавить зону для перетаскивания задач */}
                              <div className="mt-2 border-t pt-2 border-gray-300 min-h-16">
                                  {/* Здесь будут перетаскиваемые задачи */}
                                  <p className="text-center text-gray-500 text-xs">Перетащите задачи сюда</p>
                              </div>
                          </div>
                      ))
                  ) : (
                      <p className="text-center text-gray-500">Горничные не найдены.</p>
                  )}
              </div>
          </div>

          {/* Правая колонка: Неназначенные задачи / Запланированные задачи */}
          <div className="md:w-2/3 bg-white shadow-md rounded-lg overflow-hidden p-4">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Задачи уборки ({selectedDate})</h2>
              {/* TODO: Поле поиска задач */}
              <div className="mb-4 relative">
                  <input
                      type="text"
                      placeholder="Поиск задач..."
                      className="w-full px-3 py-2 border rounded-md text-gray-700 focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search size={20} className="absolute right-3 top-3 text-gray-400"/>
              </div>

              {/* Список задач (Таблица или список карточек) */}
              {/* Пока используем таблицу, как в базовой версии */}
               <div className="overflow-x-auto"> {/* Добавляем горизонтальный скролл для маленьких экранов */}
                   <table className="min-w-full leading-normal">
                       <thead>
                           <tr>
                               <th className="px-3 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                   Комната/Зона
                               </th>
                               <th className="px-3 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                   Тип уборки
                               </th>
                               <th className="px-3 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                   Статус
                               </th>
                                <th className="px-3 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                   Назначена
                               </th>
                               <th className="px-3 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                   Время
                               </th>
                                <th className="px-3 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                   Действия
                               </th>
                           </tr>
                       </thead>
                       <tbody>
                           {/* Отображаем задачи, если они есть */}
                           {cleaningTasks.length > 0 ? (
                               cleaningTasks.map(task => (
                                   <DraggableTaskRow
                                        key={task.id} // Ключ важен для React списков
                                        task={task}
                                        getStatusDisplay={getStatusDisplay}
                                        getTaskActions={getTaskActions}
                                        isPerformingAction={isPerformingAction}
                                        isCreateTaskModalOpen={isCreateTaskModalOpen}
                                        assigningTaskId={assigningTaskId}
                                        changingStatusTaskId={changingStatusTaskId}
                                        user={user} // Передаем user
                                   />
                               ))

                           ) : (
                               // Сообщение, если список задач пуст
                               <tr>
                                   <td colSpan={6} className="text-center text-gray-500 py-4">Задачи по уборке на выбранную дату не найдены.</td>
                               </tr>
                           )}
                       </tbody>
                   </table>
               </div>
               {/* TODO: Добавить пагинацию для задач */}
          </div>
      </div>

       {/* TODO: Добавить модальные окна для форм редактирования и подтверждения удаления */}

       {/* --- Модальное окно для формы создания задачи --- */}
       {/* Рендерим модальное окно, если isCreateTaskModalOpen === true */}
       {isCreateTaskModalOpen && (
           <Modal isOpen={isCreateTaskModalOpen} onClose={handleCreateTaskCancel} contentClasses="max-w-md"> {/* Используем универсальный компонент Modal */}
               {/* Передаем необходимые данные (комнаты, зоны, типы уборок, горничные) и обработчики */}
               <CleaningTaskForm
                   availableRooms={rooms}
                   availableZones={zones}
                   availableCleaningTypes={cleaningTypes}
                   availableHousekeepers={housekeepers}
                   onSuccess={handleCreateTaskSuccess}
                   onCancel={handleCreateTaskCancel}
               />
                
           </Modal>
       )}
       {/* --- Конец модального окна для формы создания задачи --- */}


    </div>
  );
}
