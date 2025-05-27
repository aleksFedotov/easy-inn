'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import api from '@/lib/api';
import axios from 'axios';
import { ChecklistItem, CleaningTask } from '@/lib/types';
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

export default function CleaningTaskDetailsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const taskId = params.id;


    const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();

    const [taskDetails, setTaskDetails] = useState<CleaningTask | null>(null);
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
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
                setChecklistItems(response.data.checklist_data?.items || []);
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
        if (checklistItems.length > 0) {
            const allChecked = checklistItems.every(item => checkedItemIds.includes(item.id));
            setIsChecklistComplete(allChecked);
        } else {
            setIsChecklistComplete(false); // Если нет пунктов, считаем, что не завершен
        }
    }, [checklistItems, checkedItemIds]);

    const handleStartCleaning = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await api.patch(`/api/cleaningtasks/${taskId}/start/` );
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
            await api.patch(`/api/cleaningtasks/${taskId}/complete/`,);
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

    const handleChecklistItemChange = (itemId: number) => {
        setCheckedItemIds(prevIds => {
            if (prevIds.includes(itemId)) {
                return prevIds.filter(id => id !== itemId);
            } else {
                return [...prevIds, itemId];
            }
        });
    };


    const renderActions = () => {
        if (!user || !taskDetails) return null;

        if (user.role === 'housekeeper') {
            if (taskDetails.status === 'assigned') {
                return (
                    <Button variant="default" onClick={handleStartCleaning}>
                        <Play className="mr-2 h-4 w-4" />
                        Начать уборку
                    </Button>
                );
            } else if (taskDetails.status === 'in_progress') {
                return (
                    <Button variant="default" onClick={handleFinishCleaning} disabled={!isChecklistComplete}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Завершить уборку
                    </Button>
                );
            }
        } else if (['manager', 'front-desk'].includes(user.role)) {
            if (taskDetails.status === 'assigned' || taskDetails.status === 'in_progress') {
                return (
                    <>
                        <Button variant="outline" onClick={() => router.push(`/housekeeping/${taskId}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Редактировать
                        </Button>
                        <Button variant="destructive" onClick={handleCancelTask}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Отменить
                        </Button>
                    </>
                );
            } else if (taskDetails.status === 'waiting_check' || taskDetails.status === 'completed') {
                return (
                    <Button variant="default" onClick={handleFinishInspection} disabled={!isChecklistComplete}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Завершить проверку
                    </Button>
                );
            }
        }
        return null;
    };

    const canEditChecklist =
        (user?.role === 'housekeeper' && taskDetails?.status === 'in_progress') ||
        ((user?.role === 'manager' || user?.role === 'front-desk') && taskDetails?.status === 'waiting_check');


    if (isLoading || isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Spinner />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <AuthRequiredMessage/>;
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
                                        <span>Тип уборки: {taskDetails.cleaning_type_name}</span>
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

                        {/* Чек-лист */}
                        {taskDetails.checklist_data && taskDetails.checklist_data.items && taskDetails.checklist_data.items.length > 0 && (
                            <div className="mt-6 border-t pt-4">
                                <h3 className="text-lg font-semibold mb-2">
                                    <ClipboardList className="mr-2 inline-block h-5 w-5" />
                                    Чек-лист
                                </h3>
                                <ul>
                                    {checklistItems.map((item, index) => (
                                        <li key={index} className="flex items-center py-2 border-b last:border-b-0">
                                            <input
                                                type="checkbox"
                                                checked={checkedItemIds.includes(item.id)}
                                                onChange={() => handleChecklistItemChange(item.id)}
                                                className="mr-2 h-4 w-4"
                                                disabled={
                                                    !canEditChecklist
                                                }
                                            />
                                            <span>{item.text}</span>
                                        </li>
                                    ))}
                                </ul>
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