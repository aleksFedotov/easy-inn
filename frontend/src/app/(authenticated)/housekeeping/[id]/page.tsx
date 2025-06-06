'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AuthRequiredMessage from '@/components/AuthRequiredMessage';
import ChecklistCardList from '@/components/housekeeping/ChecklistCardList';
import { ChecklistProgress } from '@/lib/types/housekeeping';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';


import { useTaskDetails } from '@/hooks/housekeeping/details/useTaskDetailsData';
import { useTaskActions } from '@/hooks/housekeeping/details/useTaskActions';
import { TaskHeader } from '@/components/housekeeping/details/TaskHeader';
import { TaskInfo } from '@/components/housekeeping/details/TaskInfo'; 
import { TaskActionsFooter } from '@/components/housekeeping/details/TaskActionsFooter'; 
import {Checklist } from '@/lib/types/housekeeping';

export default function CleaningTaskDetailsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const taskId = params.id;

    const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
    
   
    const { taskDetails, isLoading: isTaskLoading, error, fetchTaskDetails } = useTaskDetails(taskId);
    
   
    const { 
        isActionLoading, 
        startCleaning, 
        finishCleaning, 
        finishInspection, 
        toggleRush 
    } = useTaskActions(taskId, fetchTaskDetails);

    // --- Логика чек-листов остается здесь, так как она тесно связана с состоянием этой страницы ---
    const [checklistsState, setChecklistsState] = useState<{ [key: number]: ChecklistProgress }>({});
    const [isChecklistComplete, setIsChecklistComplete] = useState<boolean>(false);

    const checklistData: Checklist[] = useMemo(() => (taskDetails?.checklist_data as Checklist[] | undefined) || [], [taskDetails]);

    useEffect(() => {
        if (checklistData?.length === 0) {
            setIsChecklistComplete(true);
            return;
        }
        const canFinish = Object.values(checklistsState).every(
            ({ total, completed }) => total > 0 && completed === total
        );
        setIsChecklistComplete(canFinish);
    }, [checklistsState, checklistData]);

    const handleChecklistChange = useCallback((checklistId: number, progress: ChecklistProgress) => {
        setChecklistsState((prev) => ({
            ...prev,
            [checklistId]: progress
        }));
    }, []);

    const totalProgress = useMemo(() => {
        // ... логика подсчета прогресса остается без изменений
        if (checklistData.length === 0) return 0;

        const total = checklistData.reduce((sum, checklist) => {
            const checklistProgress = checklistsState[checklist.id];
            if (!checklistProgress) return sum; 
    
            const completed = checklistProgress.completed || 0;
            const totalItems = checklistProgress.total || 0;
            return sum + (totalItems === 0 ? 100 : (completed / totalItems) * 100);
        }, 0);
    
        return checklistData.length === 0 ? 0 : total / checklistData.length;

    }, [checklistsState, checklistData]);
    // --- Конец логики чек-листов ---

    // ----- Рендеринг -----

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
                {/* Используем декомпозированные компоненты */}
                <TaskHeader task={taskDetails} />

                <CardContent className="grid gap-6">
                    <TaskInfo task={taskDetails} />
                    
                    {/* Прогресс-бар и чек-листы */}
                    <div className="w-30 mx-auto">
                        <CircularProgressbar
                            value={totalProgress}
                            text={`${Math.round(totalProgress)}%`}
                            styles={buildStyles({ pathColor: '#0070f3', trailColor: '#d6d6d6', textColor: 'black' })}
                        />
                        <p className="text-center mt-2 text-sm">Общий прогресс</p>
                    </div>

                    {checklistData.map((checklist) => (
                        <ChecklistCardList
                            key={checklist.id}
                            checklist={checklist}
                            onChange={handleChecklistChange}
                        />
                    ))}
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
                            onInspect: finishInspection,
                            onToggleRush: () => toggleRush(taskDetails.is_rush),
                        }}
                    />
                </CardFooter>
            </Card>
        </div>
    );
}