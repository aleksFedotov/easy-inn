import { useState, useEffect, useCallback } from 'react';
import  api  from '@/lib/api';
import { CleaningTask, User, Room, Zone, CleaningType } from '@/lib/types';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UseHousekeepingDataProps {
    selectedDate?: Date;
}

const useHousekeepingData = ({ selectedDate }: UseHousekeepingDataProps) => {
    const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
    const [allAvailableHousekeepers, setAllAvailableHousekeepers] = useState<User[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [cleaningTypes, setCleaningTypes] = useState<CleaningType[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Callback to fetch cleaning tasks
    const fetchCleaningTasks = useCallback(async (date: string) => {
        try {
            const response = await api.get<CleaningTask[]>('/api/cleaningtasks/', {
                params: {
                    scheduled_date: date,
                    all: true,
                },
            });
            if (response.status === 200) {
                setCleaningTasks(response.data);
            } else {
                toast.error(`Не удалось загрузить задачи: ${response.status}`);
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.detail || error.response.data.message || JSON.stringify(error.response.data));
            } else {
                toast.error('Произошла ошибка при загрузке задач.');
            }
        }
    }, []);

    // Callback to fetch ALL housekeepers
    const fetchAllHousekeepers = useCallback(async () => {
        try {
            const response = await api.get<User[]>('/api/users/', {
                params: {
                    all: true,
                    role: 'housekeeper',
                },
            });
            if (response.status === 200) {
                setAllAvailableHousekeepers(response.data);
            } else {
                toast.error(`Не удалось загрузить всех горничных: ${response.status}`);
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.detail || error.response.data.message || JSON.stringify(error.response.data));
            } else {
                toast.error('Произошла ошибка при загрузке всех горничных.');
            }
        }
    }, []);

    // Callback to fetch rooms
    const fetchRooms = useCallback(async () => {
        try {
            const response = await api.get<Room[]>('/api/rooms/', {
                params: {
                    all: true,
                },
            });
            if (response.status === 200) {
                setRooms(response.data);
            } else {
                toast.error(`Не удалось загрузить комнаты: ${response.status}`);
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.detail || error.response.data.message || JSON.stringify(error.response.data));
            } else {
                toast.error('Произошла ошибка при загрузке комнат.');
            }
        }
    }, []);

    // Callback to fetch zones
    const fetchZones = useCallback(async () => {
        try {
            const response = await api.get<Zone[]>('/api/zones/', {
                params: {
                    all: true,
                },
            });
            if (response.status === 200) {
                setZones(response.data);
            } else {
                toast.error(`Не удалось загрузить зоны: ${response.status}`);
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.detail || error.response.data.message || JSON.stringify(error.response.data));
            } else {
                toast.error('Произошла ошибка при загрузке зон.');
            }
        }
    }, []);

    // Callback to fetch cleaning types
    const fetchCleaningTypes = useCallback(async () => {
        try {
            const response = await api.get<CleaningType[]>('/api/cleaningtypes/', {
                params: {
                    all: true,
                },
            });
            if (response.status === 200) {
                setCleaningTypes(response.data);
            } else {
                toast.error(`Не удалось загрузить типы уборки: ${response.status}`);
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.detail || error.response.data.message || JSON.stringify(error.response.data));
            } else {
                toast.error('Произошла ошибка при загрузке типов уборки.');
            }
        }
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoadingData(true);
        setError(null);
        const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

        try {
            await Promise.all([
                fetchCleaningTasks(dateString),
                fetchAllHousekeepers(),
                fetchRooms(),
                fetchZones(),
                fetchCleaningTypes(),
            ]);
        } catch (err) {
            console.error("Error fetching housekeeping data:", err);
            setError('Произошла ошибка при загрузке данных.');
        } finally {
            setIsLoadingData(false);
        }
    }, [selectedDate, fetchCleaningTasks, fetchAllHousekeepers, fetchRooms, fetchZones, fetchCleaningTypes]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refetchData = useCallback(() => {
        fetchData();
    }, [fetchData]);

    return {
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
        isLoadingData,
        error,
        setError,
        refetchData, // Export the refetchData function
        fetchCleaningTasks, // Keep individual fetch functions for potential specific uses
        fetchAllHousekeepers,
        fetchRooms,
        fetchZones,
        fetchCleaningTypes,
    };
};

export default useHousekeepingData;