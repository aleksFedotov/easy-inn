'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { CleaningTask } from '@/lib/types'; //  Ваш тип CleaningTask
import CleaningTaskCard from '@/components/cleaning/CleaningTaskCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import api from '@/lib/api';
import axios  from 'axios';
import { LogOut,CalendarCheck,Map } from 'lucide-react';


const MyCleaningTasksPage: React.FC = () => {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [checkoutTasks, setCheckoutTasks] = useState<CleaningTask[]>([]);
    const [currentTasks, setCurrentTasks] = useState<CleaningTask[]>([]);
    const [zoneTasks, setZoneTasks] = useState<CleaningTask[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return; //  Не загружаем, пока нет user
        const fetchTasks = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/api/cleaningtasks/`, {
                    params: {
                        assigned_to: user.id, //  Фильтруем по ID текущей горничной
                        all:true
                    },
                });
                const tasks: CleaningTask[] = response.data;
                //  Фильтруем задачи по категориям
                setCheckoutTasks(tasks.filter(task => task.cleaning_type_name === "Уборка после выезда"));
                setCurrentTasks(tasks.filter(task => task.cleaning_type_name !== "Уборка после выезда" && task.zone_name === null));
                setZoneTasks(tasks.filter(task => task.zone_name !== null));


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

    //  Функция для определения цвета карточки для задач выезда
    const getCheckoutCardColor = (task: CleaningTask) => {
        console.log(task.is_guest_checked_out)
        return task.is_guest_checked_out ? 'bg-red-100' : 'bg-gray-100';
    };

    if (isAuthLoading || loading) {
        return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (!user) {
        return <div>Пользователь не найден.</div>; //  Или перенаправление
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
                            <CalendarCheck size={16} />
                            <span>Текущая</span>
                        </TabsTrigger>
                        <TabsTrigger value="zones">
                            <Map size={16} />
                            <span>Зоны</span>
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="checkout">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {checkoutTasks
                            .sort((a, b) => {
                                // Сначала сортируем по is_guest_checked_out (красные перед серыми)
                                if (a.is_guest_checked_out && !b.is_guest_checked_out) {
                                    return -1; // a (красный) должен быть перед b (серым)
                                }
                                if (!a.is_guest_checked_out && b.is_guest_checked_out) {
                                    return 1;  
                                }

                                // Если is_guest_checked_out одинаковый, сортируем по due_time
                                const dateA = a.due_time ? new Date(a.due_time).getTime() : Infinity; // Бесконечность для null
                                const dateB = b.due_time ? new Date(b.due_time).getTime() : Infinity;

                                return dateA - dateB;
                            })
                            .map(task => (
                                <CleaningTaskCard key={task.id} task={task} cardColor={getCheckoutCardColor(task)} />
                            ))}
                            {checkoutTasks.length === 0 && <p className="text-gray-500">Нет задач уборки после выезда.</p>}

                        </div>
                    </TabsContent>
                    <TabsContent value="current">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {currentTasks.map(task => (
                                <CleaningTaskCard key={task.id} task={task} cardColor="bg-yellow-100" />
                            ))}
                            {currentTasks.length === 0 && <p className="text-gray-500">Нет текущих задач уборки.</p>}
                        </div>
                    </TabsContent>
                    <TabsContent value="zones">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {zoneTasks.map(task => (
                                <CleaningTaskCard key={task.id} task={task} cardColor="bg-yellow-100" />
                            ))}
                            {zoneTasks.length === 0 && <p className="text-gray-500">Нет задач уборки зон.</p>}

                        </div>
                    </TabsContent>
                </Tabs>


            </div>

        </div>
    );
};

export default MyCleaningTasksPage;