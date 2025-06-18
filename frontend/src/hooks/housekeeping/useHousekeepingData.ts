import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { CleaningTask, User, Room, Zone, CleaningType } from '@/lib/types';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UseHousekeepingDataProps {
    selectedDate?: Date;
    enableCaching?: boolean;
    cacheTimeout?: number; // в миллисекундах
}

interface LoadingStates {
    tasks: boolean;
    housekeepers: boolean;
    rooms: boolean;
    zones: boolean;
    cleaningTypes: boolean;
    generating: boolean;
    assigning: boolean; 
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const useHousekeepingData = ({ 
    selectedDate, 
    enableCaching = true,
    cacheTimeout = 5 * 60 * 1000 
}: UseHousekeepingDataProps) => {
    // Основные состояния
    const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
    const [allAvailableHousekeepers, setAllAvailableHousekeepers] = useState<User[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [cleaningTypes, setCleaningTypes] = useState<CleaningType[]>([]);
    const [assignedHousekeepers,setAssignedHousekeepers] = useState<User[]>([])
   
    // Состояния загрузки
    const [loadingStates, setLoadingStates] = useState<LoadingStates>({
        tasks: false,
        housekeepers: false,
        rooms: false,
        zones: false,
        cleaningTypes: false,
         generating: false, 
        assigning: false,  
    });
    
    const [error, setError] = useState<string | null>(null);
    
    // Refs для оптимизации
    const lastFetchedDateRef = useRef<string | null>(null);
    const cleaningTasksRef = useRef<CleaningTask[]>([]);
    const housekeepersRef = useRef<User[]>([]);
    
    // Кэш
    const tasksCacheRef = useRef<Map<string, CacheEntry<CleaningTask[]>>>(new Map());
    const staticDataCacheRef = useRef<{
        housekeepers?: CacheEntry<User[]>;
        rooms?: CacheEntry<Room[]>;
        zones?: CacheEntry<Zone[]>;
        cleaningTypes?: CacheEntry<CleaningType[]>;
    }>({});

    // Обновляем refs при изменении состояний
    useEffect(() => {
        cleaningTasksRef.current = cleaningTasks;
    }, [cleaningTasks]);

    useEffect(() => {
        housekeepersRef.current = allAvailableHousekeepers;
    }, [allAvailableHousekeepers]);

    // Утилиты для работы с кэшем
    const isCacheValid = useCallback((timestamp: number): boolean => {
        return enableCaching && (Date.now() - timestamp) < cacheTimeout;
    }, [enableCaching, cacheTimeout]);

    // Функция для установки кэша в Map
    const setMapCacheEntry = useCallback(<T,>(
        cache: Map<string, CacheEntry<T>>,
        key: string,
        data: T
    ) => {
        const entry: CacheEntry<T> = { data, timestamp: Date.now() };
        cache.set(key, entry);
    }, []);

    // Специализированные функции для каждого типа кэша
    const setHousekeepersCacheEntry = useCallback((data: User[]) => {
        staticDataCacheRef.current.housekeepers = { data, timestamp: Date.now() };
    }, []);

    const setRoomsCacheEntry = useCallback((data: Room[]) => {
        staticDataCacheRef.current.rooms = { data, timestamp: Date.now() };
    }, []);

    const setZonesCacheEntry = useCallback((data: Zone[]) => {
        staticDataCacheRef.current.zones = { data, timestamp: Date.now() };
    }, []);


    // Универсальная функция обработки ошибок
    const createErrorHandler = useCallback((operation: string) => (error: unknown) => {
        console.error(`Error in ${operation}:`, error);
        
        if (axios.isAxiosError(error)) {
            const errorMessage = error.response?.data?.detail || 
                               error.response?.data?.message || 
                               `Ошибка при ${operation}`;
            toast.error(errorMessage);
            setError(errorMessage);
        } else {
            const genericError = `Произошла ошибка при ${operation}`;
            toast.error(genericError);
            setError(genericError);
        }
    }, []);

    // Обновление состояния загрузки
    const updateLoadingState = useCallback((key: keyof LoadingStates, value: boolean) => {
        setLoadingStates(prev => ({ ...prev, [key]: value }));
    }, []);

    // Fetch функции с улучшенной обработкой ошибок и кэшированием
    const fetchCleaningTasks = useCallback(async (date: string): Promise<CleaningTask[]> => {
        // Проверяем кэш
        if (enableCaching && tasksCacheRef.current.has(date)) {
            const cached = tasksCacheRef.current.get(date)!;
            if (isCacheValid(cached.timestamp)) {
                setCleaningTasks(cached.data);
                return cached.data;
            }
        }

        updateLoadingState('tasks', true);
        try {
            const response = await api.get<CleaningTask[]>('/api/cleaningtasks/', {
                params: {
                    scheduled_date: date,
                    all: true,
                },
            });
            
            if (response.status === 200) {
                setCleaningTasks(response.data);
                setMapCacheEntry(tasksCacheRef.current, date, response.data);
                return response.data;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            createErrorHandler('загрузке задач')(error);
            return [];
        } finally {
            updateLoadingState('tasks', false);
        }
    }, [enableCaching, isCacheValid, setMapCacheEntry, updateLoadingState, createErrorHandler]);

    const fetchAllHousekeepers = useCallback(async (): Promise<User[]> => {
        // Проверяем кэш
        if (enableCaching && staticDataCacheRef.current.housekeepers) {
            const cached = staticDataCacheRef.current.housekeepers;
            if (isCacheValid(cached.timestamp)) {
                setAllAvailableHousekeepers(cached.data);
                return cached.data;
            }
        }

        updateLoadingState('housekeepers', true);
        try {
            const response = await api.get<User[]>('/api/users/', {
                params: {
                    all: true,
                    role: 'housekeeper',
                },
            });
            
            if (response.status === 200) {
                setAllAvailableHousekeepers(response.data);
                setHousekeepersCacheEntry(response.data);
                return response.data;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            createErrorHandler('загрузке горничных')(error);
            return [];
        } finally {
            updateLoadingState('housekeepers', false);
        }
    }, [enableCaching, isCacheValid, setHousekeepersCacheEntry, updateLoadingState, createErrorHandler]);

    const fetchRooms = useCallback(async (): Promise<Room[]> => {
        if (enableCaching && staticDataCacheRef.current.rooms) {
            const cached = staticDataCacheRef.current.rooms;
            if (isCacheValid(cached.timestamp)) {
                setRooms(cached.data);
                return cached.data;
            }
        }

        updateLoadingState('rooms', true);
        try {
            const response = await api.get<Room[]>('/api/rooms/', {
                params: { all: true },
            });
            
            if (response.status === 200) {
                setRooms(response.data);
                setRoomsCacheEntry(response.data);
                return response.data;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            createErrorHandler('загрузке комнат')(error);
            return [];
        } finally {
            updateLoadingState('rooms', false);
        }
    }, [enableCaching, isCacheValid, setRoomsCacheEntry, updateLoadingState, createErrorHandler]);

    const fetchZones = useCallback(async (): Promise<Zone[]> => {
        if (enableCaching && staticDataCacheRef.current.zones) {
            const cached = staticDataCacheRef.current.zones;
            if (isCacheValid(cached.timestamp)) {
                setZones(cached.data);
                return cached.data;
            }
        }

        updateLoadingState('zones', true);
        try {
            const response = await api.get<Zone[]>('/api/zones/', {
                params: { all: true },
            });
            
            if (response.status === 200) {
                setZones(response.data);
                setZonesCacheEntry( response.data);
                return response.data;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            createErrorHandler('загрузке зон')(error);
            return [];
        } finally {
            updateLoadingState('zones', false);
        }
    }, [enableCaching, isCacheValid, setZonesCacheEntry, updateLoadingState, createErrorHandler]);

        useEffect(() => {
        const fetchAssignedHousekeepers = async () => {
            if (selectedDate) { 
                try {
                    const response = await api.get('/api/housekeepers/assigned/', {
                        params: { scheduled_date: format(selectedDate, 'yyyy-MM-dd') }
                    });
                    setAssignedHousekeepers(response.data);
                } catch (error) {
                     if (axios.isAxiosError(error) && error.response) {
                        toast.error(error.response.data.detail || error.response.data.message || JSON.stringify(error.response.data));
                    } else {
                        toast.error('Произошла ошибка при загрузки списка горничных.');
                    }
                }
            }
        };

        // Добавляем небольшую задержку, чтобы избежать race condition
        const timer = setTimeout(() => {
            fetchAssignedHousekeepers();
        }, 200);
        
        return () => clearTimeout(timer);
    }, [selectedDate]);

    // Главная функция загрузки данных
    const fetchData = useCallback(async (forceRefresh = false) => {
        const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        
        // Проверяем, нужно ли перезагружать данные
        if (!forceRefresh && lastFetchedDateRef.current === dateString && 
            cleaningTasksRef.current.length > 0 && housekeepersRef.current.length > 0) {
                return;
            }
            
            setError(null);
            lastFetchedDateRef.current = dateString;
            
            try {
                await Promise.all([
                fetchCleaningTasks(dateString),
                fetchAllHousekeepers(),
                fetchRooms(),
                fetchZones(),

            ]);
        } catch (err) {
            console.error("Error fetching housekeeping data:", err);
            setError('Произошла ошибка при загрузке данных.');
        }
    }, [selectedDate, fetchCleaningTasks, fetchAllHousekeepers, fetchRooms, fetchZones]);
    
    // Эффект для загрузки данных при изменении даты
    useEffect(() => {
        fetchData();
    }, [selectedDate,fetchData]);
    
    // Функция для принудительного обновления данных
    const refetchData = useCallback(() => {
        fetchData(true);
    }, [fetchData]);
    
    const generateTasks = useCallback(async (dateToGenerate: Date) => {
        updateLoadingState('generating', true);
        const dateString = format(dateToGenerate, 'yyyy-MM-dd');

        try {
            const res = await api.post('/api/cleaningtasks/auto_generate/', { scheduled_date: dateString });
            if (res.status === 201) {
                if (res.data.created_count > 0) {
                    toast.success(`Создано задач: ${res.data.created_count}`);
                    
                    tasksCacheRef.current.delete(dateString);
                    await refetchData();
                } else {
                    toast.info('Задачи на сегодня уже существуют');
                }
                return true; 
            }
            return false;
        } catch (error) {
            createErrorHandler('генерации задач')(error);
            return false; 
        } finally {
            updateLoadingState('generating', false);
        }
    }, [updateLoadingState, createErrorHandler, refetchData]);


    const assignTasks = useCallback(async (taskIds: number[], housekeeperId: number, scheduledDate: Date) => {
       
        if (taskIds.length === 0) {
            toast.error("Выберите хотя бы одну задачу.");
            return false;
        }
        if (!housekeeperId) {
            toast.error("Пожалуйста, выберите горничную.");
            return false;
        }

        updateLoadingState('assigning', true);
        const dateString = format(scheduledDate, 'yyyy-MM-dd');
        
        try {
            await api.post('/api/cleaningtasks/assign_multiple/', {
                task_ids: taskIds,
                housekeeper_id: housekeeperId,
                scheduled_date: dateString,
            });
            
            toast.success(`Назначено ${taskIds.length} задач`);
            
            // Снова инвалидируем кэш и обновляем данные
            tasksCacheRef.current.delete(dateString);
            await refetchData();
            
            return true; // Успех
        } catch (err) {
            createErrorHandler('назначения задач')(err);
            return false; // Неудача
        } finally {
            updateLoadingState('assigning', false);
        }
    }, [updateLoadingState, createErrorHandler, refetchData]);


    // Функция для очистки кэша
    const clearCache = useCallback(() => {
        tasksCacheRef.current.clear();
        staticDataCacheRef.current = {};
        toast.success('Кэш очищен');
    }, []);

    // Функция для обновления конкретной задачи в состоянии и кэше
    const updateCleaningTask = useCallback((taskId: number, updates: Partial<CleaningTask>) => {
        setCleaningTasks(prev => prev.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
        ));
        
        // Обновляем кэш
        const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        if (tasksCacheRef.current.has(dateString)) {
            const cached = tasksCacheRef.current.get(dateString)!;
            const updatedTasks = cached.data.map(task => 
                task.id === taskId ? { ...task, ...updates } : task
            );
            setMapCacheEntry(tasksCacheRef.current, dateString, updatedTasks);
        }
    }, [selectedDate, setMapCacheEntry]);

    // Вычисляемые значения
    const isLoadingData = Object.values(loadingStates).some(Boolean);
    const hasData = cleaningTasks.length > 0 || allAvailableHousekeepers.length > 0;

    return {
        // Данные
        cleaningTasks,
        setCleaningTasks,
        allAvailableHousekeepers,
        setAllAvailableHousekeepers,
        rooms,
        setRooms,
        zones,
        setZones,
        cleaningTypes,
        setCleaningTypes,
        assignedHousekeepers,
        setAssignedHousekeepers,
        
        // Состояния загрузки
        isLoadingData,
        loadingStates,
        error,
        setError,
        hasData,
        
        // Функции
        refetchData,
        clearCache,
        updateCleaningTask,
        generateTasks, 
        assignTasks,   
        
       
        fetchCleaningTasks,
        fetchAllHousekeepers,
        fetchRooms,
        fetchZones,
       
    };
};

export default useHousekeepingData;