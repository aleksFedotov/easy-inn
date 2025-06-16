'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import ChecklistCardList from '@/components/housekeeping/ChecklistCardList';
import { ChecklistProgress } from '@/lib/types/housekeeping';

import { useTaskDetails } from '@/hooks/housekeeping/details/useTaskDetailsData';
import { useTaskActions } from '@/hooks/housekeeping/details/useTaskActions';
import { useChecklistLogic } from '@/hooks/housekeeping/details/useChecklistLogic';
import { TaskHeader } from '@/components/housekeeping/details/TaskHeader';
import { TaskInfo } from '@/components/housekeeping/details/TaskInfo'; 
import { TaskActionsFooter } from '@/components/housekeeping/details/TaskActionsFooter'; 
import { Spinner } from '@/components/spinner';
import AuthRequiredMessage from '@/components/AuthRequiredMessage';
import ErrorMessage from '@/components/ErrorMessage';
import { Button } from "@/components/ui/button";
import {Checklist,CleaningTask } from '@/lib/types/housekeeping';
import { ProgressCircle } from '@/components/housekeeping/details/ProgressCircle';
import { CLEANICNG_STATUSES, USER_ROLES } from '@/lib/constants';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import api from '@/lib/api';
import axios from 'axios';





type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
type CleaningStatus = typeof CLEANICNG_STATUSES[keyof typeof CLEANICNG_STATUSES]

