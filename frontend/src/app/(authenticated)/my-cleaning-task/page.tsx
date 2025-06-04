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
import { LogOut, House, BedDouble, ChevronDown, ChevronUp, Flame, Tag, Boxes,CalendarDays } from 'lucide-react'; 
import { CLEANING_TYPES} from '@/lib/constants'; 
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"; 
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Импорт Popover
import { Calendar } from '@/components/ui/calendar'; // Импорт Calendar
import { Button } from '@/components/ui/button'; // Импорт Button
import { format } from 'date-fns'; // Импорт format для форматирования даты
import { ru } from 'date-fns/locale'; // Импорт русской локали для date-fns

const MyCleaningTasksPage: React.FC = () => {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [allTasks, setAllTasks] = useState<CleaningTask[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date()); 

    const formatDateForApi = (date: Date | undefined): string | undefined => {
        if (!date) return undefined;
    return format(date, 'yyyy-MM-dd');
    };

    useEffect(() => {
        if (!user) return; // Не загружаем, пока нет user
        const fetchTasks = async () => {
            setLoading(true);
            setError(null);
            try {
                const dateString = formatDateForApi(selectedDate);
                const response = await api.get(`/api/cleaningtasks/`, {
                    params: {
                        assigned_to: user.id, 
                        scheduled_date: dateString,
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
    }, [user, selectedDate]);

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

    // Группировка задач по типу уборки и названиям чек-листов для ОБЩЕГО СВОДНОГО ОТЧЕТА
    const checklistSummary = useMemo(() => {
        const summary: Record<string, Record<string, { total: number }>> = {}; 

        allTasks.forEach(task => {
            const cleaningTypeDisplay = task.cleaning_type_display || 'Неизвестный тип';
            const checklistNames = task.associated_checklist_names && task.associated_checklist_names.length > 0
                ? task.associated_checklist_names.join(', ')
                : 'Без чек-листа';

            if (!summary[cleaningTypeDisplay]) {
                summary[cleaningTypeDisplay] = {};
            }
            if (!summary[cleaningTypeDisplay][checklistNames]) {
                summary[cleaningTypeDisplay][checklistNames] = { total: 0 };
            }
            summary[cleaningTypeDisplay][checklistNames].total++;
        });
        return summary;
    }, [allTasks]);


    // Мемоизированные и отсортированные плоские списки задач для каждой вкладки
    const sortedCheckoutTasks = useMemo(() => {
        const filtered = allTasks.filter(task => task.cleaning_type === CLEANING_TYPES.DEPARTURE);
        return sortTasksByPriority(filtered);
    }, [allTasks, sortTasksByPriority]);

    const sortedCurrentTasks = useMemo(() => {
        const filtered = allTasks.filter(task => task.cleaning_type == CLEANING_TYPES.STAYOVER);
        return sortTasksByPriority(filtered);
    }, [allTasks, sortTasksByPriority]);

    
    const sortedZoneTasks = useMemo(() => {
        const filtered = allTasks.filter(task => task.cleaning_type == CLEANING_TYPES.PUBLIC_AREA);
        return sortTasksByPriority(filtered);
    }, [allTasks, sortTasksByPriority]);
    
    const sortedOtherTasks = useMemo(() => {
        const filtered = allTasks.filter(task => ![
            CLEANING_TYPES.DEPARTURE, 
            CLEANING_TYPES.STAYOVER, 
            CLEANING_TYPES.PUBLIC_AREA
        ].includes(task.cleaning_type ));
        return sortTasksByPriority(filtered);
    }, [allTasks, sortTasksByPriority]);

    // Функция для определения цвета карточки для задач выезда
    const getCheckoutCardColor = (task: CleaningTask) => {
        return task.is_guest_checked_out ? 'bg-red-100' : 'bg-gray-100';
    };


    // Расчет общего количества задач и срочных задач
    const totalTasks = useMemo(() => allTasks.length, [allTasks]);
    const rushTasksCount = useMemo(() => allTasks.filter(task => task.is_rush).length, [allTasks]);
    
    // Сортировка ключей checklistSummary по заданному порядку
    const sortedChecklistSummaryKeys = useMemo(() => {
        // Определяем желаемый порядок типов уборок для сводки
        const customCleaningTypeOrder = [
            CLEANING_TYPES.DEPARTURE, 
            CLEANING_TYPES.STAYOVER,  
            CLEANING_TYPES.PUBLIC_AREA, 
           
        ];
        const keys = Object.keys(checklistSummary);
        return keys.sort((a, b) => {
            const indexA = customCleaningTypeOrder.indexOf(a);
            const indexB = customCleaningTypeOrder.indexOf(b);

            // Если оба типа есть в customOrder, сортируем по их индексу
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            // Если только один тип есть в customOrder, он идет раньше
            if (indexA !== -1) {
                return -1;
            }
            if (indexB !== -1) {
                return 1;
            }
            // Если ни один из типов не в customOrder, сортируем по алфавиту
            return a.localeCompare(b);
        });
    }, [checklistSummary]);   

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
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">Мои задачи</h1>
            
              <div className="mb-6 flex justify-end">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={`w-[240px] justify-start text-left font-normal ${!selectedDate && "text-muted-foreground"}`}
                        >
                            <CalendarDays size={20} className="mr-2" />
                            {selectedDate ? format(selectedDate, "PPP", { locale: ru }) : <span>Выберите дату</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                            locale={ru}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Общий summary выше tabs */}
            <Card className="bg-blue-50 p-4 rounded-lg shadow-sm mb-6 flex items-center justify-between">
                <p className="text-lg font-medium">
                    Всего задач: <span className="font-bold">{totalTasks}</span>
                </p>

                {rushTasksCount > 0 && (
                    <p className="text-lg font-medium text-red-600 flex items-center">
                        <Flame size={20} className="mr-1" /> Срочных: <span className="font-bold">{rushTasksCount}</span>
                    </p>
                )}
            </Card>

            {/* Информация о количестве уборок на каждую комбинацию списков */}
            <Collapsible
                open={isSummaryOpen}
                onOpenChange={setIsSummaryOpen}
                className="w-full mb-6"
            >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-100 rounded-lg shadow-sm cursor-pointer">
                    <h2 className="text-xl font-bold text-gray-800">Сводка по уборкам</h2>
                    {isSummaryOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 p-4 border border-gray-200 rounded-lg bg-white">
                    {Object.keys(checklistSummary).length > 0 ? (
                        sortedChecklistSummaryKeys.map(cleaningTypeDisplay => (
                            <div key={cleaningTypeDisplay} className="mb-3 last:mb-0">
                                <h3 className="text-lg font-semibold text-gray-700 flex items-center mb-1">
                                    <Tag size={18} className="mr-2" />
                                    {cleaningTypeDisplay}
                                </h3>
                                <ul className="list-none space-y-1 ml-4"> 
                                    {Object.keys(checklistSummary[cleaningTypeDisplay]).map(checklistNames => (
                                        <li key={`${cleaningTypeDisplay}-${checklistNames}`} className="text-gray-600">
                                            {checklistNames}: <span className="font-bold">{checklistSummary[cleaningTypeDisplay][checklistNames].total}</span> номеров
                                          
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-600">Нет задач с привязанными чек-листами.</p>
                    )}
                </CollapsibleContent>
            </Collapsible>


            <div className="flex justify-center">
                <Tabs defaultValue="checkout" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
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
                        <TabsTrigger value="other">
                            <Boxes size={16} className="mr-2" />
                            <span>Другое</span>
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="checkout" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {sortedCheckoutTasks.length > 0 ? (
                                sortedCheckoutTasks.map(task => (
                                    <CleaningTaskCard key={task.id} task={task} cardColor={getCheckoutCardColor(task)} />
                                ))
                            ) : (
                                <p>Нет задач уборки после выезда.</p>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="current" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {sortedCurrentTasks.length > 0 ? (
                                sortedCurrentTasks.map(task => (
                                    <CleaningTaskCard key={task.id} task={task} cardColor="bg-yellow-100" />
                                ))
                            ) : (
                                <p>Нет текущих задач уборки.</p>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="zones" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {sortedZoneTasks.length > 0 ? (
                                sortedZoneTasks.map(task => (
                                    <CleaningTaskCard key={task.id} task={task} cardColor="bg-yellow-100" />
                                ))
                            ) : (
                                <p>Нет задач уборки зон.</p>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="other" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {sortedOtherTasks.length > 0 ? (
                                sortedOtherTasks.map(task => (
                                    <CleaningTaskCard key={task.id} task={task} cardColor="bg-yellow-100" />
                                ))
                            ) : (
                                <p>Нет задач других задач.</p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default MyCleaningTasksPage;
