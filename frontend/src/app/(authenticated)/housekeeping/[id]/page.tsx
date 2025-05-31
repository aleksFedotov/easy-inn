'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import api from '@/lib/api';
import axios from 'axios';
import {
    Building,
    FileText,
    User as UserIcon,
    BookOpen,
    Clock,
    Edit,
    ClipboardList,
    CheckCircle,
    XCircle,
    Play,
    CircleDotDashed,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import AuthRequiredMessage from '@/components/AuthRequiredMessage';
import getCleaningStatusColor from '@/lib/cleaning/GetCLeaningStatusColor';
import { CLEANICNG_STATUSES, USER_ROLES } from '@/lib/constants';
import ChecklistCardList from '@/components/cleaning/ChecklistCardList';
import { Checklist, CleaningTask } from '@/lib/types';



export default function CleaningTaskDetailsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const taskId = params.id;


    const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();

    const [taskDetails, setTaskDetails] = useState<CleaningTask | null>(null);
    // Изменяем состояние для хранения всего объекта Checklist, а не только items
    const [checklistData, setChecklistData] = useState<Checklist[]>([]);
    const [checkedItemIds, setCheckedItemIds] = useState<number[]>([]);
    const [isChecklistComplete, setIsChecklistComplete] = useState<boolean>(false);

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
            const response = await api.get(`/api/cleaningtasks/${taskId}/`);
            if (response.status === 200) {
                setTaskDetails(response.data);
                // Если `checklist_data` приходит как массив шаблонов, возьмем первый или нужный
                // В данном случае, так как задача связана с одним типом уборки,
                // предполагаем, что `checklist_data` в ответе будет массивом,
                // и мы возьмем первый подходящий шаблон.
                if (response.data.checklist_data && response.data.checklist_data.length > 0) {
                    setChecklistData(response.data.checklist_data); // Берем первый шаблон из списка
                    // Инициализируем checkedItemIds как пустой массив, так как 'checked' нет на бэкенде
                    // Пользователь будет отмечать пункты на фронтенде
                
                    setCheckedItemIds([]); 
                } else {
                    setChecklistData([]); // Нет связанных чек-листов
                    setIsChecklistComplete(true); // Если нет чек-листа, считаем его завершенным
                }

            } else if (response.status === 404) {
                setError(`Задача с ID ${taskId} не найдена.`);
            } else {
                setError(`Ошибка при загрузке задачи: ${response.status}`);
            }
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data));
            } else {
                setError('Произошла ошибка при загрузке задачи.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        fetchTaskDetails();
    }, [fetchTaskDetails]);

    useEffect(() => {
        // Проверяем, все ли пункты чек-листа отмечены
        if (checklistData && checklistData.length > 0) {
            const allChecked = checklistData.every(checklist => checklist.includes(item.id));
            setIsChecklistComplete(allChecked);
        } else {
            setIsChecklistComplete(true); // Если нет чек-листа или пунктов, считаем его завершенным
        }
    }, [checklistData, checkedItemIds]);

    const handleStartCleaning = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await api.patch(`/api/cleaningtasks/${taskId}/start/`);
            fetchTaskDetails();
        } catch (err) {
            console.error('Error during start cleaning:', err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при удалении бронирования.');
            } else if (axios.isAxiosError(err) && err.request) {
                setError('Нет ответа от сервера при начавле уборки.');
            } else {
                setError('Не удалось начать уборку.');
            }

        } finally {
            setIsLoading(false);
        }

    };

    const handleFinishCleaning = async () => {
        if (!isChecklistComplete) {
            setError("Пожалуйста, завершите все пункты чек-листа.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            // Отправляем список отмеченных пунктов при завершении уборки
            await api.patch(`/api/cleaningtasks/${taskId}/complete/`, {
                completed_checklist_items: checkedItemIds
            });
            fetchTaskDetails();
        } catch (err) {
            console.error('Error during start cleaning:', err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при удалении бронирования.');
            } else if (axios.isAxiosError(err) && err.request) {
                setError('Нет ответа от сервера при завершении уборки.');
            } else {
                setError('Не удалось завершить уборку.');
            }

        } finally {
            setIsLoading(false);
        }
    };

    const handleFinishInspection = async () => {
        if (!isChecklistComplete) {
            setError("Пожалуйста, проверьте все пункты чек-листа.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            // Отправляем список отмеченных пунктов при завершении проверки
            await api.patch(`/api/cleaningtasks/${taskId}/check/`, {
                completed_checklist_items: checkedItemIds
            });
            fetchTaskDetails(); // Обновляем данные после изменения статуса
        } catch (err) {
            console.error('Error during start cleaning:', err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при удалении бронирования.');
            } else if (axios.isAxiosError(err) && err.request) {
                setError('Нет ответа от сервера при завершении уборки.');
            } else {
                setError('Не удалось завершить проверку.');
            }

        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelTask = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await api.patch(`/api/cleaningtasks/${taskId}/cancel/`);
            fetchTaskDetails(); // Обновляем данные после изменения статуса
        } catch (err) {
            console.error('Error during start cleaning:', err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при удалении бронирования.');
            } else if (axios.isAxiosError(err) && err.request) {
                setError('Нет ответа от сервера при завершении уборки.');
            } else {
                setError('Не удалось отменить задачу.');
            }

        } finally {
            setIsLoading(false);
        }
    };

     const handleChecklistItemChange = (checklistId: number,itemId: number) => {
        setCheckedItemIds(prevIds => {
            if (prevIds.includes(itemId)) {
                return prevIds.filter(id => id !== itemId);
            } else {
                return [...prevIds, itemId];
            }
        });
    };

    // Обновленная функция для изменения состояния пункта чек-листа
    // const handleChecklistItemChange = async (checklistId: number, itemId: number) => {
    //     // Определяем новое состояние для пункта
    //     const isCurrentlyChecked = checkedItemIds.includes(itemId);
    //     const newCheckedState = !isCurrentlyChecked;

    //     // Оптимистичное обновление UI
    //     setCheckedItemIds(prevIds => {
    //         if (newCheckedState) {
    //             return [...prevIds, itemId];
    //         } else {
    //             return prevIds.filter(id => id !== itemId);
    //         }
    //     });

    //     try {
    //         // Отправляем PATCH запрос на бэкенд для обновления статуса пункта
    //         // Предполагается, что у вас есть API endpoint для этого:
    //         // PATCH /api/cleaningtasks/{taskId}/checklist_items/{itemId}/
    //         // Или, что более вероятно, вы отправляете весь список отмеченных ID
    //         await api.patch(`/api/cleaningtasks/${taskId}/update_checklist_items/`, {
    //             checklist_template_id: checklistId, // ID шаблона чек-листа
    //             checked_item_ids: newCheckedState
    //                 ? [...checkedItemIds, itemId] // Если отмечаем, добавляем ID
    //                 : checkedItemIds.filter(id => id !== itemId) // Если снимаем отметку, удаляем ID
    //         });
    //         // Если успешно, UI уже обновлен.
    //         // Если нужно, можно повторно получить детали задачи для полной синхронизации
    //         // fetchTaskDetails();
    //     } catch (err) {
    //         console.error('Error updating checklist item:', err);
    //         // Откатываем UI в случае ошибки
    //         setCheckedItemIds(prevIds => {
    //             if (isCurrentlyChecked) { // Если изначально был отмечен, возвращаем обратно
    //                 return [...prevIds, itemId];
    //             } else { // Если изначально не был отмечен, убираем из списка
    //                 return prevIds.filter(id => id !== itemId);
    //             }
    //         });
    //         // Выводим сообщение об ошибке пользователю
    //         if (axios.isAxiosError(err) && err.response) {
    //             setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при обновлении пункта чек-листа.');
    //         } else {
    //             setError('Произошла непредвиденная ошибка при обновлении пункта чек-листа.');
    //         }
    //     }
    // };

    // Функция для удаления чек-листа (если это применимо к вашей логике)
    // В данном контексте, чек-лист связан с задачей, поэтому удаление всего чек-листа
    // может быть непрямым действием. Возможно, это действие для менеджера,
    // чтобы удалить шаблон чек-листа, а не экземпляр, связанный с задачей.
    // Если это удаление шаблона, то этот метод должен быть в другом месте.
    // Если это "отвязать" чек-лист от задачи, то логика будет другой.
    // Для демонстрации оставим заглушку.
    // const handleDeleteChecklist = async (checklistId: number) => {
    //     console.log(`Attempting to delete checklist with ID: ${checklistId}`);
    //     // Здесь должна быть логика удаления чек-листа, возможно, через другой API
    //     // Или это действие не должно быть доступно здесь, если чек-лист жестко привязан к задаче.
    //     setError("Удаление чек-листа из задачи пока не поддерживается.");
    // };


    const renderActions = () => {
        if (!user || !taskDetails) return null;

        if (user.role === 'housekeeper') {
            if (taskDetails.status === CLEANICNG_STATUSES.ASSIGNED) {
                return (
                    <Button variant="default" onClick={handleStartCleaning}>
                        <Play className="mr-2 h-4 w-4" />
                        Начать уборку
                    </Button>
                );
            } else if (taskDetails.status === CLEANICNG_STATUSES.IN_PROGRESS) {
                return (
                    <Button variant="default" onClick={handleFinishCleaning} disabled={!isChecklistComplete}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Завершить уборку
                    </Button>
                );
            }
        } else if ([USER_ROLES.MANAGER, USER_ROLES.FRONT_DESK].includes(user.role)) {
            return (
                <>
                    {(taskDetails.status === CLEANICNG_STATUSES.WAITING_CHECK || taskDetails.status === CLEANICNG_STATUSES.COMPLETED) &&
                        <Button variant="default" onClick={handleFinishInspection} disabled={!isChecklistComplete}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Завершить проверку
                        </Button>
                    }
                    <Button variant="outline" onClick={() => router.push(`/housekeeping/${taskId}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Редактировать
                    </Button>
                    <Button variant="destructive" onClick={handleCancelTask}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Отменить
                    </Button>
                </>
            )
        }
        return null;
    };

    const canEditChecklist =
        (user?.role === USER_ROLES.HOUSEKEEPER && taskDetails?.status === CLEANICNG_STATUSES.IN_PROGRESS) ||
        ((user?.role === USER_ROLES.MANAGER || user?.role === USER_ROLES.FRONT_DESK) && taskDetails?.status === CLEANICNG_STATUSES.WAITING_CHECK);


    if (isLoading || isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Spinner />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <AuthRequiredMessage />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <ErrorMessage message={error} onRetry={fetchTaskDetails} isLoading={isLoading} />
            </div>
        );
    }

    if (!taskDetails && taskId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="rounded-md border bg-muted p-4">
                    Задача уборки с ID {taskId} не найдена.
                </div>
            </div>
        );
    }

    if (taskDetails) {
        // Оборачиваем checklistData в массив, так как ChecklistCardList ожидает массив
        const checklistsToDisplay = checklistData ? [checklistData] : [];

        return (
            <div className="container mx-auto py-10">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    &#8592; Назад к списку задач
                </Button>

                <Card className="shadow-md">
                    <CardHeader className="space-y-4">
                        <CardTitle className="text-2xl font-bold">
                            Задача уборки: {taskDetails.room_number || taskDetails.zone_name || "Общая"}
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                            Подробная информация о задаче.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">
                                    <FileText className="mr-2 inline-block h-5 w-5" />
                                    Детали
                                </h3>
                                <ul className="list-none space-y-2">
                                    <li className="flex items-center">
                                        <Building className="mr-2 h-4 w-4" />
                                        <span>
                                            {taskDetails.room_number ? `Комната: ${taskDetails.room_number}` : `Зона: ${taskDetails.zone_name}`}
                                        </span>
                                    </li>
                                    <li className="flex items-center">
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        <span>Тип уборки: {taskDetails.cleaning_type_display}</span>
                                    </li>
                                    <li className="flex items-center">
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        <span>Назначена: {taskDetails.assigned_to_name || "Не назначена"}</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Clock className="mr-2 h-4 w-4" />
                                        <span>
                                            {taskDetails.due_time
                                                ? `Время: ${format(new Date(taskDetails.due_time), 'HH:mm', { locale: ru })}`
                                                : "Время не указано"}
                                        </span>
                                    </li>
                                    <li className="flex items-center">
                                        <ClipboardList className="mr-2 h-4 w-4" />
                                        <span>Описание: {taskDetails.notes || "Нет описания"}</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2">
                                    <CircleDotDashed className="mr-2 inline-block h-5 w-5" />
                                    Статус
                                </h3>
                                <Badge className={getCleaningStatusColor(taskDetails.status)}>
                                    {taskDetails.status_display}
                                </Badge>
                            </div>
                        </div>

                        {/* Заменяем старый рендеринг чек-листа на ChecklistCardList */}
                        {checklistsToDisplay.length > 0 && (
                            <div className="mt-6 border-t pt-4">
                                <h3 className="text-lg font-semibold mb-2">
                                    <ClipboardList className="mr-2 inline-block h-5 w-5" />
                                    Чек-лист
                                </h3>
                                <ChecklistCardList
                                    checklists={checklistsToDisplay}
                                    checkedItemIds={checkedItemIds}
                                    onChecklistItemChange={handleChecklistItemChange}
                                    // onDeleteChecklist={handleDeleteChecklist} // Передаем заглушку или реальную функцию
                                    canEditChecklist={canEditChecklist}
                                />
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        {renderActions()}
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="rounded-md border bg-muted p-4">
                Неизвестная ошибка при загрузке...
            </div>
        </div>
    );
}