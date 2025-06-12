'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import { useCleaningTasks } from '@/hooks/ready-for-check/useCleaningTasks';
import { useTaskSorting } from '@/hooks/ready-for-check/useTaskSorting';
import EmptyTasksState from '@/components/ready-for-check/EmptyTasksState'
import TasksGrid from '@/components/ready-for-check/TasksGrid';

const ReadyForCheckPage: React.FC = () => {
    const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
     const { tasks, loading, error, fetchTasks } = useCleaningTasks();
    const sortedTasks = useTaskSorting(tasks);
   
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Сортировка задач: срочные первыми, затем по времени выполнения

    if (isAuthLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <div>Пользователь не найден.</div>;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <ErrorMessage message={error} onRetry={fetchTasks} isLoading={loading} />
            </div>
        );
    }

    return (
    <div className="container mx-auto p-4">
        <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
            Задачи, готовые к проверке
            </h1>
            {sortedTasks.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
                Найдено задач: {sortedTasks.length}
            </p>
            )}
        </header>

        <main>
            {sortedTasks.length > 0 ? (
            <TasksGrid tasks={sortedTasks} />
            ) : (
            <EmptyTasksState />
            )}
        </main>
    </div>
);
};

export default ReadyForCheckPage;
