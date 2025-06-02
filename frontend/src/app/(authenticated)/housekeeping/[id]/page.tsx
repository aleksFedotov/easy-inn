'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Checklist, CleaningTask, ChecklistProgress } from '@/lib/types/housekeeping';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css'; //  Подключаем стили





interface ChecklistsState {
  [checklistId: number]: ChecklistProgress;
}

export default function CleaningTaskDetailsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const taskId = params.id;


    const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();

    const [taskDetails, setTaskDetails] = useState<CleaningTask | null>(null);
    const [checklistData, setChecklistData] = useState<Checklist[]>([]);
    const [checkedItemIds, setCheckedItemIds] = useState<number[]>([]);
    const [checklistsState, setChecklistsState] = useState<ChecklistsState>({}); 
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
                // console.log('Fetched task details:', response.data);
                if (response.data.checklist_data && response.data.checklist_data.length > 0) {
                    setChecklistData(response.data.checklist_data); 
        
                    setCheckedItemIds([]); 
                } else {
                    setChecklistData([]);  
                    setIsChecklistComplete(true); 
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
        const canFinishCleaning = Object.values(checklistsState).every(
        ({ total, completed }) => completed === total
        );
        setIsChecklistComplete(canFinishCleaning);
    }, [checklistsState]);

    const handleChecklistChange = useCallback((checklistId: number, progress: ChecklistProgress) => {
        setChecklistsState((prev) => ({
            ...prev,
            [checklistId]: progress
        }));
    }, []);

    const handleStartCleaning = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await api.patch(`/api/cleaningtasks/${taskId}/start/`);
            await fetchTaskDetails();
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
            console.log("trying to finish inspection with checked items:", checkedItemIds);
            // Отправляем список отмеченных пунктов при завершении уборки
            const response = await api.patch(`/api/cleaningtasks/${taskId}/complete/`);
            console.log('Finish inspection response:', response.data);
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
            await api.patch(`/api/cleaningtasks/${taskId}/check/`);
           
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

    const totalProgress = useMemo(() => {
    if (checklistData.length === 0) return 0;

    const total = checklistData.reduce((sum, checklist) => {
        const checklistProgress = checklistsState[checklist.id];
        if (!checklistProgress) return sum; //  Если нет данных о прогрессе, не учитываем

        const completed = checklistProgress.completed || 0;
        const totalItems = checklistProgress.total || 0;
        return sum + (totalItems === 0 ? 100 : (completed / totalItems) * 100);
    }, 0);

    return checklistData.length === 0 ? 0 : total / checklistData.length;
}, [checklistsState, checklistData]);

    // Функция для рендеринга действий в зависимости от роли пользователя и статуса задачи

    const renderActions = () => {
        if (!user || !taskDetails) return null;

        if (user.role === USER_ROLES.HOUSEKEEPER) {
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
                       
                        <div className="w-30 mx-auto">
                            <CircularProgressbar
                                value={totalProgress}
                                text={`${Math.round(totalProgress)}%`}
                                styles={buildStyles({
                                    textColor: 'black',
                                    pathColor: '#0070f3', 
                                    trailColor: '#d6d6d6',
                                })}
                            />
                            <p className="text-center mt-2 text-sm text-gray-500">
                                Общий прогресс
                            </p>
                        </div>
                    

                        {/* Заменяем старый рендеринг чек-листа на ChecklistCardList */}
                        {checklistData.length > 0 && (
                            checklistData.map((checklist) => {
                                return (
                                    <ChecklistCardList
                                        key={checklist.id}
                                        checklist={checklist} // Передаем массив с одним чек-листом
                                        onChange={handleChecklistChange}
                                    />
                                );
                            }))}
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