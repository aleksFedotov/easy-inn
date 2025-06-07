'use client';

import React, { useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
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
import {Checklist } from '@/lib/types/housekeeping';
import { ProgressCircle } from '@/components/housekeeping/details/ProgressCircle';
import { CLEANICNG_STATUSES, USER_ROLES } from '@/lib/constants';



type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
type CleaningStatus = typeof CLEANICNG_STATUSES[keyof typeof CLEANICNG_STATUSES]

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