export default function CleaningTaskDetailsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const taskId = params.id;

    const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
    const { taskDetails, isLoading: isTaskLoading, error, fetchTaskDetails } = useTaskDetails(taskId);

    const [allChecklistTemplates, setAllChecklistTemplates] = useState<Checklist[]>([]);
    const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
    const [templatesError, setTemplatesError] = useState<string | null>(null);
    const [isUpdatingTaskChecklists, setIsUpdatingTaskChecklists] = useState(false); // Для отслеживания состояния обновления задачи
    const [isAddDialogOpened, setIsAddDialogOpened] = useState(false); // Для управления диалогом добавления

    
    const { 
        isActionLoading, 
        startCleaning, 
        finishCleaning, 
        startInspection,
        finishInspection, 
        toggleRush 
    } = useTaskActions(taskId, fetchTaskDetails, router);

    const checklistData: Checklist[] = useMemo(() => (taskDetails?.checklist_data as Checklist[] | undefined) || [], [taskDetails]);

    const {
        isChecklistComplete,
        totalProgress,
        updateChecklist
    } = useChecklistLogic(checklistData)

    useEffect(() => {
        const fetchTemplates = async () => {
            if (!taskDetails?.cleaning_type) return;

            setIsTemplatesLoading(true);
            setTemplatesError(null);
            try {
                // Используем axios.get для вашего эндпоинта
                const response = await api.get<Checklist[]>(`/api/checklisttemplates/available_checklists`, {
                    params: {
                        cleaning_type: taskDetails.cleaning_type,
                        all: true,
                    }
                });
                setAllChecklistTemplates(response.data); // Axios возвращает данные в .data
            } catch (err) {
                if (axios.isAxiosError(err) && err.response) {
                    setTemplatesError(err.response?.data?.detail || err.message || "Ошибка загрузки шаблонов чек-листов.");
                } else {
                    setTemplatesError('Неизвестаная ошибка при загрузки шаблонов чек-листов.');
                }
            } finally {
                setIsTemplatesLoading(false);
            }
        };
        
        fetchTemplates();
        
    }, [taskDetails?.cleaning_type]); // Перезагружаем шаблоны, если тип уборки изменился

    // Фильтрация доступных чек-листов для добавления
    const availableChecklistsToAdd = useMemo(() => {
        if (!taskDetails || !allChecklistTemplates) return [];
        const currentAssociatedIds = new Set(taskDetails.associated_checklists);
        return allChecklistTemplates.filter(
            (checklist) => !currentAssociatedIds.has(checklist.id)
        );
    }, [taskDetails, allChecklistTemplates]);


    // Общая функция для обновления associated_checklists задачи
    const updateTaskChecklists = useCallback(async (newChecklistIds: number[]) => {
        if (!taskDetails?.id) return;
        console.log(newChecklistIds)
        setIsUpdatingTaskChecklists(true);
        try {
            // Используем axios.patch для обновления задачи
            await api.patch<CleaningTask>(`/api/cleaningtasks/${taskDetails.id}/`, {
                associated_checklists: newChecklistIds
            });

            fetchTaskDetails();

        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                setTemplatesError(err.response?.data?.detail || err.message || "Ошибка обновления чек-листов задачи:");
            } else {
                setTemplatesError('загрузки шаблонов чек-листов.');
            }
        } finally {
            setIsUpdatingTaskChecklists(false);
            setIsAddDialogOpened(false); // Закрываем диалог после добавления
        }
    }, [taskDetails?.id, fetchTaskDetails]);

    // Обработчик удаления чек-листа
    const handleRemoveChecklist = useCallback((checklistIdToRemove: number) => {
        if (!taskDetails) return;
        const newChecklistIds = taskDetails.associated_checklists.filter(
            (id) => id !== checklistIdToRemove
        );
        updateTaskChecklists(newChecklistIds);
    }, [taskDetails, updateTaskChecklists]);

    // Обработчик добавления чек-листа
    const handleAddChecklist = useCallback((templateIdToAdd: number) => {
        if (!taskDetails) return;
        const newChecklistIds = [...taskDetails.associated_checklists, templateIdToAdd];
        updateTaskChecklists(newChecklistIds);
    }, [taskDetails, updateTaskChecklists]);
    

    const handleChecklistChange = useCallback((checklistId: number, progress: ChecklistProgress) => {
        updateChecklist((prev) => ({
            ...prev,
            [checklistId]: progress
        }));
    }, [updateChecklist]);

    const shouldRenderChecklist = (role : UserRole, status:CleaningStatus) => {
        if (role === USER_ROLES.HOUSEKEEPER) {
            return status !== CLEANICNG_STATUSES.ASSIGNED;
        }
        return status !== CLEANICNG_STATUSES.WAITING_CHECK;
    };

    const shouldShowChecklistManagement =  [USER_ROLES.MANAGER, USER_ROLES.FRONT_DESK].includes(user!.role) ;


    if (isAuthLoading || isTaskLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;
    }

    if (!isAuthenticated || !user) {
        return <AuthRequiredMessage />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <ErrorMessage message={error} onRetry={fetchTaskDetails} isLoading={isTaskLoading} />
            </div>
        );
    }

    if (!taskDetails) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="rounded-md border bg-muted p-4">Задача не найдена.</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                &#8592; Назад к списку задач
            </Button>

            <Card className="shadow-md">
               
                <TaskHeader task={taskDetails} />

                <CardContent className="grid gap-6">
                    <TaskInfo task={taskDetails} />

                    <ProgressCircle
                        progress ={totalProgress}
                    />
                    
                    {shouldRenderChecklist(user.role, taskDetails.status) &&
                        checklistData.map((checklist) => (
                            <ChecklistCardList
                            key={checklist.id}
                            checklist={checklist}
                            onChange={handleChecklistChange}
                            onRemove={shouldShowChecklistManagement ? handleRemoveChecklist : undefined}
                            />
                    ))}


                    {shouldShowChecklistManagement && (
                        <div className="mt-4 flex justify-center">
                            <Dialog open={isAddDialogOpened} onOpenChange={setIsAddDialogOpened}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" disabled={isTemplatesLoading || isUpdatingTaskChecklists}>
                                        <Plus className="mr-2 h-4 w-4" /> Добавить чек-лист
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Добавить чек-лист</DialogTitle>
                                        <DialogDescription>
                                            Выберите чек-лист для добавления к этой задаче.
                                        </DialogDescription>
                                    </DialogHeader>
                                    {isTemplatesLoading ? (
                                        <Spinner />
                                    ) : templatesError ? (
                                        <ErrorMessage message={templatesError} />
                                    ) : availableChecklistsToAdd.length === 0 ? (
                                        <p className="text-center text-gray-500">
                                            Нет доступных чек-листов для добавления с типом {taskDetails.cleaning_type}.
                                        </p>
                                    ) : (
                                        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                                            <ul className="space-y-2">
                                                {availableChecklistsToAdd.map((checklist) => (
                                                    <li key={checklist.id} className="flex items-center justify-between p-2 border rounded-md">
                                                        <span>{checklist.name}</span>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleAddChecklist(checklist.id)}
                                                            disabled={isUpdatingTaskChecklists}
                                                        >
                                                            Добавить
                                                        </Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </ScrollArea>
                                    )}
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAddDialogOpened(false)}>Закрыть</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                </CardContent>
                
                <CardFooter className="flex justify-end gap-2">
                    {/* Логику рендеринга кнопок также можно вынести в отдельный компонент */}
                    <TaskActionsFooter
                        user={user}
                        task={taskDetails}
                        isChecklistComplete={isChecklistComplete}
                        isLoading={isActionLoading}
                        actions={{
                            onStart: startCleaning,
                            onFinish: finishCleaning,
                            onStartInspection: startInspection,
                            onInspect: finishInspection,
                            onToggleRush: () => toggleRush(taskDetails.is_rush),
                        }}
                    />
                </CardFooter>
            </Card>
        </div>
    );
}