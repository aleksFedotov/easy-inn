'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { CleaningTask } from '@/lib/types/housekeeping';
import CleaningTaskCard from '@/components/cleaning/CleaningTaskCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import api from '@/lib/api';
import axios from 'axios';
import { LogOut, House, BedDouble, ChevronDown, ChevronUp } from 'lucide-react'; // Добавляем иконки для аккордеона
import { CLEANING_TYPES } from '@/lib/constants'; // Используем для фильтрации и отображения
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"; // Предполагается, что у вас есть Collapsible компонент из shadcn/ui

const MyCleaningTasksPage: React.FC = () => {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [allTasks, setAllTasks] = useState<CleaningTask[]>([]); // Храним все полученные задачи
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // Состояние для управления открытием/закрытием секций аккордеона
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

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

    // Функция для сортировки задач по приоритету
    const sortTasksByPriority = useCallback((tasks: CleaningTask[]) => {
        return [...tasks].sort((a, b) => {
            // 1. Сначала срочные задачи (is_rush: true)
            if (a.is_rush && !b.is_rush) return -1;
            if (!a.is_rush && b.is_rush) return 1;

            // 2. Затем задачи, где гость выехал (is_guest_checked_out: true) - только для departure_cleaning
            if (a.cleaning_type === CLEANING_TYPES.DEPARTURE && b.cleaning_type === CLEANING_TYPES.DEPARTURE) {
                if (a.is_guest_checked_out && !b.is_guest_checked_out) return -1;
                if (!a.is_guest_checked_out && b.is_guest_checked_out) return 1;
            }

            // 3. Затем по времени выполнения (due_time)
            const dateA = a.due_time ? new Date(a.due_time).getTime() : Infinity;
            const dateB = b.due_time ? new Date(b.due_time).getTime() : Infinity;
            return dateA - dateB;
        });
    }, []);

    // Группировка задач по типу уборки и названиям чек-листов
    const groupTasks = useCallback((tasks: CleaningTask[]) => {
        const grouped: Record<string, Record<string, CleaningTask[]>> = {};

        tasks.forEach(task => {
            const cleaningTypeDisplay = task.cleaning_type_display || 'Неизвестный тип';
            // Если есть несколько чек-листов, объединяем их названия
            const checklistNames = task.associated_checklist_names && task.associated_checklist_names.length > 0
                ? task.associated_checklist_names.join(', ')
                : 'Без чек-листа';

            if (!grouped[cleaningTypeDisplay]) {
                grouped[cleaningTypeDisplay] = {};
            }
            if (!grouped[cleaningTypeDisplay][checklistNames]) {
                grouped[cleaningTypeDisplay][checklistNames] = [];
            }
            grouped[cleaningTypeDisplay][checklistNames].push(task);
        });
        return grouped;
    }, []);

    // Мемоизированные и отсортированные списки задач
    const sortedAndGroupedCheckoutTasks = useMemo(() => {
        const filtered = allTasks.filter(task => task.cleaning_type === CLEANING_TYPES.DEPARTURE);
        const sorted = sortTasksByPriority(filtered);
        return groupTasks(sorted);
    }, [allTasks, sortTasksByPriority, groupTasks]);

    const sortedAndGroupedCurrentTasks = useMemo(() => {
        const filtered = allTasks.filter(task => task.cleaning_type !== CLEANING_TYPES.DEPARTURE && task.zone_name === null);
        const sorted = sortTasksByPriority(filtered);
        return groupTasks(sorted);
    }, [allTasks, sortTasksByPriority, groupTasks]);

    const sortedAndGroupedZoneTasks = useMemo(() => {
        const filtered = allTasks.filter(task => task.zone_name !== null);
        const sorted = sortTasksByPriority(filtered);
        return groupTasks(sorted);
    }, [allTasks, sortTasksByPriority, groupTasks]);


    // Функция для определения цвета карточки для задач выезда
    const getCheckoutCardColor = (task: CleaningTask) => {
        return task.is_guest_checked_out ? 'bg-red-100' : 'bg-gray-100';
    };

    // Переключение состояния аккордеона
    const toggleSection = useCallback((key: string) => {
        setOpenSections(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    }, []);


    if (isAuthLoading || loading) {
        return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (!user) {
        return <div>Пользователь не найден.</div>; // Или перенаправление
    }

    // Вспомогательный компонент для рендеринга групп задач
    const renderGroupedTasks = (groupedTasks: Record<string, Record<string, CleaningTask[]>>) => {
        const cleaningTypes = Object.keys(groupedTasks);

        if (cleaningTypes.length === 0) {
            return <p>Нет задач для этой категории.</p>;
        }

        return (
            <>
                {cleaningTypes.map(cleaningTypeDisplay => (
                    <Collapsible
                        key={cleaningTypeDisplay}
                        open={openSections[cleaningTypeDisplay]}
                        onOpenChange={() => toggleSection(cleaningTypeDisplay)}
                        className="w-full mb-4"
                    >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-blue-100 rounded-md shadow-sm cursor-pointer">
                            <h3 className="text-lg font-semibold">{cleaningTypeDisplay}</h3>
                            {openSections[cleaningTypeDisplay] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 p-2 border border-blue-200 rounded-md">
                            {Object.keys(groupedTasks[cleaningTypeDisplay]).map(checklistNames => (
                                <Collapsible
                                    key={`${cleaningTypeDisplay}-${checklistNames}`}
                                    open={openSections[`${cleaningTypeDisplay}-${checklistNames}`]}
                                    onOpenChange={() => toggleSection(`${cleaningTypeDisplay}-${checklistNames}`)}
                                    className="w-full mb-2"
                                >
                                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-100 rounded-md shadow-sm cursor-pointer">
                                        <p className="font-medium">
                                            {checklistNames} ({groupedTasks[cleaningTypeDisplay][checklistNames].length} номеров)
                                        </p>
                                        {openSections[`${cleaningTypeDisplay}-${checklistNames}`] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-1 p-2 border border-gray-200 rounded-md">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {groupedTasks[cleaningTypeDisplay][checklistNames].map(task => (
                                                <CleaningTaskCard
                                                    key={task.id}
                                                    task={task}
                                                    cardColor={task.cleaning_type === CLEANING_TYPES.DEPARTURE ? getCheckoutCardColor(task) : "bg-yellow-100"}
                                                />
                                            ))}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}
                        </CollapsibleContent>
                    </Collapsible>
                ))}
            </>
        );
    };


    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">Мои задачи</h1>
            <div className="flex justify-center">
                <Tabs defaultValue="checkout" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="checkout">
                            <LogOut size={16} className="mr-2" />
                            <span>Выезд</span>
                        </TabsTrigger>
                        <TabsTrigger value="current">
                            <BedDouble size={16} className="mr-2" />
                            <span>Текущая</span>
                        </TabsTrigger>
                        <TabsTrigger value="zones">
                            <House size={16} className="mr-2" />
                            <span>Зоны</span>
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="checkout" className="mt-4">
                        {renderGroupedTasks(sortedAndGroupedCheckoutTasks)}
                    </TabsContent>
                    <TabsContent value="current" className="mt-4">
                        {renderGroupedTasks(sortedAndGroupedCurrentTasks)}
                    </TabsContent>
                    <TabsContent value="zones" className="mt-4">
                        {renderGroupedTasks(sortedAndGroupedZoneTasks)}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default MyCleaningTasksPage;
