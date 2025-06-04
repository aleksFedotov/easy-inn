'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { CleaningTask } from '@/lib/types';
import CleaningTaskCard from '@/components/cleaning/CleaningTaskCard';
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import api from '@/lib/api';
import axios from 'axios';
import { XCircle } from 'lucide-react'; 
import { CLEANICNG_STATUSES, USER_ROLES } from '@/lib/constants'; 

const ReadyForCheckPage: React.FC = () => {
    const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
    const [tasks, setTasks] = useState<CleaningTask[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        if (!user) {
            setError('Пользователь не аутентифицирован.');
            setLoading(false);
            return;
        }
        
        if (user.role !== USER_ROLES.MANAGER && user.role !== USER_ROLES.FRONT_DESK) {
            setError('У вас нет прав для просмотра этой страницы.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            
            const response = await api.get<CleaningTask[]>(`/api/cleaningtasks/`, {params: { all: true } });
            const allFetchedTasks: CleaningTask[] = response.data;
            if(response.status == 200) {
        
            
            const filteredTasks = allFetchedTasks.filter(task =>
                task.status === CLEANICNG_STATUSES.COMPLETED || task.status === CLEANICNG_STATUSES.WAITING_CHECK
            );
            setTasks(filteredTasks);
            } else {
                setError('Не удалось загрузить задачи. Попробуйте позже.');
            }
        } catch (err) {
            console.error(err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data));
            } else {
                setError('Ошибка при загрузке задач.');
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Сортировка задач: срочные первыми, затем по времени выполнения
    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => {
       
            if (a.is_rush && !b.is_rush) return -1;
            if (!a.is_rush && b.is_rush) return 1;

            // 2. Затем по времени выполнения (due_time)
            const dateA = a.due_time ? new Date(a.due_time).getTime() : Infinity;
            const dateB = b.due_time ? new Date(b.due_time).getTime() : Infinity;
            return dateA - dateB;
        });
    }, [tasks]);

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
            <h1 className="text-3xl font-bold mb-4">Задачи, готовые к проверке</h1>

            {sortedTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedTasks.map(task => (
                        <CleaningTaskCard
                            key={task.id}
                            task={task}
                            cardColor={task.status === CLEANICNG_STATUSES.COMPLETED ? 'bg-green-100' : 'bg-orange-100'} 
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-8 rounded-lg shadow-sm">
                    <XCircle size={48} className="text-gray-400 mb-4" />
                    <p className="text-xl font-medium">Нет задач, готовых к проверке.</p>
                    <p className="text-sm mt-2">Подождите, пока горничные завершат уборку.</p>
                </div>
            )}
        </div>
    );
};

export default ReadyForCheckPage;
