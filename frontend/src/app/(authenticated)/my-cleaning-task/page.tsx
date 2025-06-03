'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { CleaningTask } from '@/lib/types'; // Ваш тип CleaningTask
import CleaningTaskCard from '@/components/cleaning/CleaningTaskCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import api from '@/lib/api';
import axios from 'axios';
import { LogOut, House, BedDouble } from 'lucide-react';
import { CLEANING_TYPES } from '@/lib/constants';


const MyCleaningTasksPage: React.FC = () => {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [allTasks, setAllTasks] = useState<CleaningTask[]>([]); // Храним все полученные задачи
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return; // Не загружаем, пока нет user
        const fetchTasks = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/api/cleaningtasks/`, {
                    params: {
                        assigned_to: user.id, // Фильтруем по ID текущей горничной
                        all: true
                    },
                });
                const tasks: CleaningTask[] = response.data;
                setAllTasks(tasks); // Сохраняем все задачи
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
        };

        fetchTasks();
    }, [user]);

    // Мемоизированные и отсортированные списки задач
    const sortedCheckoutTasks = useMemo(() => {
        return allTasks
            .filter(task => task.cleaning_type === CLEANING_TYPES.DEPARTURE)
            .sort((a, b) => {
                // 1. Сначала срочные задачи (is_rush: true)
                if (a.is_rush && !b.is_rush) return -1;
                if (!a.is_rush && b.is_rush) return 1;

                // 2. Затем задачи, где гость выехал (is_guest_checked_out: true)
                if (a.is_guest_checked_out && !b.is_guest_checked_out) return -1;
                if (!a.is_guest_checked_out && b.is_guest_checked_out) return 1;

                // 3. Затем по времени выполнения (due_time)
                const dateA = a.due_time ? new Date(a.due_time).getTime() : Infinity;
                const dateB = b.due_time ? new Date(b.due_time).getTime() : Infinity;
                return dateA - dateB;
            });
    }, [allTasks]);

    const sortedCurrentTasks = useMemo(() => {
        return allTasks
            .filter(task => task.cleaning_type !== CLEANING_TYPES.DEPARTURE && task.zone_name === null)
            .sort((a, b) => {
                // 1. Сначала срочные задачи (is_rush: true)
                if (a.is_rush && !b.is_rush) return -1;
                if (!a.is_rush && b.is_rush) return 1;

                // 2. Затем по времени выполнения (due_time)
                const dateA = a.due_time ? new Date(a.due_time).getTime() : Infinity;
                const dateB = b.due_time ? new Date(b.due_time).getTime() : Infinity;
                return dateA - dateB;
            });
    }, [allTasks]);

    const sortedZoneTasks = useMemo(() => {
        return allTasks
            .filter(task => task.zone_name !== null)
            .sort((a, b) => {
                // 1. Сначала срочные задачи (is_rush: true)
                if (a.is_rush && !b.is_rush) return -1;
                if (!a.is_rush && b.is_rush) return 1;

                // 2. Затем по времени выполнения (due_time)
                const dateA = a.due_time ? new Date(a.due_time).getTime() : Infinity;
                const dateB = b.due_time ? new Date(b.due_time).getTime() : Infinity;
                return dateA - dateB;
            });
    }, [allTasks]);


    // Функция для определения цвета карточки для задач выезда
    const getCheckoutCardColor = (task: CleaningTask) => {
        return task.is_guest_checked_out ? 'bg-red-100' : 'bg-gray-100';
    };

    if (isAuthLoading || loading) {
        return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (!user) {
        return <div>Пользователь не найден.</div>; // Или перенаправление
    }


    return (
        <div className="container mx-auto  p-4">
            <h1 className="text-3xl font-bold mb-4">Мои задачи</h1>
            <div className="flex justify-center">
                <Tabs defaultValue="checkout" >
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="checkout">
                            <LogOut size={16} />
                            <span>Выезд</span>
                        </TabsTrigger>
                        <TabsTrigger value="current">
                            <BedDouble size={16} />
                            <span>Текущая</span>
                        </TabsTrigger>
                        <TabsTrigger value="zones">
                            <House size={16} />
                            <span>Зоны</span>
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="checkout">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sortedCheckoutTasks.length > 0 ? (
                                sortedCheckoutTasks.map(task => (
                                    <CleaningTaskCard key={task.id} task={task} cardColor={getCheckoutCardColor(task)} />
                                ))
                            ) : (
                                <p>Нет задач уборки после выезда.</p>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="current">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sortedCurrentTasks.length > 0 ? (
                                sortedCurrentTasks.map(task => (
                                    <CleaningTaskCard key={task.id} task={task} cardColor="bg-yellow-100" />
                                ))
                            ) : (
                                <p>Нет текущих задач уборки.</p>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="zones">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sortedZoneTasks.length > 0 ? (
                                sortedZoneTasks.map(task => (
                                    <CleaningTaskCard key={task.id} task={task} cardColor="bg-yellow-100" />
                                ))
                            ) : (
                                <p>Нет задач уборки зон.</p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default MyCleaningTasksPage;
